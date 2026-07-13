'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Sparkles, Send, Plane, MapPin,
  Calendar as CalendarIcon, Users, Euro, Heart,
  Gauge, ShieldAlert, Check, Plus, ArrowRight, RefreshCw
} from 'lucide-react';
import { TripPreferences } from '@/types/trip';
import { SmartChip } from '../shared/SmartChip';
import { todayISO } from '@/lib/dates';

interface ChatPlannerProps {
  preferences: TripPreferences;
  onUpdatePreferences: (prefs: TripPreferences) => void;
  onComplete: (prefs: TripPreferences) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
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
  { value: 'relax', label: 'Relax (Pocos puntos de interés)' },
  { value: 'medium', label: 'Medio (Equilibrio perfecto)' },
  { value: 'intense', label: 'Intenso (Ver lo máximo posible)' },
  { value: 'all', label: '¡Quiero verlo todo!' }
] as const;

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

const getRestrictionLabel = (restriction: string) => {
  const match = RESTRICTION_OPTIONS.find((item) => item.id === restriction);
  return match?.label || restriction.replaceAll('_', ' ');
};

export const ChatPlanner: React.FC<ChatPlannerProps> = ({
  preferences,
  onUpdatePreferences,
  onComplete,
  currentStep,
  onStepChange
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [inputDestination, setInputDestination] = useState('');
  const [inputOrigin, setInputOrigin] = useState('Barcelona');
  const [destType, setDestType] = useState('Ya tengo destino');
  const [dateType, setDateType] = useState('Fechas flexibles');

  // Sync scroll on step change or dialogue expansion
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentStep]);

  const updatePrefs = (updated: Partial<TripPreferences>) => {
    const newPrefs = { ...preferences, ...updated };
    onUpdatePreferences(newPrefs);
  };

  const handleNext = () => {
    let nextPrefs = preferences;

    if (currentStep === 1) {
      if (destType === 'Ya tengo destino' && !inputDestination) {
        nextPrefs = { ...nextPrefs, destination: 'Lisboa' };
      } else if (inputDestination) {
        nextPrefs = { ...nextPrefs, destination: inputDestination };
      } else {
        nextPrefs = { ...nextPrefs, destination: 'Recomendado por IA' };
      }
      onUpdatePreferences(nextPrefs);
    }
    if (currentStep === 2) {
      nextPrefs = { ...nextPrefs, origin: inputOrigin };
      onUpdatePreferences(nextPrefs);
    }

    if (currentStep < 9) {
      onStepChange(currentStep + 1);
    } else {
      onComplete(nextPrefs);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  // Compile full dialogue history dynamically
  const getDialogueHistory = () => {
    const history = [
      {
        id: 1,
        sender: 'agent',
        text: '¡Buenas! Qué alegría tenerte por aquí. Soy tu compi de viajes de JUST ENJOY. Cuéntame, ¿a dónde nos vamos hoy? Dime tu destino soñado o elige una de nuestras escapadas rápidas.',
        step: 1
      }
    ];

    if (currentStep > 1) {
      history.push({
        id: 2,
        sender: 'user',
        text: preferences.destination ? `Quiero viajar a ${preferences.destination}.` : 'Recomiéndame un destino.',
        step: 1
      });
      history.push({
        id: 3,
        sender: 'agent',
        text: '¡Me encanta la idea! Para buscarte los mejores vuelos y ahorrarte escalas pesadas, ¿de qué ciudad o aeropuerto salimos?',
        step: 2
      });
    }

    if (currentStep > 2) {
      history.push({
        id: 4,
        sender: 'user',
        text: `Saldré desde ${preferences.origin || 'Barcelona'}.`,
        step: 2
      });
      history.push({
        id: 5,
        sender: 'agent',
        text: '¡Apuntado! Y ahora, ¿qué fechas tienes en mente para escaparte? Dime también si tienes flexibilidad de días, que a veces hay ofertones si nos movemos un poco.',
        step: 3
      });
    }

    if (currentStep > 3) {
      history.push({
        id: 6,
        sender: 'user',
        text: `Viajaré del ${preferences.dates.start} al ${preferences.dates.end} (${preferences.dates.flexible ? 'Fechas flexibles' : 'Fechas fijas'}).`,
        step: 3
      });
      history.push({
        id: 7,
        sender: 'agent',
        text: 'Perfecto. Oye, ¿y quiénes nos unimos al plan? Cuéntame cuántos adultos y peques vais a ser en esta aventura.',
        step: 4
      });
    }

    if (currentStep > 4) {
      history.push({
        id: 8,
        sender: 'user',
        text: `Viajamos ${preferences.travelers.adults} adultos${preferences.travelers.children > 0 ? ` y ${preferences.travelers.children} niños` : ''}.`,
        step: 4
      });
      history.push({
        id: 9,
        sender: 'agent',
        text: '¡Buen grupo! Una pregunta importante para cuidar tu bolsillo: ¿qué presupuesto tienes pensado? Así busco los hoteles con mejor relación calidad-precio para ti.',
        step: 5
      });
    }

    if (currentStep > 5) {
      const budgets = { low: 'Low Cost', balanced: 'Equilibrado', premium: 'Premium', luxury: 'Lujo Inteligente' };
      history.push({
        id: 10,
        sender: 'user',
        text: `Presupuesto: ${budgets[preferences.budget]}.`,
        step: 5
      });
      history.push({
        id: 11,
        sender: 'agent',
        text: '¡Genial! Y cuéntame, ¿qué plan te apetece más? ¿Playa, cultura, gastronomía...? Elige los estilos de viaje que más vayan contigo para que diseñe algo a tu medida.',
        step: 6
      });
    }

    if (currentStep > 6) {
      history.push({
        id: 12,
        sender: 'user',
        text: `Mis estilos preferidos son: ${preferences.style.join(', ')}.`,
        step: 6
      });
      history.push({
        id: 13,
        sender: 'agent',
        text: '¡Menudo planazo se está quedando! ¿Y a qué ritmo prefieres que nos movamos? ¿Algo tranquilo para disfrutar relajados o a tope para no perdernos nada?',
        step: 7
      });
    }

    if (currentStep > 7) {
      const paces = { relax: 'Relax', medium: 'Medio', intense: 'Intenso', all: 'Verlo todo' };
      history.push({
        id: 14,
        sender: 'user',
        text: `Prefiero un ritmo: ${paces[preferences.pace]}.`,
        step: 7
      });
      history.push({
        id: 15,
        sender: 'agent',
        text: 'Por último, ¿hay algún detalle especial que deba tener en cuenta? Por ejemplo, si prefieres evitar escalas, quieres un hotel súper céntrico o evitar andar demasiado.',
        step: 8
      });
    }

    if (currentStep > 8) {
      history.push({
        id: 16,
        sender: 'user',
        text: preferences.restrictions.length > 0
          ? `Tengo los siguientes filtros: ${preferences.restrictions.map(getRestrictionLabel).join(', ')}.`
          : 'No tengo restricciones.',
        step: 8
      });
      history.push({
        id: 17,
        sender: 'agent',
        text: '¡De categoría! Ya tengo todo lo que necesito. Voy a ponerme a buscar las mejores combinaciones y a optimizar tu ruta. ¿Le damos caña a ese viaje?',
        step: 9
      });
    }

    return history;
  };

  const dialogue = getDialogueHistory();

  return (
    <div className="w-full flex flex-col h-[580px] sm:h-[650px] bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl overflow-hidden shadow-md">

      {/* Header */}
      <div className="p-5 border-b border-brand-dark/5 dark:border-brand-white/5 flex items-center justify-between bg-brand-cream/50 dark:bg-brand-dark/30 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-coral flex items-center justify-center text-brand-white shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-brand-dark dark:text-brand-white uppercase tracking-tight">Concierge Inteligente</h3>
            <p className="text-[10px] text-brand-teal flex items-center gap-1 font-extrabold uppercase mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
              <span>Planificación Conversacional</span>
            </p>
          </div>
        </div>

        {currentStep > 1 && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-[10px] font-bold text-text-muted hover:text-brand-dark dark:hover:text-brand-white transition-colors uppercase cursor-pointer"
          >
            <span>Atrás</span>
          </button>
        )}
      </div>

      {/* Chat scroll area (only messages) */}
      <div
        ref={scrollContainerRef}
        className="flex-grow p-6 overflow-y-auto flex flex-col gap-5"
      >
        <AnimatePresence initial={false}>
          {dialogue.map((msg) => {
            const isAgent = msg.sender === 'agent';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${isAgent ? 'justify-start' : 'justify-end'}`}
              >
                <div className={`flex gap-3 max-w-[80%] ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                  {isAgent && (
                    <div className="w-7 h-7 rounded-full bg-brand-blue/10 text-brand-blue border border-brand-blue/20 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isAgent
                      ? 'bg-brand-cream/80 dark:bg-brand-dark/70 border border-brand-dark/5 dark:border-brand-white/5 text-brand-dark dark:text-brand-white rounded-tl-xs'
                      : 'bg-brand-blue text-brand-white rounded-tr-xs shadow-xs'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* INPUT INTERACTION WIDGETS DOCKED AT THE BOTTOM */}
      <div className="p-5 border-t border-brand-dark/5 dark:border-brand-white/5 bg-brand-cream/20 dark:bg-brand-dark/30 shrink-0">
        <motion.div
          key={`widget-${currentStep}`}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-full flex flex-col gap-4"
        >
          {/* STEP 1: DESTINO */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Elige tu Destino:</span>
              <div className="flex flex-wrap gap-1.5">
                {DEST_OPTIONS.map((opt) => (
                  <SmartChip
                    key={opt}
                    label={opt}
                    isSelected={destType === opt}
                    onClick={() => {
                      setDestType(opt);
                      if (opt === 'Quiero el más barato') setInputDestination('El más barato');
                      else if (opt === 'Quiero el mejor equilibrio') setInputDestination('El mejor equilibrio');
                      else if (opt === 'Recomiéndame uno') setInputDestination('Recomiéndame uno');
                      else setInputDestination('');
                    }}
                  />
                ))}
              </div>
              {(destType === 'Ya tengo destino' || destType === 'Tengo varios en mente') && (
                <input
                  type="text"
                  placeholder="Ej. Lisboa, Roma, París..."
                  value={inputDestination}
                  onChange={(e) => {
                    setInputDestination(e.target.value);
                    updatePrefs({ destination: e.target.value });
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue"
                />
              )}
            </div>
          )}

          {/* STEP 2: ORIGEN */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">¿Desde dónde vuelas?</span>
              <input
                type="text"
                placeholder="Ej. Barcelona, Madrid, Valencia..."
                value={inputOrigin}
                onChange={(e) => {
                  setInputOrigin(e.target.value);
                  updatePrefs({ origin: e.target.value });
                }}
                className="w-full px-4 py-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue"
              />
            </div>
          )}

          {/* STEP 3: FECHAS */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Fechas de viaje:</span>
              <div className="flex flex-wrap gap-1.5 mb-1">
                {DATE_OPTIONS.map((opt) => (
                  <SmartChip
                    key={opt}
                    label={opt}
                    isSelected={dateType === opt}
                    onClick={() => {
                      setDateType(opt);
                      updatePrefs({ dates: { ...preferences.dates, flexible: opt !== 'Fechas fijas' } });
                    }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  value={preferences.dates.start}
                  min={todayISO()}
                  onChange={(e) => updatePrefs({ dates: { ...preferences.dates, start: e.target.value } })}
                  className="px-3.5 py-2.5 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white"
                />
                <input
                  type="date"
                  value={preferences.dates.end}
                  min={preferences.dates.start || todayISO()}
                  onChange={(e) => updatePrefs({ dates: { ...preferences.dates, end: e.target.value } })}
                  className="px-3.5 py-2.5 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white"
                />
              </div>
            </div>
          )}

          {/* STEP 4: PERSONAS */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Número de Viajeros:</span>
              <div className="flex flex-col gap-3 bg-brand-white dark:bg-brand-dark/40 p-4 rounded-xl border border-brand-dark/5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-brand-dark dark:text-brand-white">Adultos</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updatePrefs({ travelers: { ...preferences.travelers, adults: Math.max(1, preferences.travelers.adults - 1) } })} className="w-8 h-8 rounded-full border border-brand-dark/10 flex items-center justify-center text-xs font-extrabold">-</button>
                    <span className="text-xs font-bold w-4 text-center">{preferences.travelers.adults}</span>
                    <button onClick={() => updatePrefs({ travelers: { ...preferences.travelers, adults: preferences.travelers.adults + 1 } })} className="w-8 h-8 rounded-full border border-brand-dark/10 flex items-center justify-center text-xs font-extrabold">+</button>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-brand-dark/5 pt-3">
                  <span className="text-xs font-bold text-brand-dark dark:text-brand-white">Niños</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => updatePrefs({ travelers: { ...preferences.travelers, children: Math.max(0, preferences.travelers.children - 1) } })} className="w-8 h-8 rounded-full border border-brand-dark/10 flex items-center justify-center text-xs font-extrabold">-</button>
                    <span className="text-xs font-bold w-4 text-center">{preferences.travelers.children}</span>
                    <button onClick={() => updatePrefs({ travelers: { ...preferences.travelers, children: preferences.travelers.children + 1 } })} className="w-8 h-8 rounded-full border border-brand-dark/10 flex items-center justify-center text-xs font-extrabold">+</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PRESUPUESTO */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Categoría de Presupuesto:</span>
              <div className="flex flex-col gap-2">
                {(Object.keys(BUDGET_LABELS) as Array<keyof typeof BUDGET_LABELS>).map((key) => (
                  <button
                    key={key}
                    onClick={() => updatePrefs({ budget: key })}
                    className={`text-left p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      preferences.budget === key
                        ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/15 text-brand-dark dark:text-brand-white'
                        : 'border-brand-dark/5 dark:border-brand-white/5 bg-brand-white dark:bg-brand-dark/30 text-text-muted'
                    }`}
                  >
                    <span>{BUDGET_LABELS[key]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: ESTILO DE VIAJE */}
          {currentStep === 6 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Intereses de viaje:</span>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_OPTIONS.map((styleOpt) => {
                  const isSelected = preferences.style.includes(styleOpt);
                  return (
                    <SmartChip
                      key={styleOpt}
                      label={styleOpt}
                      isSelected={isSelected}
                      onClick={() => {
                        const updated = isSelected
                          ? preferences.style.filter(s => s !== styleOpt)
                          : [...preferences.style, styleOpt];
                        updatePrefs({ style: updated });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: RITMO */}
          {currentStep === 7 && (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Ritmo de itinerario:</span>
              <div className="flex flex-col gap-2">
                {PACE_OPTIONS.map((paceOpt) => (
                  <button
                    key={paceOpt.value}
                    onClick={() => updatePrefs({ pace: paceOpt.value })}
                    className={`text-left p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                      preferences.pace === paceOpt.value
                        ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/15 text-brand-dark dark:text-brand-white'
                        : 'border-brand-dark/5 dark:border-brand-white/5 bg-brand-white dark:bg-brand-dark/30 text-text-muted'
                    }`}
                  >
                    <span>{paceOpt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 8: RESTRICCIONES & CONVENIENCIAS */}
          {currentStep === 8 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filtros y Restricciones:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {RESTRICTION_OPTIONS.map((item) => {
                  const isSelected = preferences.restrictions.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        const updated = isSelected
                          ? preferences.restrictions.filter(r => r !== item.id)
                          : [...preferences.restrictions, item.id];
                        updatePrefs({ restrictions: updated });
                      }}
                      className={`text-left p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/15 text-brand-dark dark:text-brand-white'
                          : 'border-brand-dark/5 dark:border-brand-white/5 bg-brand-white dark:bg-brand-dark/30 text-text-muted'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 9: CONFIRMACION */}
          {currentStep === 9 && (
            <div className="flex flex-col gap-3 text-center py-2">
              <div className="w-10 h-10 rounded-full bg-brand-teal/20 text-brand-teal flex items-center justify-center mx-auto">
                <Check className="w-5 h-5 stroke-[3px]" />
              </div>
              <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase">¡Todo listo para la IA!</h4>
              <p className="text-[10px] text-text-muted max-w-xs mx-auto leading-relaxed">
                Toda la información ha sido recopilada. Haz clic a continuación para que la IA genere tu viaje personalizado.
              </p>
            </div>
          )}

          {/* Actions button footer */}
          <div className="flex items-center justify-between border-t border-brand-dark/5 dark:border-brand-white/5 pt-4">
            <span className="text-[10px] font-semibold text-text-muted">PASO {currentStep} DE 9</span>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-coral hover:from-brand-blue/90 hover:to-brand-coral/90 text-brand-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
            >
              {currentStep === 9 ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Ruta Just Enjoy</span>
                </>
              ) : (
                <>
                  <span>Siguiente paso</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default ChatPlanner;
