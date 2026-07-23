// Datos de contacto del titular/cliente del plan. Opcionales: el viajero puede
// omitir este paso del wizard y generar el plan igual. Se capturan en blanco (no
// se prellenan desde la cuenta de Firebase) y se persisten en la tabla
// `plan_holders` de Supabase (lado n8n), no en `travel_plans`.
export interface PlanHolder {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  // Evidencia del consentimiento (RGPD 6.1.a). Se rellenan al marcar la casilla
  // de consentimiento en el paso del titular; `consentAt` es el momento (ISO) y
  // `consentVersion` la versión de la política aceptada. Sin `consentAt` el
  // titular NO se envía a n8n ni se persiste (ver lib/holder.ts). No cuentan
  // como "datos de titular" (holderHasData mira solo nombre/tel/email).
  consentAt?: string;
  consentVersion?: string;
}

export interface TripPreferences {
  origin: string;
  destination: string;
  dates: {
    start: string;
    end: string;
    flexible: boolean;
  };
  travelers: {
    adults: number;
    children: number;
  };
  budget: 'low' | 'balanced' | 'premium' | 'luxury';
  // Monto real en USD que el usuario fija con el slider de presupuesto. Es la
  // fuente de verdad para `budget_total_usd` (ver mapPreferencesToN8n) — ya no
  // se infiere solo de la categoría `budget`, que era una tarifa/día adivinada
  // y podía quedar por debajo del coste real de la ruta.
  budgetAmountUsd: number;
  style: string[];
  restrictions: string[];
  // Titular/cliente del plan (nombre, apellidos, teléfono, email). Opcional: se
  // omite si el viajero saltó el paso del wizard. Al ir dentro de
  // `TripPreferences`, viaja embebido en `TripData.user_preferences`, así que
  // queda disponible para mostrarlo en el detalle del viaje sin duplicar campos.
  holder?: PlanHolder;
}

export interface JustGoScore {
  overall_match: number;
  price_score: number;
  comfort_score: number;
  location_score: number;
  activities_score: number;
  friction_score: number;
  friction_label: 'Baja' | 'Media' | 'Alta';
}

export interface Flight {
  provider: string;
  airline: string;
  from: string;
  to: string;
  departure: string;
  arrival: string;
  duration: string;
  stops: number;
  price: number;
  baggage: string;
  booking_url: string;
}

export interface Hotel {
  provider: string;
  name: string;
  area: string;
  rating: number;
  price_per_night: number;
  total_price: number;
  pros: string[];
  cons: string[];
  booking_url: string;
  lat?: number;
  lng?: number;
}

export interface Activity {
  provider: string;
  name: string;
  category: string;
  price: number;
  duration: string;
  requires_booking: boolean;
  opening_hours: string;
  best_time: string;
  booking_url: string;
  why: string;
}

export interface Event {
  provider: string;
  name: string;
  date: string;
  time: string;
  price_from: number;
  venue: string;
  url: string;
}

export interface ItineraryBlock {
  time: string;
  period: 'Mañana' | 'Mediodía' | 'Tarde' | 'Noche';
  title: string;
  type: 'flight' | 'food' | 'activity' | 'hotel' | 'transit' | 'rest' | 'airport';
  duration: string;
  cost: number;
  location: string;
  description: string;
  tip?: string;
  alternative?: string;
  lat?: number;
  lng?: number;
  imageUrl?: string;
}

export interface DayPlan {
  day: number;
  date: string;
  title: string;
  summary: string;
  blocks: ItineraryBlock[];
}

export interface BudgetBreakdown {
  flights: number;
  hotel: number;
  activities: number;
  // null = no se encontró ningún dato real de transporte (antes se rellenaba
  // con 50 USD fijo, presentado como si fuera un precio real detectado).
  transport: number | null;
  food: number;
  extras: number;
  total: number;
  // Claves de este objeto que son una estimación genérica de guía de viaje,
  // no un precio real detectado por ninguna búsqueda (hoy: food, extras).
  estimatedFields: Array<'flights' | 'hotel' | 'activities' | 'transport' | 'food' | 'extras'>;
}

export interface TripOption {
  title: string;
  destination: string;
  summary: string;
  estimated_total: number;
  currency: string;
  why_selected: string[];
  tradeoffs: string[];
  imageUrl?: string;
  // Climatología real (Open-Meteo, histórico del mismo rango de fechas hace un
  // año) para la ubicación del hotel — ausente si la API no respondió, nunca
  // se rellena con un valor inventado.
  climate?: {
    avgTempC: number;
    description: string;
  };
}

export interface AlternativeOption {
  type: 'cheapest' | 'premium' | 'comfortable' | 'balanced';
  destination: string;
  match: number;
  estimated_total: number;
  reason: string;
}

export interface TripData {
  trip_id: string;
  user_preferences: TripPreferences;
  justgo_score: JustGoScore;
  best_option: TripOption;
  alternatives: AlternativeOption[];
  flights: Flight[];
  hotels: Hotel[];
  activities: Activity[];
  events: Event[];
  itinerary: DayPlan[];
  budget: BudgetBreakdown;
  // Avisos no bloqueantes que n8n emitió aunque el plan sí se completó (p. ej.
  // "no había vuelo el día exacto, se ajustó la fecha ±1 día"). Antes se
  // descartaban en silencio porque solo se leían los `warnings` en la rama
  // needs_user_input.
  notices?: string[];
  share: {
    private_url: string;
    pdf_enabled: boolean;
    calendar_enabled: boolean;
  };
}
