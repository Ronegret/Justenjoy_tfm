'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Compass, Sparkles } from 'lucide-react';
import { DayPlan } from '@/types/trip';
import { DayPlanCard } from './DayPlanCard';

interface ItineraryTimelineProps {
  itinerary: DayPlan[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ itinerary }) => {
  const [activeDayIdx, setActiveDayIdx] = useState(0);

  const activeDay = itinerary[activeDayIdx] || itinerary[0];

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Day Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-dark/10 dark:border-brand-white/5 scrollbar-thin">
        {itinerary.map((day, idx) => {
          const isActive = idx === activeDayIdx;
          return (
            <button
              key={day.day}
              type="button"
              onClick={() => setActiveDayIdx(idx)}
              className={`px-5 py-3 rounded-2xl border transition-all text-left shrink-0 cursor-pointer flex flex-col gap-0.5 relative ${
                isActive
                  ? 'border-brand-blue bg-brand-white dark:bg-brand-dark font-extrabold text-brand-blue dark:text-brand-white shadow-xs'
                  : 'border-brand-dark/5 dark:border-brand-white/5 bg-brand-white/40 dark:bg-brand-dark/10 text-text-muted hover:border-brand-blue/30'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="active-day-tab"
                  className="absolute inset-0 border-2 border-brand-blue rounded-2xl -m-[1px] pointer-events-none"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className="text-[9px] uppercase font-bold text-text-muted">DÍA {day.day}</span>
              <span className="text-xs font-black tracking-tight">{formatDate(day.date)}</span>
            </button>
          );
        })}
      </div>

      {/* Active Day Description & Highlights */}
      <div className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/5 dark:border-brand-white/5 rounded-2xl p-5 shadow-xs flex flex-col gap-2">
        <h3 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-brand-coral" />
          <span>{activeDay.title}</span>
        </h3>
        <p className="text-xs text-text-muted leading-relaxed italic">
          "{activeDay.summary}"
        </p>
      </div>

      {/* Timeline Blocks vertical list */}
      <div className="flex flex-col gap-6 relative mt-2 pl-2">
        {/* Visual timeline back line - now dotted */}
        <div className="absolute top-0 bottom-0 left-[75px] w-0.5 border-l border-dashed border-brand-dark/15 dark:border-brand-white/10 -z-10" />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeDay.day}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-6"
          >
            {activeDay.blocks.map((block, idx) => (
              <DayPlanCard key={idx} block={block} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
export default ItineraryTimeline;
