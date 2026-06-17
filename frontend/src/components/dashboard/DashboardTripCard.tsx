'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Compass, Eye, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { TripData } from '@/types/trip';

interface DashboardTripCardProps {
  trip: TripData;
  onDelete: (id: string) => void;
}

export const DashboardTripCard: React.FC<DashboardTripCardProps> = ({ trip, onDelete }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return 'text-green-600 bg-green-500/10 border-green-500/20';
      case 'generado':
        return 'text-brand-blue bg-brand-blue/10 border-brand-blue/20';
      case 'finalizado':
        return 'text-text-muted bg-brand-dark/5 dark:bg-brand-white/5 border-brand-dark/10';
      default:
        return 'text-amber-600 bg-amber-500/10 border-amber-500/20';
    }
  };

  // Mock a trip status based on trip id length or random
  const getMockStatus = (id: string) => {
    if (id.includes('oporto')) return 'confirmado';
    if (id.includes('roma')) return 'generado';
    return 'generado'; // default for lisbon
  };

  const status = getMockStatus(trip.trip_id);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-5 relative overflow-hidden transition-all hover:shadow-md"
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border ${getStatusBadge(status)}`}>
          {status}
        </span>

        <button
          onClick={() => onDelete(trip.trip_id)}
          className="p-1.5 rounded-lg text-text-muted hover:text-brand-coral hover:bg-brand-coral/10 transition-colors cursor-pointer"
          title="Eliminar viaje"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <div>
        <h4 className="text-xl font-black text-brand-dark dark:text-brand-white tracking-tight uppercase">
          {trip.best_option.destination}
        </h4>
        <p className="text-xs text-text-muted mt-1 truncate">
          {trip.best_option.title}
        </p>
      </div>

      {/* Stats */}
      <div className="flex flex-col gap-2 border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 text-xs font-medium text-text-muted">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-blue" />
          <span>{trip.user_preferences.dates.start} al {trip.user_preferences.dates.end}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-blue" />
          <span>
            {trip.user_preferences.travelers.adults} {trip.user_preferences.travelers.adults === 1 ? 'Adulto' : 'Adultos'}
            {trip.user_preferences.travelers.children > 0 ? `, ${trip.user_preferences.travelers.children} Niños` : ''}
          </span>
        </div>
      </div>

      {/* Footer view action */}
      <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-text-muted uppercase">PRESUPUESTO TOTAL</span>
          <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">
            {trip.budget.total}€
          </span>
        </div>

        <Link
          href={`/trip/${trip.trip_id}`}
          className="flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-brand-white text-xs font-bold shadow-xs hover:shadow-md transition-all"
        >
          <span>Abrir Cockpit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  );
};
export default DashboardTripCard;
