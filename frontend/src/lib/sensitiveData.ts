// Guardarraíl de MINIMIZACIÓN de categorías especiales (RGPD art. 9) en texto libre.
//
// Contexto — hallazgo #4 de `docs/auditoria-cumplimiento-legal-seguridad.md`: la caja
// de refinamiento de `/trip/[id]` envía texto libre a n8n → LLM (GPT-4o-mini) y
// buscadores (SerpAPI/Tavily). La AUP de **Tavily prohíbe** enviar datos del art. 9,
// y no hay base jurídica (9.2.a) para tratarlos aquí. Este módulo detecta señales de
// que el usuario está revelando un ATRIBUTO PERSONAL sensible; cuando las hay,
// `/api/refine-trip` **rechaza** el refinamiento y pide reformular en vez de reenviar
// el texto aguas abajo. El plan actual se conserva intacto.
//
// Es un control **best-effort y proporcionado**, no un clasificador exhaustivo: la
// defensa principal es el **reencuadre funcional** (la UI pide "solo preferencias de
// viaje") sumado a este filtro y a la no-persistencia del texto. NO sustituye la base
// jurídica ni la información del art. 13 (ver Artefacto 1, política de privacidad).
//
// Diseño deliberado: NO bloquea preferencias funcionales legítimas de viaje —hotel
// accesible, zona "gay-friendly", comida vegetariana— porque eso sería
// sobrebloqueo (mala UX y potencialmente discriminatorio). Solo se marca cuando el
// texto revela el atributo sensible de la propia persona (p. ej. "soy diabético",
// "soy musulmán", "necesito comida halal").
//
// LIMITACIÓN CONOCIDA (cobertura monoidioma): los patrones están en ESPAÑOL. Un
// texto de categoría especial escrito en otro idioma (p. ej. "I am pregnant")
// puede no detectarse y llegar a los buscadores. Es coherente con el carácter
// best-effort del control y con que el portal es en español; la defensa jurídica
// principal sigue siendo el reencuadre funcional + la no-persistencia del texto,
// no este filtro. Si se internacionaliza el portal, ampliar los patrones.

export type SpecialCategory =
  | 'salud'
  | 'religión'
  | 'orientación sexual'
  | 'ideología política'
  | 'afiliación sindical'
  | 'origen étnico o racial';

export interface SpecialCategoryScan {
  hit: boolean;
  categories: SpecialCategory[];
}

// El texto se normaliza (minúsculas + sin diacríticos) antes de aplicar los
// patrones, así que los patrones van SIN tildes. Se usa `\b` SOLO al inicio para
// permitir prefijos (p. ej. "diabet" cubre diabético/diabetes) sin cortar a mitad
// de otra palabra.
const PATTERNS: Array<{ category: SpecialCategory; re: RegExp }> = [
  // Salud: condiciones médicas explícitas. Incluye alergias e intolerancias y
  // celiaquía porque son datos de salud (art. 9), aunque el usuario los formule
  // como preferencia dietética. NO incluye términos de accesibilidad funcional
  // (silla de ruedas, movilidad reducida, discapacidad): esos se marcan solo con
  // autoidentificación en el patrón siguiente, para no bloquear peticiones
  // legítimas como "hotel con acceso para silla de ruedas" (ver cabecera).
  {
    category: 'salud',
    re: /\b(?:diabet|celiac|alergi|intoleranci|embarazad|gestant|cancer|tumor|vih|sida|hiv|depresi|ansiedad|bipolar|esquizo|autis|asperger|tdah|epilep|alzheimer|parkinson|marcapasos|insulin|dialisi|quimioterap|enfermedad cronica|dolencia|medicacion|medicament|protesis|oxigeno medico|lesion medular)/g
  },
  // Discapacidad como dato personal: SOLO cuando el texto autoidentifica la
  // condición ("soy/tengo/uso ... discapacidad/silla de ruedas"), no cuando pide
  // una característica funcional del alojamiento ("acceso para silla de ruedas").
  {
    category: 'salud',
    re: /\b(?:soy|estoy|tengo|padezco|sufro|uso|voy en)\b[\w\s]{0,10}(?:discapaci|minusval|movilidad reducida|silla de ruedas)/g
  },
  // Religión: dietas/prácticas/prendas religiosas y autoidentificación. NO marca
  // iglesias/mezquitas/sinagogas como destino turístico (eso es turismo).
  {
    category: 'religión',
    re: /\b(?:halal|kosher|kasher|ramadan|shabbat|sabbat|kipa|hiyab|niqab|burka|velo islamico|soy (?:musulman|catolic|cristian|evangelic|judi|budist|hindu|ateo|agnostic)|mi religion|motivos religiosos)/g
  },
  // Orientación sexual: SOLO autoidentificación personal ("soy gay"), no
  // preferencias de destino ("zona gay-friendly"), que son funcionales.
  {
    category: 'orientación sexual',
    re: /\bsoy (?:gay|homosexual|lesbian|lesbic|bisexual|trans(?:exual|genero|generista)?\b)/g
  },
  // Ideología política: mínimo y de alta precisión para evitar falsos positivos.
  {
    category: 'ideología política',
    re: /\b(?:partido politic|militante de|mi ideologia|afiliacion politica)/g
  },
  // Afiliación sindical.
  {
    category: 'afiliación sindical',
    re: /\b(?:sindicat|afiliad(?:o|a) a (?:un |el )?sindic)/g
  },
  // Origen racial o étnico (autoidentificación explícita). NO incluye "de raza"
  // suelto: colisiona con razas de mascota ("perro de raza"), un caso soportado
  // (pet_friendly). La autoidentificación se cubre con "mi raza"/"mi etnia"/"soy …".
  {
    category: 'origen étnico o racial',
    re: /\b(?:soy (?:gitan|latin|africa|asiatic|arabe|indigena|mestiz)|mi etnia|mi raza|origen etnico)/g
  }
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, ''); // elimina diacríticos combinantes (á→a, ñ→n)
}

