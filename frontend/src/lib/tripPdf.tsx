import React from 'react';
import { TripData } from '@/types/trip';

/** Convierte un texto libre en un fragmento seguro para nombre de fichero. */
function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'viaje';
}

/**
 * Genera el PDF del viaje a partir de `trip` y dispara su descarga en el
 * navegador. El import de @react-pdf/renderer y del documento es dinámico para
 * que no entren en el bundle de servidor / SSR (Next 16).
 *
 * Propaga cualquier error (no lo silencia) para que el llamador avise al usuario.
 */
export async function downloadTripPdf(trip: TripData): Promise<void> {
  const [{ pdf }, { TripPdfDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/trip/TripPdfDocument'),
  ]);

  const blob = await pdf(<TripPdfDocument trip={trip} />).toBlob();

  const fileName = `viaje-${slugify(trip.best_option.destination)}-${trip.user_preferences.dates.start}.pdf`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revocar tras el tick actual: revocar de forma síncrona justo después de
  // click() puede abortar la descarga de blobs grandes en algunos navegadores.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
