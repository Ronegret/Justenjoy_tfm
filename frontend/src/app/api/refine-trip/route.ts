import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/requireSession';
import { TripPreferences } from '@/types/trip';
import { isUnusableN8nPlan, mapN8nToTripData, getErrorMessage, ensureWarnings } from '@/lib/n8nPlan';
import { scanForSpecialCategoryData } from '@/lib/sensitiveData';

// Ruta interna de REFINAMIENTO (RUTA B de n8n, webhook `travel-refine`).
//
// A diferencia de /api/plan-trip (que planifica desde cero — RUTA A), esta ruta
// re-ejecuta SOLO los pasos afectados por el `feedback_text` del usuario sobre un
// plan ya generado, mucho más barato. n8n reconstruye el plan actual desde su
// memoria interna indexada por `session_id`; el frontend solo envía
// `{ session_id, feedback_text }` (la webhook admite además un `current_plan`
// opcional, pero no lo necesitamos: la memoria de n8n es la fuente de verdad).
//
// La memoria de sesión de n8n caduca/se pierde al reiniciar: en ese caso la RUTA
// B responde HTTP 400 y aquí se traduce a `session_expired` para que el frontend
// conserve el plan actual y avise. Otros fallos (p. ej. el motor devuelve un plan
// truncado con status "error") se propagan como `error`, NO como sesión caducada.

interface RefineRequestBody {
  session_id?: string;
  feedback_text?: string;
  // Preferencias del plan actual: necesarias para mapear la respuesta de n8n con
  // el mismo `mapN8nToTripData` (origen/destino/fechas/viajeros y cálculo de
  // presupuesto salen de aquí). Viajan desde el viaje mostrado en el frontend.
  user_preferences?: TripPreferences;
}

