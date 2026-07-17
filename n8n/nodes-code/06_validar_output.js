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

// ── Seguridad: ciudad de origen/destino no reconocida (bug real detectado:
// "Marruecos" —un país, no una ciudad— se convertía en el código IATA "MAR",
// que por coincidencia es un aeropuerto real pero de Maracaibo, Venezuela;
// SerpAPI encontró vuelos "válidos" a un continente equivocado sin dar
// ningún error). "Convertir Ciudades a IATA" ahora usa 'XXX' cuando no
// reconoce la ciudad, en vez de inventar un código que podría coincidir con
// un aeropuerto real de otro sitio. Si sigue en 'XXX' aquí, se fuerza el
// aviso sin importar lo que haya hecho el agente con esos datos — y, si el
// texto escrito coincide con un país conocido, se sugieren ciudades reales
// de ESE país en vez de un ejemplo fijo (antes siempre decía "Marrakech o
// Casablanca" aunque el país escrito fuera otro). Debe reflejar las mismas
// ciudades que ChatPlanner.tsx sugiere en el formulario (COUNTRY_TO_CITIES).
const COUNTRY_TO_CITIES = {
  'marruecos': ['Marrakech', 'Casablanca'], 'morocco': ['Marrakech', 'Casablanca'],
  'francia': ['París', 'Lyon', 'Niza'], 'france': ['París', 'Lyon', 'Niza'],
  'italia': ['Roma', 'Milán', 'Venecia', 'Florencia'], 'italy': ['Roma', 'Milán', 'Venecia', 'Florencia'],
  'españa': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'], 'spain': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
  'portugal': ['Lisboa', 'Oporto'],
  'alemania': ['Berlín', 'Múnich', 'Fráncfort'], 'germany': ['Berlín', 'Múnich', 'Fráncfort'],
  'reino unido': ['Londres', 'Mánchester', 'Edimburgo'], 'united kingdom': ['Londres', 'Mánchester', 'Edimburgo'], 'inglaterra': ['Londres', 'Mánchester'],
  'grecia': ['Atenas'], 'greece': ['Atenas'],
  'turquía': ['Estambul'], 'turkey': ['Estambul'],
  'egipto': ['El Cairo'], 'egypt': ['El Cairo'],
  'japón': ['Tokio'], 'japan': ['Tokio'],
  'china': ['Pekín', 'Shanghái', 'Hong Kong'],
  'india': ['Bombay', 'Nueva Delhi'],
  'tailandia': ['Bangkok'], 'thailand': ['Bangkok'],
  'méxico': ['Ciudad de México', 'Cancún'], 'mexico': ['Ciudad de México', 'Cancún'],
  'brasil': ['São Paulo', 'Río de Janeiro'], 'brazil': ['São Paulo', 'Río de Janeiro'],
  'argentina': ['Buenos Aires'],
  'estados unidos': ['Nueva York', 'Los Ángeles', 'Miami', 'Chicago'], 'usa': ['Nueva York', 'Los Ángeles', 'Miami'], 'united states': ['Nueva York', 'Los Ángeles', 'Miami'],
  'canadá': ['Toronto', 'Montreal', 'Vancouver'], 'canada': ['Toronto', 'Montreal', 'Vancouver'],
  'australia': ['Sídney', 'Melbourne'],
  'holanda': ['Ámsterdam'], 'netherlands': ['Ámsterdam'], 'países bajos': ['Ámsterdam'],
  'bélgica': ['Bruselas'], 'belgium': ['Bruselas'],
  'suiza': ['Zúrich', 'Ginebra'], 'switzerland': ['Zúrich', 'Ginebra'],
  'austria': ['Viena'],
  'irlanda': ['Dublín'], 'ireland': ['Dublín'],
  'croacia': ['Zagreb'], 'croatia': ['Zagreb'],
  'noruega': ['Oslo'], 'norway': ['Oslo'],
  'suecia': ['Estocolmo'], 'sweden': ['Estocolmo'],
  'dinamarca': ['Copenhague'], 'denmark': ['Copenhague'],
  'polonia': ['Varsovia'], 'poland': ['Varsovia'],
  'sudáfrica': ['Ciudad del Cabo', 'Johannesburgo'], 'south africa': ['Ciudad del Cabo', 'Johannesburgo'],
  'perú': ['Lima'], 'peru': ['Lima'],
  'chile': ['Santiago'],
  'colombia': ['Bogotá'],
  'cuba': ['La Habana'],
  'jordania': ['Amán'], 'jordan': ['Amán'],
  'israel': ['Tel Aviv'],
  'emiratos árabes': ['Dubái', 'Abu Dabi'], 'uae': ['Dubái', 'Abu Dabi'],
  'indonesia': ['Bali']
};
try {
  const iataData = $('Convertir Ciudades a IATA').first().json;
  const brief = iataData.session_state?.travel_brief;
  const unresolved = [];
  if (brief?.destination_city_iata === 'XXX') unresolved.push(brief.destination_city_original?.[0] || 'destino');
  if (brief?.origin_city_iata === 'XXX') unresolved.push(brief.origin_city_original || 'origen');
  if (unresolved.length > 0) {
    result.status = 'needs_user_input';
    result.warnings = result.warnings || [];
    const suggestions = unresolved
      .map((name) => COUNTRY_TO_CITIES[String(name).trim().toLowerCase()])
      .find((cities) => cities && cities.length > 0);
    const proposedChange = suggestions
      ? `Escribe una ciudad concreta, por ejemplo "${suggestions.join('" o "')}" en vez de "${unresolved.join(', ')}".`
      : 'Escribe una ciudad concreta (no un país ni una región).';
    result.warnings.push({
      type: 'no_valid_flight',
      detail: `No reconocemos "${unresolved.join(' / ')}" como una ciudad concreta (¿es un país o una región?). Necesitamos el nombre de una ciudad específica para buscar vuelos reales.`,
      proposed_change: proposedChange,
      requires_user_approval: true
    });
  }
} catch (e) {}

