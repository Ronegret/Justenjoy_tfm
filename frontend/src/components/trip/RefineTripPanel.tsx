'use client';

import React, { useState } from 'react';
import { Wand2, RefreshCw, ArrowRight, AlertTriangle, CheckCircle2, Clock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useTrips } from '@/context/TripContext';
import { N8nWarning } from '@/types/planResult';

// Panel de REFINAMIENTO del plan (RUTA B de n8n). A diferencia de "Ajustar y
// Regenerar" de /results (que replanifica desde cero), aquí el usuario describe
// en texto libre qué cambiaría y n8n re-ejecuta SOLO los pasos afectados,
// conservando el resto del plan. Solo se monta para planes con `session_id`.

// Sugerencias rápidas: rellenan la caja de texto (no envían solas), para que el
// usuario pueda matizar antes de refinar.
// Mismo tope que aplica /api/refine-trip (que es el autoritativo): aquí solo
// evita que el usuario escriba de más y reciba un error al enviar.
const MAX_FEEDBACK_CHARS = 500;

const QUICK_SUGGESTIONS = [
  'Hazlo más barato',
  'Menos caminatas entre actividades',
  'Más cultura y museos',
  'Un hotel más céntrico',
  'Vuelos en horarios más cómodos'
];

type FeedbackState =
  | { kind: 'idle' }
  | { kind: 'success' }
  | { kind: 'warnings'; warnings: N8nWarning[] }
  | { kind: 'session_expired' }
  | { kind: 'not_refinable' }
  | { kind: 'blocked_sensitive'; categories: string[] }
  | { kind: 'error'; message: string };

