'use client';

import React from 'react';
import { Plane, Clock, Luggage, ArrowRight, ExternalLink } from 'lucide-react';
import { Flight } from '@/types/trip';

interface FlightCardProps {
  flight: Flight;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  // new Date() no lanza ante una fecha invalida: devuelve un Invalid Date cuyo
  // toLocale* imprime el literal "Invalid Date". Por eso hay que comprobar
  // isNaN(getTime()) en vez de envolver en try/catch.
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      // Si llega solo "HH:MM" u otro formato no ISO, muestralo tal cual.
      return /^\d{1,2}:\d{2}/.test(isoString) ? isoString.slice(0, 5) : '';
    }
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
              Vuelo de Ida Recomendado
            </h4>
            <p className="text-[9px] text-text-muted font-medium mt-0.5">
              Proveedor: {flight.provider}
            </p>
          </div>
        </div>

        <span className="text-xs font-extrabold text-brand-blue px-2.5 py-1 bg-brand-blue/10 rounded-full uppercase">
          {flight.stops === 0 ? 'Directo' : `${flight.stops} escala(s)`}
        </span>
      </div>

      {/* Flight Time Details */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
        {/* Source */}
        <div className="text-center sm:text-left">
          <span className="text-2xl font-black text-brand-dark dark:text-brand-white tracking-tight">{flight.from}</span>
          <p className="text-xs font-bold text-brand-dark dark:text-brand-white mt-1">{formatTime(flight.departure)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{formatDate(flight.departure)}</p>
        </div>

        {/* Transition Line */}
        <div className="flex-grow flex flex-col items-center max-w-[200px]">
          <span className="text-[10px] text-text-muted flex items-center gap-1 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            {flight.duration}
          </span>
          <div className="w-full h-0.5 bg-brand-dark/15 dark:bg-brand-white/15 relative my-2">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-brand-blue" />
          </div>
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{flight.airline}</span>
        </div>

        {/* Destination */}
        <div className="text-center sm:text-right">
          <span className="text-2xl font-black text-brand-dark dark:text-brand-white tracking-tight">{flight.to}</span>
          <p className="text-xs font-bold text-brand-dark dark:text-brand-white mt-1">{formatTime(flight.arrival)}</p>
          <p className="text-[10px] text-text-muted mt-0.5">{formatDate(flight.arrival)}</p>
        </div>
      </div>

      {/* Footer / Booking */}
      <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium">
          <Luggage className="w-4 h-4 text-brand-teal" />
          <span>{flight.baggage}</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[9px] font-semibold text-text-muted uppercase">TARISA DE VUELO</span>
            <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">{flight.price}€</span>
          </div>

          <a
            href={flight.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-brand-white text-xs font-bold shadow-xs hover:shadow-md transition-all"
          >
            <span>Reservar Vuelo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
export default FlightCard;
