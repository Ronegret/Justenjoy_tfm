const agentOutput = $input.first().json.output || $input.first().json.text || '';
const prepInput = $('Preparar Motor Planificador').first().json;
const sessionId = prepInput.session_state.session_id;
const revisionCount = prepInput.revision_count;
const staticData = $getWorkflowStaticData('global');

// Limpiar markdown si el LLM lo añadió
let cleaned = agentOutput.trim();
if (cleaned.startsWith('```json')) cleaned = cleaned.replace(/^```json\s*/, '').trim();
if (cleaned.startsWith('```')) cleaned = cleaned.replace(/^```\s*/, '').trim();
if (cleaned.endsWith('```')) cleaned = cleaned.replace(/\s*```$/, '').trim();

let result;
try {
  result = JSON.parse(cleaned);
} catch(e) {
  return [{ json: {
    status: 'error',
    session_id: sessionId,
    revision_count: revisionCount,
    error_detail: `Output no-JSON del motor planificador: ${e.message}. Raw (primeros 300 chars): ${agentOutput.substring(0, 300)}`,
    warnings: [],
    plan: null
  } }];
}

// ── SIEMPRE sobrescribir generated_at — no confiar en el agente ──
result.generated_at = new Date().toISOString();

// ── Safety net c): stars debe ser null si hotel_class no es válido ──
if (result.plan && result.plan.segments) {
  result.plan.segments.forEach(seg => {
    if (seg.hotel && (seg.hotel.stars === 0 || seg.hotel.stars === undefined || seg.hotel.stars === '')) {
      seg.hotel.stars = null;
    }
  });
}

// ── Safety net g): booking_url de vuelos — SIEMPRE reconstruir con formato
// travel/flights?q= (verificado con una petición real: HTTP 200, precarga la
// ruta y fecha correctas). Se probó un flujo de booking_token + booking_options
// de SerpAPI para dar la URL de reserva real del proveedor, pero SerpAPI
// devuelve la MISMA url generica "travel/clk/f" para todos los proveedores —
// sin datos adicionales que no expone la API, esa url da 404. Se descartó ese
// flujo por no funcionar; este enlace de búsqueda es el que sí funciona. ──
if (result.plan && result.plan.segments) {
  result.plan.segments.forEach(seg => {
    const ob = seg.flights?.outbound;
    const rt = seg.flights?.return;
    if (ob && ob.origin && ob.destination && ob.departure_datetime) {
      const date = ob.departure_datetime.substring(0, 10);
      ob.booking_url = `https://www.google.com/travel/flights?q=Flights%20to%20${ob.destination}%20from%20${ob.origin}%20on%20${date}`;
    }
    if (rt && rt.origin && rt.destination && rt.departure_datetime) {
      const date2 = rt.departure_datetime.substring(0, 10);
      rt.booking_url = `https://www.google.com/travel/flights?q=Flights%20to%20${rt.destination}%20from%20${rt.origin}%20on%20${date2}`;
    }
  });
}

// ── Safety net plan_notes: mínimo 1 nota si el agente las omitió ──
// GPT-4.1 puede omitir plan_notes aunque Tavily haya respondido.
// Este safety net construye notas mínimas desde el contexto del plan.
if (result.plan && (!result.plan.plan_notes || result.plan.plan_notes.length === 0)) {
  const seg = result.plan.segments?.[0];
  const dest = seg?.destination || 'el destino';
  const origin = seg?.origin || 'tu ciudad';
  const checkIn = seg?.hotel?.check_in || '';
  const month = checkIn ? new Date(checkIn).toLocaleString('es-ES', { month: 'long' }) : 'verano';
  result.plan.plan_notes = [
    `Visa: Verificar requisitos de entrada para ciudadanos de ${origin} en ${dest}.`,
    `Clima: Consultar previsión meteorológica para ${dest} en ${month}.`,
    `Transporte local: Se recomienda usar metro y/o taxi para desplazarse por ${dest}.`
  ];
}

// ── Safety net f): trip_summary mínimo si el agente lo omitió ──
if (result.plan && (!result.plan.trip_summary || result.plan.trip_summary.trim() === '')) {
  const seg = result.plan.segments?.[0];
  if (seg) {
    const dest = seg.destination || 'tu destino';
    const days = result.plan.daily_itinerary?.length || 0;
    result.plan.trip_summary = `Un viaje de ${days} días a ${dest} con vuelo y alojamiento confirmados.`;
  }
}

