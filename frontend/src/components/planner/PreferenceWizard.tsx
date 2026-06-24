'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Send, Sparkles, MapPin,
  Calendar as CalendarIcon, Users, Euro, Heart, Gauge, ShieldAlert, CheckCircle2
} from 'lucide-react';
import { TripPreferences } from '@/types/trip';
import { SmartChip } from '../shared/SmartChip';

interface PreferenceWizardProps {
  onComplete: (prefs: TripPreferences) => void;
  onUpdatePreferences: (prefs: TripPreferences) => void;
  onStepChange?: (step: number) => void;
}

const DEST_OPTIONS = [
  'Ya tengo destino',
  'Recomiéndame uno',
  'Tengo varios en mente',
  'Quiero el más barato',
  'Quiero el mejor equilibrio'
];

const DATE_OPTIONS = [
  'Fechas fijas',
  'Fechas flexibles',
  'Fin de semana',
  'Puente',
  'Cualquier fecha barata'
];

const BUDGET_LABELS = {
  low: 'Low Cost (Económico)',
  balanced: 'Equilibrado (Calidad/Precio)',
  premium: 'Premium (Comodidad extra)',
  luxury: 'Lujo Inteligente (Todo incluido)'
};

const STYLE_OPTIONS = [
  'Playa', 'Cultura', 'Gastronomía', 'Relax', 'Aventura', 'Museos',
  'Vida nocturna', 'Compras', 'Naturaleza', 'Fotografía', 'Familia',
  'Romántico', 'Local experience', 'Sin caminar mucho', 'Pet friendly', 'Accesible'
];

const PACE_OPTIONS = [
  { value: 'relax', label: 'Relax (Pocos puntos de interés al día)' },
  { value: 'medium', label: 'Medio (Equilibrio perfecto)' },
  { value: 'intense', label: 'Intenso (Ver lo máximo posible)' },
  { value: 'all', label: '¡Quiero verlo todo!' }
];

const RESTRICTION_OPTIONS = [
  { id: 'avoid_scales', label: 'Evitar escalas' },
  { id: 'avoid_early_flights', label: 'Evitar vuelos temprano' },
  { id: 'central_hotel', label: 'Hotel céntrico' },
  { id: 'cheap_hotel', label: 'Hotel barato' },
  { id: 'free_activities', label: 'Actividades gratis' },
  { id: 'free_museums', label: 'Museos gratuitos' },
  { id: 'kids_friendly', label: 'Viaje con niños' },
  { id: 'low_walking', label: 'Evitar caminar mucho' },
  { id: 'accessibility', label: 'Necesito accesibilidad' },
  { id: 'save_money', label: 'Quiero ahorrar' }
];

