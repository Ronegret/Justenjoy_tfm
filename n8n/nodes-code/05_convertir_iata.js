// Nodo Code: "Convertir Ciudades a IATA"
// ---------------------------------------------------------------------------
// Mantiene 3 tablas (~60 ciudades) y enriquece el session_state con:
//   - origin_city_iata, destination_city_iata        (Tabla 1: cityToIata)
//   - destination_city_ll  "@lat,lng,15z"            (Tabla 2: cityToGps)
//   - destination_airport_name                        (Tabla 3: iataToAirportName)
// Fallbacks: IATA -> primeros 3 chars en mayuscula; GPS -> null.
// Ver doc de arquitectura, secciones 4.4 y 12.

const incoming = $input.first().json;
const session_state = incoming.session_state;
const brief = session_state.travel_brief;

// ── Tabla 1: ciudad -> codigo IATA ─────────────────────────────────────────
const cityToIata = {
  amsterdam: 'AMS', paris: 'CDG', london: 'LHR', barcelona: 'BCN',
  madrid: 'MAD', rome: 'FCO', berlin: 'BER', munich: 'MUC',
  frankfurt: 'FRA', vienna: 'VIE', zurich: 'ZRH', geneva: 'GVA',
  brussels: 'BRU', lisbon: 'LIS', porto: 'OPO', dublin: 'DUB',
  copenhagen: 'CPH', stockholm: 'ARN', oslo: 'OSL', helsinki: 'HEL',
  prague: 'PRG', budapest: 'BUD', warsaw: 'WAW', athens: 'ATH',
  istanbul: 'IST', moscow: 'SVO', milan: 'MXP', venice: 'VCE',
  florence: 'FLR', naples: 'NAP', nice: 'NCE', valencia: 'VLC',
  seville: 'SVQ', malaga: 'AGP', bilbao: 'BIO', manchester: 'MAN',
  edinburgh: 'EDI',
  'new york': 'JFK', newyork: 'JFK', miami: 'MIA', 'los angeles': 'LAX',
  losangeles: 'LAX', chicago: 'ORD', 'san francisco': 'SFO',
  sanfrancisco: 'SFO', boston: 'BOS', washington: 'IAD', toronto: 'YYZ',
  vancouver: 'YVR', 'mexico city': 'MEX', mexicocity: 'MEX', cancun: 'CUN',
  'buenos aires': 'EZE', buenosaires: 'EZE', bogota: 'BOG', lima: 'LIM',
  santiago: 'SCL', 'sao paulo': 'GRU', saopaulo: 'GRU', 'rio de janeiro': 'GIG',
  riodejaneiro: 'GIG',
  tokyo: 'NRT', osaka: 'KIX', seoul: 'ICN', beijing: 'PEK', shanghai: 'PVG',
  'hong kong': 'HKG', hongkong: 'HKG', singapore: 'SIN', bangkok: 'BKK',
  'kuala lumpur': 'KUL', kualalumpur: 'KUL', jakarta: 'CGK', mumbai: 'BOM',
  delhi: 'DEL', dubai: 'DXB', 'abu dhabi': 'AUH', abudhabi: 'AUH',
  doha: 'DOH', 'tel aviv': 'TLV', telaviv: 'TLV',
  cairo: 'CAI', 'cape town': 'CPT', capetown: 'CPT', johannesburg: 'JNB',
  marrakech: 'RAK', casablanca: 'CMN', nairobi: 'NBO',
  sydney: 'SYD', melbourne: 'MEL', auckland: 'AKL',
};

