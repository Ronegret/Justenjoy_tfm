'use client';

import React, { useState } from 'react';
import { RefreshCw, ArrowRight, DollarSign, Award, Eye, Heart, Anchor } from 'lucide-react';
import { motion } from 'framer-motion';

interface RegenerateActionBarProps {
  onRegenerate: (actionType: string) => void;
}

export const RegenerateActionBar: React.FC<RegenerateActionBarProps> = ({ onRegenerate }) => {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const actions = [
    { id: 'cheaper', label: 'Hacerlo más barato', icon: DollarSign, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    { id: 'premium', label: 'Hacerlo más premium', icon: Award, color: 'text-purple-600 bg-purple-600/10 border-purple-600/20' },
    { id: 'low-walking', label: 'Menos caminatas', icon: Eye, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
    { id: 'more-culture', label: 'Más cultura', icon: Heart, color: 'text-brand-blue bg-brand-blue/10 border-brand-blue/20' }
  ];

  const handleActionClick = (id: string) => {
    setActiveAction(id);
    onRegenerate(id);
    setTimeout(() => setActiveAction(null), 2500); // clear active loading
  };

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-4">
      {/* Label info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
            Ajustar y Regenerar
          </h4>
          <p className="text-[10px] text-text-muted mt-0.5">
            Ajusta los parámetros para recalcular la ruta automáticamente.
          </p>
        </div>

        {activeAction && (
          <span className="text-xs text-brand-coral font-bold flex items-center gap-1 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Recalculando...
          </span>
        )}
      </div>

      {/* Buttons layout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          const isLoading = activeAction === act.id;
          return (
            <button
              key={act.id}
              onClick={() => handleActionClick(act.id)}
              disabled={activeAction !== null}
              className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all select-none cursor-pointer ${
                isLoading
                  ? 'border-brand-coral bg-brand-coral/5 text-brand-coral animate-pulse'
                  : 'bg-brand-white dark:bg-brand-dark hover:shadow-sm hover:border-brand-blue/30 text-brand-dark dark:text-brand-white border-brand-dark/10 dark:border-brand-white/10'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${act.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{act.label}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-text-muted rotate-45 shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default RegenerateActionBar;
