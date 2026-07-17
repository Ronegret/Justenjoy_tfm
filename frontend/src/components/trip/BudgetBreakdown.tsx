'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plane, Building, Utensils, Compass, Bus } from 'lucide-react';
import { BudgetBreakdown as BudgetType } from '@/types/trip';

interface BudgetBreakdownProps {
  budget: BudgetType;
}

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({ budget }) => {

  const isEstimate = (key: BudgetType['estimatedFields'][number]) => budget.estimatedFields?.includes(key);

  const items = [
    { key: 'flights' as const, label: 'Vuelos de Ida/Vuelta', cost: budget.flights, icon: Plane, color: 'bg-brand-blue', pct: Math.round((budget.flights / budget.total) * 100) },
    { key: 'hotel' as const, label: 'Hotel y Alojamiento', cost: budget.hotel, icon: Building, color: 'bg-brand-dark dark:bg-brand-blue/80', pct: Math.round((budget.hotel / budget.total) * 100) },
    { key: 'activities' as const, label: 'Actividades & Entradas', cost: budget.activities, icon: Compass, color: 'bg-brand-coral', pct: Math.round((budget.activities / budget.total) * 100) },
    { key: 'transport' as const, label: 'Transporte Local', cost: budget.transport, icon: Bus, color: 'bg-brand-blue/60', pct: budget.transport ? Math.round((budget.transport / budget.total) * 100) : 0 },
    { key: 'food' as const, label: 'Comidas y Restaurantes', cost: budget.food, icon: Utensils, color: 'bg-brand-coral/75', pct: Math.round((budget.food / budget.total) * 100) },
    { key: 'extras' as const, label: 'Extras & Compras', cost: budget.extras, icon: CreditCard, color: 'bg-brand-dark/60 dark:bg-brand-white/20', pct: Math.round((budget.extras / budget.total) * 100) }
  ];

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 premium-border rounded-3xl p-6 shadow-xs flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
              Desglose de Presupuesto
            </h4>
            <p className="text-[9px] text-text-muted font-medium mt-0.5">
              Cálculo para el total de la reserva (2 personas).
            </p>
          </div>
        </div>

        <div className="flex flex-col text-right">
          <span className="text-[9px] font-bold text-text-muted uppercase">TOTAL ESTIMADO</span>
          <span className="text-lg font-black text-brand-dark dark:text-brand-white">{budget.total}€</span>
        </div>
      </div>

      {/* Main Bar Chart */}
      <div className="flex flex-col gap-2">
        <div className="w-full h-3.5 rounded-full bg-brand-dark/5 dark:bg-brand-white/5 overflow-hidden flex">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ width: 0 }}
              animate={{ width: `${item.pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.04 }}
              className={`h-full ${item.color}`}
              title={`${item.label}: ${item.pct}%`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[9px] text-text-muted font-bold px-1">
          <span>0%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Budget rows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-brand-cream/30 dark:bg-brand-dark/20 border border-brand-dark/5 dark:border-brand-white/5 hover:border-brand-blue/15 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg text-brand-white ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-brand-dark dark:text-brand-white flex items-center gap-1.5">
                    {item.label}
                    {isEstimate(item.key) && (
                      <span className="text-[8px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full border border-amber-500/20">
                        Estimación
                      </span>
                    )}
                  </span>
                  <span className="text-[9px] text-text-muted font-medium">
                    {typeof item.cost === 'number' ? `Porcentaje: ${item.pct}%` : 'Sin dato real disponible'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-black text-brand-dark dark:text-brand-white">
                  {typeof item.cost === 'number' ? `${item.cost}€` : 'No disponible'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Nota: antes había aquí una fila "Alternativa Low Cost / Premium" con
          total × 0.82 / × 1.45 — números sin ninguna búsqueda real detrás. Las
          alternativas reales (misma ruta, presupuesto ajustado) están en
          /results, donde sí disparan una búsqueda de verdad al pulsarlas. */}
    </div>
  );
};
export default BudgetBreakdown;
