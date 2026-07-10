'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Building, Compass, Calendar, MapPin, Share2 } from 'lucide-react';

interface Integration {
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  status: string;
}

export const IntegrationLogoCloud: React.FC = () => {
  const integrations: Integration[] = [
    { name: 'Vuelos', category: 'Opciones claras para llegar sin vueltas', icon: Plane, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', status: 'Comparar' },
    { name: 'Hoteles', category: 'Zonas cómodas y bien ubicadas', icon: Building, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', status: 'Elegir' },
    { name: 'Actividades', category: 'Planes que encajan con tu estilo', icon: Compass, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20', status: 'Disfrutar' },
    { name: 'Fechas', category: 'Rutas pensadas para tus días reales', icon: Calendar, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', status: 'Cuadrar' },
    { name: 'Mapa', category: 'Distancias y barrios fáciles de entender', icon: MapPin, color: 'text-green-500 bg-green-500/10 border-green-500/20', status: 'Ubicar' },
    { name: 'Compartir', category: 'Una propuesta lista para revisar juntos', icon: Share2, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', status: 'Enviar' }
  ];

  return (
    <div className="w-full py-8">
      <div className="text-center mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full">
          Todo en un solo lugar
        </span>
        <h3 className="text-2xl font-black text-brand-dark dark:text-brand-white mt-3">
          Lo importante del viaje, ordenado para decidir rápido
        </h3>
        <p className="text-sm text-text-muted mt-2 max-w-xl mx-auto leading-relaxed font-medium">
          En vez de enseñarte datos sueltos, agrupamos lo que necesitas para entender si un viaje merece la pena.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-7xl mx-auto px-4">
        {integrations.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.03, y: -2 }}
              className="flex flex-col items-center justify-between p-5 rounded-2xl border bg-brand-white dark:bg-brand-dark/30 shadow-premium relative overflow-hidden group cursor-default transition-all duration-200 border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue/25 hover:shadow-premium-xl"
            >
              <div className="absolute top-2 right-2">
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-brand-dark/5 dark:bg-brand-white/5 text-text-muted dark:text-brand-cream border border-brand-dark/10 dark:border-brand-white/10 uppercase tracking-wider">
                  {item.status}
                </span>
              </div>

              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 border ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="text-center mt-1">
                <p className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-normal">
                  {item.name}
                </p>
                <p className="text-xs text-text-muted font-medium mt-1 leading-snug">
                  {item.category}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
export default IntegrationLogoCloud;
