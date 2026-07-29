// Tipos compartidos para el resultado de generar un plan de viaje.
// Se mantienen aparte de types/trip.ts para no colisionar con otras ramas.

/** Aviso emitido por n8n cuando el plan no puede completarse (p. ej. sin vuelos). */
export interface N8nWarning {
  type?: string;
  detail?: string;
  proposed_change?: string;
  requires_user_approval?: boolean;
  amount_over?: number;
  /** Solo en `budget_exceeded`: coste real detectado, redondeado hacia arriba.
   * Permite ofrecer "usar este presupuesto y reintentar" en vez de un callejón
   * sin salida. */
  suggested_budget_usd?: number;
}

/**
 * Resultado de `generateTrip`: o bien un viaje utilizable (`ok`) o bien la
 * señal de que n8n necesita que el usuario ajuste la entrada (`needs_user_input`),
 * con los avisos reales de n8n para mostrarlos.
 */
export type GenerateTripResult =
  | { status: 'ok'; tripId: string }
  | { status: 'needs_user_input'; warnings: N8nWarning[] };

/**
 * Resultado de `refineTrip` (RUTA B de n8n, `travel-refine`). Además de los
 * casos de `generateTrip`, contempla `session_expired`: la sesión que la RUTA B
 * necesita vive en la MEMORIA de n8n indexada por `session_id`, y caduca o se
 * pierde si n8n se reinicia. Cuando eso ocurre, el refinamiento no es posible
 * pero el plan actual se conserva intacto; la UI muestra un aviso claro y, si
 * el usuario quiere cambios, debe replanificar desde cero (RUTA A).
 *
 * `blocked_sensitive`: el texto de refinamiento parece contener categorías
 * especiales del art. 9 RGPD (salud, religión, etc.). Por minimización y para no
 * incumplir la AUP de los buscadores, NO se reenvía a n8n; se pide reformular sin
 * datos personales sensibles y el plan actual se conserva. Ver `lib/sensitiveData`
 * y el hallazgo #4 de `docs/auditoria-cumplimiento-legal-seguridad.md`.
 */
export type RefineTripResult =
  | { status: 'ok'; tripId: string }
  | { status: 'needs_user_input'; warnings: N8nWarning[] }
  | { status: 'session_expired' }
  | { status: 'blocked_sensitive'; categories: string[] }
  | { status: 'error'; message: string };
