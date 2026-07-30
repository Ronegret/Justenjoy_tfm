const input = $input.first().json;
const tb = input.travel_brief || input.session_state?.travel_brief || {};

// ── Tabla IATA ─────────────────────────────────────────────────
const cityToIata = {
  'amsterdam': 'AMS', 'amsterdam, netherlands': 'AMS', 'amsterdam, holanda': 'AMS',
  'paris': 'CDG', 'paris, france': 'CDG', 'paris, francia': 'CDG',
  'london': 'LHR', 'london, uk': 'LHR', 'london, england': 'LHR', 'londres': 'LHR',
  'barcelona': 'BCN', 'barcelona, spain': 'BCN', 'barcelona, españa': 'BCN',
  'madrid': 'MAD', 'madrid, spain': 'MAD', 'madrid, españa': 'MAD',
  'valencia': 'VLC', 'valencia, spain': 'VLC', 'valencia, españa': 'VLC',
  'sevilla': 'SVQ', 'seville': 'SVQ', 'sevilla, españa': 'SVQ',
  'malaga': 'AGP', 'málaga': 'AGP', 'malaga, españa': 'AGP',
  'bilbao': 'BIO', 'bilbao, españa': 'BIO',
  'palma': 'PMI', 'palma de mallorca': 'PMI', 'mallorca': 'PMI',
  'alicante': 'ALC', 'alicante, españa': 'ALC',
  'rome': 'FCO', 'roma': 'FCO', 'rome, italy': 'FCO', 'roma, italia': 'FCO',
  'milan': 'MXP', 'milano': 'MXP', 'milan, italy': 'MXP',
  'berlin': 'BER', 'berlin, germany': 'BER', 'berlín': 'BER',
  'frankfurt': 'FRA', 'frankfurt, germany': 'FRA',
  'munich': 'MUC', 'münchen': 'MUC', 'munich, germany': 'MUC',
  'vienna': 'VIE', 'wien': 'VIE', 'viena': 'VIE', 'vienna, austria': 'VIE',
  'zurich': 'ZRH', 'zürich': 'ZRH', 'zurich, switzerland': 'ZRH',
  'brussels': 'BRU', 'bruselas': 'BRU', 'bruxelles': 'BRU',
  'lisbon': 'LIS', 'lisboa': 'LIS', 'lisbon, portugal': 'LIS',
  'athens': 'ATH', 'atenas': 'ATH', 'athens, greece': 'ATH',
  'istanbul': 'IST', 'istanbul, turkey': 'IST',
  'stockholm': 'ARN', 'estocolmo': 'ARN',
  'oslo': 'OSL', 'oslo, norway': 'OSL',
  'copenhagen': 'CPH', 'copenhague': 'CPH', 'københavn': 'CPH',
  'helsinki': 'HEL', 'helsinki, finland': 'HEL',
  'prague': 'PRG', 'praga': 'PRG', 'prague, czech republic': 'PRG',
  'budapest': 'BUD', 'budapest, hungary': 'BUD',
  'warsaw': 'WAW', 'varsovia': 'WAW', 'warszawa': 'WAW',
  'new york': 'JFK', 'nueva york': 'JFK', 'new york, usa': 'JFK',
  'los angeles': 'LAX', 'los ángeles': 'LAX',
  'miami': 'MIA', 'chicago': 'ORD',
  'toronto': 'YYZ', 'montreal': 'YUL', 'montréal': 'YUL',
  'vancouver': 'YVR', 'mexico city': 'MEX', 'ciudad de mexico': 'MEX', 'cdmx': 'MEX',
  'buenos aires': 'EZE', 'bogota': 'BOG', 'bogotá': 'BOG',
  'lima': 'LIM', 'santiago': 'SCL', 'sao paulo': 'GRU', 'são paulo': 'GRU',
  'rio de janeiro': 'GIG', 'rio': 'GIG',
  'tokyo': 'NRT', 'tokio': 'NRT', 'beijing': 'PEK', 'pekin': 'PEK',
  'shanghai': 'PVG', 'hong kong': 'HKG', 'singapore': 'SIN', 'singapur': 'SIN',
  'dubai': 'DXB', 'bangkok': 'BKK', 'mumbai': 'BOM', 'bombay': 'BOM',
  'delhi': 'DEL', 'nueva delhi': 'DEL', 'new delhi': 'DEL',
  'seoul': 'ICN', 'seúl': 'ICN',
  'sydney': 'SYD', 'melbourne': 'MEL', 'auckland': 'AKL',
  'cairo': 'CAI', 'el cairo': 'CAI', 'cape town': 'CPT', 'ciudad del cabo': 'CPT',
  'johannesburg': 'JNB', 'johannesburgo': 'JNB',
  'casablanca': 'CMN', 'nairobi': 'NBO',
  // --- Capitales y grandes ciudades del mundo (añadidas 2026-07-04, v27) ---
  'porto': 'OPO', 'oporto': 'OPO',
  'geneva': 'GVA', 'ginebra': 'GVA',
  'dublin': 'DUB', 'dublín': 'DUB',
  'edinburgh': 'EDI', 'edimburgo': 'EDI',
  'manchester': 'MAN',
  'lyon': 'LYS', 'lión': 'LYS',
  'nice': 'NCE', 'niza': 'NCE',
  'naples': 'NAP', 'nápoles': 'NAP', 'napoli': 'NAP',
  'venice': 'VCE', 'venecia': 'VCE', 'venezia': 'VCE',
  'florence': 'FLR', 'florencia': 'FLR', 'firenze': 'FLR',
  'san francisco': 'SFO',
  'washington': 'IAD', 'washington dc': 'IAD',
  'boston': 'BOS',
  'cancun': 'CUN', 'cancún': 'CUN',
  'havana': 'HAV', 'la habana': 'HAV',
  'panama': 'PTY', 'panamá': 'PTY', 'panama city': 'PTY', 'ciudad de panamá': 'PTY',
  'doha': 'DOH',
  'abu dhabi': 'AUH', 'abu dabi': 'AUH',
  'tel aviv': 'TLV',
  'kuala lumpur': 'KUL',
  'bali': 'DPS', 'denpasar': 'DPS',
  'manila': 'MNL',
  'marrakech': 'RAK', 'marrakesh': 'RAK',
  // Capitales anadidas en v32 para paises listados en COUNTRY_TO_CITIES
  'zagreb': 'ZAG', 'amman': 'AMM', 'ammán': 'AMM',
  // "Tunez" en espanol nombra tanto al pais como a su capital (Tunis): se
  // resuelve directamente a la capital, porque buscar vuelos "a un pais" no
  // tiene sentido y en este contexto casi siempre significa la ciudad.
  'tunis': 'TUN', 'túnez': 'TUN',
};

