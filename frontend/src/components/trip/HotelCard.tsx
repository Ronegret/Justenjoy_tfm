'use client';

import React from 'react';
import { Building, Star, Check, AlertTriangle, ExternalLink } from 'lucide-react';
import { Hotel } from '@/types/trip';

interface HotelCardProps {
  hotel: Hotel;
}

export const HotelCard: React.FC<HotelCardProps> = ({ hotel }) => {
  const nights = hotel.price_per_night > 0 ? Math.round(hotel.total_price / hotel.price_per_night) : 0;
  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
              Alojamiento Recomendado
            </h4>
            <p className="text-[9px] text-text-muted font-medium mt-0.5">
              Proveedor: {hotel.provider}
            </p>
          </div>
        </div>

        {hotel.rating > 0 && (
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-500 px-2.5 py-1 rounded-full text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>{hotel.rating} / 5</span>
          </div>
        )}
      </div>

      {/* Hotel Name & Area */}
      <div>
        <h3 className="text-lg font-black text-brand-dark dark:text-brand-white uppercase tracking-tight">
          {hotel.name}
        </h3>
        <p className="text-xs text-text-muted mt-1">
          Zona: <span className="font-semibold text-brand-dark dark:text-brand-white">{hotel.area}</span>
        </p>
      </div>

      {/* Pros & Cons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1 bg-brand-cream/30 dark:bg-brand-white/5 p-3 rounded-xl border border-brand-dark/5 dark:border-brand-white/5">
        {/* Pros */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-brand-teal uppercase tracking-wider">Ventajas</span>
          <ul className="flex flex-col gap-1">
            {hotel.pros.map((pro, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-xs text-brand-dark dark:text-brand-white">
                <Check className="w-3.5 h-3.5 text-brand-teal shrink-0 stroke-[3px]" />
                <span>{pro}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Cons */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-brand-coral uppercase tracking-wider">A tener en cuenta</span>
          <ul className="flex flex-col gap-1">
            {hotel.cons.map((con, idx) => (
              <li key={idx} className="flex items-center gap-1.5 text-xs text-text-muted">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-coral shrink-0" />
                <span>{con}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Booking */}
      <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-text-muted uppercase">TARIFA POR NOCHE</span>
            <span className="text-xs text-brand-dark dark:text-brand-white">
              <span className="font-extrabold text-sm">{hotel.price_per_night}€</span> / noche
            </span>
          </div>
          <div className="flex flex-col border-l border-brand-dark/10 dark:border-brand-white/10 pl-4">
            <span className="text-[9px] font-semibold text-text-muted uppercase">
              TOTAL ESTANCIA{nights > 0 ? ` (${nights} ${nights === 1 ? 'noche' : 'noches'})` : ''}
            </span>
            <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">{hotel.total_price}€</span>
          </div>
        </div>

        <a
          href={hotel.booking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-brand-white text-xs font-bold shadow-xs hover:shadow-md transition-all"
        >
          <span>Reservar Hotel</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
export default HotelCard;
