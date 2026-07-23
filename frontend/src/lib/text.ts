// Utilidades de normalización de texto compartidas. Antes la lógica de quitar
// acentos (`normalize('NFD')` + eliminación de diacríticos) estaba duplicada en
// el slugify del PDF y en el buscador del dashboard, sin coordinar. Fuente única
// de verdad para no arreglarla en dos sitios.

/** Quita los diacríticos (acentos, diéresis…) de una cadena: "José" → "Jose". */
function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Normaliza un texto para búsqueda insensible a mayúsculas y acentos,
 * conservando los espacios. "José Pérez" → "jose perez".
 */
export function normalizeForSearch(value: string): string {
  return stripDiacritics(value).toLowerCase();
}

/**
 * Normaliza para comparación laxa: minúsculas, sin acentos y sin separadores
 * (espacios, guiones, signos, +). Pensada para buscar por datos del cliente
 * ignorando el formato: "jose perez" casa "José Pérez" y "600123456" casa
 * "+34 600 123 456".
 */
export function normalizeLoose(value: string): string {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}
