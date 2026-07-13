/** Etiquetas legibles de las preferencias de viaje, compartidas entre la UI y el PDF. */

export const BUDGET_LABELS: Record<string, string> = {
  low: 'Económico',
  balanced: 'Equilibrado',
  premium: 'Premium',
  luxury: 'Lujo',
};

export function budgetLabel(budget: string): string {
  return BUDGET_LABELS[budget] ?? 'Equilibrado';
}
