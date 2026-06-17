import React from 'react';
import Link from 'next/link';
import { Compass } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-brand-dark text-brand-cream border-t border-brand-white/10 py-12 px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-transparent">
              <img src="/logo.png" alt="JUST ENJOY Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-tight text-brand-white uppercase">
              JUST <span className="text-brand-blue font-bold">ENJOY</span>
            </span>
          </Link>
          <p className="text-xs text-brand-cream/60 leading-relaxed max-w-xs">
            De 20 pestañas a una ruta perfecta. Hiperautomatizamos la planificación de tus viajes para darte la mejor ruta justificada en minutos.
          </p>
        </div>

        {/* Product Links */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-white mb-4">Producto</h4>
          <ul className="space-y-2 text-sm text-brand-cream/70">
            <li>
              <Link href="/planner" className="hover:text-brand-blue transition-colors">
                Planificador de viajes
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-brand-blue transition-colors">
                Planes y Precios
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-brand-blue transition-colors">
                Panel de Usuario
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Help */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-brand-cream/70">
            <li>
              <Link href="#" className="hover:text-brand-blue transition-colors">
                Términos de Servicio
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-blue transition-colors">
                Política de Privacidad
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-blue transition-colors">
                Uso de cookies
              </Link>
            </li>
          </ul>
        </div>

        {/* Technical Stack / Integrations note */}
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-white mb-4">Integraciones</h4>
          <p className="text-xs text-brand-cream/60 leading-relaxed">
            Arquitectura compatible con KAYAK, Amadeus, Google Places, Civitatis, GetYourGuide y automatizaciones en n8n.
          </p>
          <div className="mt-4 pt-4 border-t border-brand-white/10 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-brand-blue/20 px-2 py-1 text-xs font-semibold text-brand-blue ring-1 ring-inset ring-brand-blue/30">
              Compatible con n8n
            </span>
            <span className="inline-flex items-center rounded-full bg-brand-coral/20 px-2 py-1 text-xs font-semibold text-brand-coral ring-1 ring-inset ring-brand-coral/30">
              AI Powered
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-brand-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-cream/40">
        <p>© {new Date().getFullYear()} JUST ENJOY Inc. Todos los derechos reservados. Diseñado para TFM TravelTech.</p>
        <p className="mt-2 sm:mt-0">Desarrollado con React, Next.js y Tailwind CSS.</p>
      </div>
    </footer>
  );
};
export default Footer;
