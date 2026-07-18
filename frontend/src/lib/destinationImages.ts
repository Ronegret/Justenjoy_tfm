// Fotos locales de respaldo por ciudad — se usan cuando no hay imageUrl real
// (Google Places) para el destino del viaje ni para una parada concreta del
// itinerario. Antes cada bloque sin foto propia caía a una única imagen
// genérica de stock (ala de avión al atardecer) sin relación con el destino;
// esto da al menos la foto real de la ciudad en vez de una escena aleatoria.
export function getFallbackDestinationImage(dest: string): string {
  const d = dest.toLowerCase();
  if (d.includes('lisboa')) return '/images/destinations/lisboa.png';
  if (d.includes('porto') || d.includes('oport')) return '/images/destinations/oporto.png';
  if (d.includes('roma')) return '/images/destinations/roma.png';
  if (d.includes('barcelona')) return '/images/destinations/barcelona.png';
  if (d.includes('madrid')) return '/images/destinations/madrid.png';
  if (d.includes('valencia')) return '/images/destinations/valencia.png';
  if (d.includes('granada')) return '/images/destinations/granada.png';
  if (d.includes('canarias')) return '/images/destinations/islas_canarias.png';
  if (d.includes('londres') || d.includes('london')) return '/images/destinations/londres.png';
  if (d.includes('mallorca')) return '/images/destinations/mallorca.png';
  if (d.includes('amsterdam') || d.includes('ámsterdam')) return '/images/destinations/amsterdam.png';
  if (d.includes('berl')) return '/images/destinations/berlin.png';
  if (d.includes('caracas')) return '/images/destinations/caracas.png';
  if (d.includes('nueva york') || d.includes('new york')) return '/images/destinations/nueva_york.png';
  if (d.includes('parís') || d.includes('paris')) return '/images/destinations/paris.png';
  if (d.includes('rio de janeiro') || d.includes('río de janeiro')) return '/images/destinations/rio_de_janeiro.png';
  if (d.includes('santiago')) return '/images/destinations/santiago_chile.png';
  return '/images/destinations/barcelona.png';
}
