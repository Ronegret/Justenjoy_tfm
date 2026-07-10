'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Plane, Building, Compass, Sparkles,
  Users, Calendar, Euro, Heart, Gauge, ShieldAlert
} from 'lucide-react';
import { TripPreferences } from '@/types/trip';

interface TravelSummaryPanelProps {
  preferences: TripPreferences;
}

export const TravelSummaryPanel: React.FC<TravelSummaryPanelProps> = ({ preferences }) => {
  const getStyleLabel = (style: string) => {
    const labels: Record<string, string> = {
      culture: 'Cultura',
      food: 'Gastronomía',
      beach: 'Playa',
      adventure: 'Aventura',
      relax: 'Relax',
      museums: 'Museos',
      family: 'Familia'
    };
    return labels[style] || style;
  };

  const getRestrictionLabel = (restriction: string) => {
    const labels: Record<string, string> = {
      avoid_scales: 'Evitar escalas',
      avoid_early_flights: 'Evitar vuelos temprano',
      central_hotel: 'Hotel céntrico',
      cheap_hotel: 'Hotel barato',
      free_activities: 'Actividades gratis',
      free_museums: 'Museos gratuitos',
      kids_friendly: 'Viaje con niños',
      low_walking: 'Evitar caminar mucho',
      accessibility: 'Accesibilidad',
      save_money: 'Ahorrar'
    };
    return labels[restriction] || restriction.replaceAll('_', ' ');
  };

  const getBudgetLabel = (b: string) => {
    switch (b) {
      case 'low': return 'Low Cost';
      case 'balanced': return 'Equilibrado';
      case 'premium': return 'Premium';
      case 'luxury': return 'Lujo';
      default: return 'Equilibrado';
    }
  };

  const getPaceLabel = (p: string) => {
    switch (p) {
      case 'relax': return 'Relajado';
      case 'medium': return 'Medio';
      case 'intense': return 'Intenso';
      case 'all': return 'Verlo Todo';
      default: return 'Medio';
    }
  };

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 premium-border rounded-3xl p-6 shadow-xs flex flex-col gap-6 sticky top-24">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-blue" />
            <h3 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
              Resumen del viaje
            </h3>
          </div>
          <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
            Lo importante de tu plan mientras lo vamos preparando.
          </p>
        </div>
        <div className="w-8 h-8 opacity-45 shrink-0">
          <img src="/logo.png" alt="Deco Icon" className="w-full h-full object-contain" />
        </div>
      </div>

      {/* Stylized Visual Route Line Map */}
      <div className="w-full h-28 rounded-2xl bg-brand-cream/50 dark:bg-brand-dark/50 border border-brand-dark/5 dark:border-brand-white/5 relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-radial-at-t from-brand-blue/5 via-transparent to-transparent" />

        {/* Animated Dashed Route Line */}
        <svg className="absolute w-full h-full px-8" viewBox="0 0 100 50">
          <path
            d="M 10 25 Q 50 10 90 25"
            fill="none"
            stroke="rgba(37, 99, 235, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="animate-[dash_6s_linear_infinite]"
          />
          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -40;
              }
            }
          `}</style>
        </svg>

        <div className="flex items-center justify-between w-full px-6 z-10">
          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-brand-blue flex items-center justify-center text-brand-white text-[10px] font-black shadow-xs">
              {preferences.origin ? preferences.origin.substring(0, 3).toUpperCase() : 'ORG'}
            </div>
            <span className="text-[9px] font-bold uppercase text-brand-dark dark:text-brand-white">
              {preferences.origin || 'Origen'}
            </span>
          </div>

          <motion.div
            animate={{ y: [0, -2, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          >
            <Plane className="w-4 h-4 text-brand-coral transform rotate-45" />
          </motion.div>

          <div className="flex flex-col items-center gap-1">
            <div className="w-7 h-7 rounded-full bg-brand-coral flex items-center justify-center text-brand-white text-[10px] font-black shadow-xs">
              {preferences.destination && preferences.destination !== 'Recomendado por IA'
                ? preferences.destination.substring(0, 3).toUpperCase()
                : 'DST'}
            </div>
            <span className="text-[9px] font-bold uppercase text-brand-dark dark:text-brand-white">
              {preferences.destination || 'Destino'}
            </span>
          </div>
        </div>
      </div>

      {/* Details Grid - high density clean look */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Destination Info */}
        <div className="flex flex-col gap-0.5 bg-brand-cream/30 dark:bg-brand-dark/20 p-3 rounded-xl border border-brand-dark/5 dark:border-brand-white/5">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-blue" />
            <span>Destino</span>
          </span>
          <span className="text-xs font-black text-brand-dark dark:text-brand-white truncate uppercase">
            {preferences.destination || 'Pendiente...'}
          </span>
        </div>

        {/* Travelers Info */}
        <div className="flex flex-col gap-0.5 bg-brand-cream/30 dark:bg-brand-dark/20 p-3 rounded-xl border border-brand-dark/5 dark:border-brand-white/5">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Users className="w-3 h-3 text-brand-blue" />
            <span>Viajeros</span>
          </span>
          <span className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">
            {preferences.travelers.adults} Ad. {preferences.travelers.children > 0 ? `, ${preferences.travelers.children} Ni.` : ''}
          </span>
        </div>

        {/* Budget Info */}
        <div className="flex flex-col gap-0.5 bg-brand-cream/30 dark:bg-brand-dark/20 p-3 rounded-xl border border-brand-dark/5 dark:border-brand-white/5">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Euro className="w-3 h-3 text-brand-blue" />
            <span>Presupuesto</span>
          </span>
          <span className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">
            {getBudgetLabel(preferences.budget)}
          </span>
        </div>

        {/* Pace Info */}
        <div className="flex flex-col gap-0.5 bg-brand-cream/30 dark:bg-brand-dark/20 p-3 rounded-xl border border-brand-dark/5 dark:border-brand-white/5">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Gauge className="w-3 h-3 text-brand-blue" />
            <span>Ritmo</span>
          </span>
          <span className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">
            {getPaceLabel(preferences.pace)}
          </span>
        </div>

        {/* Dates Info */}
        <div className="col-span-2 flex flex-col gap-0.5 bg-brand-cream/30 dark:bg-brand-dark/20 p-3 rounded-xl border border-brand-dark/5 dark:border-brand-white/5">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brand-blue" />
            <span>Fechas</span>
          </span>
          <span className="text-xs font-black text-brand-dark dark:text-brand-white">
            {preferences.dates.start} al {preferences.dates.end}
            <span className="text-[9px] text-text-muted font-bold ml-1 uppercase">
              {preferences.dates.flexible ? '(Flex)' : '(Fijo)'}
            </span>
          </span>
        </div>
      </div>

      {/* Style Chips List */}
      <div className="flex flex-col gap-2">
        <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
          <Heart className="w-3 h-3 text-brand-coral" />
          <span>Etiquetas de enfoque</span>
        </span>
        <div className="flex flex-wrap gap-1">
          {preferences.style.length > 0 ? (
            preferences.style.map((item) => (
              <span
                key={item}
                className="px-2.5 py-0.5 rounded-md bg-brand-blue/5 text-brand-blue dark:bg-brand-blue/20 dark:text-brand-white text-[9px] font-bold uppercase tracking-wider"
              >
                {getStyleLabel(item)}
              </span>
            ))
          ) : (
            <span className="text-[9px] text-text-muted italic">Ningún estilo seleccionado...</span>
          )}
        </div>
      </div>

      {/* Restrictions List */}
      {preferences.restrictions.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-brand-dark/5 dark:border-brand-white/5 pt-4">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-brand-coral" />
            <span>Filtros prioritarios</span>
          </span>
          <div className="flex flex-wrap gap-1">
            {preferences.restrictions.map((item) => {
              const label = getRestrictionLabel(item);
              return (
                <span
                  key={item}
                  className="px-2.5 py-0.5 rounded-md bg-brand-dark/5 text-text-dark dark:bg-brand-white/5 dark:text-brand-cream text-[9px] font-semibold uppercase tracking-wider"
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
export default TravelSummaryPanel;
