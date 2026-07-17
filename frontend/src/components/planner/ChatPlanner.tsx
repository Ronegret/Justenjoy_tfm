'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Sparkles, Send, Plane, MapPin,
  Calendar as CalendarIcon, Users, Euro, Heart,
  ShieldAlert, Check, Plus, ArrowRight, RefreshCw
} from 'lucide-react';
import { TripPreferences } from '@/types/trip';
import { SmartChip } from '../shared/SmartChip';
import { todayISO } from '@/lib/dates';
import { budgetBounds, budgetTierFromAmount, BUDGET_TIER_LABELS, BudgetTier } from '@/lib/budget';

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

// Aviso temprano si escriben un país en vez de una ciudad: el motor busca
// vuelos a una CIUDAD concreta (aeropuerto), no a un país — un caso real
// escribiendo "Marruecos" acabó generando un código de aeropuerto inválido
// que coincidía por casualidad con uno real de otro continente. El backend
// ya maneja esto de forma segura (ver n8n/05_convertir_iata.js), pero avisar
// aquí evita gastar una búsqueda completa. Las mismas ciudades sugeridas
// están en COUNTRY_TO_CITIES de n8n/nodes-code/06_validar_output.js — si
// añades un país aquí, añádelo también allí.
// "Túnez" no está aquí a propósito: en español nombra tanto al país como a
// su capital, y el backend ya lo resuelve directo a la ciudad (Tunis).
const COUNTRY_TO_CITIES: Record<string, string[]> = {
  'marruecos': ['Marrakech', 'Casablanca'], 'morocco': ['Marrakech', 'Casablanca'],
  'francia': ['París', 'Lyon', 'Niza'], 'france': ['París', 'Lyon', 'Niza'],
  'italia': ['Roma', 'Milán', 'Venecia', 'Florencia'], 'italy': ['Roma', 'Milán', 'Venecia', 'Florencia'],
  'españa': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'], 'spain': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
  'portugal': ['Lisboa', 'Oporto'],
  'alemania': ['Berlín', 'Múnich', 'Fráncfort'], 'germany': ['Berlín', 'Múnich', 'Fráncfort'],
  'reino unido': ['Londres', 'Mánchester', 'Edimburgo'], 'united kingdom': ['Londres', 'Mánchester', 'Edimburgo'], 'inglaterra': ['Londres', 'Mánchester'],
  'grecia': ['Atenas'], 'greece': ['Atenas'],
  'turquía': ['Estambul'], 'turkey': ['Estambul'],
  'egipto': ['El Cairo'], 'egypt': ['El Cairo'],
  'japón': ['Tokio'], 'japan': ['Tokio'],
  'china': ['Pekín', 'Shanghái', 'Hong Kong'],
  'india': ['Bombay', 'Nueva Delhi'],
  'tailandia': ['Bangkok'], 'thailand': ['Bangkok'],
  'méxico': ['Ciudad de México', 'Cancún'], 'mexico': ['Ciudad de México', 'Cancún'],
  'brasil': ['São Paulo', 'Río de Janeiro'], 'brazil': ['São Paulo', 'Río de Janeiro'],
  'argentina': ['Buenos Aires'],
  'estados unidos': ['Nueva York', 'Los Ángeles', 'Miami', 'Chicago'], 'usa': ['Nueva York', 'Los Ángeles', 'Miami'], 'united states': ['Nueva York', 'Los Ángeles', 'Miami'],
  'canadá': ['Toronto', 'Montreal', 'Vancouver'], 'canada': ['Toronto', 'Montreal', 'Vancouver'],
  'australia': ['Sídney', 'Melbourne'],
  'holanda': ['Ámsterdam'], 'netherlands': ['Ámsterdam'], 'países bajos': ['Ámsterdam'],
  'bélgica': ['Bruselas'], 'belgium': ['Bruselas'],
  'suiza': ['Zúrich', 'Ginebra'], 'switzerland': ['Zúrich', 'Ginebra'],
  'austria': ['Viena'],
  'irlanda': ['Dublín'], 'ireland': ['Dublín'],
  'croacia': ['Zagreb'], 'croatia': ['Zagreb'],
  'noruega': ['Oslo'], 'norway': ['Oslo'],
  'suecia': ['Estocolmo'], 'sweden': ['Estocolmo'],
  'dinamarca': ['Copenhague'], 'denmark': ['Copenhague'],
  'polonia': ['Varsovia'], 'poland': ['Varsovia'],
  'sudáfrica': ['Ciudad del Cabo', 'Johannesburgo'], 'south africa': ['Ciudad del Cabo', 'Johannesburgo'],
  'perú': ['Lima'], 'peru': ['Lima'],
  'chile': ['Santiago'],
  'colombia': ['Bogotá'],
  'cuba': ['La Habana'],
  'jordania': ['Amán'], 'jordan': ['Amán'],
  'israel': ['Tel Aviv'],
  'emiratos árabes': ['Dubái', 'Abu Dabi'], 'uae': ['Dubái', 'Abu Dabi'],
  'indonesia': ['Bali']
};
function suggestedCitiesForCountry(value: string): string[] | null {
  return COUNTRY_TO_CITIES[value.trim().toLowerCase()] || null;
}

