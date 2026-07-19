import React from 'react';
import Link from 'next/link';
import { Mail, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-brand-dark text-brand-cream border-t border-brand-white/10 py-10 px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-8">
        <div className="flex flex-col gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center bg-transparent">
              <img src="/logo.png" alt="JUST ENJOY Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-black tracking-normal text-brand-white uppercase">
              JUST <span className="text-brand-blue font-bold">ENJOY</span>
            </span>
          </Link>
          <p className="text-sm text-brand-cream/72 leading-relaxed max-w-sm">
            Tu viaje claro, bonito y fácil de compartir. Te ayudamos a decidir destino,
            vuelos, alojamiento y plan diario sin perder horas comparando.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-brand-white mb-4">Explorar</h4>
          <ul className="space-y-3 text-sm text-brand-cream/72">
            <li>
              <Link href="/planner" className="hover:text-brand-white transition-colors">
                Crear un viaje
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-brand-white transition-colors">
                Mis viajes
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-brand-white transition-colors">
                Sobre Just Enjoy
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-brand-white mb-4">Confianza</h4>
          <div className="flex flex-col gap-3 text-sm text-brand-cream/72">
            <p className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-teal mt-0.5 shrink-0" />
              <span>Tu cuenta protege tus viajes y propuestas guardadas.</span>
            </p>
            <p className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-brand-blue mt-0.5 shrink-0" />
              <span>¿Necesitas ayuda? Escríbenos desde tu cuenta.</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-brand-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-brand-cream/50">
        <p>© {new Date().getFullYear()} JUST ENJOY. Todos los derechos reservados.</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-brand-white transition-colors">Privacidad</Link>
          <Link href="/terms" className="hover:text-brand-white transition-colors">Términos</Link>
          <Link href="/cookies" className="hover:text-brand-white transition-colors">Cookies</Link>
        </div>
        <p>Hecho para disfrutar más el viaje desde el primer clic.</p>
      </div>
    </footer>
  );
};

export default Footer;