// ── Tabla GPS → coordenadas para Google Maps (formato @lat,lng,15z) ──
const cityToGps = {
  'amsterdam': '@52.3676,4.9041,15z',
  'paris': '@48.8566,2.3522,15z',
  'london': '@51.5074,-0.1278,15z', 'londres': '@51.5074,-0.1278,15z',
  'barcelona': '@41.3851,2.1734,15z',
  'madrid': '@40.4168,-3.7038,15z',
  'valencia': '@39.4699,-0.3763,15z',
  'sevilla': '@37.3891,-5.9845,15z', 'seville': '@37.3891,-5.9845,15z',
  'malaga': '@36.7213,-4.4214,15z', 'málaga': '@36.7213,-4.4214,15z',
  'bilbao': '@43.2630,-2.9350,15z',
  'palma': '@39.5696,2.6502,15z', 'palma de mallorca': '@39.5696,2.6502,15z', 'mallorca': '@39.5696,2.6502,15z',
  'alicante': '@38.3452,-0.4815,15z',
  'rome': '@41.9028,12.4964,15z', 'roma': '@41.9028,12.4964,15z',
  'milan': '@45.4642,9.1900,15z', 'milano': '@45.4642,9.1900,15z',
  'berlin': '@52.5200,13.4050,15z', 'berlín': '@52.5200,13.4050,15z',
  'frankfurt': '@50.1109,8.6821,15z',
  'munich': '@48.1351,11.5820,15z', 'münchen': '@48.1351,11.5820,15z',
  'vienna': '@48.2082,16.3738,15z', 'wien': '@48.2082,16.3738,15z', 'viena': '@48.2082,16.3738,15z',
  'zurich': '@47.3769,8.5417,15z', 'zürich': '@47.3769,8.5417,15z',
  'brussels': '@50.8503,4.3517,15z', 'bruselas': '@50.8503,4.3517,15z',
  'lisbon': '@38.7223,-9.1393,15z', 'lisboa': '@38.7223,-9.1393,15z',
  'athens': '@37.9838,23.7275,15z', 'atenas': '@37.9838,23.7275,15z',
  'istanbul': '@41.0082,28.9784,15z',
  'stockholm': '@59.3293,18.0686,15z', 'estocolmo': '@59.3293,18.0686,15z',
  'oslo': '@59.9139,10.7522,15z',
  'copenhagen': '@55.6761,12.5683,15z', 'copenhague': '@55.6761,12.5683,15z',
  'prague': '@50.0755,14.4378,15z', 'praga': '@50.0755,14.4378,15z',
  'budapest': '@47.4979,19.0402,15z',
  'warsaw': '@52.2297,21.0122,15z', 'varsovia': '@52.2297,21.0122,15z',
  'new york': '@40.7128,-74.0060,15z', 'nueva york': '@40.7128,-74.0060,15z',
  'los angeles': '@34.0522,-118.2437,15z', 'los ángeles': '@34.0522,-118.2437,15z',
  'miami': '@25.7617,-80.1918,15z',
  'chicago': '@41.8781,-87.6298,15z',
  'toronto': '@43.6532,-79.3832,15z',
  'montreal': '@45.5017,-73.5673,15z', 'montréal': '@45.5017,-73.5673,15z',
  'vancouver': '@49.2827,-123.1207,15z',
  'mexico city': '@19.4326,-99.1332,15z', 'ciudad de mexico': '@19.4326,-99.1332,15z',
  'buenos aires': '@-34.6037,-58.3816,15z',
  'bogota': '@4.7110,-74.0721,15z', 'bogotá': '@4.7110,-74.0721,15z',
  'lima': '@-12.0464,-77.0428,15z',
  'santiago': '@-33.4489,-70.6693,15z',
  'sao paulo': '@-23.5505,-46.6333,15z', 'são paulo': '@-23.5505,-46.6333,15z',
  'rio de janeiro': '@-22.9068,-43.1729,15z',
  'tokyo': '@35.6762,139.6503,15z', 'tokio': '@35.6762,139.6503,15z',
  'beijing': '@39.9042,116.4074,15z', 'pekin': '@39.9042,116.4074,15z',
  'shanghai': '@31.2304,121.4737,15z',
  'hong kong': '@22.3193,114.1694,15z',
  'singapore': '@1.3521,103.8198,15z', 'singapur': '@1.3521,103.8198,15z',
  'dubai': '@25.2048,55.2708,15z',
  'bangkok': '@13.7563,100.5018,15z',
  'mumbai': '@19.0760,72.8777,15z', 'bombay': '@19.0760,72.8777,15z',
  // 'new delhi' es el valor que manda el chip de India del planificador. Estaba en
  // cityToIata pero no aquí, así que el ll salía null y la búsqueda de actividades
  // perdía el ancla que el prompt marca como CRÍTICA.
  'delhi': '@28.6139,77.2090,15z', 'nueva delhi': '@28.6139,77.2090,15z',
  'new delhi': '@28.6139,77.2090,15z',
  'seoul': '@37.5665,126.9780,15z', 'seúl': '@37.5665,126.9780,15z',
  'sydney': '@-33.8688,151.2093,15z',
  'melbourne': '@-37.8136,144.9631,15z',
  'auckland': '@-36.8485,174.7633,15z',
  'cairo': '@30.0444,31.2357,15z', 'el cairo': '@30.0444,31.2357,15z',
  'cape town': '@-33.9249,18.4241,15z', 'ciudad del cabo': '@-33.9249,18.4241,15z',
  'johannesburg': '@-26.2041,28.0473,15z',
  'casablanca': '@33.5731,-7.5898,15z',
  'nairobi': '@-1.2921,36.8219,15z',
  // --- Capitales y grandes ciudades del mundo (v27) ---
  'porto': '@41.1579,-8.6291,15z', 'oporto': '@41.1579,-8.6291,15z',
  'geneva': '@46.2044,6.1432,15z', 'ginebra': '@46.2044,6.1432,15z',
  'dublin': '@53.3498,-6.2603,15z', 'dublín': '@53.3498,-6.2603,15z',
  'edinburgh': '@55.9533,-3.1883,15z', 'edimburgo': '@55.9533,-3.1883,15z',
  'manchester': '@53.4808,-2.2426,15z',
  'lyon': '@45.7640,4.8357,15z', 'lión': '@45.7640,4.8357,15z',
  'nice': '@43.7102,7.2620,15z', 'niza': '@43.7102,7.2620,15z',
  'naples': '@40.8518,14.2681,15z', 'nápoles': '@40.8518,14.2681,15z', 'napoli': '@40.8518,14.2681,15z',
  'venice': '@45.4408,12.3155,15z', 'venecia': '@45.4408,12.3155,15z', 'venezia': '@45.4408,12.3155,15z',
  'florence': '@43.7696,11.2558,15z', 'florencia': '@43.7696,11.2558,15z', 'firenze': '@43.7696,11.2558,15z',
  'san francisco': '@37.7749,-122.4194,15z',
  'washington': '@38.9072,-77.0369,15z', 'washington dc': '@38.9072,-77.0369,15z',
  'boston': '@42.3601,-71.0589,15z',
  'cancun': '@21.1619,-86.8515,15z', 'cancún': '@21.1619,-86.8515,15z',
  'havana': '@23.1136,-82.3666,15z', 'la habana': '@23.1136,-82.3666,15z',
  'panama': '@8.9824,-79.5199,15z', 'panamá': '@8.9824,-79.5199,15z', 'panama city': '@8.9824,-79.5199,15z', 'ciudad de panamá': '@8.9824,-79.5199,15z',
  'doha': '@25.2854,51.5310,15z',
  'abu dhabi': '@24.4539,54.3773,15z', 'abu dabi': '@24.4539,54.3773,15z',
  'tel aviv': '@32.0853,34.7818,15z',
  'kuala lumpur': '@3.1390,101.6869,15z',
  'bali': '@-8.6705,115.2126,15z', 'denpasar': '@-8.6705,115.2126,15z',
  'manila': '@14.5995,120.9842,15z',
  'marrakech': '@31.6295,-7.9811,15z', 'marrakesh': '@31.6295,-7.9811,15z',
  'zagreb': '@45.8150,15.9819,15z',
  'amman': '@31.9454,35.9284,15z', 'ammán': '@31.9454,35.9284,15z',
  'tunis': '@36.8065,10.1815,15z', 'túnez': '@36.8065,10.1815,15z',
};

