import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/requireSession';
import { TripPreferences } from '@/types/trip';
import { isUnusableN8nPlan, mapN8nToTripData, getErrorMessage, ensureWarnings, type N8nResponse } from '@/lib/n8nPlan';
import { scanForSpecialCategoryData } from '@/lib/sensitiveData';
import { isRefineTokenConfigured, verifyRefineToken } from '@/lib/refineToken';

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
  // Firma que acredita que este `session_id` pertenece al usuario autenticado.
  // La emite /api/plan-trip al crear el plan (ver lib/refineToken).
  refine_token?: string;
}

// Tope de longitud del texto de refinamiento. Es una instrucción de ajuste, no un
// documento: por encima de esto no aporta señal al agente y solo infla el coste
// de tokens del LLM aguas abajo. El textarea aplica el mismo límite, pero el
// autoritativo es este (el cliente no es de fiar).
const MAX_FEEDBACK_CHARS = 500;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function firstIsoDate(...candidates: Array<string | undefined>): string | undefined {
  return candidates.find((d): d is string => typeof d === 'string' && ISO_DATE.test(d));
}

/**
 * Devuelve las preferencias con las FECHAS EFECTIVAS del plan refinado.
 *
 * El agente de refinamiento puede mover las fechas ("sal un día antes"), pero el
 * cliente nos envía las preferencias del plan viejo. `mapN8nToTripData` deriva de
 * ahí tanto la cabecera del viaje como los días que factura de comida en el
 * presupuesto, así que sin esto el plan mostraría vuelos y hotel nuevos con las
 * fechas antiguas y un total descuadrado.
 *
 * n8n no devuelve `travel_brief` en el refinamiento (verificado en
 * `n8n/examples/output-plan-v39-e2e-refinamiento.json`), así que las fechas reales
 * se leen del propio plan: el hotel primero (check-in/check-out son las fechas de
 * estancia) y los vuelos como respaldo. Si no hay ninguna utilizable se conservan
 * las del cliente, que es el comportamiento anterior.
 */
function withRefreshedDates(prefs: TripPreferences, rawData: N8nResponse): TripPreferences {
  const segment = rawData.plan?.segments?.[0];
  const start = firstIsoDate(
    segment?.hotel?.check_in,
    segment?.flights?.outbound?.departure_datetime?.split('T')[0]
  );
  const end = firstIsoDate(
    segment?.hotel?.check_out,
    segment?.flights?.return?.departure_datetime?.split('T')[0]
  );
  if (!start && !end) return prefs;

  const nuevoStart = start || prefs.dates.start;
  const nuevoEnd = end || prefs.dates.end;

  // Cada fecha cae por separado a la del cliente, así que la mezcla puede salir
  // INCOHERENTE: si solo se pudo leer la salida y el refinamiento la movió más
  // allá del regreso viejo, quedaría `start > end`. Eso hace que `computeTripDays`
  // devuelva 0 (el presupuesto de comida se calcularía por otra vía) y que la
  // cabecera pinte un rango al revés. Ante la duda, las del cliente: desfasadas
  // son peores que invertidas, pero al menos son coherentes entre sí.
  if (nuevoStart > nuevoEnd) {
    console.warn('[refine-trip] Fechas del plan refinado incoherentes; se conservan las del cliente.');
    return prefs;
  }

  return { ...prefs, dates: { ...prefs.dates, start: nuevoStart, end: nuevoEnd } };
}