// Nombres de ciudad que existen (de forma conocida y frecuente) en más de un
// país — un texto ambiguo tipo "Valencia" o "Santiago" se resuelve siempre
// a la MISMA ciudad fija en la tabla de n8n, que podría no ser la que el
// viajero tenía en mente. No bloquea el envío, solo sugiere precisar.
const AMBIGUOUS_CITIES: Record<string, string> = {
  'valencia': 'Se asumirá Valencia (España). Si es Valencia (Venezuela), escribe "Valencia, Venezuela".',
  'córdoba': 'Se asumirá Córdoba (España). Si es Córdoba (Argentina), escribe "Córdoba, Argentina".',
  'cordoba': 'Se asumirá Córdoba (España). Si es Córdoba (Argentina), escribe "Córdoba, Argentina".',
  'guadalajara': 'Se asumirá Guadalajara (España). Si es Guadalajara (México), escribe "Guadalajara, México".',
  'santiago': 'Se asumirá Santiago (Chile). Si es Santiago de Compostela (España), escríbelo completo.',
  'san josé': 'Hay varias ciudades con este nombre — precisa el país, por ejemplo "San José, Costa Rica".',
  'cambridge': 'Hay una Cambridge en Reino Unido y otra en EE.UU. — precisa el país si no es la del Reino Unido.',
  'birmingham': 'Hay una Birmingham en Reino Unido y otra en EE.UU. — precisa el país si no es la del Reino Unido.',
  'toledo': 'Se asumirá Toledo (España). Si es Toledo (EE.UU.), escribe "Toledo, Ohio".'
};
function ambiguousCityHint(value: string): string | null {
  return AMBIGUOUS_CITIES[value.trim().toLowerCase()] || null;
}

const DATE_OPTIONS = [
  'Fechas fijas',
  'Fechas flexibles',
  'Fin de semana',
  'Puente',
  'Cualquier fecha barata'
];


// `value` es lo que se envía a n8n (activity_interests) y debe quedarse en
// inglés siempre: el motor compara contra categorías de Google Maps/Places,
// que vienen en inglés, y mezclar idiomas debilitaba el matching de
// actividades. `label` es solo para mostrar en la UI, en español.
const STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'beach', label: 'Playa' },
  { value: 'culture', label: 'Cultura' },
  { value: 'food', label: 'Gastronomía' },
  { value: 'relax', label: 'Relax' },
  { value: 'adventure', label: 'Aventura' },
  { value: 'museums', label: 'Museos' },
  { value: 'nightlife', label: 'Vida nocturna' },
  { value: 'shopping', label: 'Compras' },
  { value: 'nature', label: 'Naturaleza' },
  { value: 'photography', label: 'Fotografía' },
  { value: 'family', label: 'Familia' },
  { value: 'romantic', label: 'Romántico' },
  { value: 'local_experience', label: 'Experiencia local' },
  { value: 'low_walking', label: 'Sin caminar mucho' },
  { value: 'pet_friendly', label: 'Viaje con mascota' },
  { value: 'accessible', label: 'Accesible' }
];

