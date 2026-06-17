'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, AlertTriangle, Compass, ShieldCheck } from 'lucide-react';
import { TripOption } from '@/types/trip';

interface RouteDecisionCardProps {
  bestOption: TripOption;
}

export const RouteDecisionCard: React.FC<RouteDecisionCardProps> = ({ bestOption }) => {
  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-brand-dark/5 dark:border-brand-white/5 pb-3">
        <div className="w-8 h-8 rounded-full bg-brand-teal/20 text-brand-teal flex items-center justify-center">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
            ¿Por qué Just Enjoy eligió esta ruta?
          </h3>
          <p className="text-[10px] text-text-muted mt-0.5">
            Explicación detallada de la optimización basada en tus restricciones.
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-text-dark dark:text-brand-cream italic bg-brand-cream/40 dark:bg-brand-white/5 p-4 rounded-xl border border-brand-dark/5 dark:border-brand-white/5">
        "{bestOption.summary}"
      </p>

      {/* Pros & Tradeoffs Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        {/* Pros */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-extrabold text-brand-teal uppercase tracking-wider flex items-center gap-1.5">
            <Check className="w-4 h-4 text-brand-teal stroke-[3px]" />
            <span>Factores Decisivos (Pros)</span>
          </h4>
          <ul className="flex flex-col gap-2.5">
            {bestOption.why_selected.map((item, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2 text-xs text-brand-dark dark:text-brand-white"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-teal shrink-0 mt-1.5" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Tradeoffs */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-extrabold text-brand-coral uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-brand-coral" />
            <span>Compromisos asumidos (Tradeoffs)</span>
          </h4>
          <ul className="flex flex-col gap-2.5">
            {bestOption.tradeoffs.map((item, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-2 text-xs text-text-muted"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-coral shrink-0 mt-1.5" />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer explanation tag */}
      <div className="mt-2 text-center text-[10px] text-text-muted flex items-center justify-center gap-1 border-t border-brand-dark/5 dark:border-brand-white/5 pt-4">
        <Compass className="w-3.5 h-3.5 text-brand-blue" />
        <span>Ruta optimizada descartando otras 14 combinaciones con mayor tiempo de espera o coste.</span>
      </div>
    </div>
  );
};
export default RouteDecisionCard;
