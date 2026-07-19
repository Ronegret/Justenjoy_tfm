'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus, Compass, Calendar, Users,
  MapPin, CheckSquare, Smile
} from 'lucide-react';
import { useTrips } from '@/context/TripContext';
import { DashboardTripCard } from '@/components/dashboard/DashboardTripCard';

export default function DashboardPage() {
  const router = useRouter();
  const { savedTrips, deleteTrip } = useTrips();

  // Antes esta fila mostraba "18% Ahorro Prom." y "Plan Premium: Plus Activo"
  // como texto fijo, sin relación con ningún dato real (no hay ningún sistema
  // de planes de pago: la página de precios dice explícitamente "aún se están
  // preparando"). Ahora ambos stats son cálculos reales sobre los viajes
  // guardados, igual que ya se hizo con el JustGo score y el desglose de
  // presupuesto — si no hay viajes, se muestra 0/— en vez de un número inventado.
  const avgMatch = savedTrips.length > 0
    ? Math.round(savedTrips.reduce((acc, t) => acc + (t.justgo_score?.overall_match || 0), 0) / savedTrips.length)
    : null;
  const uniqueDestinations = new Set(savedTrips.map((t) => t.best_option.destination)).size;

  return (
    <div className="w-full flex-grow py-10 px-4 lg:px-8 bg-brand-cream/30 dark:bg-brand-dark/10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-brand-dark/10 dark:border-brand-white/5 pb-6">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
              Mi Espacio Personal
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-brand-dark dark:text-brand-white uppercase mt-2">
              Mis Viajes Guardados
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Aquí están todos los viajes que has planificado. Revísalos, compártelos o vuelve a verlos cuando quieras.
            </p>
          </div>

          <button
            onClick={() => router.push('/planner')}
            className="flex items-center gap-1 px-5 py-3 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-brand-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Viaje</span>
          </button>
        </div>

        {/* Dynamic Trip List */}
        {savedTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedTrips.map((trip) => (
              <DashboardTripCard
                key={trip.trip_id}
                trip={trip}
                onDelete={deleteTrip}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/30 rounded-3xl gap-4">
            <Compass className="w-12 h-12 text-brand-blue/30 animate-pulse" />
            <div>
              <h3 className="text-base font-extrabold text-brand-dark dark:text-brand-white uppercase">No tienes viajes generados</h3>
              <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">
                Cuéntale a nuestro concierge inteligente a dónde te gustaría ir y generaremos una propuesta en 3 minutos.
              </p>
            </div>
            <button
              onClick={() => router.push('/planner')}
              className="px-5 py-2.5 rounded-xl bg-brand-blue text-brand-white text-xs font-bold shadow-xs hover:bg-brand-blue/90 cursor-pointer"
            >
              Comenzar a planificar
            </button>
          </div>
        )}

        {/* User Stats/Dashboard summary row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-brand-dark/10 dark:border-brand-white/5">
          {/* Stat 1 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
              {savedTrips.length}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">VIAJES TOTALES</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">Rutas creadas</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">PASOS AL DÍA</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">Checklists listos</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-black text-xs">
              {avgMatch !== null ? `${avgMatch}%` : '—'}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">MATCH PROMEDIO</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">JustGo Score</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">DESTINOS EXPLORADOS</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">{uniqueDestinations} distinto{uniqueDestinations === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* Travel recommendations */}
        <div className="mt-4 bg-brand-white dark:bg-brand-dark/30 border border-brand-dark/15 dark:border-brand-white/5 rounded-3xl p-6 flex items-start gap-4">
          <div className="p-3 bg-brand-coral/10 text-brand-coral rounded-2xl shrink-0">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight">
              ¿Listo para tu próxima aventura?
            </h4>
            <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-2xl">
              Nuestras plantillas inteligentes de Inteligencia Artificial para el fin de semana del Día del Trabajador están recibiendo tarifas bajas en vuelos a Oporto y Milán. ¡Haz clic en crear viaje para explorarlos!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
