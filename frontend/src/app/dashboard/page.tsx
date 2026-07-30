'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Compass, MapPin, CheckSquare, Smile, Search, X
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTrips } from '@/context/TripContext';
import { DashboardTripCard } from '@/components/dashboard/DashboardTripCard';
import { holderFullName } from '@/lib/holder';
import { normalizeLoose } from '@/lib/text';

// Panel de estado vacío reutilizable: mismo contenedor para "no hay viajes" y
// "la búsqueda no tiene resultados", que antes eran dos bloques de JSX casi
// idénticos copiados. Solo cambian icono, textos y la acción del botón.
interface EmptyStateProps {
  icon: LucideIcon;
  animateIcon?: boolean;
  title: string;
  description: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
}

function EmptyState({ icon: Icon, animateIcon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/30 rounded-3xl gap-4">
      <Icon aria-hidden className={`w-12 h-12 text-brand-blue/30${animateIcon ? ' animate-pulse' : ''}`} />
      <div>
        <h3 className="text-base font-extrabold text-brand-dark dark:text-brand-white uppercase">{title}</h3>
        <p className="text-xs text-text-muted mt-1 max-w-xs leading-relaxed">{description}</p>
      </div>
      <button
        onClick={onAction}
        className="px-5 py-2.5 rounded-xl bg-brand-blue text-brand-white text-xs font-bold shadow-xs hover:bg-brand-blue/90 cursor-pointer"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { savedTrips, deleteTrip } = useTrips();
  const [query, setQuery] = useState('');
  // Coincidencias por CLIENTE resueltas en el servidor (sobre `plan_holders`), para
  // que la búsqueda por nombre/teléfono/email funcione **tras recargar** (cuando el
  // `holder` ya no está en memoria). `null` = sin búsqueda activa / no resuelta. El
  // endpoint devuelve solo `session_id` (== `trip_id`); nunca PII. Ver spec
  // 2026-07-23-buscador-clientes-servidor.
  const [serverMatchIds, setServerMatchIds] = useState<Set<string> | null>(null);

  // Consulta al endpoint server-side (debounced) cuando cambia la búsqueda. Es una
  // MEJORA no bloqueante: si falla (401/503/red), la búsqueda por destino/título y
  // por titular en memoria (misma sesión) sigue funcionando en cliente.
  useEffect(() => {
    const q = query.trim();
    // Cada plan viaja con su firma de propiedad: el endpoint solo consulta los que
    // acredita el `refine_token` emitido para este usuario (ver lib/refineToken). Los
    // planes de fallback y los guardados antes del token no la llevan y quedan fuera de
    // la búsqueda persistente; siguen encontrándose por destino y, en la misma sesión,
    // por titular en memoria.
    const sessions = savedTrips
      .filter((t) => t.session_id && t.refine_token)
      .map((t) => ({ session_id: t.session_id, refine_token: t.refine_token }));
    if (!q || sessions.length === 0) {
      // Limpiar las coincidencias del servidor al vaciar la búsqueda es intencional
      // (evita falsos positivos de una query anterior). El memo de filtrado ignora
      // serverMatchIds cuando la query está vacía, así que no cascadea render útil.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setServerMatchIds(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/holders/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessions, query: q }),
          signal: controller.signal,
        });
        if (!res.ok) {
          // Hay que LIMPIAR, no solo salir: si no, las coincidencias de la consulta
          // anterior siguen mostrándose (y contando en las estadísticas) para la
          // consulta nueva, que es un falso positivo silencioso.
          setServerMatchIds(null);
          return;
        }
        const data = await res.json();
        setServerMatchIds(new Set(Array.isArray(data?.matching_session_ids) ? data.matching_session_ids : []));
      } catch {
        // Abort (nueva pulsación) o error de red: se ignora; el filtro en cliente sigue.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, savedTrips]);

  // Filtra los planes por los datos del titular/cliente (nombre, apellidos,
  // nombre completo, teléfono, email) y también por destino/título del viaje, en
  // una sola caja. Con la búsqueda vacía se muestran todos. Los planes sin
  // titular solo pueden casar por destino/título. Se compara CAMPO A CAMPO (no
  // un haystack unido) para no producir coincidencias falsas cruzando el límite
  // entre dos campos, y con `normalizeLoose` (sin separadores) para que el
  // formato no impida la coincidencia ("jose perez" casa "José Pérez";
  // "600123456" casa "+34 600 123 456").
  const filteredTrips = useMemo(() => {
    const q = normalizeLoose(query.trim());
    if (!q) return savedTrips;
    return savedTrips.filter((trip) => {
      // Coincidencia persistente por cliente resuelta en el servidor (sobre
      // `plan_holders`): funciona tras recargar, cuando el `holder` ya no está en
      // memoria. Se une (OR) con el filtro en cliente de abajo. El conjunto viene
      // indexado por `session_id` (que en los planes de n8n coincide con `trip_id`,
      // pero se compara por el campo explícito).
      if (trip.session_id && serverMatchIds?.has(trip.session_id)) return true;
      const holder = trip.user_preferences.holder;
      // `holderFullName` cubre nombre y apellidos: con matching laxo, cualquier
      // consulta que casaría uno de ellos casa también el nombre completo (los
      // contiene como subcadena), así que no se listan por separado. El titular en
      // memoria solo existe en la sesión en que se generó el plan; destino/título
      // siempre están disponibles en cliente.
      const fields = [
        holderFullName(holder),
        holder?.phone,
        holder?.email,
        trip.best_option.destination,
        trip.best_option.title,
      ];
      return fields.some((field) => field && normalizeLoose(field).includes(q));
    });
  }, [savedTrips, query, serverMatchIds]);

  // Con búsqueda activa, la fila de stats refleja el subconjunto filtrado, así
  // que el rótulo del primer stat se adapta para no contradecir el número.
  const isSearching = query.trim().length > 0;

  // Antes esta fila mostraba "18% Ahorro Prom." y "Plan Premium: Plus Activo"
  // como texto fijo, sin relación con ningún dato real (no hay ningún sistema
  // de planes de pago: la página de precios dice explícitamente "aún se están
  // preparando"). Ahora ambos stats son cálculos reales, igual que ya se hizo
  // con el JustGo score y el desglose de presupuesto — si no hay viajes, se
  // muestra 0/— en vez de un número inventado.
  // Los stats se calculan sobre `filteredTrips` (no sobre todos los guardados)
  // para que la fila resumen sea coherente con la grid cuando hay una búsqueda
  // activa; sin búsqueda, `filteredTrips === savedTrips`.
  const avgMatch = filteredTrips.length > 0
    ? Math.round(filteredTrips.reduce((acc, t) => acc + (t.justgo_score?.overall_match || 0), 0) / filteredTrips.length)
    : null;
  const uniqueDestinations = new Set(filteredTrips.map((t) => t.best_option.destination)).size;

  return (
    <div className="w-full flex-grow py-10 px-4 lg:px-8 bg-brand-cream/30 dark:bg-brand-dark/10">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-brand-dark/10 dark:border-brand-white/5 pb-6">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">
              Mi Espacio Personal
            </span>
            <h2 className="text-2xl lg:text-3xl font-black text-brand-dark dark:text-brand-white uppercase mt-2">
              Mis Viajes Guardados
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Aquí están todos los viajes que has planificado. Revísalos, compártelos o vuelve a verlos cuando quieras.
            </p>
          </div>

          <button
            onClick={() => router.push('/planner')}
            className="flex items-center gap-1 px-5 py-3 rounded-2xl bg-brand-blue hover:bg-brand-blue/90 text-brand-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Nuevo Viaje</span>
          </button>
        </div>

        {/* Search bar — filtra por datos del cliente y por destino/título */}
        {savedTrips.length > 0 && (
          <div className="relative max-w-md">
            <Search aria-hidden className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por cliente, destino…"
              aria-label="Buscar viajes por datos del cliente o destino"
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 text-sm text-brand-dark dark:text-brand-white placeholder:text-text-muted shadow-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/40"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-text-muted hover:text-brand-coral hover:bg-brand-coral/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Dynamic Trip List */}
        {savedTrips.length === 0 ? (
          <EmptyState
            icon={Compass}
            animateIcon
            title="No tienes viajes generados"
            description="Cuéntale a nuestro concierge inteligente a dónde te gustaría ir y generaremos una propuesta en 3 minutos."
            actionLabel="Comenzar a planificar"
            onAction={() => router.push('/planner')}
          />
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <DashboardTripCard
                key={trip.trip_id}
                trip={trip}
                onDelete={deleteTrip}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Search}
            title="Ningún plan coincide con la búsqueda"
            description={<>No hay viajes que coincidan con «{query}». Prueba con otro nombre, email, teléfono o destino.</>}
            actionLabel="Limpiar búsqueda"
            onAction={() => setQuery('')}
          />
        )}

        {/* User Stats/Dashboard summary row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8 pt-8 border-t border-brand-dark/10 dark:border-brand-white/5">
          {/* Stat 1 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-bold">
              {filteredTrips.length}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">{isSearching ? 'VIAJES ENCONTRADOS' : 'VIAJES TOTALES'}</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">{isSearching ? 'Resultados' : 'Rutas creadas'}</span>
            </div>
          </div>

          {/* Stat 2 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-teal/10 text-brand-teal flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">PASOS AL DÍA</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">Checklists listos</span>
            </div>
          </div>

          {/* Stat 3 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-coral/10 text-brand-coral flex items-center justify-center font-black text-xs">
              {avgMatch !== null ? `${avgMatch}%` : '—'}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">MATCH PROMEDIO</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">JustGo Score</span>
            </div>
          </div>

          {/* Stat 4 */}
          <div className="p-5 rounded-2xl bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">DESTINOS EXPLORADOS</span>
              <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">{uniqueDestinations} distinto{uniqueDestinations === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* Travel recommendations */}
        <div className="mt-4 bg-brand-white dark:bg-brand-dark/30 border border-brand-dark/15 dark:border-brand-white/5 rounded-3xl p-6 flex items-start gap-4">
          <div className="p-3 bg-brand-coral/10 text-brand-coral rounded-2xl shrink-0">
            <Smile className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight">
              ¿Listo para tu próxima aventura?
            </h4>
            <p className="text-xs text-text-muted mt-1 leading-relaxed max-w-2xl">
              Nuestras plantillas inteligentes de Inteligencia Artificial para el fin de semana del Día del Trabajador están recibiendo tarifas bajas en vuelos a Oporto y Milán. ¡Haz clic en crear viaje para explorarlos!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