// ── Tabla 2: ciudad -> coordenadas GPS "@lat,lng,15z" ──────────────────────
const cityToGps = {
  amsterdam: '@52.3676,4.9041,15z', paris: '@48.8566,2.3522,15z',
  london: '@51.5074,-0.1278,15z', barcelona: '@41.3851,2.1734,15z',
  madrid: '@40.4168,-3.7038,15z', rome: '@41.9028,12.4964,15z',
  berlin: '@52.5200,13.4050,15z', munich: '@48.1351,11.5820,15z',
  frankfurt: '@50.1109,8.6821,15z', vienna: '@48.2082,16.3738,15z',
  zurich: '@47.3769,8.5417,15z', geneva: '@46.2044,6.1432,15z',
  brussels: '@50.8503,4.3517,15z', lisbon: '@38.7223,-9.1393,15z',
  porto: '@41.1579,-8.6291,15z', dublin: '@53.3498,-6.2603,15z',
  copenhagen: '@55.6761,12.5683,15z', stockholm: '@59.3293,18.0686,15z',
  oslo: '@59.9139,10.7522,15z', helsinki: '@60.1699,24.9384,15z',
  prague: '@50.0755,14.4378,15z', budapest: '@47.4979,19.0402,15z',
  warsaw: '@52.2297,21.0122,15z', athens: '@37.9838,23.7275,15z',
  istanbul: '@41.0082,28.9784,15z', moscow: '@55.7558,37.6173,15z',
  milan: '@45.4642,9.1900,15z', venice: '@45.4408,12.3155,15z',
  florence: '@43.7696,11.2558,15z', naples: '@40.8518,14.2681,15z',
  nice: '@43.7102,7.2620,15z', valencia: '@39.4699,-0.3763,15z',
  seville: '@37.3891,-5.9845,15z', malaga: '@36.7213,-4.4214,15z',
  bilbao: '@43.2630,-2.9350,15z', manchester: '@53.4808,-2.2426,15z',
  edinburgh: '@55.9533,-3.1883,15z',
  'new york': '@40.7128,-74.0060,15z', newyork: '@40.7128,-74.0060,15z',
  miami: '@25.7617,-80.1918,15z', 'los angeles': '@34.0522,-118.2437,15z',
  losangeles: '@34.0522,-118.2437,15z', chicago: '@41.8781,-87.6298,15z',
  'san francisco': '@37.7749,-122.4194,15z', sanfrancisco: '@37.7749,-122.4194,15z',
  boston: '@42.3601,-71.0589,15z', washington: '@38.9072,-77.0369,15z',
  toronto: '@43.6532,-79.3832,15z', vancouver: '@49.2827,-123.1207,15z',
  'mexico city': '@19.4326,-99.1332,15z', mexicocity: '@19.4326,-99.1332,15z',
  cancun: '@21.1619,-86.8515,15z',
  'buenos aires': '@-34.6037,-58.3816,15z', buenosaires: '@-34.6037,-58.3816,15z',
  bogota: '@4.7110,-74.0721,15z', lima: '@-12.0464,-77.0428,15z',
  santiago: '@-33.4489,-70.6693,15z', 'sao paulo': '@-23.5505,-46.6333,15z',
  saopaulo: '@-23.5505,-46.6333,15z', 'rio de janeiro': '@-22.9068,-43.1729,15z',
  riodejaneiro: '@-22.9068,-43.1729,15z',
  tokyo: '@35.6762,139.6503,15z', osaka: '@34.6937,135.5023,15z',
  seoul: '@37.5665,126.9780,15z', beijing: '@39.9042,116.4074,15z',
  shanghai: '@31.2304,121.4737,15z', 'hong kong': '@22.3193,114.1694,15z',
  hongkong: '@22.3193,114.1694,15z', singapore: '@1.3521,103.8198,15z',
  bangkok: '@13.7563,100.5018,15z', 'kuala lumpur': '@3.1390,101.6869,15z',
  kualalumpur: '@3.1390,101.6869,15z', jakarta: '@-6.2088,106.8456,15z',
  mumbai: '@19.0760,72.8777,15z', delhi: '@28.7041,77.1025,15z',
  dubai: '@25.2048,55.2708,15z', 'abu dhabi': '@24.4539,54.3773,15z',
  abudhabi: '@24.4539,54.3773,15z', doha: '@25.2854,51.5310,15z',
  'tel aviv': '@32.0853,34.7818,15z', telaviv: '@32.0853,34.7818,15z',
  cairo: '@30.0444,31.2357,15z', 'cape town': '@-33.9249,18.4241,15z',
  capetown: '@-33.9249,18.4241,15z', johannesburg: '@-26.2041,28.0473,15z',
  marrakech: '@31.6295,-7.9811,15z', casablanca: '@33.5731,-7.5898,15z',
  nairobi: '@-1.2921,36.8219,15z',
  sydney: '@-33.8688,151.2093,15z', melbourne: '@-37.8136,144.9631,15z',
  auckland: '@-36.8485,174.7633,15z',
};