// ── Safety net c): stars debe ser null si hotel_class no es válido ──
if (result.plan && result.plan.segments) {
  result.plan.segments.forEach(seg => {
    if (seg.hotel && (seg.hotel.stars === 0 || seg.hotel.stars === undefined || seg.hotel.stars === '')) {
      seg.hotel.stars = null;
    }
  });
}

// ── Safety net g): booking_url de vuelos — un solo link round-trip con 'through' ──
// Formato: ?q=Flights to CDG from AMS on 2026-09-15 through 2026-09-30
// Se asigna el mismo link a outbound y return: ambos abren la búsqueda completa del viaje.
// Verificado con una petición real: HTTP 200, precarga ruta y fechas correctas.
// NO reintentar el flujo booking_token + booking_options de SerpAPI para obtener la
// URL de reserva real del proveedor: ya se probó y SerpAPI devuelve la MISMA url
// genérica 'travel/clk/f' para todos los proveedores — sin datos adicionales que la
// API no expone, esa url da 404. Este enlace de búsqueda es el que sí funciona.
if (result.plan && result.plan.segments) {
  result.plan.segments.forEach(seg => {
    const ob = seg.flights?.outbound;
    const rt = seg.flights?.return;
    if (ob && ob.origin && ob.destination && ob.departure_datetime) {
      const dateOut = ob.departure_datetime.substring(0, 10);
      const dateRet = rt?.departure_datetime ? rt.departure_datetime.substring(0, 10) : '';
      const throughPart = dateRet ? `%20through%20${dateRet}` : '';
      const roundTripUrl = `https://www.google.com/travel/flights?q=Flights%20to%20${ob.destination}%20from%20${ob.origin}%20on%20${dateOut}${throughPart}`;
      ob.booking_url = roundTripUrl;
      if (rt) rt.booking_url = roundTripUrl;
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

// ── (v32) ELIMINADO: extracción de coste de transporte desde plan_notes ──
// Antes se leía por regex el primer número con símbolo de moneda que
// apareciera en plan_notes. Ese texto suele mencionar el precio de UN billete
// suelto ("un billete de metro cuesta 2,50€"), no el gasto total de transporte
// local del viaje — usarlo como total infravaloraba muchísimo el presupuesto
// (viajes de 15 días salían con "Transporte Local: 2.5€"). Si no hay un total
// real y fiable, el campo queda null y el frontend muestra "No disponible" en
// vez de fingir un coste.

// ── Seguridad: no puede ser plan_ready si hay warnings críticas ──

// ── (v32) Recalcular vuelos y actividades multiplicando por el número real de
// viajeros. Ni la búsqueda de vuelos ni la de actividades reciben el número de
// pasajeros (solo Hoteles sí, ver prompt), así que price_usd es SIEMPRE un
// precio por persona — pero el agente no lo multiplicaba de forma fiable al
// construir cost_summary, lo que hacía que viajes de 2+ personas salieran
// mostrando el precio de 1 sola persona como si fuera el total. ──
if (result.plan && result.plan.cost_summary) {
  const segCost = result.plan.segments?.[0];
  const cs = result.plan.cost_summary;
  const travelersBrief = prepInput.session_state?.travel_brief?.travelers;
  const childrenCount = Array.isArray(travelersBrief?.children) ? travelersBrief.children.length : (travelersBrief?.children || 0);
  const totalTravelers = Math.max(1, (travelersBrief?.adults || 1) + childrenCount);

  const perPersonFlights = (segCost?.flights?.outbound?.price_usd || 0) + (segCost?.flights?.return?.price_usd || 0);
  if (perPersonFlights > 0) {
    cs.flights_usd = Math.round(perPersonFlights * totalTravelers * 100) / 100;
  }

  const perPersonActivities = (segCost?.activities || []).reduce((sum, a) => sum + (a.price_usd || 0), 0);
  if (perPersonActivities > 0) {
    cs.activities_usd = Math.round(perPersonActivities * totalTravelers * 100) / 100;
  }

  cs.total_usd = (cs.flights_usd || 0) + (cs.hotel_usd || 0) + (cs.activities_usd || 0) +
                 (cs.inter_city_transport_usd || 0) + (cs.estimated_local_transport_usd || 0);
  cs.budget_remaining_usd = (cs.budget_total_usd || 0) - cs.total_usd;

  // ── Si tras recalcular se pasa del presupuesto, el plan NO puede ir como listo ──
  // (v33) Verificación determinista: el agente a veces no se autovalida bien la
  // aritmética. Tres detalles que importan:
  //  a) budget > 0 — sin presupuesto declarado no hay nada que exceder (antes,
  //     budget ausente => 0 => cualquier plan con coste disparaba el warning).
  //  b) suggested_budget_usd = Math.ceil(total) — se redondea el coste real hacia
  //     arriba para que, si el usuario acepta "usar este presupuesto", el reintento
  //     no vuelva a fallar por céntimos.
  //  c) Si el agente ya emitió su propio budget_exceeded, se PISAN sus números con
  //     los deterministas en vez de respetar su cuenta.
  const budget = cs.budget_total_usd || 0;
  if (budget > 0 && cs.total_usd > budget) {
    const amountOver = Math.round((cs.total_usd - budget) * 100) / 100;
    const suggestedBudget = Math.ceil(cs.total_usd);
    const detail = `El coste total (${cs.total_usd.toFixed(2)} USD) supera el presupuesto solicitado (${budget.toFixed(2)} USD) en ${amountOver.toFixed(2)} USD.`;
    const proposedChange = 'Sube el presupuesto, reduce noches, pide alojamiento mas economico o cambia de destino.';
    result.warnings = result.warnings || [];
    const already = result.warnings.find(w => w.type === 'budget_exceeded');
    if (already) {
      already.detail = detail;
      already.proposed_change = already.proposed_change || proposedChange;
      already.requires_user_approval = true;
      already.amount_over = amountOver;
      already.suggested_budget_usd = suggestedBudget;
    } else {
      result.warnings.push({
        type: 'budget_exceeded',
        detail,
        proposed_change: proposedChange,
        requires_user_approval: true,
        amount_over: amountOver,
        suggested_budget_usd: suggestedBudget
      });
    }
    result.status = 'needs_user_input';
  }
}

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
