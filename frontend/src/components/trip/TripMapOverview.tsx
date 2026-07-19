'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Map as MapIcon, Navigation, MapPin, ExternalLink, Footprints } from 'lucide-react';
import { DayPlan } from '@/types/trip';

function directionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

interface TripMapOverviewProps {
  itinerary: DayPlan[];
}

interface MapPoint {
  key: string;
  lat: number;
  lng: number;
  title: string;
  day: number;
  type: string;
  time: string;
}

/**
 * Dibuja la ruta real a pie entre las paradas de un día (Directions API), no
 * una línea recta. Solo se activa con 2+ paradas con coordenada propia y
 * distinta entre sí — los bloques de relleno sin actividad real comparten la
 * única coordenada geocodificada del día, así que quedan fuera (no hay nada
 * real que conectar entre ellos).
 */
interface RouteInfo {
  distanceMeters: number;
  durationText: string;
  day: number | 'all';
}

function DayRoute({ waypoints, day, onRouteInfo }: { waypoints: { lat: number; lng: number }[]; day: number | 'all'; onRouteInfo: (info: RouteInfo | null) => void }) {
  const map = useMap();
  const routesLibrary = useMapsLibrary('routes');
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLibrary || !map) return;
    const r = new routesLibrary.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: { strokeColor: '#2563eb', strokeWeight: 4, strokeOpacity: 0.75 }
    });
    rendererRef.current = r;
    return () => {
      r.setMap(null);
      rendererRef.current = null;
    };
  }, [routesLibrary, map]);

  useEffect(() => {
    if (!rendererRef.current || !routesLibrary || waypoints.length < 2) {
      onRouteInfo(null);
      return;
    }
    const renderer = rendererRef.current;
    const service = new routesLibrary.DirectionsService();
    const middle = waypoints.slice(1, -1).map((p) => ({ location: p, stopover: true }));
    service.route(
      {
        origin: waypoints[0],
        destination: waypoints[waypoints.length - 1],
        waypoints: middle,
        travelMode: routesLibrary.TravelMode.WALKING
      },
      (result, status) => {
        // Si Google no encuentra ruta a pie (paradas muy lejos entre sí, cruzan
        // agua, etc.) simplemente no dibujamos línea — los marcadores se
        // quedan como están, nunca fingimos un trayecto ni una distancia.
        if (status === 'OK' && result) {
          renderer.setDirections(result);
          const legs = result.routes[0]?.legs || [];
          const distanceMeters = legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0);
          const durationSeconds = legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0);
          const durationMin = Math.round(durationSeconds / 60);
          onRouteInfo({
            distanceMeters,
            durationText: durationMin < 60 ? `${durationMin} min` : `${Math.floor(durationMin / 60)}h ${durationMin % 60}min`,
            day
          });
        } else {
          onRouteInfo(null);
        }
      }
    );
  }, [routesLibrary, waypoints, onRouteInfo, day]);

  return null;
}