// ── Tabla IATA → nombre del aeropuerto (para Google Maps Directions) ──
const iataToAirportName = {
  'AMS': 'Amsterdam Airport Schiphol',
  'CDG': 'Paris Charles de Gaulle Airport',
  'LHR': 'London Heathrow Airport',
  'BCN': 'Barcelona El Prat Airport',
  'MAD': 'Madrid Barajas Airport',
  'VLC': 'Valencia Airport',
  'SVQ': 'Seville Airport',
  'AGP': 'Málaga-Costa del Sol Airport',
  'BIO': 'Bilbao Airport',
  'PMI': 'Palma de Mallorca Airport',
  'ALC': 'Alicante-Elche Miguel Hernández Airport',
  'FCO': 'Rome Fiumicino Airport',
  'MXP': 'Milan Malpensa Airport',
  'BER': 'Berlin Brandenburg Airport',
  'FRA': 'Frankfurt Airport',
  'MUC': 'Munich Airport',
  'VIE': 'Vienna International Airport',
  'ZRH': 'Zurich Airport',
  'BRU': 'Brussels Airport',
  'LIS': 'Lisbon Humberto Delgado Airport',
  'ATH': 'Athens International Airport',
  'IST': 'Istanbul Airport',
  'ARN': 'Stockholm Arlanda Airport',
  'OSL': 'Oslo Gardermoen Airport',
  'CPH': 'Copenhagen Airport',
  'HEL': 'Helsinki Airport',
  'PRG': 'Prague Václav Havel Airport',
  'BUD': 'Budapest Ferenc Liszt Airport',
  'WAW': 'Warsaw Chopin Airport',
  'JFK': 'John F. Kennedy International Airport',
  'LAX': 'Los Angeles International Airport',
  'MIA': 'Miami International Airport',
  'ORD': 'Chicago O Hare International Airport',
  'YYZ': 'Toronto Pearson International Airport',
  'YUL': 'Montreal Trudeau International Airport',
  'YVR': 'Vancouver International Airport',
  'MEX': 'Mexico City International Airport',
  'EZE': 'Buenos Aires Ezeiza Airport',
  'BOG': 'Bogota El Dorado Airport',
  'LIM': 'Lima Jorge Chavez Airport',
  'SCL': 'Santiago Arturo Merino Benitez Airport',
  'GRU': 'Sao Paulo Guarulhos Airport',
  'GIG': 'Rio de Janeiro Galeao Airport',
  'NRT': 'Tokyo Narita Airport',
  'PEK': 'Beijing Capital International Airport',
  'PVG': 'Shanghai Pudong International Airport',
  'HKG': 'Hong Kong International Airport',
  'SIN': 'Singapore Changi Airport',
  'DXB': 'Dubai International Airport',
  'BKK': 'Bangkok Suvarnabhumi Airport',
  'BOM': 'Mumbai Chhatrapati Shivaji Airport',
  'DEL': 'Delhi Indira Gandhi Airport',
  'ICN': 'Seoul Incheon International Airport',
  'SYD': 'Sydney Kingsford Smith Airport',
  'MEL': 'Melbourne Airport',
  'AKL': 'Auckland Airport',
  'CAI': 'Cairo International Airport',
  'CPT': 'Cape Town International Airport',
  'JNB': 'Johannesburg OR Tambo Airport',
  'CMN': 'Casablanca Mohammed V Airport',
  'NBO': 'Nairobi Jomo Kenyatta Airport',
  // --- Capitales y grandes ciudades del mundo (v27) ---
  'OPO': 'Porto Airport',
  'GVA': 'Geneva Airport',
  'DUB': 'Dublin Airport',
  'EDI': 'Edinburgh Airport',
  'MAN': 'Manchester Airport',
  'LYS': 'Lyon-Saint Exupéry Airport',
  'NCE': 'Nice Côte d Azur Airport',
  'NAP': 'Naples International Airport',
  'VCE': 'Venice Marco Polo Airport',
  'FLR': 'Florence Airport',
  'SFO': 'San Francisco International Airport',
  'IAD': 'Washington Dulles International Airport',
  'BOS': 'Boston Logan International Airport',
  'CUN': 'Cancún International Airport',
  'HAV': 'José Martí International Airport',
  'PTY': 'Tocumen International Airport',
  'DOH': 'Hamad International Airport',
  'AUH': 'Zayed International Airport',
  'TLV': 'Ben Gurion Airport',
  'KUL': 'Kuala Lumpur International Airport',
  'DPS': 'Ngurah Rai International Airport',
  'MNL': 'Ninoy Aquino International Airport',
  'RAK': 'Marrakesh Menara Airport',
  'ZAG': 'Zagreb Airport',
  'AMM': 'Queen Alia International Airport',
  'TUN': 'Tunis-Carthage International Airport',
};