export const RefineTripPanel: React.FC = () => {
  const { refineTrip } = useTrips();
  const [text, setText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>({ kind: 'idle' });

  const canSubmit = text.trim().length > 0 && !isRefining;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsRefining(true);
    setFeedback({ kind: 'idle' });
    const result = await refineTrip(text.trim());
    setIsRefining(false);

    if (result.status === 'ok') {
      setText('');
      setFeedback({ kind: 'success' });
    } else if (result.status === 'needs_user_input') {
      setFeedback({ kind: 'warnings', warnings: result.warnings });
    } else if (result.status === 'session_expired') {
      setFeedback({ kind: 'session_expired' });
    } else if (result.status === 'not_refinable') {
      setFeedback({ kind: 'not_refinable' });
    } else if (result.status === 'blocked_sensitive') {
      // No se ha enviado nada a los servicios de búsqueda; el texto se conserva
      // para que el usuario lo reformule sin datos personales sensibles.
      setFeedback({ kind: 'blocked_sensitive', categories: result.categories });
    } else {
      setFeedback({ kind: 'error', message: result.message });
    }
  };

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider flex items-center gap-1.5">
            <Wand2 className="w-4 h-4 text-brand-blue" />
            <span>Refinar este plan</span>
          </h4>
          <p className="text-[10px] text-text-muted mt-0.5">
            Dinos qué cambiarías y ajustamos solo lo necesario, sin rehacer todo el viaje.
          </p>
        </div>

        {isRefining && (
          <span className="text-xs text-brand-coral font-bold flex items-center gap-1 animate-pulse shrink-0">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Refinando...
          </span>
        )}
      </div>

      {/* Chips de sugerencia: rellenan la caja de texto */}
      <div className="flex flex-wrap gap-2">
        {QUICK_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setText(s)}
            disabled={isRefining}
            className="px-3 py-1.5 rounded-full border border-brand-dark/10 dark:border-brand-white/10 text-[11px] font-semibold text-brand-dark dark:text-brand-white bg-brand-cream/40 dark:bg-brand-dark/60 hover:border-brand-blue/40 hover:text-brand-blue transition-colors disabled:opacity-50 cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isRefining}
          rows={3}
          maxLength={MAX_FEEDBACK_CHARS}
          placeholder="¿Qué cambiarías de este plan? Ej: prefiero un hotel junto a la playa y actividades más tranquilas."
          className="w-full resize-none rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark p-3 text-xs text-brand-dark dark:text-brand-white placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-blue/40 disabled:opacity-60"
        />
        {/* El contador solo aparece cerca del tope, para no distraer al escribir. */}
        {text.length > MAX_FEEDBACK_CHARS * 0.8 && (
          <span className="self-end text-[10px] text-text-muted">
            {text.length}/{MAX_FEEDBACK_CHARS}
          </span>
        )}
      </div>

      {/* Aviso de privacidad (RGPD art. 9): el texto lo procesa una IA y servicios
          de búsqueda externos. Se pide expresamente NO incluir datos personales
          sensibles — reencuadre funcional del campo (ver auditoría, hallazgo #4). */}
      <p className="flex items-start gap-1.5 text-[10px] leading-snug text-text-muted -mt-1">
        <ShieldCheck className="w-3 h-3 text-brand-teal shrink-0 mt-0.5" />
        <span>
          Usa este espacio solo para <strong>preferencias de viaje</strong>. Tu texto lo procesa una IA
          y servicios de búsqueda externos, así que no incluyas datos de salud, religión, ideología u
          otros datos personales sensibles.
        </span>
      </p>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all select-none ${
          canSubmit
            ? 'bg-brand-blue text-brand-white hover:bg-brand-blue/90 cursor-pointer shadow-xs'
            : 'bg-brand-dark/10 dark:bg-brand-white/10 text-text-muted cursor-not-allowed'
        }`}
      >
        {isRefining ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Aplicando tu ajuste...
          </>
        ) : (
          <>
            Refinar plan
            <ArrowRight className="w-3.5 h-3.5" />
          </>
        )}
      </button>

      {/* Resultado */}
      {feedback.kind === 'success' && (
        <div className="flex items-start gap-2 rounded-xl bg-brand-teal/10 border border-brand-teal/20 p-3 text-xs text-brand-dark dark:text-brand-white">
          <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
          <span>¡Plan actualizado! Hemos aplicado tu ajuste; revisa el itinerario y el presupuesto arriba.</span>
        </div>
      )}

      {feedback.kind === 'warnings' && (
        <div className="flex flex-col gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-brand-dark dark:text-brand-white">
          <div className="flex items-center gap-2 font-bold text-amber-600">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>No pudimos aplicar el ajuste tal cual</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-text-muted">
            {feedback.warnings.map((w, i) => (
              <li key={i}>
                {w.detail || 'Ajuste no aplicable.'}
                {w.proposed_change ? ` — ${w.proposed_change}` : ''}
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-text-muted">Tu plan actual se mantiene sin cambios.</p>
        </div>
      )}

      {feedback.kind === 'blocked_sensitive' && (
        <div className="flex flex-col gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-brand-dark dark:text-brand-white">
          <div className="flex items-center gap-2 font-bold text-amber-600">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>Reformula sin datos personales sensibles</span>
          </div>
          <p className="text-text-muted">
            Tu mensaje parece incluir datos personales sensibles
            {feedback.categories.length > 0 ? ` (${feedback.categories.join(', ')})` : ''}. Por tu
            privacidad <strong>no lo hemos enviado</strong> a los servicios de búsqueda y tu plan sigue
            intacto. Descríbelo solo como preferencia de viaje —por ejemplo &laquo;hotel accesible&raquo;,
            &laquo;restaurantes tranquilos&raquo; o &laquo;menús vegetarianos&raquo;— y vuelve a intentarlo.
          </p>
        </div>
      )}

      {feedback.kind === 'session_expired' && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-brand-dark dark:text-brand-white">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            La sesión de este plan ha caducado, así que no podemos refinarlo ahora. Tu plan actual se
            mantiene intacto. Para introducir cambios, crea un plan nuevo desde el planificador.
          </span>
        </div>
      )}

      {feedback.kind === 'not_refinable' && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-brand-dark dark:text-brand-white">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span>
            No podemos confirmar que este plan sea tuyo, así que no lo refinamos. Suele pasar con
            planes guardados antes de esta mejora: créalo de nuevo desde el planificador y ya podrás
            ajustarlo. Tu plan actual se mantiene intacto.
          </span>
        </div>
      )}

      {feedback.kind === 'error' && (
        <div className="flex items-start gap-2 rounded-xl bg-brand-coral/10 border border-brand-coral/20 p-3 text-xs text-brand-dark dark:text-brand-white">
          <AlertTriangle className="w-4 h-4 text-brand-coral shrink-0 mt-0.5" />
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
};

export default RefineTripPanel;