export async function POST(req: NextRequest) {
  // Autenticación obligatoria: mismo gate que /api/plan-trip.
  const authError = await requireSession(req, 'refine-trip');
  if (authError) return authError;

  try {
    const body: RefineRequestBody = await req.json();
    const { session_id, feedback_text, user_preferences } = body;

    // Sin `session_id` real de n8n no hay nada que refinar (planes de fallback).
    // El frontend ya oculta el control en ese caso; esto es defensa en profundidad.
    if (!session_id) {
      return NextResponse.json({ status: 'session_expired' });
    }
    if (!feedback_text || !feedback_text.trim()) {
      return NextResponse.json(
        { status: 'error', message: 'Escribe qué te gustaría cambiar del plan.' },
        { status: 400 }
      );
    }

    // Guardarraíl de minimización (RGPD art. 9 — hallazgo #4 de la auditoría). El
    // texto libre viaja a n8n → LLM y buscadores (SerpAPI/Tavily, cuya AUP prohíbe
    // datos del art. 9) y no hay base jurídica para tratar categorías especiales
    // aquí. Si el texto parece revelar salud/religión/orientación/etc., NO se
    // reenvía: se pide reformular y el plan actual se conserva intacto. Es un
    // control autoritativo server-side (la UI también avisa y pre-chequea, pero
    // esto no depende del cliente). No se registra el `feedback_text` en logs.
    const scan = scanForSpecialCategoryData(feedback_text);
    if (scan.hit) {
      console.warn(
        `[refine-trip] Refinamiento bloqueado por posible dato del art. 9 (${scan.categories.join(', ')}); no se reenvía a n8n.`
      );
      return NextResponse.json({ status: 'blocked_sensitive', categories: scan.categories });
    }
    // Necesitamos las preferencias del plan actual para mapear la respuesta. Se
    // valida que `travelers.adults/children` sean numéricos: mapN8nToTripData los
    // suma para el presupuesto, y un objeto malformado produciría totales NaN.
    const travelers = user_preferences?.travelers;
    if (
      !user_preferences?.dates?.start ||
      typeof travelers?.adults !== 'number' ||
      typeof travelers?.children !== 'number'
    ) {
      return NextResponse.json(
        { status: 'error', message: 'Faltan datos del plan actual para refinarlo.' },
        { status: 400 }
      );
    }
    if (!process.env.N8N_REFINE_WEBHOOK_URL) {
      console.warn('[refine-trip] N8N_REFINE_WEBHOOK_URL no configurada; refinamiento no disponible');
      return NextResponse.json(
        { status: 'error', message: 'El refinamiento no está disponible en este entorno.' },
        { status: 503 }
      );
    }

    const n8nBody = { session_id, feedback_text: feedback_text.trim() };

    console.log('[refine-trip] Reenviando refinamiento a n8n para session_id:', session_id);

    let response: Response;
    try {
      response = await fetch(process.env.N8N_REFINE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(n8nBody)
      });
    } catch (e: unknown) {
      console.warn('[refine-trip] No se pudo contactar con n8n:', getErrorMessage(e));
      return NextResponse.json(
        { status: 'error', message: 'No pudimos contactar con el servicio de refinamiento. Inténtalo de nuevo.' },
        { status: 502 }
      );
    }

    // La RUTA B corta con HTTP 400 cuando `Cargar Sesión` no encuentra la sesión
    // (n8n reiniciado o sesión caducada). Es la única señal de "no refinable ahora".
    if (response.status === 400) {
      console.warn('[refine-trip] n8n devolvió 400 (sesión no encontrada/caducada).');
      return NextResponse.json({ status: 'session_expired' });
    }
    if (!response.ok) {
      console.warn(`[refine-trip] n8n devolvió ${response.status} ${response.statusText}.`);
      return NextResponse.json(
        { status: 'error', message: `El servicio de refinamiento devolvió un error (${response.status}).` },
        { status: 502 }
      );
    }

    const rawText = await response.text();
    if (!rawText) {
      return NextResponse.json(
        { status: 'error', message: 'El servicio de refinamiento devolvió una respuesta vacía.' },
        { status: 502 }
      );
    }
    const n8nData = JSON.parse(rawText);
    const rawData = Array.isArray(n8nData) ? n8nData[0] : n8nData;

    // El motor puede devolver 200 con `status: "error"` por fallos que NO son de
    // sesión (p. ej. JSON del planificador truncado en viajes largos). Se propaga
    // como error genuino con su detalle — NO como session_expired (eso solo lo es
    // el HTTP 400 de arriba), para no dar un mensaje/recuperación equivocados.
    if (rawData?.status === 'error') {
      const detail =
        typeof rawData.error_detail === 'string' ? rawData.error_detail
        : typeof rawData.detail === 'string' ? rawData.detail
        : null;
      console.warn('[refine-trip] n8n status=error en el cuerpo:', detail);
      return NextResponse.json(
        { status: 'error', message: detail || 'No hemos podido aplicar el ajuste al plan. Inténtalo de nuevo o reformúlalo.' },
        { status: 502 }
      );
    }

    // n8n no pudo aplicar el ajuste (plan vacío o needs_user_input): devolvemos
    // sus avisos reales para que el usuario reformule, sin tocar el plan actual.
    if (isUnusableN8nPlan(rawData)) {
      const warnings = ensureWarnings(rawData.warnings, {
        type: 'refine_incomplete',
        detail: 'No hemos podido aplicar ese ajuste al plan.',
        proposed_change: 'Prueba a describir el cambio de otra forma o con menos condiciones a la vez.'
      });
      console.warn(`[refine-trip] Refinamiento no utilizable; propagando ${warnings.length} aviso(s).`);
      return NextResponse.json({ status: 'needs_user_input', warnings });
    }

    // Mismo esquema que la RUTA A → mismo mapper. Las preferencias del plan actual
    // aportan origen/destino/fechas/viajeros para el mapeo y el presupuesto.
    // Se devuelve un sobre explícito { status: 'ok', trip } para que el cliente no
    // tenga que inferir el éxito por ausencia de campo de control.
    const trip = await mapN8nToTripData(n8nData, user_preferences);
    console.log('[refine-trip] Plan refinado mapeado correctamente.');
    return NextResponse.json({ status: 'ok', trip });
  } catch (error: unknown) {
    console.error('[refine-trip] Error en la ruta de refinamiento:', error);
    return NextResponse.json(
      { status: 'error', message: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
