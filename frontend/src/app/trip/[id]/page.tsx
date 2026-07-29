'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Compass, ShieldCheck, Check, Sparkles, Luggage,
  MapPin, CheckSquare, Plus, ExternalLink, Calendar,
  Building, Plane, Landmark, CreditCard, ChevronRight,
  User, Mail, Phone
} from 'lucide-react';
import { useTrips } from '@/context/TripContext';
import { downloadTripPdf } from '@/lib/tripPdf';
import { PrivateTripHero } from '@/components/trip/PrivateTripHero';
import { ItineraryTimeline } from '@/components/trip/ItineraryTimeline';
import { RefineTripPanel } from '@/components/trip/RefineTripPanel';
import { TripMapOverview } from '@/components/trip/TripMapOverview';
import { FlightCard } from '@/components/trip/FlightCard';
import { HotelCard } from '@/components/trip/HotelCard';
import { BudgetBreakdown } from '@/components/trip/BudgetBreakdown';
import { ShareTripPanel } from '@/components/trip/ShareTripPanel';
import { PracticalInfoCard } from '@/components/trip/PracticalInfoCard';
import { getFallbackDestinationImage } from '@/lib/destinationImages';
import { holderHasData, holderFullName } from '@/lib/holder';

interface TripPageProps {
  params: Promise<{ id: string }>;
}

