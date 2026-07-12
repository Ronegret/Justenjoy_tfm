'use client';

import React from 'react';
import { Calendar, Users, Share2, Download, Compass, CloudSun } from 'lucide-react';
import { motion } from 'framer-motion';
import { TripData } from '@/types/trip';

interface PrivateTripHeroProps {
  trip: TripData;
  onShare?: () => void;
  onPdf?: () => void;
}

export const PrivateTripHero: React.FC<PrivateTripHeroProps> = ({ trip, onShare, onPdf }) => {
  const getBudgetLabel = (b: string) => {
    switch (b) {
      case 'low': return 'Económico';
      case 'balanced': return 'Equilibrado';
      case 'premium': return 'Premium';
      case 'luxury': return 'Lujo';
      default: return 'Equilibrado';
    }
  };

  // Mock weather based on destination
  const getWeather = (dest: string) => {
    const d = dest.toLowerCase();
    if (d.includes('lisboa')) return { temp: '22°C', label: 'Despejado' };
    if (d.includes('oporto')) return { temp: '19°C', label: 'Parcialmente Nublado' };
    return { temp: '25°C', label: 'Soleado' };
  };

  const weather = getWeather(trip.best_option.destination);

  // Antes caía a una lista fija de 10 ciudades (y a la imagen de Barcelona
  // para cualquier destino no listado, ej. Río de Janeiro). Ahora usa la foto
  // real del destino que trae el plan (Google Places); esta lista local queda
  // solo como último respaldo si esa foto no llegó.
  const getFallbackDestinationImage = (dest: string) => {
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
    return '/images/destinations/barcelona.png';
  };

  const bgImage = trip.best_option.imageUrl || getFallbackDestinationImage(trip.best_option.destination);

  return (
    <div className="w-full relative h-[360px] md:h-[420px] rounded-3xl overflow-hidden shadow-lg border border-brand-dark/10 dark:border-brand-white/10 mb-8 bg-brand-dark">
      {/* Background image backdrop (styled premium card fallback) */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-brand-dark/10 z-10" />
      <div
        className="absolute inset-0 opacity-70 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
        style={{
          backgroundImage: `url('${bgImage}')`
        }}
      />

      {/* Hero Content Overlay */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-10 text-brand-white">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-white/20 backdrop-blur-md border border-brand-white/10 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-brand-teal" />
            <span>RUTA OPTIMIZADA</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onShare}
              className="p-2.5 rounded-full bg-brand-white/10 hover:bg-brand-white/20 backdrop-blur-md border border-brand-white/10 transition-all cursor-pointer"
              title="Compartir enlace de viaje"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onPdf}
              className="p-2.5 rounded-full bg-brand-white/10 hover:bg-brand-white/20 backdrop-blur-md border border-brand-white/10 transition-all cursor-pointer"
              title="Descargar itinerario PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Core Title and Details */}
        <div className="flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
              {trip.best_option.title}
            </h1>
            <p className="text-sm md:text-base text-brand-cream/80 max-w-xl font-medium mt-2">
              Un viaje personalizado a {trip.best_option.destination} creado por la IA de Just Enjoy.
            </p>
          </motion.div>

          {/* Quick stats row */}
          <div className="flex flex-wrap gap-4 md:gap-6 border-t border-brand-white/15 pt-4 mt-2">

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-teal" />
              <div className="flex flex-col">
                <span className="text-[9px] text-brand-cream/60 uppercase font-bold tracking-wider">Fechas</span>
                <span className="text-xs font-bold">{trip.user_preferences.dates.start} al {trip.user_preferences.dates.end}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-teal" />
              <div className="flex flex-col">
                <span className="text-[9px] text-brand-cream/60 uppercase font-bold tracking-wider">Pasajeros</span>
                <span className="text-xs font-bold">
                  {trip.user_preferences.travelers.adults} {trip.user_preferences.travelers.adults === 1 ? 'Adulto' : 'Adultos'}
                  {trip.user_preferences.travelers.children > 0 ? `, ${trip.user_preferences.travelers.children} Niños` : ''}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CloudSun className="w-4 h-4 text-brand-teal" />
              <div className="flex flex-col">
                <span className="text-[9px] text-brand-cream/60 uppercase font-bold tracking-wider">Clima Previsto</span>
                <span className="text-xs font-bold">{weather.temp} - {weather.label}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-md bg-brand-coral/20 border border-brand-coral/30 text-brand-coral text-xs font-black uppercase tracking-wider">
                Presupuesto {getBudgetLabel(trip.user_preferences.budget)}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
export default PrivateTripHero;