export async function POST(req: NextRequest) {
  // Autenticación obligatoria: mismo gate que /api/plan-trip.
  const session = await requireSession(req, 'refine-trip');
  if (session.error) return session.error;

  try {
    const body: RefineRequestBody = await req.json();
    const { session_id, feedback_text, user_preferences, refine_token } = body;

    // Sin `session_id` real de n8n no hay nada que refinar (planes de fallback).
    // El frontend ya oculta el control en ese caso; esto es defensa en profundidad.
    if (!session_id) {
      return NextResponse.json({ status: 'session_expired' });
    }

    // PROPIEDAD del plan. Autenticar no basta: el `session_id` lo aporta el
    // cliente, así que sin esto cualquier usuario con cuenta podría refinar —y
    // por tanto leer entero— el plan de otra persona. El token acredita que este
    // `session_id` se emitió para este `uid` (ver lib/refineToken).
    if (!isRefineTokenConfigured()) {
      // Falla cerrado: sin secreto no se puede acreditar nada, y refinar sin
      // comprobar propiedad es justo el agujero que esto cierra.
      console.error('[refine-trip] REFINE_TOKEN_SECRET no configurada; refinamiento deshabilitado');
      return NextResponse.json(
        { status: 'error', message: 'El refinamiento no está disponible en este entorno.' },
        { status: 503 }
      );
    }
    if (!verifyRefineToken(refine_token, session.uid, session_id)) {
      console.warn('[refine-trip] Token de refinamiento ausente o no válido para la sesión autenticada.');
      return NextResponse.json({ status: 'not_refinable' }, { status: 403 });
    }
    // `feedback_text` viene del cuerpo JSON: comprobar el TIPO antes de llamar a
    // .trim(), o un número/objeto reventaría con un 500 en vez de un 400 claro.
    if (typeof feedback_text !== 'string' || !feedback_text.trim()) {
      return NextResponse.json(
        { status: 'error', message: 'Escribe qué te gustaría cambiar del plan.' },
        { status: 400 }
      );
    }
    if (feedback_text.trim().length > MAX_FEEDBACK_CHARS) {
      return NextResponse.json(
        {
          status: 'error',
          message: `El ajuste es demasiado largo (máximo ${MAX_FEEDBACK_CHARS} caracteres). Resúmelo en una o dos frases.`
        },
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
    // `dates.end` es tan obligatoria como `start`: `withRefreshedDates` la lee y,
    // si faltara, la guarda de coherencia compararía contra `undefined` —que
    // siempre da false— y no saltaría nunca; el plan acabaría guardado sin fecha
    // de vuelta y `computeTripDays` devolvería 0.
    const travelers = user_preferences?.travelers;
    if (
      !user_preferences?.dates?.start ||
      !user_preferences?.dates?.end ||
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

    // No se registra el `session_id`: mientras no haya comprobación de propiedad,
    // quien lo posee puede leer y mutar ese plan, así que se comporta como una
    // credencial y no debe quedar en logs. Tampoco se registra el `feedback_text`.
    console.log('[refine-trip] Reenviando refinamiento a n8n.');

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
    // Cuerpo ilegible o con una forma que no es un plan (p. ej. `[]`, `null` o
    // texto plano de un proxy): se corta aquí con un error propio. Si se dejara
    // caer al catch general, el usuario vería el mensaje interno de la excepción.
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.warn('[refine-trip] n8n devolvió un cuerpo que no es JSON.');
      return NextResponse.json(
        { status: 'error', message: 'El servicio de refinamiento devolvió una respuesta ilegible.' },
        { status: 502 }
      );
    }
    const unwrapped = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!unwrapped || typeof unwrapped !== 'object') {
      console.warn('[refine-trip] n8n devolvió una respuesta sin plan utilizable.');
      return NextResponse.json(
        { status: 'error', message: 'El servicio de refinamiento devolvió una respuesta vacía.' },
        { status: 502 }
      );
    }
    const rawData = unwrapped as N8nResponse & { error_detail?: unknown; detail?: unknown };

    // El motor puede devolver 200 con `status: "error"` por fallos que NO son de
    // sesión (p. ej. JSON del planificador truncado en viajes largos). Se propaga
    // como error genuino con su detalle — NO como session_expired (eso solo lo es
    // el HTTP 400 de arriba), para no dar un mensaje/recuperación equivocados.
    if (rawData.status === 'error') {
      // El detalle de n8n es diagnóstico interno (trazas del motor, estado de la
      // sesión): se registra, pero al usuario se le da un mensaje accionable. Es
      // el mismo criterio que aplica /api/plan-trip, que nunca lo propaga.
      const detail =
        typeof rawData.error_detail === 'string' ? rawData.error_detail
        : typeof rawData.detail === 'string' ? rawData.detail
        : null;
      console.warn('[refine-trip] n8n status=error en el cuerpo:', detail);
      return NextResponse.json(
        { status: 'error', message: 'No hemos podido aplicar el ajuste al plan. Inténtalo de nuevo o reformúlalo.' },
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
    const trip = await mapN8nToTripData(rawData, withRefreshedDates(user_preferences, rawData));
    console.log('[refine-trip] Plan refinado mapeado correctamente.');
    return NextResponse.json({ status: 'ok', trip });
  } catch (error: unknown) {
    // El mensaje real solo va al log: puede contener rutas, nombres de campo o
    // trazas internas que no tienen por qué llegar al navegador.
    console.error('[refine-trip] Error en la ruta de refinamiento:', getErrorMessage(error));
    return NextResponse.json(
      { status: 'error', message: 'No hemos podido completar el refinamiento. Inténtalo de nuevo.' },
      { status: 500 }
    );
  }
}
