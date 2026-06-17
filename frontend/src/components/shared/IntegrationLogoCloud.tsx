'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plane, Building, Compass, Calendar, MapPin, Search } from 'lucide-react';

interface Integration {
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  status: 'Compatible' | 'Listo' | 'API';
}

export const IntegrationLogoCloud: React.FC = () => {
  const integrations: Integration[] = [
    { name: 'KAYAK', category: 'Comparación Vuelos', icon: Plane, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', status: 'API' },
    { name: 'Amadeus', category: 'GDS Vuelos & Hoteles', icon: Search, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', status: 'API' },
    { name: 'Google Hotels', category: 'Tarifas Alojamiento', icon: Building, color: 'text-red-500 bg-red-500/10 border-red-500/20', status: 'Compatible' },
    { name: 'Civitatis', category: 'Actividades & Tours', icon: Compass, color: 'text-pink-500 bg-pink-500/10 border-pink-500/20', status: 'Listo' },
    { name: 'GetYourGuide', category: 'Experiencias Locales', icon: Compass, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', status: 'Listo' },
    { name: 'Ticketmaster', category: 'Eventos & Entradas', icon: Calendar, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20', status: 'Compatible' },
    { name: 'Google Places', category: 'Ubicaciones & Horarios', icon: MapPin, color: 'text-green-500 bg-green-500/10 border-green-500/20', status: 'API' }
  ];

  return (
    <div className="w-full py-8">
      <div className="text-center mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full">
          Ecosistema Conectado
        </span>
        <h3 className="text-lg font-bold text-brand-dark dark:text-brand-white mt-2">
          Arquitectura lista para conectar con proveedores clave
        </h3>
        <p className="text-xs text-text-muted mt-1 max-w-lg mx-auto">
          Conexión automatizada mediante webhooks en n8n para comparar tarifas en tiempo real.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-w-7xl mx-auto px-4">
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
              className={`flex flex-col items-center justify-between p-4 rounded-xl border bg-brand-white dark:bg-brand-dark/30 shadow-xs relative overflow-hidden group cursor-default transition-all duration-200 border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue/20`}
            >
              <div className="absolute top-2 right-2">
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm bg-brand-dark/5 dark:bg-brand-white/5 text-text-muted dark:text-brand-cream border border-brand-dark/10 dark:border-brand-white/10 uppercase tracking-widest">
                  {item.status}
                </span>
              </div>

              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 border ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="text-center mt-1">
                <p className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
                  {item.name}
                </p>
                <p className="text-[10px] text-text-muted font-medium mt-0.5 whitespace-nowrap">
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