export const PreferenceWizard: React.FC<PreferenceWizardProps> = ({
  onComplete,
  onUpdatePreferences,
  onStepChange
}) => {
  const [step, setStep] = useState(1);
  const [prefs, setPrefs] = useState<TripPreferences>({
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

  const [inputDestination, setInputDestination] = useState('');
  const [inputOrigin, setInputOrigin] = useState('Barcelona');
  const [destType, setDestType] = useState('Ya tengo destino');
  const [dateType, setDateType] = useState('Fechas flexibles');

  const updatePrefs = (updated: Partial<TripPreferences>) => {
    const newPrefs = { ...prefs, ...updated };
    setPrefs(newPrefs);
    onUpdatePreferences(newPrefs);
  };

  const nextStep = () => {
    // Save transient inputs before moving
    if (step === 1) {
      if (destType === 'Ya tengo destino' && !inputDestination) {
        updatePrefs({ destination: 'Lisboa' }); // Default to Lisbon if empty
      } else if (inputDestination) {
        updatePrefs({ destination: inputDestination });
      } else {
        updatePrefs({ destination: 'Recomendado por IA' });
      }
    }
    if (step === 2) {
      updatePrefs({ origin: inputOrigin });
    }

    if (step < 9) {
      setStep(step + 1);
      if (onStepChange) onStepChange(step + 1);
    } else {
      onComplete(prefs);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      if (onStepChange) onStepChange(step - 1);
    }
  };

  const handleStyleToggle = (style: string) => {
    const isSelected = prefs.style.includes(style);
    const updatedStyles = isSelected
      ? prefs.style.filter((s) => s !== style)
      : [...prefs.style, style];
    updatePrefs({ style: updatedStyles });
  };

  const handleRestrictionToggle = (restrictionId: string) => {
    const isSelected = prefs.restrictions.includes(restrictionId);
    const updatedRestrictions = isSelected
      ? prefs.restrictions.filter((r) => r !== restrictionId)
      : [...prefs.restrictions, restrictionId];
    updatePrefs({ restrictions: updatedRestrictions });
  };

  const stepsDetails = [
    { num: 1, title: 'Destino', icon: MapPin },
    { num: 2, title: 'Origen', icon: MapPin },
    { num: 3, title: 'Fechas', icon: CalendarIcon },
    { num: 4, title: 'Personas', icon: Users },
    { num: 5, title: 'Presupuesto', icon: Euro },
    { num: 6, title: 'Estilo', icon: Heart },
    { num: 7, title: 'Ritmo', icon: Gauge },
    { num: 8, title: 'Filtros', icon: ShieldAlert },
    { num: 9, title: 'Confirmar', icon: CheckCircle2 }
  ];

  return (
    <div className="w-full flex flex-col h-full justify-between">
      {/* Wizard Mini Step Bar */}
      <div className="flex items-center justify-between px-2 py-3 border-b border-brand-dark/10 dark:border-brand-white/5 bg-brand-white/20 dark:bg-brand-dark/10">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {stepsDetails.map((s) => {
            const SIcon = s.icon;
            const isPassed = s.num < step;
            const isCurrent = s.num === step;
            return (
              <div key={s.num} className="flex items-center shrink-0">
                <div
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    isCurrent
                      ? 'bg-brand-blue border-brand-blue text-brand-white'
                      : isPassed
                      ? 'bg-brand-teal/20 border-brand-teal/30 text-brand-teal'
                      : 'bg-brand-white/30 dark:bg-brand-dark/20 border-brand-dark/5 dark:border-brand-white/5 text-text-muted'
                  }`}
                >
                  <SIcon className="w-3.5 h-3.5" />
                  <span>{s.title}</span>
                </div>
                {s.num < 9 && <ArrowRight className="w-3 h-3 text-text-muted mx-1 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Form Body */}
      <div className="flex-grow p-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {/* STEP 1: DESTINO */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Cuál es tu destino de viaje?</h3>
                  <p className="text-xs text-text-muted">Dinos a dónde quieres ir o deja que JUST ENJOY te recomiende la mejor opción.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {DEST_OPTIONS.map((opt) => (
                    <SmartChip
                      key={opt}
                      label={opt}
                      isSelected={destType === opt}
                      onClick={() => {
                        setDestType(opt);
                        if (opt === 'Quiero el más barato') {
                          setInputDestination('El más barato');
                          updatePrefs({ destination: 'El más barato' });
                        } else if (opt === 'Quiero el mejor equilibrio') {
                          setInputDestination('El mejor equilibrio');
                          updatePrefs({ destination: 'El mejor equilibrio' });
                        } else if (opt === 'Recomiéndame uno') {
                          setInputDestination('Recomiéndame uno');
                          updatePrefs({ destination: 'Recomiéndame uno' });
                        } else {
                          setInputDestination('');
                        }
                      }}
                    />
                  ))}
                </div>

                {(destType === 'Ya tengo destino' || destType === 'Tengo varios en mente') && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-brand-dark dark:text-brand-white">Introduce el destino:</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ej. Lisboa, Roma, París..."
                        value={inputDestination}
                        onChange={(e) => {
                          setInputDestination(e.target.value);
                          updatePrefs({ destination: e.target.value });
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-text-dark dark:text-brand-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: ORIGEN */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Desde dónde vuelas?</h3>
                  <p className="text-xs text-text-muted">Comparamos tarifas desde tu aeropuerto de salida.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-brand-dark dark:text-brand-white font-sans">Ciudad o Aeropuerto de salida:</label>
                  <input
                    type="text"
                    placeholder="Ej. Barcelona, Madrid, Sevilla..."
                    value={inputOrigin}
                    onChange={(e) => {
                      setInputOrigin(e.target.value);
                      updatePrefs({ origin: e.target.value });
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-text-dark dark:text-brand-white focus:outline-hidden focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: FECHAS */}
            {step === 3 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Cuándo quieres viajar?</h3>
                  <p className="text-xs text-text-muted font-sans">Selecciona flexibilidad para encontrar mejores precios de vuelos.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DATE_OPTIONS.map((opt) => (
                    <SmartChip
                      key={opt}
                      label={opt}
                      isSelected={dateType === opt}
                      onClick={() => {
                        setDateType(opt);
                        updatePrefs({
                          dates: {
                            ...prefs.dates,
                            flexible: opt !== 'Fechas fijas'
                          }
                        });
                      }}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-muted">Fecha de inicio</label>
                    <input
                      type="date"
                      value={prefs.dates.start}
                      onChange={(e) => updatePrefs({ dates: { ...prefs.dates, start: e.target.value } })}
                      className="px-4 py-2.5 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-text-dark dark:text-brand-white text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-text-muted">Fecha de regreso</label>
                    <input
                      type="date"
                      value={prefs.dates.end}
                      onChange={(e) => updatePrefs({ dates: { ...prefs.dates, end: e.target.value } })}
                      className="px-4 py-2.5 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-text-dark dark:text-brand-white text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: PERSONAS */}
            {step === 4 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Quiénes viajan?</h3>
                  <p className="text-xs text-text-muted font-sans">Optimizamos el tipo de hotel, las actividades y los billetes.</p>
                </div>

                <div className="flex flex-col gap-6 bg-brand-white dark:bg-brand-dark/30 p-6 rounded-2xl border border-brand-dark/5 dark:border-brand-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark dark:text-brand-white">Adultos</h4>
                      <p className="text-xs text-text-muted">Mayores de 12 años</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updatePrefs({ travelers: { ...prefs.travelers, adults: Math.max(1, prefs.travelers.adults - 1) } })}
                        className="w-10 h-10 rounded-full border border-brand-dark/10 dark:border-brand-white/10 flex items-center justify-center font-bold text-lg hover:bg-brand-dark/5 dark:hover:bg-brand-white/5 text-brand-dark dark:text-brand-white"
                      >
                        -
                      </button>
                      <span className="text-base font-extrabold w-6 text-center text-brand-dark dark:text-brand-white">{prefs.travelers.adults}</span>
                      <button
                        type="button"
                        onClick={() => updatePrefs({ travelers: { ...prefs.travelers, adults: prefs.travelers.adults + 1 } })}
                        className="w-10 h-10 rounded-full border border-brand-dark/10 dark:border-brand-white/10 flex items-center justify-center font-bold text-lg hover:bg-brand-dark/5 dark:hover:bg-brand-white/5 text-brand-dark dark:text-brand-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark dark:text-brand-white">Niños</h4>
                      <p className="text-xs text-text-muted">Edades entre 2 y 12 años</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updatePrefs({ travelers: { ...prefs.travelers, children: Math.max(0, prefs.travelers.children - 1) } })}
                        className="w-10 h-10 rounded-full border border-brand-dark/10 dark:border-brand-white/10 flex items-center justify-center font-bold text-lg hover:bg-brand-dark/5 dark:hover:bg-brand-white/5 text-brand-dark dark:text-brand-white"
                      >
                        -
                      </button>
                      <span className="text-base font-extrabold w-6 text-center text-brand-dark dark:text-brand-white">{prefs.travelers.children}</span>
                      <button
                        type="button"
                        onClick={() => updatePrefs({ travelers: { ...prefs.travelers, children: prefs.travelers.children + 1 } })}
                        className="w-10 h-10 rounded-full border border-brand-dark/10 dark:border-brand-white/10 flex items-center justify-center font-bold text-lg hover:bg-brand-dark/5 dark:hover:bg-brand-white/5 text-brand-dark dark:text-brand-white"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5: PRESUPUESTO */}
            {step === 5 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Cuál es tu rango de presupuesto?</h3>
                  <p className="text-xs text-text-muted">Ajustamos las opciones de aerolínea y categoría de alojamiento.</p>
                </div>

                <div className="flex flex-col gap-4">
                  {(Object.keys(BUDGET_LABELS) as Array<keyof typeof BUDGET_LABELS>).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updatePrefs({ budget: key })}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        prefs.budget === key
                          ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 text-brand-dark dark:text-brand-white font-semibold'
                          : 'border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-text-muted hover:border-brand-blue/30'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-dark dark:text-brand-white">{BUDGET_LABELS[key]}</span>
                        <span className="text-xs text-text-muted">
                          {key === 'low' && 'Vuelos low-cost directos y hostales/hoteles 2* bien puntuados'}
                          {key === 'balanced' && 'Mejor equilibrio calidad-precio, hoteles 3/4* recomendados'}
                          {key === 'premium' && 'Vuelos con maleta facturada, hoteles céntricos 4* e itinerario VIP'}
                          {key === 'luxury' && 'Hoteles de gran lujo, traslados privados e itinerario exclusivo'}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        prefs.budget === key ? 'border-brand-blue bg-brand-blue' : 'border-brand-dark/20'
                      }`}>
                        {prefs.budget === key && <div className="w-2.5 h-2.5 rounded-full bg-brand-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 6: ESTILO DE VIAJE */}
            {step === 6 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Cómo te gusta viajar?</h3>
                  <p className="text-xs text-text-muted">Elige todas las etiquetas que describan tu estilo.</p>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {STYLE_OPTIONS.map((styleOpt) => {
                    const isSelected = prefs.style.includes(styleOpt);
                    return (
                      <SmartChip
                        key={styleOpt}
                        label={styleOpt}
                        isSelected={isSelected}
                        onClick={() => handleStyleToggle(styleOpt)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 7: RITMO */}
            {step === 7 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Qué ritmo prefieres para el viaje?</h3>
                  <p className="text-xs text-text-muted">Controlamos el espacio entre actividades para evitar el cansancio.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {PACE_OPTIONS.map((paceOpt) => (
                    <button
                      key={paceOpt.value}
                      type="button"
                      onClick={() => updatePrefs({ pace: paceOpt.value as any })}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        prefs.pace === paceOpt.value
                          ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 text-brand-dark dark:text-brand-white font-semibold'
                          : 'border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-text-muted hover:border-brand-blue/30'
                      }`}
                    >
                      <span className="text-sm font-bold text-brand-dark dark:text-brand-white">{paceOpt.label}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        prefs.pace === paceOpt.value ? 'border-brand-blue bg-brand-blue' : 'border-brand-dark/20'
                      }`}>
                        {prefs.pace === paceOpt.value && <div className="w-2.5 h-2.5 rounded-full bg-brand-white" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 8: RESTRICCIONES & CONVENIENCIAS */}
            {step === 8 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white">¿Alguna restricción o filtro?</h3>
                  <p className="text-xs text-text-muted font-sans">Marcamos prioridades clave para que la IA refine los resultados.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {RESTRICTION_OPTIONS.map((item) => {
                    const isSelected = prefs.restrictions.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleRestrictionToggle(item.id)}
                        className={`text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 text-brand-dark dark:text-brand-white font-medium'
                            : 'border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-text-muted hover:border-brand-blue/30'
                        }`}
                      >
                        <span className="text-xs font-semibold">{item.label}</span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSelected ? 'border-brand-blue bg-brand-blue' : 'border-brand-dark/20'
                        }`}>
                          {isSelected && <ArrowRight className="w-3 h-3 text-brand-white rotate-45" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 9: CONFIRMACION */}
            {step === 9 && (
              <div className="flex flex-col gap-4">
                <div className="text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-brand-teal/20 text-brand-teal flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-brand-dark dark:text-brand-white">¡Todo listo para crear tu viaje!</h3>
                  <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                    Ya tenemos todo lo que necesitamos. Pulsa el botón y te preparamos tu viaje personalizado.
                  </p>
                </div>

                {/* Summary Card */}
                <div className="bg-brand-white dark:bg-brand-dark/30 p-5 rounded-2xl border border-brand-dark/5 dark:border-brand-white/5 flex flex-col gap-3 text-sm">
                  <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2.5">
                    <span className="font-semibold text-text-muted">Destino:</span>
                    <span className="font-extrabold text-brand-blue uppercase">{prefs.destination || 'Recomendado por IA'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2.5">
                    <span className="font-semibold text-text-muted">Origen:</span>
                    <span className="font-bold text-brand-dark dark:text-brand-white">{prefs.origin}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2.5">
                    <span className="font-semibold text-text-muted">Fechas:</span>
                    <span className="font-bold text-brand-dark dark:text-brand-white">{prefs.dates.start} al {prefs.dates.end}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2.5">
                    <span className="font-semibold text-text-muted">Viajeros:</span>
                    <span className="font-bold text-brand-dark dark:text-brand-white">
                      {prefs.travelers.adults} {prefs.travelers.adults === 1 ? 'Adulto' : 'Adultos'}
                      {prefs.travelers.children > 0 && `, ${prefs.travelers.children} Niños`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2.5">
                    <span className="font-semibold text-text-muted">Presupuesto:</span>
                    <span className="font-bold text-brand-dark dark:text-brand-white">{BUDGET_LABELS[prefs.budget]}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-2.5">
                    <span className="font-semibold text-text-muted">Ritmo:</span>
                    <span className="font-bold text-brand-dark dark:text-brand-white capitalize">{prefs.pace}</span>
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="font-semibold text-text-muted">Estilo:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {prefs.style.map((s) => (
                        <span key={s} className="px-2.5 py-0.5 rounded-md bg-brand-blue/10 text-brand-blue text-[10px] font-bold uppercase">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Buttons Navigation */}
      <div className="flex items-center justify-between p-6 border-t border-brand-dark/10 dark:border-brand-white/5 bg-brand-white/10 dark:bg-brand-dark/20">
        <button
          type="button"
          onClick={prevStep}
          disabled={step === 1}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border border-brand-dark/10 dark:border-brand-white/10 text-text-muted transition-all select-none ${
            step === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-brand-dark/5 dark:hover:bg-brand-white/5 cursor-pointer'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Atrás</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-coral hover:from-brand-blue/90 hover:to-brand-coral/90 text-brand-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
        >
          {step === 9 ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generar Ruta Just Enjoy</span>
            </>
          ) : (
            <>
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
export default PreferenceWizard;
