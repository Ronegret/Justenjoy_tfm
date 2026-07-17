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
// aviso sin importar lo que haya hecho el agente con esos datos. ──
try {
  const iataData = $('Convertir Ciudades a IATA').first().json;
  const brief = iataData.session_state?.travel_brief;
  const unresolved = [];
  if (brief?.destination_city_iata === 'XXX') unresolved.push(brief.destination_city_original?.[0] || 'destino');
  if (brief?.origin_city_iata === 'XXX') unresolved.push(brief.origin_city_original || 'origen');
  if (unresolved.length > 0) {
    result.status = 'needs_user_input';
    result.warnings = result.warnings || [];
    result.warnings.push({
      type: 'no_valid_flight',
      detail: `No reconocemos "${unresolved.join(' / ')}" como una ciudad concreta (¿es un país o una región?). Necesitamos el nombre de una ciudad específica para buscar vuelos reales.`,
      proposed_change: 'Escribe una ciudad concreta, por ejemplo "Marrakech" o "Casablanca" en vez de "Marruecos".',
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

// ── Ya NO se extrae un precio de transporte desde el texto libre de
// plan_notes. Ese texto suele mencionar el precio de UN billete suelto
// ("un billete de metro cuesta 2,50€"), no el gasto total de transporte
// local del viaje — usar ese número como si fuera el total del viaje
// entero infravaloraba muchísimo el presupuesto (viajes de varios días
// aparecían con "Transporte Local: 2.5€"). Si no hay un total real y
// fiable, el campo queda null y el frontend muestra "No disponible" en vez
// de fingir un coste.

// ── Recalcular vuelos y actividades multiplicando por el número real de
// viajeros. Ni la búsqueda de vuelos ni la de actividades reciben el número
// de pasajeros (solo Hoteles sí, ver prompt), así que price_usd es SIEMPRE
// un precio por persona — pero el agente no lo multiplicaba de forma
// fiable al construir cost_summary, lo que hacía que viajes de 2+ personas
// salieran mostrando el precio de 1 sola persona como si fuera el total. ──
if (result.plan && result.plan.cost_summary) {
  const seg = result.plan.segments?.[0];
  const cs = result.plan.cost_summary;
  const travelersBrief = prepInput.session_state?.travel_brief?.travelers;
  const childrenCount = Array.isArray(travelersBrief?.children) ? travelersBrief.children.length : (travelersBrief?.children || 0);
  const totalTravelers = Math.max(1, (travelersBrief?.adults || 1) + childrenCount);

  const perPersonFlights = (seg?.flights?.outbound?.price_usd || 0) + (seg?.flights?.return?.price_usd || 0);
  if (perPersonFlights > 0) {
    cs.flights_usd = Math.round(perPersonFlights * totalTravelers * 100) / 100;
  }

  const perPersonActivities = (seg?.activities || []).reduce((sum, a) => sum + (a.price_usd || 0), 0);
  if (perPersonActivities > 0) {
    cs.activities_usd = Math.round(perPersonActivities * totalTravelers * 100) / 100;
  }

  cs.total_usd = (cs.flights_usd || 0) + (cs.hotel_usd || 0) + (cs.activities_usd || 0) +
                 (cs.inter_city_transport_usd || 0) + (cs.estimated_local_transport_usd || 0);
  cs.budget_remaining_usd = (cs.budget_total_usd || 0) - cs.total_usd;
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
    // Redondeamos el coste real hacia arriba para que, si el usuario acepta
    // "usar este presupuesto", el reintento no vuelva a fallar por céntimos.
    const suggestedBudget = Math.ceil(total);
    const already = result.warnings.find(w => w.type === 'budget_exceeded');
    if (already) {
      already.requires_user_approval = true;
      already.amount_over = amountOver;
      already.suggested_budget_usd = suggestedBudget;
    } else {
      result.warnings.push({
        type: 'budget_exceeded',
        detail: `El coste total (${total.toFixed(2)} USD) supera el presupuesto solicitado (${budget.toFixed(2)} USD) en ${amountOver.toFixed(2)} USD.`,
        proposed_change: 'Sube el presupuesto, reduce noches, pide alojamiento mas economico o cambia de destino.',
        requires_user_approval: true,
        amount_over: amountOver,
        suggested_budget_usd: suggestedBudget
      });
    }
  }
}

// ── Seguridad: no puede ser plan_ready si hay warnings críticas ──
const hasCritical = (result.warnings || []).some(w => w.requires_user_approval === true);
if (result.status === 'plan_ready' && hasCritical) result.status = 'needs_user_input';

// ── daily_itinerary: SIEMPRE construido aquí, no por el LLM ──
// Antes el agente tenía que redactar todo daily_itinerary[] (título, resumen
// narrativo, y 4 bloques de relleno mañana/mediodía/tarde/noche para cada
// día sin actividad real) — mucho texto de salida, más lento y con riesgo de
// romper la regla de "día completo". Ahora el agente solo devuelve
// segments[].activities[] (ya lo hacía) y plan.landmarks[] (lista corta de
// sitios reales del destino, ver prompt); el itinerario día a día se arma
// aquí de forma determinista y siempre con la misma estructura.
if (result.plan) {
  const seg = result.plan.segments?.[0];
  if (seg) {
    const arrivalDate = (seg.flights?.outbound?.arrival_datetime || '').substring(0, 10);
    const returnDate  = (seg.flights?.return?.departure_datetime || '').substring(0, 10);
    const dest = seg.destination || '';
    const landmarks = Array.isArray(result.plan.landmarks) ? result.plan.landmarks.filter(Boolean) : [];

    if (arrivalDate && returnDate) {
      const start = new Date(arrivalDate);
      const end   = new Date(returnDate);
      const activities = seg.activities || [];
      const actByDate = {};
      activities.forEach(a => { if (a.date) { if (!actByDate[a.date]) actByDate[a.date] = []; actByDate[a.date].push(a); } });

      const toBlock = (time, name, act) => ({
        time,
        name,
        duration_hours: (act && act.duration_hours) || 2,
        price_usd: (act && act.price_usd) || 0,
        booking_url: (act && act.booking_url) || '',
        lat: (act && typeof act.lat === 'number') ? act.lat : null,
        lng: (act && typeof act.lng === 'number') ? act.lng : null
      });
      const isFood = (act) => /restaur|food|comida|café|cafe|bar\b/i.test(act.category || '');

      const days = [];
      let d = new Date(start);
      let dayNum = 1;
      let landmarkIdx = 0;

      while (d <= end) {
        const dateStr = d.toISOString().substring(0, 10);
        const dayActs = (actByDate[dateStr] || []).slice(0, 2); // máx 2 actividades reales/día
        const isArrival = dateStr === arrivalDate;
        const isReturn = !isArrival && dateStr === returnDate;
        const activityBlocks = [];

        if (isArrival) {
          activityBlocks.push(toBlock('20:00', 'Cena cerca del hotel y paseo nocturno', null));
        } else if (isReturn) {
          const morningAct = dayActs[0];
          activityBlocks.push(morningAct
            ? toBlock(morningAct.start_time || '10:00', morningAct.name, morningAct)
            : toBlock('10:00', 'Última exploración o compras antes del check-out', null));
        } else {
          const foodAct = dayActs.find(isFood) || null;
          const nonFoodActs = dayActs.filter((a) => a !== foodAct);
          const morningAct = nonFoodActs[0] || null;
          const afternoonAct = nonFoodActs[1] || null;

          activityBlocks.push(morningAct
            ? toBlock(morningAct.start_time || '10:00', morningAct.name, morningAct)
            : toBlock('10:00', 'Paseo matutino por el centro histórico', null));
          activityBlocks.push(foodAct
            ? toBlock(foodAct.start_time || '13:00', foodAct.name, foodAct)
            : toBlock('13:00', 'Almuerzo en un restaurante local de la zona', null));
          activityBlocks.push(afternoonAct
            ? toBlock(afternoonAct.start_time || '16:00', afternoonAct.name, afternoonAct)
            : toBlock('16:00', 'Tarde libre para explorar tiendas y cafés del barrio', null));
          activityBlocks.push(toBlock('20:00', 'Paseo nocturno y cena cerca del hotel', null));
        }

        const realNames = dayActs.map((a) => a.name).filter(Boolean);
        let title, summary;
        if (isArrival) {
          title = `Día de llegada a ${dest}`;
          summary = `Llegada a ${dest}. Traslado y check-in en el hotel. Por la noche, cena cerca del hotel para empezar a disfrutar del destino.`;
        } else if (isReturn) {
          title = `Último día en ${dest} — Regreso`;
          summary = `Último día en ${dest}: check-out del hotel y vuelo de regreso. Aprovecha la mañana para una última exploración.`;
        } else if (realNames.length > 0) {
          title = realNames.join(' · ');
          summary = `Día dedicado a ${realNames.join(' y ')}, con tiempo libre para seguir descubriendo ${dest} entre visita y visita.`;
        } else {
          title = `Día libre para caminar y conocer ${dest}`;
          summary = `Día libre para explorar ${dest} a tu ritmo, pasear por sus calles y descubrir rincones locales.`;
        }

        let pointsOfInterest;
        if (realNames.length > 0) {
          pointsOfInterest = [realNames[0]];
        } else if (!isArrival && !isReturn && landmarks.length > 0) {
          pointsOfInterest = [landmarks[landmarkIdx % landmarks.length]];
          landmarkIdx++;
        } else {
          pointsOfInterest = [];
        }

        days.push({
          day: dayNum,
          date: dateStr,
          title,
          summary,
          points_of_interest: pointsOfInterest,
          activities: activityBlocks
        });
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
