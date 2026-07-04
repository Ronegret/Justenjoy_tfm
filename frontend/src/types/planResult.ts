// Tipos compartidos para el resultado de generar un plan de viaje.
// Se mantienen aparte de types/trip.ts para no colisionar con otras ramas.

/** Aviso emitido por n8n cuando el plan no puede completarse (p. ej. sin vuelos). */
export interface N8nWarning {
  type?: string;
  detail?: string;
  proposed_change?: string;
  requires_user_approval?: boolean;
  amount_over?: number;
}

/**
 * Resultado de `generateTrip`: o bien un viaje utilizable (`ok`) o bien la
 * señal de que n8n necesita que el usuario ajuste la entrada (`needs_user_input`),
 * con los avisos reales de n8n para mostrarlos.
 */
export type GenerateTripResult =
  | { status: 'ok'; tripId: string }
  | { status: 'needs_user_input'; warnings: N8nWarning[] };
