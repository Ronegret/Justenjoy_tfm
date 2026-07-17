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
import { downloadTripPdf } from '@/lib/tripPdf';

function ResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentTrip, setCurrentTripById, generateTrip, isLoading } = useTrips();
  const [activeAlternativeType, setActiveAlternativeType] = useState<'recommended' | 'cheapest' | 'premium'>('recommended');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [regeneratingType, setRegeneratingType] = useState<'cheapest' | 'premium' | null>(null);

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
      // El tier por sí solo ya no mueve el presupuesto real (ver budgetAmountUsd
      // en mapPreferencesToN8n): ajustamos también el monto para que el botón
      // rápido de "más barato"/"premium" tenga efecto real en la búsqueda.
      budgetAmountUsd: actionType === 'cheaper'
        ? Math.round(trip.user_preferences.budgetAmountUsd * 0.7)
        : actionType === 'premium'
          ? Math.round(trip.user_preferences.budgetAmountUsd * 1.5)
          : trip.user_preferences.budgetAmountUsd,
      style: actionType === 'more-culture' ? [...trip.user_preferences.style, 'culture'] : trip.user_preferences.style,
      restrictions: actionType === 'low-walking' ? [...trip.user_preferences.restrictions, 'low_walking'] : trip.user_preferences.restrictions
    };

    const result = await generateTrip(updatedPrefs);
    if (result.status === 'ok') {
      router.push(`/results?id=${result.tripId}`);
    }
    // Si n8n devuelve needs_user_input al regenerar, no navegamos: se mantiene el
    // viaje actual (esta acción es un ajuste rápido opcional).
  };

  // Las tarjetas "Más económico"/"Lujo inteligente" antes mostraban un destino,
  // precio y match INVENTADOS (Oporto/Roma con números fijos) y al pulsarlas
  // cambiaban a un viaje mock sin relación con la búsqueda real del usuario.
  // Ahora disparan una búsqueda real (mismo destino, presupuesto ajustado) vía
  // el mismo mecanismo que ya usa la barra de "Reconstruir viaje".
  const handleSearchAlternative = async (type: 'cheapest' | 'premium') => {
    setRegeneratingType(type);
    try {
      await handleRegenerateAction(type === 'cheapest' ? 'cheaper' : 'premium');
    } finally {
      setRegeneratingType(null);
    }
  };

  // Compile comparative cards data
  const mainOption = trip.best_option;

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

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Antes el botón de PDF solo existía escondido en el panel lateral
                de /trip/[id] — aquí, en la primera pantalla que ve el
                cliente, no había ninguno visible. */}
            <button
              onClick={async () => {
                if (isGeneratingPdf) return;
                setIsGeneratingPdf(true);
                try {
                  await downloadTripPdf(trip);
                } catch (err) {
                  console.error('Error generando el PDF del viaje:', err);
                  alert('No se pudo generar el PDF del viaje. Inténtalo de nuevo en unos segundos.');
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
              disabled={isGeneratingPdf}
              className="px-6 py-3.5 rounded-2xl border-2 border-brand-blue text-brand-blue dark:text-brand-white font-extrabold text-sm hover:bg-brand-blue/5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
            >
              <FileText className="w-4 h-4" />
              <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>
            <button
              onClick={() => router.push(`/trip/${trip.trip_id}`)}
              className="w-full md:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-coral hover:from-brand-blue/90 hover:to-brand-coral/90 text-brand-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
            >
              <span>Ver Itinerario Completo</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Avisos no bloqueantes de n8n (p. ej. fecha de vuelo ajustada ±1 día
            porque no había disponibilidad exacta): el plan sí se completó, pero
            el usuario necesita saberlo para no confundirse con lo que pidió. */}
        {trip.notices && trip.notices.length > 0 && (
          <div className="rounded-2xl border border-brand-blue/30 bg-brand-blue/5 dark:bg-brand-blue/10 p-4 flex flex-col gap-1.5">
            {trip.notices.map((notice, i) => (
              <p key={i} className="text-xs text-brand-dark dark:text-brand-white leading-relaxed">
                <span className="font-bold text-brand-blue">Aviso: </span>{notice}
              </p>
            ))}
          </div>
        )}

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
                  <span className="text-text-muted">Duración del vuelo:</span>
                  <span className="font-bold text-brand-dark dark:text-brand-white">
                    {trip.flights[0]?.duration || 'N/D'}
                    {trip.flights[0] && ` (${trip.flights[0].stops === 0 ? 'Directo' : `${trip.flights[0].stops} escala(s)`})`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2">
                  <span className="text-text-muted">Alojamiento:</span>
                  <span className="font-bold text-brand-dark dark:text-brand-white">
                    {trip.hotels[0] ? `${trip.hotels[0].rating}/5 · ${trip.hotels[0].area}` : 'N/D'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2">
                  <span className="text-text-muted">Actividades incluidas:</span>
                  <span className="font-bold text-brand-dark dark:text-brand-white">
                    {trip.activities.length} {trip.activities.length === 1 ? 'actividad real' : 'actividades reales'}
                  </span>
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
              price={mainOption.estimated_total}
              reason={mainOption.summary}
              isSelected={activeAlternativeType === 'recommended'}
              onSelect={() => setActiveAlternativeType('recommended')}
            />

            {/* 2. Cheapest — sin precio/match inventados: busca de verdad al pulsar */}
            <TripOptionCard
              type="cheapest"
              destination={mainOption.destination}
              reason={`Misma ruta a ${mainOption.destination}, buscando de nuevo con un presupuesto más bajo (vuelos low-cost, hotel más sencillo).`}
              isSelected={activeAlternativeType === 'cheapest'}
              isLoading={regeneratingType === 'cheapest'}
              onSelect={() => {
                setActiveAlternativeType('cheapest');
                handleSearchAlternative('cheapest');
              }}
            />

            {/* 3. Premium — idem, sin inventar destino ni precio */}
            <TripOptionCard
              type="premium"
              destination={mainOption.destination}
              reason={`Misma ruta a ${mainOption.destination}, buscando de nuevo con más presupuesto (mejor hotel, vuelos más cómodos).`}
              isSelected={activeAlternativeType === 'premium'}
              isLoading={regeneratingType === 'premium'}
              onSelect={() => {
                setActiveAlternativeType('premium');
                handleSearchAlternative('premium');
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