// FALLBACK 'XXX' (v32): el fallback anterior devolvia las 3 primeras letras en
// mayusculas. Bug real detectado en produccion: "Marruecos" (un pais, no una
// ciudad) -> "MAR", que ES un codigo IATA valido, pero de Maracaibo (Venezuela).
// SerpAPI encontro vuelos reales Barcelona->Miami->Maracaibo (+2000 USD/persona)
// sin dar ningun error, porque el codigo "parecia" valido. Ahora se usa 'XXX'
// (codigo de la industria para "aeropuerto desconocido/no valido") para que la
// busqueda no encuentre nada y dispare el flujo ya existente de
// no_valid_flight / needs_user_input, en vez de inventar un destino.
function toIata(cityName) {
  if (!cityName) return cityName;
  if (/^[A-Z]{3}$/.test(cityName.trim())) return cityName.trim();
  if (cityName.trim().startsWith('/m/') || cityName.trim().startsWith('/g/')) return cityName.trim();
  const key = cityName.trim().toLowerCase();
  if (cityToIata[key]) return cityToIata[key];
  return 'XXX';
}

function toGps(cityName) {
  if (!cityName) return null;
  const key = cityName.trim().toLowerCase();
  return cityToGps[key] || null;
}

const originIata = toIata(tb.origin_city);
const destinationIata = toIata(tb.destination_city?.[0]);
const destinationGps = toGps(tb.destination_city?.[0]);
const destinationAirportName = destinationIata === 'XXX'
  ? `Ciudad no reconocida: ${tb.destination_city?.[0] || ''}`
  : (iataToAirportName[destinationIata] || `${destinationIata} Airport`);

const enrichedSessionState = {
  ...input.session_state,
  travel_brief: {
    ...tb,
    origin_city_iata: originIata,
    destination_city_iata: destinationIata,
    destination_city_ll: destinationGps,
    destination_airport_name: destinationAirportName,
    origin_city_original: tb.origin_city,
    destination_city_original: tb.destination_city
  }
};

return [{ json: {
  ...input,
  session_state: enrichedSessionState,
  travel_brief: enrichedSessionState.travel_brief,
  origin_iata: originIata,
  destination_iata: destinationIata,
  destination_ll: destinationGps,
  destination_airport: destinationAirportName
} }];
