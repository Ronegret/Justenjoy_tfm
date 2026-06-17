'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Compass, Sparkles } from 'lucide-react';
import { JustGoScore } from '@/types/trip';

interface JustGoScoreCardProps {
  score: JustGoScore;
}

export const JustGoScoreCard: React.FC<JustGoScoreCardProps> = ({ score }) => {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Animate overall score on mount
    const timer = setTimeout(() => {
      setAnimatedValue(score.overall_match);
    }, 400);
    return () => clearTimeout(timer);
  }, [score.overall_match]);

  // SVG Circular progress math
  const radius = 55;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedValue / 100) * circumference;

  const getFrictionColor = (label: string) => {
    switch (label) {
      case 'Baja': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'Media': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'Alta': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-green-500 bg-green-500/10 border-green-500/20';
    }
  };

  const scoreDetails = [
    { label: 'Relación Precio', value: score.price_score, color: 'bg-emerald-500' },
    { label: 'Índice Confort', value: score.comfort_score, color: 'bg-blue-500' },
    { label: 'Ubicación Hotel', value: score.location_score, color: 'bg-amber-500' },
    { label: 'Coincidencia Actividades', value: score.activities_score, color: 'bg-indigo-500' }
  ];

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center gap-8">
      {/* Circle gauge on the left */}
      <div className="flex flex-col items-center gap-3 shrink-0">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="72"
              cy="72"
              r={radius}
              className="stroke-brand-dark/5 dark:stroke-brand-white/5"
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            {/* Foreground Circle */}
            <motion.circle
              cx="72"
              cy="72"
              r={radius}
              stroke="url(#score-gradient)"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              strokeLinecap="round"
            />
            {/* Gradients */}
            <defs>
              <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#F26444" />
              </linearGradient>
            </defs>
          </svg>

          {/* Centered Match Percentage */}
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold tracking-tight text-brand-dark dark:text-brand-white">
              {score.overall_match}%
            </span>
            <span className="text-[9px] font-extrabold uppercase text-text-muted tracking-widest mt-0.5">
              COINCIDENCIA
            </span>
          </div>
        </div>

        {/* Friction badge */}
        <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-bold ${getFrictionColor(score.friction_label)}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Fricción {score.friction_label}</span>
        </div>
      </div>

      {/* Sub-scores list on the right */}
      <div className="flex-grow w-full flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-brand-coral" />
            <span>Just Enjoy Score</span>
          </h4>
          <p className="text-[10px] text-text-muted mt-0.5">
            Cálculo algorítmico cruzando precio, comodidad, ubicación y clima.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scoreDetails.map((item) => (
            <div key={item.label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text-muted">{item.label}</span>
                <span className="text-brand-dark dark:text-brand-white">{item.value}/100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-brand-dark/5 dark:bg-brand-white/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  className={`h-full rounded-full ${item.color}`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-3 flex justify-between text-[10px] text-text-muted font-medium">
          <span>Potencial de Ahorro: Alto</span>
          <span className="flex items-center gap-1">
            <Compass className="w-3 h-3 text-brand-blue" />
            Caminabilidad: Media-Alta
          </span>
        </div>
      </div>
    </div>
  );
};
export default JustGoScoreCard;