// ── Extracción de coste de transporte desde plan_notes (safety net) ──
if (result.plan && result.plan.cost_summary &&
    (result.plan.cost_summary.estimated_local_transport_usd === null ||
     result.plan.cost_summary.estimated_local_transport_usd === 0)) {
  const notes = (result.plan.plan_notes || []).join(' ');
  const patterns = [
    /(\d+[,.]?\d*)\s*[€$£](?:[^.]{0,20})?(?:metro|taxi|bus|tren|aeropuerto|transfer|tarjeta|pase)/i,
    /(?:metro|taxi|bus|tren|aeropuerto|transfer|tarjeta|pase)[^.]{0,30}?(\d+[,.]?\d*)\s*[€$£]/i,
    /(?:metro|taxi|transport)[^.]{0,30}?(\d+(?:[.,]\d+)?)\s*(?:euros?|usd|dollars?)/i
  ];
  for (const pattern of patterns) {
    const match = notes.match(pattern);
    if (match) {
      const val = parseFloat((match[1] || match[2] || '0').replace(',', '.'));
      if (val > 0 && val < 300) {
        result.plan.cost_summary.estimated_local_transport_usd = val;
        result.plan.cost_summary.local_transport_data_source = 'tavily';
        const cs = result.plan.cost_summary;
        cs.total_usd = (cs.flights_usd||0)+(cs.hotel_usd||0)+(cs.activities_usd||0)+val+(cs.inter_city_transport_usd||0);
        cs.budget_remaining_usd = (cs.budget_total_usd||0) - cs.total_usd;
        break;
      }
    }
  }
}

// ── Seguridad: verificar presupuesto de forma determinista. El agente a veces
// no se autovalida bien la aritmética y devuelve plan_ready aunque el total
// supere el presupuesto — aquí se recalcula con código, no con el LLM. ──
if (result.plan && result.plan.cost_summary) {
  const cs = result.plan.cost_summary;
  const total = (cs.flights_usd || 0) + (cs.hotel_usd || 0) + (cs.activities_usd || 0) +
                (cs.inter_city_transport_usd || 0) + (cs.estimated_local_transport_usd || 0);
  const budget = cs.budget_total_usd || 0;
  if (budget > 0 && total > budget) {
    const amountOver = Math.round((total - budget) * 100) / 100;
    result.warnings = result.warnings || [];
    const already = result.warnings.find(w => w.type === 'budget_exceeded');
    if (already) {
      already.requires_user_approval = true;
      already.amount_over = amountOver;
    } else {
      result.warnings.push({
        type: 'budget_exceeded',
        detail: `El coste total (${total.toFixed(2)} USD) supera el presupuesto solicitado (${budget.toFixed(2)} USD) en ${amountOver.toFixed(2)} USD.`,
        proposed_change: 'Sube el presupuesto, reduce noches, pide alojamiento mas economico o cambia de destino.',
        requires_user_approval: true,
        amount_over: amountOver
      });
    }
  }
}

// ── Seguridad: no puede ser plan_ready si hay warnings críticas ──
const hasCritical = (result.warnings || []).some(w => w.requires_user_approval === true);
if (result.status === 'plan_ready' && hasCritical) result.status = 'needs_user_input';

// ── Safety net: daily_itinerary vacío → generar estructura mínima desde activities ──
if (result.plan && (!result.plan.daily_itinerary || result.plan.daily_itinerary.length === 0)) {
  const seg = result.plan.segments?.[0];
  if (seg) {
    const arrivalDate = (seg.flights?.outbound?.arrival_datetime || '').substring(0, 10);
    const returnDate  = (seg.flights?.return?.departure_datetime || '').substring(0, 10);
    const dest = seg.destination || '';
    if (arrivalDate && returnDate) {
      const start = new Date(arrivalDate);
      const end   = new Date(returnDate);
      const days  = [];
      const activities = seg.activities || [];
      // Indexar actividades por fecha
      const actByDate = {};
      activities.forEach(a => { if (a.date) { if (!actByDate[a.date]) actByDate[a.date] = []; actByDate[a.date].push(a); } });
      let d = new Date(start);
      let dayNum = 1;
      while (d <= end) {
        const dateStr = d.toISOString().substring(0, 10);
        const dayActs = (actByDate[dateStr] || []).map(a => ({
          time: a.start_time || '10:00',
          name: a.name,
          duration_hours: a.duration_hours || 3,
          price_usd: a.price_usd || 0,
          booking_url: a.booking_url || ''
        }));
        let title, summary;
        if (dateStr === arrivalDate) {
          title = `Día de llegada a ${dest}`;
          summary = `Llegada a ${dest}. Check-in en el hotel. Tarde libre para explorar el barrio.`;
        } else if (dateStr === returnDate) {
          title = `Último día en ${dest} — Regreso`;
          summary = `Check-out del hotel. Vuelo de regreso. Mañana libre para últimas compras o paseo.`;
        } else if (dayActs.length > 0) {
          title = dayActs.map(a => a.name).join(' · ');
          summary = `Día dedicado a: ${dayActs.map(a => a.name).join(', ')}.`;
        } else {
          title = `Día libre para caminar y conocer ${dest}`;
          summary = `Día libre para explorar ${dest} a tu ritmo, descubrir mercados locales, cafés y calles del barrio.`;
        }
        days.push({ day: dayNum, date: dateStr, title, summary, activities: dayActs });
        d.setDate(d.getDate() + 1);
        dayNum++;
      }
      result.plan.daily_itinerary = days;
    }
  }
}

result.session_id = result.session_id || sessionId;
result.revision_count = result.revision_count ?? revisionCount;

// Persistir en static data
const currentSession = staticData[sessionId] || {};
staticData[sessionId] = {
  ...currentSession,
  status: result.status,
  plan: result.plan,
  warnings: result.warnings || [],
  revision_count: result.revision_count,
  generated_at: result.generated_at
};

return [{ json: result }];
