'use client';

import React from 'react';
import { FileCheck2, CloudSun, Bus, Info } from 'lucide-react';

interface PracticalInfoCardProps {
  notes: string[];
}

// Cada nota real llega con el prefijo "Visa:", "Clima:" o "Transporte local:"
// (ver PASO 4 del prompt del Agente y el safety net de plan_notes en
// 06_validar_output.js) — se usa para elegir icono, no para inventar nada.
function getNoteIcon(note: string) {
  const lower = note.toLowerCase();
  if (lower.startsWith('visa')) return FileCheck2;
  if (lower.startsWith('clima')) return CloudSun;
  if (lower.startsWith('transporte')) return Bus;
  return Info;
}

export const PracticalInfoCard: React.FC<PracticalInfoCardProps> = ({ notes }) => {
  if (!notes || notes.length === 0) return null;

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 premium-border rounded-3xl p-6 shadow-xs flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-brand-dark/5 dark:border-brand-white/5 pb-3">
        <div className="w-8 h-8 rounded-full bg-brand-teal/10 text-brand-teal flex items-center justify-center">
          <Info className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
            Información práctica
          </h4>
          <p className="text-[9px] text-text-muted font-medium mt-0.5">
            Visado, clima y transporte para tu destino.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {notes.map((note, idx) => {
          const Icon = getNoteIcon(note);
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3.5 rounded-2xl bg-brand-cream/30 dark:bg-brand-dark/20 border border-brand-dark/5 dark:border-brand-white/5"
            >
              <div className="w-7 h-7 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xs text-text-dark dark:text-brand-cream/90 leading-relaxed font-medium pt-0.5">
                {note}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PracticalInfoCard;
