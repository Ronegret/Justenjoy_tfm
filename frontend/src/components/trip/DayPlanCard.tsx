'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Plane, Utensils, Compass, Building, Landmark,
  MapPin, Clock, AlertCircle, RefreshCw
} from 'lucide-react';
import { ItineraryBlock } from '@/types/trip';

interface DayPlanCardProps {
  block: ItineraryBlock;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'flight': return Plane;
    case 'food': return Utensils;
    case 'activity': return Landmark;
    case 'hotel': return Building;
    case 'transit': return Clock;
    default: return Compass;
  }
};

const getColorClass = (type: string) => {
  switch (type) {
    case 'flight': return 'bg-blue-500/10 text-brand-blue border-blue-500/20';
    case 'food': return 'bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-500/20';
    case 'activity': return 'bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-500/20';
    case 'hotel': return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 border-indigo-500/20';
    case 'transit': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border-emerald-500/20';
    default: return 'bg-brand-blue/10 text-brand-blue border-brand-blue/20';
  }
};

export const DayPlanCard: React.FC<DayPlanCardProps> = ({ block }) => {

  const colorClass = getColorClass(block.type);

  return (
    <div className="w-full flex gap-5 relative">
      {/* Time column */}
      <div className="flex flex-col items-center shrink-0 w-14 text-right pt-2 select-none">
        <span className="text-sm font-black text-brand-dark dark:text-brand-white">{block.time}</span>
        <span className="text-[8px] font-extrabold uppercase text-text-muted tracking-widest mt-0.5">
          {block.period}
        </span>
      </div>

      {/* Dotted Timeline connector element */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-xs z-10 ${colorClass}`}>
          {React.createElement(getIcon(block.type), { className: 'w-3.5 h-3.5' })}
        </div>
        <div className="w-0.5 h-full border-l border-dashed border-brand-dark/15 dark:border-brand-white/10 absolute top-8 bottom-0 left-[75px] -z-10" />
      </div>

      {/* Main card box - vercel minimal style */}
      <div className="flex-grow bg-brand-white dark:bg-brand-dark/40 premium-border rounded-2xl p-5 shadow-xs flex flex-col gap-3.5 hover:shadow-sm transition-shadow">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <h4 className="text-sm font-black text-brand-dark dark:text-brand-white uppercase tracking-tight">
              {block.title}
            </h4>
            <span className="text-[10px] text-text-muted font-bold flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 text-brand-blue shrink-0" />
              <span>{block.location}</span>
              {block.duration && <span className="mx-1">• Duración: {block.duration}</span>}
            </span>
          </div>

          <div className="shrink-0 pt-0.5">
            {block.cost > 0 ? (
              <span className="text-[11px] font-extrabold text-brand-dark dark:text-brand-white bg-brand-dark/5 dark:bg-brand-white/5 px-2.5 py-1 rounded-md border border-brand-dark/5">
                {block.cost}€
              </span>
            ) : (
              <span className="text-[10px] font-extrabold text-brand-teal bg-brand-teal/10 px-2.5 py-1 rounded-md border border-brand-teal/20 uppercase tracking-wider">
                Gratis
              </span>
            )}
          </div>
        </div>

        {/* Text */}
        <p className="text-xs text-text-dark dark:text-brand-cream/90 leading-relaxed font-sans font-medium">
          {block.description}
        </p>

        {/* Local tips and alternatives */}
        {(block.tip || block.alternative) && (
          <div className="flex flex-col gap-2 mt-1 border-t border-brand-dark/5 dark:border-brand-white/5 pt-3">
            {block.tip && (
              <div className="flex items-start gap-2 bg-brand-blue/5 dark:bg-brand-blue/15 p-3 rounded-xl text-xs text-text-dark dark:text-brand-cream border border-brand-blue/10">
                <AlertCircle className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-brand-blue uppercase mr-1 text-[9px] tracking-wider">Consejo local:</span>
                  <span className="font-medium">{block.tip}</span>
                </div>
              </div>
            )}

            {block.alternative && (
              <div className="flex items-start gap-2 bg-brand-dark/5 dark:bg-brand-white/5 p-3 rounded-xl text-xs text-text-muted border border-brand-dark/5">
                <RefreshCw className="w-4 h-4 text-text-muted shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-text-dark dark:text-brand-white uppercase mr-1 text-[9px] tracking-wider">Alternativa cercana:</span>
                  <span className="font-medium">{block.alternative}</span>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
export default DayPlanCard;
