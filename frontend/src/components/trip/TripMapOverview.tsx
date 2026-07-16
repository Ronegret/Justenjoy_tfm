'use client';

import React, { useMemo, useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { Map as MapIcon, Navigation, MapPin, ExternalLink } from 'lucide-react';
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
}

export const TripMapOverview: React.FC<TripMapOverviewProps> = ({ itinerary }) => {
  const [activeDayFilter, setActiveDayFilter] = useState<number | 'all'>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const points: MapPoint[] = useMemo(() => {
    const pts: MapPoint[] = [];
    itinerary.forEach((day) => {
      day.blocks.forEach((block, idx) => {
        if (typeof block.lat === 'number' && typeof block.lng === 'number') {
          pts.push({ key: `${day.day}-${idx}`, lat: block.lat, lng: block.lng, title: block.title, day: day.day, type: block.type });
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

  const center = useMemo(() => {
    if (filteredPoints.length === 0) return null;
    return {
      lat: filteredPoints.reduce((acc, p) => acc + p.lat, 0) / filteredPoints.length,
      lng: filteredPoints.reduce((acc, p) => acc + p.lng, 0) / filteredPoints.length
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
            {/* key fuerza remount al cambiar de día para recentrar el mapa (defaultCenter es no-controlado) */}
            <Map key={activeDayFilter} defaultCenter={center} defaultZoom={13} gestureHandling="greedy" disableDefaultUI={false}>
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
      <div className="flex items-center justify-between text-[10px] text-text-muted font-bold pt-1">
        <span className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-brand-coral" />
          {filteredPoints.length} {filteredPoints.length === 1 ? 'parada marcada' : 'paradas marcadas'}
        </span>
      </div>
    </div>
  );
};

export default TripMapOverview;
