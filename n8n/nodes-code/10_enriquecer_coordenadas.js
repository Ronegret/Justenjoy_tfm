// Enriquecer daily_itinerary con UNA coordenada por día para el mapa del frontend.
// Prioridad: (1) gps de actividad concreta ese día → (2) geocoding del POI vía OpenStreetMap → (3) centro de la ciudad.
const result = $input.first().json;
const plan = result.plan;

if (!plan || !Array.isArray(plan.daily_itinerary)) {
  return [{ json: result }];
}

// Centro de ciudad como fallback (ya lo tenemos en el travel_brief)
let cityCenter = null;
try {
  const prep = $('Preparar Motor Planificador').first().json;
  const ll = prep.session_state?.travel_brief?.destination_city_ll; // formato @lat,lng,15z
  if (ll) {
    const parts = ll.replace('@', '').split(',');
    cityCenter = { lat: parseFloat(parts[0]), lng: parseFloat(parts[1]) };
  }
} catch (e) {}

const city = plan.segments?.[0]?.destination || '';

// Índice de actividades con coordenadas por fecha
const actByDate = {};
(plan.segments?.[0]?.activities || []).forEach(a => {
  if (a.date && a.lat != null && a.lng != null) {
    actByDate[a.date] = { lat: a.lat, lng: a.lng };
  }
});

// Geocoding vía Nominatim (OpenStreetMap) — sin API key
async function geocode(name) {
  try {
    const res = await this.helpers.httpRequest({
      method: 'GET',
      url: 'https://nominatim.openstreetmap.org/search',
      qs: { q: `${name}, ${city}`, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'TFM-TravelPlanner/1.0 (educational project)' },
      json: true
    });
    if (Array.isArray(res) && res.length > 0) {
      return { lat: parseFloat(res[0].lat), lng: parseFloat(res[0].lon) };
    }
  } catch (e) {}
  return null;
}

for (const day of plan.daily_itinerary) {
  let coord = null;
  let source = 'none';

  // 1. Coordenada de una actividad concreta ese día
  if (actByDate[day.date]) {
    coord = actByDate[day.date];
    source = 'activity';
  }
  // 2. Geocoding del punto de interés mencionado
  else if (Array.isArray(day.points_of_interest) && day.points_of_interest.length > 0) {
    const poi = typeof day.points_of_interest[0] === 'string'
      ? day.points_of_interest[0]
      : day.points_of_interest[0]?.name;
    if (poi) {
      coord = await geocode.call(this, poi);
      if (coord) source = 'geocoded';
      // Nominatim: máx 1 petición/seg — respetar el límite
      await new Promise(r => setTimeout(r, 1100));
    }
  }
  // 3. Fallback: centro de la ciudad
  if (!coord && cityCenter) {
    coord = cityCenter;
    source = 'city_center';
  }

  if (coord) {
    day.lat = coord.lat;
    day.lng = coord.lng;
  } else {
    day.lat = null;
    day.lng = null;
  }
  day.coordinate_source = source;
}

return [{ json: result }];