export default function DynamicTripPage({ params }: TripPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const { currentTrip, setCurrentTripById, isLoading } = useTrips();

  // Interactive checklist state — todas empiezan sin marcar; las marca el
  // usuario a medida que completa cada tarea (antes 3 venían pre-marcadas
  // sin que el usuario hubiera hecho nada).
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const [checklist, setChecklist] = useState([
    { id: 'pass', label: 'Pasaporte / DNI en vigor', checked: false },
    { id: 'insurance', label: 'Seguro médico de viaje', checked: false },
    { id: 'hotel-res', label: 'Reserva de hotel confirmada', checked: false },
    { id: 'airport-transit', label: 'Transporte desde aeropuerto reservado', checked: false },
    { id: 'activity-tickets', label: 'Entradas para museos reservadas', checked: false },
    { id: 'luggage', label: 'Equipaje de cabina pesado y medido', checked: false },
    { id: 'charger', label: 'Adaptador de corriente universal', checked: false }
  ]);

  useEffect(() => {
    if (id) {
      setCurrentTripById(id);
    }
  }, [id, setCurrentTripById]);

  if (!currentTrip && !isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center gap-4">
        <Compass className="w-12 h-12 text-brand-blue animate-pulse" />
        <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white font-sans">Buscando tu cockpit de viaje...</h3>
        <p className="text-xs text-text-muted">Si has creado un viaje, se cargará en breves segundos.</p>
        <button
          onClick={() => router.push('/planner')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-brand-blue text-brand-white text-xs font-bold shadow-xs hover:bg-brand-blue/90"
        >
          Planificar otro viaje
        </button>
      </div>
    );
  }

  const trip = currentTrip!;

  // Titular/cliente del plan (opcional): viaja embebido en user_preferences. Solo
  // se muestra si el viajero rellenó algo en el paso del wizard. Mismo criterio
  // (recortado) que la captura y el envío, vía @/lib/holder.
  const holder = trip.user_preferences?.holder;
  const holderName = holderFullName(holder);
  const hasHolder = holderHasData(holder);

  const handleToggleChecklist = (checkId: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === checkId ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleDownloadPdf = async () => {
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
  };

  const getFrictionLabelColor = (label: string) => {
    switch (label) {
      case 'Baja': return 'text-brand-teal bg-brand-teal/10';
      case 'Media': return 'text-yellow-600 bg-yellow-500/10';
      default: return 'text-brand-coral bg-brand-coral/10';
    }
  };

  return (
    <div className="w-full flex-grow py-8 px-4 lg:px-8 bg-brand-cream/30 dark:bg-brand-dark/10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* EDITORIAL TRIP HERO HEADER */}
        <PrivateTripHero
          trip={trip}
          onShare={() => alert('¡Enlace de viaje copiado al portapapeles!')}
          onPdf={handleDownloadPdf}
          isGeneratingPdf={isGeneratingPdf}
        />

        {/* DETAILED DOUBLE COLUMN VIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT COLUMN: ITINERARY TIMELINE & DETAILED CARDS (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* Timeline day to day */}
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-black text-brand-dark dark:text-brand-white uppercase tracking-tight">
                  Itinerario detallado día a día
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Optimización horaria calculada para evitar aglomeraciones y maximizar comodidad.
                </p>
              </div>
              <ItineraryTimeline
                itinerary={trip.itinerary}
                fallbackImageUrl={trip.best_option.imageUrl || getFallbackDestinationImage(trip.best_option.destination)}
              />
            </div>

            {/* Refinamiento del plan (RUTA B de n8n): solo para planes reales de
                n8n, que llevan session_id. Los planes de fallback (mock/OpenAI)
                no son refinables, así que el control no se muestra. */}
            {trip.session_id && (
              <div className="mt-2">
                <RefineTripPanel />
              </div>
            )}

            {/* Transport & Lodging recommended */}
            <div className="flex flex-col gap-6 mt-4">
              <h3 className="text-lg font-black text-brand-dark dark:text-brand-white uppercase tracking-tight border-b border-brand-dark/5 dark:border-brand-white/5 pb-2">
                Billetes & Reservas Recomendadas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FlightCard flight={trip.flights[0]} />
                <HotelCard hotel={trip.hotels[0]} />
              </div>
            </div>

            {/* Budget Details breakdown */}
            <div className="mt-4">
              <h3 className="text-lg font-black text-brand-dark dark:text-brand-white uppercase tracking-tight border-b border-brand-dark/5 dark:border-brand-white/5 pb-2 mb-4">
                Estudio de Costes Estimados
              </h3>
              <BudgetBreakdown budget={trip.budget} />
            </div>

          </div>

          {/* RIGHT COLUMN: MAP PREVIEW, CHECKLISTS, TOOLS (1/3 width) */}
          <div className="flex flex-col gap-8">

            {/* Trip Map Overview */}
            <TripMapOverview itinerary={trip.itinerary} />

            {/* Info práctica real (visado/clima/transporte) — antes solo estaba
                en el PDF, no en la página del viaje. */}
            <PracticalInfoCard notes={trip.best_option.why_selected} />

            {/* Titular del plan (opcional) — solo si el viajero dejó sus datos. */}
            {hasHolder && (
              <div className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-brand-blue" />
                    <span>Titular del plan</span>
                  </h4>
                  <p className="text-[10px] text-text-muted mt-0.5">
                    Datos de contacto asociados a esta reserva.
                  </p>
                </div>
                <div className="flex flex-col gap-2.5 mt-1">
                  {holderName && (
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-dark dark:text-brand-white">
                      <User className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span>{holderName}</span>
                    </div>
                  )}
                  {holder!.phone && (
                    <a
                      href={`tel:${holder!.phone}`}
                      className="flex items-center gap-2.5 text-xs font-semibold text-brand-dark dark:text-brand-white hover:text-brand-blue transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span>{holder!.phone}</span>
                    </a>
                  )}
                  {holder!.email && (
                    <a
                      href={`mailto:${holder!.email}`}
                      className="flex items-center gap-2.5 text-xs font-semibold text-brand-dark dark:text-brand-white hover:text-brand-blue transition-colors break-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      <span>{holder!.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Checklist card */}
            <div className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-4">
              <div>
                <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-brand-blue" />
                  <span>Checklist de preparación</span>
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5">
                  Cosas obligatorias listas antes de ir al aeropuerto.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 mt-2">
                {checklist.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id)}
                    className="flex items-start gap-2.5 text-left text-xs font-semibold text-brand-dark dark:text-brand-white cursor-pointer group"
                  >
                    <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      item.checked
                        ? 'bg-brand-teal border-brand-teal text-brand-dark'
                        : 'border-brand-dark/20 dark:border-brand-white/20 group-hover:border-brand-blue/50'
                    }`}>
                      {item.checked && <Check className="w-3 h-3 stroke-[3px]" />}
                    </div>
                    <span className={item.checked ? 'line-through text-text-muted font-medium' : ''}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Share controls panel */}
            <ShareTripPanel
              url={`/trip/${trip.trip_id}`}
              onPdf={handleDownloadPdf}
              isGeneratingPdf={isGeneratingPdf}
            />

          </div>

        </div>

      </div>
    </div>
  );
}
