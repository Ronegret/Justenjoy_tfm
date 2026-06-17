'use client';

import React, { useState } from 'react';
import { Map, MapPin, Compass, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';

interface MapPoint {
  id: number;
  label: string;
  x: number; // percentage
  y: number; // percentage
  type: 'airport' | 'hotel' | 'culture' | 'food' | 'activity';
  day: number;
}

export const MapPreview: React.FC = () => {
  const [activeDayFilter, setActiveDayFilter] = useState<number | 'all'>('all');

  const points: MapPoint[] = [
    { id: 1, label: 'Llegada Aeropuerto LIS', x: 75, y: 15, type: 'airport', day: 1 },
    { id: 2, label: 'Hotel Lisboa Centro (Baixa)', x: 50, y: 45, type: 'hotel', day: 1 },
    { id: 3, label: 'Almuerzo tradicional en Baixa', x: 53, y: 52, type: 'food', day: 1 },
    { id: 4, label: 'Plaza del Comercio', x: 51, y: 62, type: 'activity', day: 1 },
    { id: 5, label: 'Cena Fado Bairro Alto', x: 40, y: 48, type: 'food', day: 1 },
    { id: 6, label: 'Tour Barrio Alfama', x: 62, y: 49, type: 'culture', day: 2 },
    { id: 7, label: 'Almuerzo Time Out Market', x: 42, y: 58, type: 'food', day: 2 },
    { id: 8, label: 'Paseo en Velero Dársena Belém', x: 20, y: 78, type: 'activity', day: 2 },
    { id: 9, label: 'Tarde de Compras LX Factory', x: 32, y: 68, type: 'activity', day: 3 }
  ];

  const filteredPoints = activeDayFilter === 'all'
    ? points
    : points.filter(p => p.day === activeDayFilter);

  // Math coordinates for connecting path
  const getPathD = () => {
    if (filteredPoints.length < 2) return '';
    return filteredPoints.map((p, idx) => {
      const command = idx === 0 ? 'M' : 'L';
      return `${command} ${p.x * 4} ${p.y * 3}`;
    }).join(' ');
  };

  const getMarkerColor = (type: string) => {
    switch (type) {
      case 'airport': return 'bg-brand-blue border-blue-200';
      case 'hotel': return 'bg-brand-dark border-brand-dark/30';
      case 'food': return 'bg-brand-coral border-brand-coral/20';
      default: return 'bg-brand-blue border-brand-blue/20';
    }
  };

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 premium-border rounded-3xl p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
              Mapa Visual de Ruta
            </h4>
            <p className="text-[9px] text-text-muted font-medium mt-0.5">
              Trazado secuencial de traslados recomendados.
            </p>
          </div>
        </div>

        {/* Day filters */}
        <div className="flex items-center gap-1 bg-brand-dark/5 dark:bg-brand-white/5 p-1 rounded-lg">
          {(['all', 1, 2, 3] as const).map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDayFilter(day)}
              className={`px-2.5 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all cursor-pointer ${
                activeDayFilter === day
                  ? 'bg-brand-blue text-brand-white shadow-xs'
                  : 'text-text-muted hover:text-brand-dark dark:hover:text-brand-white'
              }`}
            >
              {day === 'all' ? 'Ver todo' : `Día ${day}`}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Canvas Map area */}
      <div className="w-full h-[300px] rounded-2xl border border-brand-dark/5 dark:border-brand-white/5 bg-brand-cream/30 dark:bg-brand-dark/20 relative overflow-hidden">

        {/* River coastline visual decoration */}
        <svg className="absolute inset-0 w-full h-full animate-[fade_1s_ease]" xmlns="http://www.w3.org/2000/svg">
          {/* Lisbon Tagus River shoreline mockup */}
          <path
            d="M -20 180 Q 150 210 400 240 T 820 280 L 820 400 L -20 400 Z"
            fill="rgba(37, 99, 235, 0.05)"
            stroke="rgba(37, 99, 235, 0.1)"
            strokeWidth="1.5"
          />

          {/* Bridge mockup */}
          <line
            x1="120" y1="200"
            x2="180" y2="300"
            stroke="rgba(242, 100, 68, 0.15)"
            strokeWidth="2"
            strokeDasharray="4 2"
          />

          {/* Connect points route line */}
          <motion.path
            d={getPathD()}
            fill="none"
            stroke="#2563EB"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </svg>

        {/* Render Markers */}
        {filteredPoints.map((p) => (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {/* Pulsing ring */}
            <div className="absolute inset-0 rounded-full bg-brand-blue/25 scale-150 animate-ping opacity-75" />

            {/* Pin Marker */}
            <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-black text-brand-white shadow-xs cursor-default relative z-10 ${getMarkerColor(p.type)}`}>
              {p.day}
            </div>

            {/* Label tooltip (editorial hover style) */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-brand-dark/95 text-brand-cream text-[9px] font-bold py-1 px-2 rounded-md border border-brand-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-30 shadow-md">
              {p.label}
            </div>
          </div>
        ))}
      </div>

      {/* Map Stats Footer */}
      <div className="flex items-center justify-between text-[10px] text-text-muted font-bold pt-1">
        <span className="flex items-center gap-1">
          <Navigation className="w-3.5 h-3.5 text-brand-coral" />
          Distancia promedio: 4.8 km / día
        </span>
        <span>Modo: Metro + Caminar</span>
      </div>
    </div>
  );
};
export default MapPreview;
