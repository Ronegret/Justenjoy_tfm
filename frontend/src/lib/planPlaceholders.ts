// Marcadores de los RELLENOS que el mapper de n8n inserta cuando el plan viene
// incompleto (`lib/n8nPlan.ts`): un hotel "pendiente de confirmar" y un día de
// itinerario genérico. Existen para que la UI no se rompa —`ItineraryTimeline`
// accede a `itinerary[0]`— y para no fingir datos que n8n no devolvió.
//
// Viven aquí, y no en `n8nPlan.ts`, porque el CLIENTE necesita reconocerlos:
// `TripContext.refineTrip` compara el plan refinado con el actual para no
// sobrescribir datos buenos con relleno, y `n8nPlan.ts` es server-only (lee
// `process.env` y llama a APIs externas), así que no puede importarse desde un
// componente `'use client'`. Duplicar las cadenas a mano sería peor: en cuanto
// una de las dos copias cambiase, el guardarraíl dejaría de detectar nada, en
// silencio.

/** Prefijo del hotel de relleno. El nombre real lleva el destino detrás. */
export const HOTEL_PLACEHOLDER_PREFIX = 'Alojamiento pendiente de confirmar';

/** Resumen exacto del día de itinerario de relleno. */
export const ITINERARY_PLACEHOLDER_SUMMARY =
  'Itinerario aún por detallar; explora el destino a tu ritmo.';

export function isPlaceholderHotel(hotel: { name?: string } | undefined): boolean {
  return !!hotel?.name?.startsWith(HOTEL_PLACEHOLDER_PREFIX);
}

/**
 * ¿El itinerario es solo el día de relleno? Se exige que sea el ÚNICO día: un
 * viaje real con ese texto en uno de sus días sigue siendo un itinerario válido.
 */
export function isPlaceholderItinerary(itinerary: { summary?: string }[] | undefined): boolean {
  return itinerary?.length === 1 && itinerary[0]?.summary === ITINERARY_PLACEHOLDER_SUMMARY;
}