const getStyleLabel = (value: string) => STYLE_OPTIONS.find((s) => s.value === value)?.label || value;

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

    if (currentStep < 8) {
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
      history.push({
        id: 10,
        sender: 'user',
        text: `Presupuesto: $${(preferences.budgetAmountUsd || 0).toLocaleString('en-US')} USD (${BUDGET_TIER_LABELS[preferences.budget]}).`,
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
        text: `Mis estilos preferidos son: ${preferences.style.map(getStyleLabel).join(', ')}.`,
        step: 6
      });
      history.push({
        id: 13,
        sender: 'agent',
        text: 'Por último, ¿hay algún detalle especial que deba tener en cuenta? Por ejemplo, si prefieres evitar escalas, quieres un hotel súper céntrico o evitar andar demasiado.',
        step: 7
      });
    }

    if (currentStep > 7) {
      history.push({
        id: 14,
        sender: 'user',
        text: preferences.restrictions.length > 0
          ? `Tengo los siguientes filtros: ${preferences.restrictions.map(getRestrictionLabel).join(', ')}.`
          : 'No tengo restricciones.',
        step: 7
      });
      history.push({
        id: 15,
        sender: 'agent',
        text: '¡De categoría! Ya tengo todo lo que necesito. Voy a ponerme a buscar las mejores combinaciones y a optimizar tu ruta. ¿Le damos caña a ese viaje?',
        step: 8
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
              {(destType === 'Ya tengo destino' || destType === 'Tengo varios en mente') && (() => {
                const countryCities = suggestedCitiesForCountry(inputDestination);
                const ambiguousHint = !countryCities ? ambiguousCityHint(inputDestination) : null;
                return (
                  <>
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
                    {countryCities && (
                      <div className="flex flex-col gap-1.5">
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-semibold flex items-start gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>&quot;{inputDestination}&quot; es un país, no una ciudad — necesitamos un aeropuerto concreto. Elige una ciudad:</span>
                        </p>
                        <div className="flex flex-wrap gap-1.5 pl-5">
                          {countryCities.map((city) => (
                            <SmartChip
                              key={city}
                              label={city}
                              isSelected={false}
                              onClick={() => {
                                setInputDestination(city);
                                updatePrefs({ destination: city });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    {ambiguousHint && (
                      <p className="text-[10px] text-text-muted font-medium flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-blue" />
                        <span>{ambiguousHint}</span>
                      </p>
                    )}
                  </>
                );
              })()}
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
          {currentStep === 5 && (() => {
            const bounds = budgetBounds(preferences);
            const amount = Math.min(Math.max(preferences.budgetAmountUsd || bounds.default, bounds.min), bounds.max);
            const tier = budgetTierFromAmount(amount, bounds);
            const setAmount = (value: number) => {
              const clamped = Math.min(Math.max(value, bounds.min), bounds.max);
              updatePrefs({ budgetAmountUsd: clamped, budget: budgetTierFromAmount(clamped, bounds) });
            };
            return (
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Presupuesto total del viaje:</span>

                <div className="flex flex-col gap-3 bg-brand-white dark:bg-brand-dark/40 p-4 rounded-xl border border-brand-dark/5">
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-brand-blue">${amount.toLocaleString('en-US')}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-brand-blue/10 text-brand-blue">
                      {BUDGET_TIER_LABELS[tier]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={bounds.min}
                    max={bounds.max}
                    step={10}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    aria-label="Presupuesto total del viaje en USD"
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-brand-blue bg-brand-dark/10 dark:bg-brand-white/15"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-text-muted uppercase tracking-wider">
                    <span>${bounds.min.toLocaleString('en-US')} mínimo realista</span>
                    <span>${bounds.max.toLocaleString('en-US')}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(BUDGET_TIER_LABELS) as BudgetTier[]).map((key) => {
                    const presetPosition = { low: 0.1, balanced: 0.4, premium: 0.65, luxury: 0.9 }[key];
                    const presetAmount = Math.round(bounds.min + (bounds.max - bounds.min) * presetPosition);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setAmount(presetAmount)}
                        className={`text-center py-2 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                          tier === key
                            ? 'border-brand-blue bg-brand-blue/5 text-brand-blue'
                            : 'border-brand-dark/10 dark:border-brand-white/10 text-text-muted hover:border-brand-blue/30'
                        }`}
                      >
                        {BUDGET_TIER_LABELS[key]}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* STEP 6: ESTILO DE VIAJE */}
          {currentStep === 6 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Intereses de viaje:</span>
              <div className="flex flex-wrap gap-1.5">
                {STYLE_OPTIONS.map((styleOpt) => {
                  const isSelected = preferences.style.includes(styleOpt.value);
                  return (
                    <SmartChip
                      key={styleOpt.value}
                      label={styleOpt.label}
                      isSelected={isSelected}
                      onClick={() => {
                        const updated = isSelected
                          ? preferences.style.filter(s => s !== styleOpt.value)
                          : [...preferences.style, styleOpt.value];
                        updatePrefs({ style: updated });
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 7: RESTRICCIONES & CONVENIENCIAS */}
          {currentStep === 7 && (
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

          {/* STEP 8: CONFIRMACION */}
          {currentStep === 8 && (
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
            <span className="text-[10px] font-semibold text-text-muted">PASO {currentStep} DE 8</span>
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-coral hover:from-brand-blue/90 hover:to-brand-coral/90 text-brand-white font-extrabold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer select-none"
            >
              {currentStep === 8 ? (
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
