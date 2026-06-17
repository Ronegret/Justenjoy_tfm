'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Plane, Building, Compass, Sparkles, AlertCircle } from 'lucide-react';
import { useTrips } from '@/context/TripContext';

export const AiProcessingScreen: React.FC = () => {
  const { isLoading, loadingProgress, loadingMessage, activeLoadingStep } = useTrips();

  const steps = [
    { label: 'Buscador de Vuelos', icon: Plane },
    { label: 'Comparador de Alojamientos', icon: Building },
    { label: 'Filtro de Actividades & Museos', icon: Compass },
    { label: 'Buscador de Eventos', icon: Sparkles },
    { label: 'Tiempos de Transporte y Clima', icon: Compass },
    { label: 'Optimización de Presupuestos', icon: Sparkles },
    { label: 'Generando Ruta Óptima Justificada', icon: Sparkles }
  ];

  // Map active loading index (0-8) to steps (0-6)
  const mapLoadingStepToSubstep = (step: number) => {
    if (step <= 1) return 0; // flights
    if (step === 2) return 1; // hotels
    if (step === 3 || step === 5) return 4; // transport
    if (step === 4) return 2; // activities
    if (step === 6) return 3; // events
    if (step === 7) return 5; // budget
    return 6; // final route
  };

  const currentStepMapped = mapLoadingStepToSubstep(activeLoadingStep);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand-dark/95 backdrop-blur-md text-brand-white p-6"
        >
          {/* Main Container */}
          <div className="w-full max-w-xl flex flex-col items-center text-center gap-6">

            {/* Spinning AI Logo */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-blue to-brand-coral flex items-center justify-center shadow-lg shadow-brand-blue/20"
            >
              <Sparkles className="w-8 h-8 text-brand-white" />
            </motion.div>

            {/* Title */}
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
                Hiperautomatizando tu viaje
              </h2>
              <p className="text-brand-cream/60 text-sm mt-1">
                La IA de Just Enjoy está analizando miles de opciones a través de n8n...
              </p>
            </div>

            {/* Circular Progress & Message */}
            <div className="w-full bg-brand-white/5 border border-brand-white/10 rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-brand-blue to-brand-coral transition-all duration-300" style={{ width: `${loadingProgress}%` }} />

              <div className="flex items-center justify-between w-full text-xs font-semibold text-brand-cream/50">
                <span>PROCESANDO EN N8N</span>
                <span>{loadingProgress}%</span>
              </div>

              {/* Spinner & Message */}
              <div className="flex items-center gap-3 py-2">
                <Loader2 className="w-5 h-5 text-brand-coral animate-spin shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMessage}
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-base font-medium text-brand-white"
                  >
                    {loadingMessage}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* Checklist */}
            <div className="w-full flex flex-col gap-2 bg-brand-white/5 border border-brand-white/10 rounded-2xl p-6 text-left">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-cream/50 mb-3">
                Tareas del Asistente
              </h3>

              {steps.map((step, idx) => {
                const isCompleted = idx < currentStepMapped;
                const isActive = idx === currentStepMapped;
                const StepIcon = step.icon;

                return (
                  <div
                    key={step.label}
                    className={`flex items-center justify-between p-2 rounded-lg transition-colors duration-200 ${
                      isActive ? 'bg-brand-white/5 text-brand-white font-medium' : 'text-brand-cream/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-md ${
                        isCompleted ? 'bg-brand-teal/20 text-brand-teal' : isActive ? 'bg-brand-blue/20 text-brand-blue' : 'bg-brand-white/5'
                      }`}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <span className="text-sm">{step.label}</span>
                    </div>

                    <div>
                      {isCompleted ? (
                        <div className="w-5 h-5 rounded-full bg-brand-teal flex items-center justify-center text-brand-dark">
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        </div>
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full bg-brand-white/10" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Microcopy footer */}
            <div className="flex items-center gap-2 text-xs text-brand-cream/40 justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Te ahorramos abrir 20 pestañas en tu navegador.</span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default AiProcessingScreen;
