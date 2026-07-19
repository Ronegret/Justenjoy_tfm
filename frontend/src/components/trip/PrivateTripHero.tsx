'use client';

import React from 'react';
import { Calendar, Users, Share2, Download, Compass, CloudSun, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { TripData } from '@/types/trip';
import { budgetLabel } from '@/lib/tripLabels';
import { getFallbackDestinationImage } from '@/lib/destinationImages';

interface PrivateTripHeroProps {
  trip: TripData;
  onShare?: () => void;
  onPdf?: () => void;
  isGeneratingPdf?: boolean;
}

export const PrivateTripHero: React.FC<PrivateTripHeroProps> = ({ trip, onShare, onPdf, isGeneratingPdf }) => {
  // Clima real (Open-Meteo, histórico del mismo rango de fechas hace un año,
  // ver fetchClimateAverage en route.ts) — antes esto era un mock fijo
  // ("25°C Soleado" para casi cualquier destino, sin importar el mes del
  // viaje). Si la API no respondió, no se muestra el dato en vez de inventarlo.
  const climate = trip.best_option.climate;

  // Antes caía a una lista fija de 10 ciudades (y a la imagen de Barcelona
  // para cualquier destino no listado, ej. Río de Janeiro). Ahora usa la foto
  // real del destino que trae el plan (Google Places); esta lista local queda
  // solo como último respaldo si esa foto no llegó. La lista vive en
  // lib/destinationImages.ts para compartirla con las tarjetas del itinerario.
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
            {/* Antes era un icono suelto de 40px, fácil de pasar por alto —
                ahora es un botón con texto y color propio, visible de un
                vistazo apenas se carga la página. */}
            <button
              onClick={onPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-brand-coral hover:bg-brand-coral/90 text-brand-white font-extrabold text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar PDF</span>
                </>
              )}
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

          {/* Quick stats row — antes eran filas de icono+texto diminutas
              (9px), fáciles de pasar por alto en la primera pantalla que ve
              el cliente. Ahora son tarjetas con el número/valor grande, para
              que el vistazo inicial destaque lo importante del viaje. */}
          <div className="flex flex-wrap gap-3 border-t border-brand-white/15 pt-4 mt-2">

            <div className="flex items-center gap-2.5 bg-brand-white/10 backdrop-blur-md border border-brand-white/10 rounded-2xl px-4 py-2.5">
              <Calendar className="w-5 h-5 text-brand-teal shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] text-brand-cream/60 uppercase font-bold tracking-wider">Fechas</span>
                <span className="text-sm font-extrabold">{trip.user_preferences.dates.start} al {trip.user_preferences.dates.end}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-brand-white/10 backdrop-blur-md border border-brand-white/10 rounded-2xl px-4 py-2.5">
              <Users className="w-5 h-5 text-brand-teal shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] text-brand-cream/60 uppercase font-bold tracking-wider">Pasajeros</span>
                <span className="text-sm font-extrabold">
                  {trip.user_preferences.travelers.adults} {trip.user_preferences.travelers.adults === 1 ? 'Adulto' : 'Adultos'}
                  {trip.user_preferences.travelers.children > 0 ? `, ${trip.user_preferences.travelers.children} Niños` : ''}
                </span>
              </div>
            </div>

            {climate && (
              <div className="flex items-center gap-2.5 bg-brand-white/10 backdrop-blur-md border border-brand-white/10 rounded-2xl px-4 py-2.5">
                <CloudSun className="w-5 h-5 text-brand-teal shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-brand-cream/60 uppercase font-bold tracking-wider">Clima habitual (histórico)</span>
                  <span className="text-lg font-black leading-none">{climate.avgTempC}°C <span className="text-sm font-extrabold">· {climate.description}</span></span>
                </div>
              </div>
            )}

            <div className="flex items-center bg-brand-coral/20 border border-brand-coral/30 rounded-2xl px-4 py-2.5">
              <span className="text-brand-coral text-sm font-black uppercase tracking-wider">
                Presupuesto {budgetLabel(trip.user_preferences.budget)}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
export default PrivateTripHero;
