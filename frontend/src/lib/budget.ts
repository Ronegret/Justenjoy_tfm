import { TripPreferences } from '@/types/trip';

export function tripNights(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.round((e.getTime() - s.getTime()) / 86400000);
  return Math.max(1, diff);
}

export function totalTravelers(travelers: TripPreferences['travelers']): number {
  return Math.max(1, (travelers.adults || 0) + (travelers.children || 0));
}

// USD por persona/noche. `MIN` es el suelo por debajo del cual un viaje real
// (vuelo + noche de hotel + comida básica) deja de ser alcanzable — no es que
// el presupuesto sea "ajustado", es que no hay ningún destino real que encaje.
// Antes este mínimo no existía: el slider (o los botones de categoría) podían
// enviar un `budget_total_usd` inferior al coste real de cualquier ruta, y el
// backend siempre terminaba devolviendo "presupuesto superado".
export const MIN_DAILY_RATE_USD = 60;
export const DEFAULT_DAILY_RATE_USD = 150;
export const MAX_DAILY_RATE_USD = 700;

export interface BudgetBounds {
  min: number;
  default: number;
  max: number;
}

export function budgetBounds(prefs: Pick<TripPreferences, 'dates' | 'travelers'>): BudgetBounds {
  const nights = tripNights(prefs.dates.start, prefs.dates.end);
  const travelers = totalTravelers(prefs.travelers);
  return {
    min: Math.round(nights * travelers * MIN_DAILY_RATE_USD),
    default: Math.round(nights * travelers * DEFAULT_DAILY_RATE_USD),
    max: Math.round(nights * travelers * MAX_DAILY_RATE_USD)
  };
}

export type BudgetTier = 'low' | 'balanced' | 'premium' | 'luxury';

export function budgetTierFromAmount(amountUsd: number, bounds: BudgetBounds): BudgetTier {
  const range = bounds.max - bounds.min;
  const position = range > 0 ? (amountUsd - bounds.min) / range : 0;
  if (position < 0.25) return 'low';
  if (position < 0.55) return 'balanced';
  if (position < 0.8) return 'premium';
  return 'luxury';
}

export const BUDGET_TIER_LABELS: Record<BudgetTier, string> = {
  low: 'Económico',
  balanced: 'Equilibrado',
  premium: 'Premium',
  luxury: 'Lujo'
};
