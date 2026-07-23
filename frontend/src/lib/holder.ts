import { PlanHolder } from '@/types/trip';

// Helpers compartidos del titular/cliente del plan. Unifican el criterio de "hay
// datos" (recortando espacios) entre la captura en el wizard, el envío a n8n y la
// visualización en el detalle del viaje, que antes divergían (unos recortaban
// espacios y otros no). Fuente única de verdad para no duplicar la lógica.

/** ¿El titular tiene algún dato real, ignorando espacios en blanco? */
export function holderHasData(h?: PlanHolder | null): boolean {
  if (!h) return false;
  return !!(
    (h.firstName || '').trim() ||
    (h.lastName || '').trim() ||
    (h.phone || '').trim() ||
    (h.email || '').trim()
  );
}

/** Nombre completo del titular, recortado. Cadena vacía si no hay nombre. */
export function holderFullName(h?: PlanHolder | null): string {
  if (!h) return '';
  return [h.firstName, h.lastName]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * Titular en el contrato snake_case que espera n8n, con los valores recortados,
 * o `undefined` si no hay ningún dato. Es la fuente única del campo `holder` del
 * payload del webhook.
 */
export function holderToN8nPayload(
  h?: PlanHolder | null
): { first_name: string; last_name: string; phone: string; email: string } | undefined {
  if (!holderHasData(h)) return undefined;
  return {
    first_name: (h!.firstName || '').trim(),
    last_name: (h!.lastName || '').trim(),
    phone: (h!.phone || '').trim(),
    email: (h!.email || '').trim()
  };
}