export const TripMapOverview: React.FC<TripMapOverviewProps> = ({ itinerary }) => {
  const [activeDayFilter, setActiveDayFilter] = useState<number | 'all'>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const handleRouteInfo = useCallback((info: RouteInfo | null) => setRouteInfo(info), []);

  const points: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [];
    itinerary.forEach((day) => {
      day.blocks.forEach((block, idx) => {
        if (typeof block.lat === 'number' && typeof block.lng === 'number') {
          pts.push({ key: `${day.day}-${idx}`, lat: block.lat, lng: block.lng, title: block.title, day: day.day, type: block.type, time: block.time || '' });
        }
      });
    });
    return pts;
  }, [itinerary]);

  const dayNumbers = useMemo(
    () => Array.from(new Set(itinerary.map((d) => d.day))).sort((a, b) => a - b),
    [itinerary]
  );

  const filteredPoints = activeDayFilter === 'all' ? points : points.filter((p) => p.day === activeDayFilter);

  // Paradas únicas del día en orden cronológico, para trazar la ruta a pie.
  // Se descartan puntos consecutivos que caen prácticamente en la misma
  // coordenada (~50m) — normalmente varios bloques de relleno del mismo día
  // sin actividad real, que comparten la única coordenada geocodificada de
  // ese día y no representan paradas distintas de verdad.
  const routeWaypoints = useMemo(() => {
    if (activeDayFilter === 'all') return [];
    const ordered = [...filteredPoints].sort((a, b) => a.time.localeCompare(b.time));
    const deduped: MapPoint[] = [];
    for (const p of ordered) {
      const last = deduped[deduped.length - 1];
      const isSameSpot = last && Math.abs(last.lat - p.lat) < 0.0005 && Math.abs(last.lng - p.lng) < 0.0005;
      if (!isSameSpot) deduped.push(p);
    }
    return deduped;
  }, [filteredPoints, activeDayFilter]);

  const center = useMemo(() => {
    if (filteredPoints.length === 0) return null;
    return {
      lat: filteredPoints.reduce((acc, p) => acc + p.lat, 0) / filteredPoints.length,
      lng: filteredPoints.reduce((acc, p) => acc + p.lng, 0) / filteredPoints.length
    };
  }, [filteredPoints]);

  // Caja que contiene todas las paradas visibles, para que "Ver todo" encuadre
  // el viaje completo en vez de promediar coordenadas. Promediar lat/lng de
  // paradas en ciudades distintas (viajes multi-destino) puede dar un centro
  // en medio del océano con el zoom fijo anterior — el mapa quedaba en blanco
  // y sin marcadores visibles porque todos caían fuera del encuadre.
  const bounds = useMemo(() => {
    if (filteredPoints.length < 2) return null;
    const lats = filteredPoints.map((p) => p.lat);
    const lngs = filteredPoints.map((p) => p.lng);
    return {
      north: Math.max(...lats),
      south: Math.min(...lats),
      east: Math.max(...lngs),
      west: Math.min(...lngs)
    };
  }, [filteredPoints]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const hasApiKey = !!apiKey && apiKey !== 'changeme';

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 premium-border rounded-3xl p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <MapIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
              Mapa del viaje
            </h4>
            <p className="text-[9px] text-text-muted font-medium mt-0.5">
              Ubicaciones reales de tu itinerario.
            </p>
          </div>
        </div>

        {dayNumbers.length > 1 && (
          <div className="flex items-center gap-1 bg-brand-dark/5 dark:bg-brand-white/5 p-1 rounded-lg flex-wrap">
            <button
              type="button"
              onClick={() => { setActiveDayFilter('all'); setSelectedKey(null); }}
              className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                activeDayFilter === 'all'
                  ? 'bg-brand-blue text-brand-white shadow-xs'
                  : 'text-text-muted hover:text-brand-dark dark:hover:text-brand-white'
              }`}
            >
              Ver todo
            </button>
            {dayNumbers.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => { setActiveDayFilter(day); setSelectedKey(null); }}
                className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                  activeDayFilter === day
                    ? 'bg-brand-blue text-brand-white shadow-xs'
                    : 'text-text-muted hover:text-brand-dark dark:hover:text-brand-white'
                }`}
              >
                Día {day}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map area */}
      {!hasApiKey ? (
        <div className="w-full h-[300px] rounded-2xl border border-brand-dark/5 dark:border-brand-white/5 bg-brand-cream/30 dark:bg-brand-dark/20 flex items-center justify-center text-text-muted text-xs text-center p-4">
          <div>
            <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
            Configura tu Google Maps API Key para ver el mapa interactivo.
          </div>
        </div>
      ) : !center || filteredPoints.length === 0 ? (
        <div className="w-full h-[300px] rounded-2xl border border-brand-dark/5 dark:border-brand-white/5 bg-brand-cream/30 dark:bg-brand-dark/20 flex items-center justify-center text-text-muted text-xs text-center p-4">
          <div>
            <MapPin className="w-6 h-6 mx-auto mb-2 opacity-50" />
            Aún no tenemos ubicaciones exactas para las paradas de este viaje.
          </div>
        </div>
      ) : (
        <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-brand-dark/5 dark:border-brand-white/5">
          <APIProvider apiKey={apiKey}>
            {/* key fuerza remount al cambiar de día/filtro para recalcular el encuadre
                (defaultCenter/defaultBounds son no-controlados). Con 2+ paradas se ajusta
                por bounds para que TODAS queden visibles (crítico en "Ver todo" con viajes
                multi-destino); con 1 sola parada, bounds tendría área cero, así que se usa
                center + zoom fijo. */}
            <Map
              key={activeDayFilter}
              {...(bounds
                ? { defaultBounds: { ...bounds, padding: 56 } }
                : { defaultCenter: center, defaultZoom: 14 })}
              gestureHandling="greedy"
              disableDefaultUI={false}
            >
              {routeWaypoints.length >= 2 && (
                <DayRoute waypoints={routeWaypoints.map((p) => ({ lat: p.lat, lng: p.lng }))} day={activeDayFilter} onRouteInfo={handleRouteInfo} />
              )}
              {filteredPoints.map((p) => (
                <Marker
                  key={p.key}
                  position={{ lat: p.lat, lng: p.lng }}
                  title={p.title}
                  onClick={() => setSelectedKey(p.key)}
                  label={p.type === 'airport' ? { text: '✈', fontSize: '13px' } : undefined}
                />
              ))}
              {selectedKey && (() => {
                const p = filteredPoints.find((pt) => pt.key === selectedKey);
                if (!p) return null;
                return (
                  <InfoWindow position={{ lat: p.lat, lng: p.lng }} onCloseClick={() => setSelectedKey(null)}>
                    <div className="flex flex-col gap-1.5 p-1 max-w-[180px]">
                      <span className="text-xs font-bold text-brand-dark">{p.title}</span>
                      <a
                        href={directionsUrl(p.lat, p.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline"
                      >
                        Cómo llegar <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </InfoWindow>
                );
              })()}
            </Map>
          </APIProvider>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-text-muted font-bold pt-1 flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-brand-coral" />
          {filteredPoints.length} {filteredPoints.length === 1 ? 'parada marcada' : 'paradas marcadas'}
        </span>
        {/* Se filtra por día en el propio render (en vez de resetear routeInfo
            en un efecto aparte) para no mostrar la distancia del día anterior
            mientras se calcula la ruta nueva. */}
        {routeInfo && routeInfo.day === activeDayFilter && (
          <span className="flex items-center gap-1 text-brand-blue">
            <Footprints className="w-3.5 h-3.5" />
            {(routeInfo.distanceMeters / 1000).toFixed(1)} km a pie · {routeInfo.durationText} entre {routeWaypoints.length} paradas reales
          </span>
        )}
      </div>
    </div>
  );
};

export default TripMapOverview;
