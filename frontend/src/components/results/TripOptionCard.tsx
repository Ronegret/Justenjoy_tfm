'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, ShieldCheck, Tag, HelpCircle } from 'lucide-react';
import { AlternativeOption, TripOption } from '@/types/trip';

interface TripOptionCardProps {
  type: 'recommended' | 'cheapest' | 'premium';
  destination: string;
  matchScore: number;
  price: number;
  reason: string;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const TripOptionCard: React.FC<TripOptionCardProps> = ({
  type,
  destination,
  matchScore,
  price,
  reason,
  isSelected = false,
  onSelect
}) => {
  const badgeLabels = {
    recommended: { label: 'Mejor Equilibrio', color: 'bg-brand-blue text-brand-white' },
    cheapest: { label: 'Más Económico', color: 'bg-emerald-500 text-brand-white' },
    premium: { label: 'Lujo Inteligente', color: 'bg-purple-600 text-brand-white' }
  };

  const badge = badgeLabels[type];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onSelect}
      className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between gap-5 relative overflow-hidden shadow-xs ${
        isSelected
          ? 'bg-brand-white dark:bg-brand-dark border-brand-blue ring-2 ring-brand-blue/30 shadow-md'
          : 'bg-brand-white/80 dark:bg-brand-dark/30 border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue/30'
      }`}
    >
      {/* Decorative background glow for active card */}
      {isSelected && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-radial-at-tr from-brand-blue/10 via-transparent to-transparent -z-10" />
      )}

      {/* Top row */}
      <div className="flex items-start justify-between">
        <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${badge.color}`}>
          {badge.label}
        </span>

        <div className="flex items-center gap-1">
          <span className="text-sm font-extrabold text-brand-dark dark:text-brand-white">{matchScore}%</span>
          <span className="text-[9px] font-bold text-text-muted">MATCH</span>
        </div>
      </div>

      {/* Main Details */}
      <div>
        <h4 className="text-xl font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight">
          {destination}
        </h4>
        <p className="text-xs text-text-muted mt-2 leading-relaxed">
          {reason}
        </p>
      </div>

      {/* Price row */}
      <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 flex items-center justify-between mt-auto">
        <div className="flex flex-col">
          <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">PRESUPUESTO ESTIMADO</span>
          <span className="text-xl font-extrabold text-brand-dark dark:text-brand-white">
            {price}€ <span className="text-xs font-semibold text-text-muted">/ persona</span>
          </span>
        </div>

        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          isSelected
            ? 'bg-brand-blue text-brand-white'
            : 'bg-brand-dark/5 dark:bg-brand-white/5 text-text-muted hover:bg-brand-blue hover:text-brand-white'
        }`}>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};
export default TripOptionCard;