// Negador seguido del hueco hasta la coincidencia (capturado para inspeccionarlo).
// La ventana es corta a propósito: negar una condición cercana es una NO-revelación
// y no hay que bloquearla, pero un "no" lejano en la frase no debe amnistiar una
// revelación real. La puntuación ya corta la ventana porque el hueco solo admite
// `[\w\s]`.
const NEGATION_BEFORE = /\b(?:no|sin|ni|ningun[oa]?|tampoco|jamas|nunca)\b([\w\s]{0,16})$/;

// Conjunciones que abren una oración NUEVA: si aparecen entre el negador y la
// coincidencia, la negación pertenece a la oración anterior y no alcanza a esta.
// Sin esto, "sin gluten y soy celiaco" o "sin escaleras y tengo movilidad
// reducida" se daban por negados y el texto llegaba al LLM y a los buscadores,
// que es justo lo que este módulo existe para evitar.
const CLAUSE_BREAK = /\b(?:y|e|o|u|pero|aunque)\b/;

/**
 * ¿La coincidencia en `index` viene negada? Busca un negador en la ventana previa
 * ("no tengo alergias", "sin alergias conocidas") y comprueba que la negación no
 * se haya quedado en una oración anterior (ver CLAUSE_BREAK).
 */
function precededByNegation(haystack: string, index: number): boolean {
  const before = haystack.slice(Math.max(0, index - 20), index);
  const negated = NEGATION_BEFORE.exec(before);
  if (!negated) return false;
  return !CLAUSE_BREAK.test(negated[1]);
}

/**
 * Escanea texto libre en busca de señales de categorías especiales del art. 9.
 * Devuelve las categorías detectadas (para poder avisar al usuario de qué
 * reformular). `hit === false` no garantiza ausencia de datos sensibles; es un
 * control best-effort (ver cabecera del módulo). Ignora coincidencias negadas
 * (ver precededByNegation).
 */
export function scanForSpecialCategoryData(text: string): SpecialCategoryScan {
  const normalized = normalize(text);
  const categories: SpecialCategory[] = [];
  for (const { category, re } of PATTERNS) {
    if (categories.includes(category)) continue;
    // Los patrones llevan flag `g`: se recorren TODAS las coincidencias y basta
    // una NO negada para marcar la categoría. lastIndex se resetea por si el
    // literal se reutiliza entre llamadas.
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(normalized)) !== null) {
      if (!precededByNegation(normalized, m.index)) {
        categories.push(category);
        break;
      }
      if (m.index === re.lastIndex) re.lastIndex++; // evita bucle en match vacío
    }
  }
  return { hit: categories.length > 0, categories };
}