// ── Tabla 3: IATA -> nombre completo del aeropuerto ────────────────────────
const iataToAirportName = {
  AMS: 'Amsterdam Airport Schiphol', CDG: 'Paris Charles de Gaulle Airport',
  LHR: 'London Heathrow Airport', BCN: 'Barcelona-El Prat Airport',
  MAD: 'Adolfo Suarez Madrid-Barajas Airport', FCO: 'Rome Fiumicino Airport',
  BER: 'Berlin Brandenburg Airport', MUC: 'Munich Airport',
  FRA: 'Frankfurt Airport', VIE: 'Vienna International Airport',
  ZRH: 'Zurich Airport', GVA: 'Geneva Airport',
  BRU: 'Brussels Airport', LIS: 'Lisbon Humberto Delgado Airport',
  OPO: 'Porto Airport', DUB: 'Dublin Airport',
  CPH: 'Copenhagen Airport', ARN: 'Stockholm Arlanda Airport',
  OSL: 'Oslo Gardermoen Airport', HEL: 'Helsinki Airport',
  PRG: 'Vaclav Havel Airport Prague', BUD: 'Budapest Ferenc Liszt Airport',
  WAW: 'Warsaw Chopin Airport', ATH: 'Athens International Airport',
  IST: 'Istanbul Airport', SVO: 'Moscow Sheremetyevo Airport',
  MXP: 'Milan Malpensa Airport', VCE: 'Venice Marco Polo Airport',
  FLR: 'Florence Airport', NAP: 'Naples International Airport',
  NCE: 'Nice Cote d Azur Airport', VLC: 'Valencia Airport',
  SVQ: 'Seville Airport', AGP: 'Malaga Costa del Sol Airport',
  BIO: 'Bilbao Airport', MAN: 'Manchester Airport', EDI: 'Edinburgh Airport',
  JFK: 'John F. Kennedy International Airport', MIA: 'Miami International Airport',
  LAX: 'Los Angeles International Airport', ORD: 'O Hare International Airport',
  SFO: 'San Francisco International Airport', BOS: 'Boston Logan International Airport',
  IAD: 'Washington Dulles International Airport', YYZ: 'Toronto Pearson International Airport',
  YVR: 'Vancouver International Airport', MEX: 'Mexico City International Airport',
  CUN: 'Cancun International Airport', EZE: 'Buenos Aires Ezeiza International Airport',
  BOG: 'El Dorado International Airport', LIM: 'Jorge Chavez International Airport',
  SCL: 'Santiago International Airport', GRU: 'Sao Paulo Guarulhos International Airport',
  GIG: 'Rio de Janeiro Galeao International Airport',
  NRT: 'Narita International Airport', KIX: 'Kansai International Airport',
  ICN: 'Incheon International Airport', PEK: 'Beijing Capital International Airport',
  PVG: 'Shanghai Pudong International Airport', HKG: 'Hong Kong International Airport',
  SIN: 'Singapore Changi Airport', BKK: 'Suvarnabhumi Airport',
  KUL: 'Kuala Lumpur International Airport', CGK: 'Soekarno-Hatta International Airport',
  BOM: 'Chhatrapati Shivaji Maharaj International Airport', DEL: 'Indira Gandhi International Airport',
  DXB: 'Dubai International Airport', AUH: 'Abu Dhabi International Airport',
  DOH: 'Hamad International Airport', TLV: 'Ben Gurion Airport',
  CAI: 'Cairo International Airport', CPT: 'Cape Town International Airport',
  JNB: 'O. R. Tambo International Airport', RAK: 'Marrakech Menara Airport',
  CMN: 'Casablanca Mohammed V International Airport', NBO: 'Jomo Kenyatta International Airport',
  SYD: 'Sydney Kingsford Smith Airport', MEL: 'Melbourne Airport',
  AKL: 'Auckland Airport',
};

// ── Tabla 4: intereses en cualquier idioma -> inglés para SerpAPI ──────────
const interestToEn = {
  // ES
  gastronomia: 'food', gastronomía: 'food', comida: 'food', restaurantes: 'restaurants',
  museos: 'museums', museo: 'museums', arte: 'art', cultura: 'culture',
  historia: 'history', historico: 'history', histórico: 'history',
  compras: 'shopping', tiendas: 'shopping', moda: 'fashion',
  naturaleza: 'nature', parques: 'parks', playa: 'beach', playas: 'beach',
  aventura: 'adventure', deporte: 'sports', deportes: 'sports',
  musica: 'music', música: 'music', conciertos: 'concerts', teatro: 'theater',
  noche: 'nightlife', vida_nocturna: 'nightlife', bares: 'bars',
  spa: 'spa', relax: 'wellness', bienestar: 'wellness',
  arquitectura: 'architecture', monumentos: 'monuments',
  // PT
  compras_pt: 'shopping', praias: 'beach', museus: 'museums',
  // FR
  gastronomie: 'food', musées: 'museums', plages: 'beach',
  // DE
  einkaufen: 'shopping', museen: 'museums', strand: 'beach',
};

function normalizeInterests(interests) {
  if (!Array.isArray(interests)) return interests;
  return interests.map((i) => {
    const key = String(i).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '_');
    return interestToEn[key] || interestToEn[String(i).trim().toLowerCase()] || i;
  });
}

// ── Helpers de lookup ──────────────────────────────────────────────────────
function norm(s) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, ''); // quita acentos
}

function toIata(city) {
  const key = norm(city);
  if (cityToIata[key]) return cityToIata[key];
  // fallback: primeros 3 chars en mayuscula
  return key.replace(/[^a-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
}

function toGps(city) {
  return cityToGps[norm(city)] || null;
}

// ── Enriquecer el brief ────────────────────────────────────────────────────
const origin = brief.origin_city;
const destinations = Array.isArray(brief.destination_city)
  ? brief.destination_city
  : [brief.destination_city];
const primaryDest = destinations[0];

const origin_city_iata = toIata(origin);
const destination_city_iata = toIata(primaryDest);
const destination_city_ll = toGps(primaryDest);
const destination_airport_name =
  iataToAirportName[destination_city_iata] || `${primaryDest} Airport`;

// Inyectar los campos derivados en el travel_brief del session_state.
brief.origin_city_iata = origin_city_iata;
brief.destination_city_iata = destination_city_iata;
brief.destination_city_ll = destination_city_ll;
brief.destination_airport_name = destination_airport_name;
brief.activity_interests = normalizeInterests(brief.activity_interests);

// Reemitir el item enriquecido (conserva segments, steps_to_run, etc.).
const out = { ...incoming };
out.session_state = { ...session_state, travel_brief: brief };

return [{ json: out }];
