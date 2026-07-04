'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { TripData, TripPreferences } from '../types/trip';
import { GenerateTripResult } from '../types/planResult';
import { mockTrips } from '../data/mockTripData';

interface TripContextType {
  savedTrips: TripData[];
  currentTrip: TripData | null;
  isLoading: boolean;
  loadingProgress: number;
  loadingMessage: string;
  activeLoadingStep: number;
  generateTrip: (prefs: TripPreferences) => Promise<GenerateTripResult>;
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
  // Se hace en un efecto de montaje (no en un inicializador de useState) A
  // PROPÓSITO: así el HTML del servidor y la primera hidratación coinciden
  // (estado vacío) y el relleno desde localStorage ocurre TRAS montar, evitando
  // un hydration mismatch. Por eso set-state-in-effect no aplica a este patrón
  // SSR-safe y se desactiva de forma acotada y documentada.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('justenjoy_trips');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setSavedTrips(parsed);
          if (parsed.length > 0 && !currentTrip) {
            setCurrentTrip(parsed[0]);
          }
        } catch (e) {
          console.error('Error parsing stored trips', e);
        }
      } else {
        // Populate with defaults
        const defaults = Object.values(mockTrips);
        setSavedTrips(defaults);
        setCurrentTrip(defaults[0]);
        localStorage.setItem('justenjoy_trips', JSON.stringify(defaults));
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveTrip = (trip: TripData) => {
    setSavedTrips((prev) => {
      const exists = prev.some((t) => t.trip_id === trip.trip_id);
      let updated;
      if (exists) {
        updated = prev.map((t) => (t.trip_id === trip.trip_id ? trip : t));
      } else {
        updated = [trip, ...prev];
      }
      localStorage.setItem('justenjoy_trips', JSON.stringify(updated));
      return updated;
    });
  };

  const deleteTrip = (id: string) => {
    setSavedTrips((prev) => {
      const updated = prev.filter((t) => t.trip_id !== id);
      localStorage.setItem('justenjoy_trips', JSON.stringify(updated));
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
