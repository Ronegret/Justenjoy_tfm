// Preparar el payload para guardar en Supabase (tabla travel_plans)
// Solo procesa si el plan está listo (plan_ready)
const result = $input.first().json;

// Guardar solo planes completos — no needs_user_input ni error
if (result.status !== 'plan_ready') {
  // Pasar el resultado sin modificar y marcar que no se debe guardar
  return [{ json: { ...result, _skip_supabase: true } }];
}

const plan = result.plan || {};
const segment = plan.segments?.[0] || {};
const costSummary = plan.cost_summary || {};

// Recuperar el travel_brief del session_state para metadatos
let travelBrief = {};
try {
  const prepMotor = $('Preparar Motor Planificador').first().json;
  travelBrief = prepMotor.session_state?.travel_brief || {};
} catch(e) {
  travelBrief = {};
}

// Construir el registro para Supabase
const record = {
  session_id: result.session_id,
  status: result.status,
  destination: segment.destination || travelBrief.destination_city?.[0] || 'unknown',
  origin: segment.origin || travelBrief.origin_city || 'unknown',
  departure_date: segment.flights?.outbound?.departure_datetime?.slice(0,10)
    || travelBrief.departure_date || null,
  return_date: segment.flights?.return?.departure_datetime?.slice(0,10)
    || travelBrief.return_date || null,
  budget_usd: costSummary.budget_total_usd || travelBrief.budget_total_usd || null,
  total_cost_usd: costSummary.total_usd || null,
  travelers_count: (travelBrief.travelers?.adults || 0) + (travelBrief.travelers?.children?.length || 0),
  activity_interests: travelBrief.activity_interests || [],
  plan: plan
};

// Pasar tanto el registro para Supabase como el resultado original para el Responder
return [{ json: {
  ...result,
  _supabase_record: record,
  _skip_supabase: false
} }];
