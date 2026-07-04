'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Compass, ArrowRight, Sparkles, Check,
  HelpCircle, ChevronRight, Share2, Calendar, FileText
} from 'lucide-react';
import { useTrips } from '@/context/TripContext';
import { JustGoScoreCard } from '@/components/results/JustGoScoreCard';
import { RouteDecisionCard } from '@/components/results/RouteDecisionCard';
import { TripOptionCard } from '@/components/results/TripOptionCard';
import { RegenerateActionBar } from '@/components/trip/RegenerateActionBar';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTrip, setCurrentTripById, generateTrip, isLoading } = useTrips();
  const [activeAlternativeType, setActiveAlternativeType] = useState<'recommended' | 'cheapest' | 'premium'>('recommended');

  const tripId = searchParams.get('id');

  useEffect(() => {
    if (tripId) {
      setCurrentTripById(tripId);
    }
  }, [tripId, setCurrentTripById]);

  // If there's no active trip, fallback or show a loading state
  if (!currentTrip && !isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center gap-4">
        <Compass className="w-12 h-12 text-brand-blue animate-pulse" />
        <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">Buscando tu ruta óptima...</h3>
        <p className="text-xs text-text-muted">Si has creado un viaje, se cargará en breves segundos.</p>
        <button
          onClick={() => router.push('/planner')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-brand-blue text-brand-white text-xs font-bold shadow-xs hover:bg-brand-blue/90 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          Ir al Planificador
        </button>
      </div>
    );
  }

  // Active representation
  const trip = currentTrip!;

  const handleRegenerateAction = async (actionType: string) => {
    // Modify preferences in background and regenerate to demonstrate n8n capability
    const updatedPrefs = {
      ...trip.user_preferences,
      budget: actionType === 'cheaper' ? 'low' : actionType === 'premium' ? 'premium' : trip.user_preferences.budget,
      style: actionType === 'more-culture' ? [...trip.user_preferences.style, 'culture'] : trip.user_preferences.style,
      pace: actionType === 'low-walking' ? 'relax' : trip.user_preferences.pace,
      restrictions: actionType === 'low-walking' ? [...trip.user_preferences.restrictions, 'low_walking'] : trip.user_preferences.restrictions
    };

    const result = await generateTrip(updatedPrefs);
    if (result.status === 'ok') {
      router.push(`/results?id=${result.tripId}`);
    }
    // Si n8n devuelve needs_user_input al regenerar, no navegamos: se mantiene el
    // viaje actual (esta acción es un ajuste rápido opcional).
  };

  // Compile comparative cards data
  const mainOption = trip.best_option;
  const alternatives = trip.alternatives;

  const cheapestAlt = alternatives.find(a => a.type === 'cheapest');
  const premiumAlt = alternatives.find(a => a.type === 'premium');

  return (
    <div className="w-full flex-grow py-8 px-4 lg:px-8 bg-brand-cream/30 dark:bg-brand-dark/10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* TOP INTRO CARD */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-brand-dark/10 dark:border-brand-white/5 pb-6">
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 border border-brand-dark/5 bg-transparent mt-1.5 hidden sm:flex">
              <img src="/logo.png" alt="JUST ENJOY Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
                Ruta Óptima Justificada
              </span>
              <h2 className="text-2xl lg:text-4xl font-black text-brand-dark dark:text-brand-white uppercase mt-2">
                Tu viaje a {mainOption.destination}
              </h2>
              <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-xl">
                Hemos comparado vuelos, estancias y horarios. Tu viaje equilibrado está listo para ser revisado y reservado.
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push(`/trip/${trip.trip_id}`)}
            className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-coral hover:from-brand-blue/90 hover:to-brand-coral/90 text-brand-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
          >
            <span>Ver Itinerario Completo</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 1. SCOREBOARD SUMMARY & JUSTIFICATION CARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Score gauge Card (span 2 on large screens) */}
          <div className="lg:col-span-2">
            <JustGoScoreCard score={trip.justgo_score} />
          </div>

          {/* Friction indicator card */}
          <div className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Detalle del viaje</span>
              <h4 className="text-base font-extrabold text-brand-dark dark:text-brand-white uppercase">Resumen Ejecutivo</h4>

              <div className="flex flex-col gap-2 mt-4 text-xs">
                <div className="flex justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2">
                  <span className="text-text-muted">Ahorro Estimado:</span>
                  <span className="font-bold text-brand-teal">~ 180€ (18% total)</span>
                </div>
                <div className="flex justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2">
                  <span className="text-text-muted">Tiempo de Vuelos:</span>
                  <span className="font-bold text-brand-dark dark:text-brand-white">{trip.flights[0]?.duration || '1h 55m'} (Directo)</span>
                </div>
                <div className="flex justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2">
                  <span className="text-text-muted">Distancia Alojamiento:</span>
                  <span className="font-bold text-brand-dark dark:text-brand-white">350m del centro histórico</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/trip/${trip.trip_id}`)}
              className="mt-6 w-full py-2.5 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue text-xs font-bold text-brand-dark dark:text-brand-white hover:bg-brand-blue/5 transition-all cursor-pointer"
            >
              Consultar detalles de reservas
            </button>
          </div>
        </div>

        {/* 2. RECONSTRUCT / QUICK ACTION BAR */}
        <RegenerateActionBar onRegenerate={handleRegenerateAction} />

        {/* 3. OPTION COMPARISON ROW (3 OPTIONS) */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-base font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
              Comparativa de opciones viables
            </h3>
            <p className="text-[10px] text-text-muted mt-0.5">
              Elige entre el mejor equilibrio sugerido por la IA o los extremos optimizados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Recommended */}
            <TripOptionCard
              type="recommended"
              destination={mainOption.destination}
              matchScore={trip.justgo_score.overall_match}
              price={trip.budget.total}
              reason={mainOption.summary}
              isSelected={activeAlternativeType === 'recommended'}
              onSelect={() => setActiveAlternativeType('recommended')}
            />

            {/* 2. Cheapest */}
            <TripOptionCard
              type="cheapest"
              destination={cheapestAlt ? cheapestAlt.destination : 'Oporto'}
              matchScore={cheapestAlt ? cheapestAlt.match : 86}
              price={cheapestAlt ? cheapestAlt.estimated_total : 540}
              reason={cheapestAlt ? cheapestAlt.reason : 'Alternativa económica descartando hoteles premium.'}
              isSelected={activeAlternativeType === 'cheapest'}
              onSelect={() => {
                setActiveAlternativeType('cheapest');
                if (cheapestAlt) {
                  // Switch active route mock to cheapest option
                  setCurrentTripById('justenjoy-oporto-cheapest');
                }
              }}
            />

            {/* 3. Premium */}
            <TripOptionCard
              type="premium"
              destination={premiumAlt ? premiumAlt.destination : 'Roma'}
              matchScore={premiumAlt ? premiumAlt.match : 89}
              price={premiumAlt ? premiumAlt.estimated_total : 780}
              reason={premiumAlt ? premiumAlt.reason : 'Alternativa premium con traslados privados e históricos.'}
              isSelected={activeAlternativeType === 'premium'}
              onSelect={() => {
                setActiveAlternativeType('premium');
                if (premiumAlt) {
                  // Switch active route mock to premium option
                  setCurrentTripById('justenjoy-roma-premium');
                }
              }}
            />
          </div>
        </div>

        {/* 4. EXPLANATION ROUTE DECISION CARD */}
        <RouteDecisionCard bestOption={mainOption} />

      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-12 text-sm text-text-muted">
        Cargando tus resultados óptimos...
      </div>
    }>
      <ResultsContent />
    </Suspense>
  );
}
