'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TripData, TripPreferences } from '../types/trip';
import { GenerateTripResult, RefineTripResult } from '../types/planResult';
import { scanForSpecialCategoryData } from '../lib/sensitiveData';
import { mockTrips } from '../data/mockTripData';

interface TripContextType {
  savedTrips: TripData[];
  currentTrip: TripData | null;
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  activeLoadingStep: number;
  generateTrip: (prefs: TripPreferences) => Promise<GenerateTripResult>;
  refineTrip: (feedbackText: string) => Promise<RefineTripResult>;
  saveTrip: (trip: TripData) => void;
  deleteTrip: (id: string) => void;
  setCurrentTripById: (id: string) => boolean;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

const LOADING_STEPS = [
  { message: 'Analizando vuelos disponibles...', category: 'flights' },
  { message: 'Comparando aerolíneas y horarios...', category: 'flights' },
  { message: 'Buscando alojamientos bien ubicados...', category: 'hotels' },
  { message: 'Calculando tiempos de traslado...', category: 'transport' },
  { message: 'Revisando actividades y entradas...', category: 'activities' },
  { message: 'Comprobando horarios de museos...', category: 'activities' },
  { message: 'Buscando experiencias locales...', category: 'events' },
  { message: 'Priorizando precio, tiempo y comodidad...', category: 'budget' },
  { message: 'Generando Ruta Óptima Justificada...', category: 'final' }
];

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedTrips, setSavedTrips] = useState<TripData[]>([]);
  const [currentTrip, setCurrentTrip] = useState<TripData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [activeLoadingStep, setActiveLoadingStep] = useState(0);

  // Initialize trips from localstorage or load default mocks.
  // Efecto de montaje (no inicializador de useState) A PROPÓSITO: el HTML del
  // servidor y la primera hidratación coinciden (estado vacío) y el relleno desde
  // localStorage ocurre TRAS montar, evitando un hydration mismatch. Los disables
  // por línea (set-state-in-effect) y el de exhaustive-deps documentan que es
  // intencional y SSR-safe.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('justenjoy_trips');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSavedTrips(parsed);
          if (parsed.length > 0 && !currentTrip) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCurrentTrip(parsed[0]);
          }
        } catch (e) {
          console.error('Error parsing stored trips', e);
        }
      } else {
        // Populate with defaults
        const defaults = Object.values(mockTrips);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSavedTrips(defaults);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCurrentTrip(defaults[0]);
        localStorage.setItem('justenjoy_trips', JSON.stringify(defaults));
      }
    }
  }, []);

  // El titular (holder) es PII: se conserva en memoria (para mostrarlo durante la
  // sesión), pero NO se serializa a localStorage — su fuente de verdad es la tabla
  // plan_holders del lado servidor. Así no queda PII en claro en el navegador.
  const stripHolderForStorage = (trips: TripData[]) =>
    trips.map((t) =>
      t.user_preferences?.holder
        ? { ...t, user_preferences: { ...t.user_preferences, holder: undefined } }
        : t
    );

  const saveTrip = (trip: TripData) => {
    setSavedTrips((prev) => {
      const exists = prev.some((t) => t.trip_id === trip.trip_id);
      let updated;
      if (exists) {
        updated = prev.map((t) => (t.trip_id === trip.trip_id ? trip : t));
      } else {
        updated = [trip, ...prev];
      }
      localStorage.setItem('justenjoy_trips', JSON.stringify(stripHolderForStorage(updated)));
      return updated;
    });
  };

  const deleteTrip = (id: string) => {
    setSavedTrips((prev) => {
      const updated = prev.filter((t) => t.trip_id !== id);
      localStorage.setItem('justenjoy_trips', JSON.stringify(stripHolderForStorage(updated)));
      return updated;
    });
    if (currentTrip?.trip_id === id) {
      setCurrentTrip(null);
    }
  };

  const setCurrentTripById = (id: string): boolean => {
    const found = savedTrips.find((t) => t.trip_id === id) || mockTrips[id];
    if (found) {
      setCurrentTrip(found);
      return true;
    }
    return false;
  };

  // Simulates or calls n8n webhook
  const generateTrip = async (prefs: TripPreferences): Promise<GenerateTripResult> => {
    setIsLoading(true);
    setLoadingProgress(0);
    setActiveLoadingStep(0);
    setLoadingMessage(LOADING_STEPS[0].message);

    let customizedTrip: TripData | null = null;
    let generatedId = '';

    try {
      // 1. Fetch from Next.js API route (which handles n8n integration or fallback)
      const response = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(prefs),
      });

      if (!response.ok) {
        throw new Error('API returned non-ok status');
      }

      const data = await response.json();

      // n8n no pudo completar el plan: no fingimos un viaje, devolvemos sus avisos
      // para que el planner los muestre y el usuario ajuste la entrada.
      if (data && data.status === 'needs_user_input') {
        setIsLoading(false);
        return { status: 'needs_user_input', warnings: Array.isArray(data.warnings) ? data.warnings : [] };
      }

      customizedTrip = data;
      generatedId = customizedTrip?.trip_id || '';
    } catch (error) {
      console.warn('API call failed or n8n not connected, falling back to local simulation:', error);

      // Fallback: Dynamic selection of mock templates based on preferences
      let matchedTemplateId = 'justenjoy-lisbon-2026';
      const dest = prefs.destination.toLowerCase();

      if (dest.includes('porto') || dest.includes('oport') || prefs.budget === 'low') {
        matchedTemplateId = 'justenjoy-oporto-cheapest';
      } else if (dest.includes('roma') || dest.includes('rome') || prefs.budget === 'premium' || prefs.budget === 'luxury') {
        matchedTemplateId = 'justenjoy-roma-premium';
      }

      const baseTemplate = mockTrips[matchedTemplateId] || mockTrips['justenjoy-lisbon-2026'];

      // Customize template with actual user input
      generatedId = `justenjoy-${baseTemplate.best_option.destination.toLowerCase()}-${Date.now()}`;
      customizedTrip = {
        ...baseTemplate,
        trip_id: generatedId,
        user_preferences: {
          ...prefs,
          destination: baseTemplate.best_option.destination
        },
        share: {
          ...baseTemplate.share,
          private_url: `/trip/${generatedId}`
        }
      };
    }

    // Simulate n8n hyper-automation processing times (keeps the beautiful UI steps loading)
    const stepDuration = 500; // ms per step
    for (let i = 0; i < LOADING_STEPS.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
      const progress = Math.round(((i + 1) / LOADING_STEPS.length) * 100);
      setLoadingProgress(progress);
      setActiveLoadingStep(i);
      if (i < LOADING_STEPS.length - 1) {
        setLoadingMessage(LOADING_STEPS[i + 1].message);
      }
    }

    // Save customized trip
    if (customizedTrip) {
      saveTrip(customizedTrip);
      setCurrentTrip(customizedTrip);
    }
    setIsLoading(false);
    return { status: 'ok', tripId: generatedId };
  };

  // Refina el plan ACTUAL (RUTA B de n8n) a partir de una instrucción en texto
  // libre, en vez de replanificar desde cero. Solo es posible para planes reales
  // de n8n (los que tienen `session_id`); el resto no son refinables. El estado
  // de carga lo gestiona el propio panel de refinamiento (no toca `isLoading`
  // global, que dispara el overlay a pantalla completa del planner).
  const refineTrip = async (feedbackText: string): Promise<RefineTripResult> => {
    const trip = currentTrip;
    if (!trip || !trip.session_id) {
      // No refinable (plan de fallback o sin sesión de n8n): el control no
      // debería haberse mostrado. Se conserva el plan actual.
      return { status: 'session_expired' };
    }
    // Planes guardados antes de que existiera el token de propiedad: la ruta los
    // rechazaría igualmente, así que nos ahorramos la ida y vuelta.
    if (!trip.refine_token) {
      return { status: 'not_refinable' };
    }

    // Pre-chequeo de categorías especiales (RGPD art. 9 — hallazgo #4) en cliente:
    // evita la ida y vuelta a la red cuando el texto revela datos sensibles. La
    // ruta /api/refine-trip lo vuelve a comprobar de forma autoritativa (mismo
    // `lib/sensitiveData`), así que esto es solo UX; el control real es server-side.
    const scan = scanForSpecialCategoryData(feedbackText);
    if (scan.hit) {
      return { status: 'blocked_sensitive', categories: scan.categories };
    }

    try {
      // El titular (holder) es PII de contacto que NO interviene en el
      // refinamiento (solo se usan origen/destino/fechas/viajeros para mapear).
      // Se recorta antes de enviar, igual que bodyForLlm en /api/plan-trip.
      const prefsForRefine = { ...trip.user_preferences };
      delete prefsForRefine.holder;

      const response = await fetch('/api/refine-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: trip.session_id,
          // Acredita que este plan es nuestro; sin él la ruta responde
          // `not_refinable` (ver lib/refineToken).
          refine_token: trip.refine_token,
          feedback_text: feedbackText,
          user_preferences: prefsForRefine
        })
      });

      const data = await response.json();

      // La ruta usa un discriminador `status` explícito para todas las respuestas:
      // 'ok' (con `trip`), 'needs_user_input', 'session_expired', 'blocked_sensitive'
      // o 'error'.
      if (data?.status === 'session_expired') {
        return { status: 'session_expired' };
      }
      if (data?.status === 'not_refinable') {
        return { status: 'not_refinable' };
      }
      if (data?.status === 'blocked_sensitive') {
        return { status: 'blocked_sensitive', categories: Array.isArray(data.categories) ? data.categories : [] };
      }
      if (data?.status === 'needs_user_input') {
        return { status: 'needs_user_input', warnings: Array.isArray(data.warnings) ? data.warnings : [] };
      }
      if (data?.status !== 'ok' || !data.trip || !response.ok) {
        return { status: 'error', message: data?.message || 'No se pudo refinar el plan.' };
      }

      // Guardarraíl de no-regresión. El refinamiento re-ejecuta SOLO los pasos
      // afectados, así que si la respuesta pierde bloques que el plan actual sí
      // tenía (p. ej. vuelve solo con hoteles y sin vuelos), no es un plan mejor:
      // es una respuesta incompleta. Como `saveTrip` sobrescribe en sitio y no hay
      // deshacer, se descarta y se conserva el plan bueno.
      const refinedTrip = data.trip as TripData;
      const lost = (['flights', 'hotels', 'itinerary'] as const).filter(
        (block) => (trip[block]?.length ?? 0) > 0 && (refinedTrip[block]?.length ?? 0) === 0
      );
      if (lost.length > 0) {
        console.warn('refineTrip: respuesta incompleta, se conserva el plan actual. Faltan:', lost.join(', '));
        return {
          status: 'error',
          message:
            'El ajuste llegó incompleto y habría empeorado tu plan, así que lo hemos descartado. Tu plan sigue intacto: prueba a pedir el cambio de otra forma.'
        };
      }

      // Éxito: reemplaza el viaje mostrado EN SITIO (mismo trip_id/session_id) en
      // vez de crear uno nuevo.
      const refined: TripData = {
        ...refinedTrip,
        trip_id: trip.trip_id,
        session_id: trip.session_id,
        // El plan refinado se mapea igual que el original y no trae token: se
        // conserva el del plan actual para poder seguir refinando.
        refine_token: trip.refine_token,
        share: { ...refinedTrip.share, private_url: `/trip/${trip.trip_id}` }
      };
      // El titular (PII) no se serializa ni lo devuelve n8n: se conserva el del
      // plan actual para no perderlo al refinar.
      if (trip.user_preferences?.holder && refined.user_preferences) {
        refined.user_preferences = { ...refined.user_preferences, holder: trip.user_preferences.holder };
      }

      saveTrip(refined);
      setCurrentTrip(refined);
      return { status: 'ok', tripId: refined.trip_id };
    } catch (error) {
      console.warn('refineTrip failed:', error);
      return { status: 'error', message: 'No se pudo contactar con el servicio de refinamiento. Inténtalo de nuevo.' };
    }
  };

  return (
    <TripContext.Provider
      value={{
        savedTrips,
        currentTrip,
        isLoading,
        loadingProgress,
        loadingMessage,
        activeLoadingStep,
        generateTrip,
        refineTrip,
        saveTrip,
        deleteTrip,
        setCurrentTripById
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export const useTrips = () => {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
};
