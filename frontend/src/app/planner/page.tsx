'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTrips } from '@/context/TripContext';
import { TripPreferences } from '@/types/trip';
import { N8nWarning } from '@/types/planResult';
import { ChatPlanner } from '@/components/planner/ChatPlanner';
import { TravelSummaryPanel } from '@/components/planner/TravelSummaryPanel';
import { AiProcessingScreen } from '@/components/planner/AiProcessingScreen';

function PlannerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { generateTrip } = useTrips();

  // State to sync real-time visual cockpit
  const [preferences, setPreferences] = useState<TripPreferences>({
    origin: 'Barcelona',
    destination: '',
    dates: {
      start: '2026-05-01',
      end: '2026-05-04',
      flexible: true
    },
    travelers: {
      adults: 2,
      children: 0
    },
    budget: 'balanced',
    style: ['culture', 'food'],
    pace: 'medium',
    restrictions: ['avoid_early_flights', 'central_hotel']
  });

  const [currentStep, setCurrentStep] = useState(1);
  // Avisos de n8n cuando no puede completar el plan (p. ej. sin vuelos).
  const [planWarnings, setPlanWarnings] = useState<N8nWarning[] | null>(null);

  // Pre-populate preferences from URL query parameters if they exist
  useEffect(() => {
    const destParam = searchParams.get('dest');
    const styleParam = searchParams.get('style');

    if (destParam) {
      setPreferences((prev) => ({ ...prev, destination: destParam }));
    }
    if (styleParam) {
      setPreferences((prev) => ({
        ...prev,
        style: prev.style.includes(styleParam) ? prev.style : [...prev.style, styleParam]
      }));
    }
  }, [searchParams]);

  const handleUpdatePreferences = (updated: TripPreferences) => {
    setPreferences(updated);
  };

  const handleCompleteWizard = async (finalPrefs: TripPreferences) => {
    try {
      setPlanWarnings(null);
      const result = await generateTrip(finalPrefs);
      if (result.status === 'ok') {
        router.push(`/results?id=${result.tripId}`);
      } else {
        // n8n no pudo completar el plan: mostramos sus avisos reales en vez de
        // navegar a un viaje falso. El usuario ajusta la entrada y reintenta.
        setPlanWarnings(result.warnings);
      }
    } catch (error) {
      console.error('Failed to generate trip:', error);
    }
  };

  const stepsList = [
    { num: 1, label: 'Destino' },
    { num: 2, label: 'Origen' },
    { num: 3, label: 'Fechas' },
    { num: 4, label: 'Viajeros' },
    { num: 5, label: 'Presupuesto' },
    { num: 6, label: 'Estilo' },
    { num: 7, label: 'Ritmo' },
    { num: 8, label: 'Filtros' },
    { num: 9, label: 'Confirmar' }
  ];

  return (
    <div className="w-full flex-grow flex flex-col relative bg-brand-cream/30 dark:bg-brand-dark/10">

      {/* Smart Loading Screen overlay (handles active processing checkmarks) */}
      <AiProcessingScreen />

      {/* Aviso cuando n8n no puede completar el plan (p. ej. sin vuelos): mostramos
          el motivo real y la sugerencia en vez de generar un viaje ficticio. */}
      {planWarnings && planWarnings.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 pt-4">
          <div className="rounded-2xl border border-amber-400/50 bg-amber-50 dark:bg-amber-500/10 p-4 flex flex-col gap-2">
            <h4 className="text-sm font-extrabold text-amber-700 dark:text-amber-300 uppercase tracking-tight">
              No pudimos completar tu plan
            </h4>
            {planWarnings.map((w, i) => (
              <div key={i} className="text-xs text-brand-dark dark:text-brand-white leading-relaxed">
                <p>{w.detail || 'n8n necesita que ajustes algún dato del viaje.'}</p>
                {w.proposed_change && (
                  <p className="text-text-muted mt-0.5">Sugerencia: {w.proposed_change}</p>
                )}
              </div>
            ))}
            <p className="text-[11px] text-text-muted mt-1">
              Ajusta las fechas, el origen o el destino y vuelve a generar el viaje.
            </p>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col lg:flex-row gap-6 p-4 lg:p-8">

        {/* COLUMN 1: PROGRESS SIDEBAR (Desktop only) */}
        <div className="hidden lg:flex flex-col gap-4 w-1/5 shrink-0 bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-5 shadow-xs h-fit">
          <h4 className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider mb-2">
            Pasos de Planificación
          </h4>
          <div className="flex flex-col gap-3">
            {stepsList.map((step) => {
              const isPassed = step.num < currentStep;
              const isCurrent = step.num === currentStep;
              return (
                <div
                  key={step.num}
                  className={`flex items-center gap-2 text-xs font-semibold ${
                    isCurrent
                      ? 'text-brand-blue font-bold'
                      : isPassed
                      ? 'text-brand-teal'
                      : 'text-text-muted'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] ${
                    isCurrent
                      ? 'border-brand-blue bg-brand-blue text-brand-white'
                      : isPassed
                      ? 'border-brand-teal bg-brand-teal/20 text-brand-teal'
                      : 'border-brand-dark/10 dark:border-brand-white/10 text-text-muted'
                  }`}>
                    {isPassed ? '✓' : step.num}
                  </div>
                  <span className="truncate">{step.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMN 2: UNIFIED CHAT PLANNER FLOW (Main) */}
        <div className="flex-grow flex flex-col">
          <ChatPlanner
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onComplete={handleCompleteWizard}
            currentStep={currentStep}
            onStepChange={(stepNum) => setCurrentStep(stepNum)}
          />
        </div>

        {/* COLUMN 3: TRAVEL COCKPIT PANEL (Right Sidebar) */}
        <div className="w-full lg:w-1/3 shrink-0">
          <TravelSummaryPanel preferences={preferences} />
        </div>

      </div>
    </div>
  );
}

export default function PlannerPage() {
  return (
    <Suspense fallback={
      <div className="flex-grow flex items-center justify-center p-12 text-sm text-text-muted">
        Cargando planificador conversacional...
      </div>
    }>
      <PlannerContent />
    </Suspense>
  );
}
