'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';

const STORAGE_KEY = 'justenjoy_cookie_notice_dismissed';

// Aviso puramente informativo, no un banner de consentimiento con
// aceptar/rechazar: la única cookie que usamos (justenjoy-session) es
// estrictamente necesaria para iniciar sesión, así que no requiere
// consentimiento previo — pero preferimos ser transparentes igualmente
// (ver /cookies). Se muestra una vez por navegador hasta que se descarta.
export function CookieNotice() {
  const [dismissed, setDismissed] = useState(true);

  // El servidor y la primera hidratación coinciden (banner oculto) y la
  // lectura de localStorage ocurre TRAS montar, evitando un hydration
  // mismatch — mismo patrón ya usado en TripContext.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDismissed(false);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50">
      <div className="bg-brand-dark text-brand-cream border border-brand-white/10 rounded-2xl shadow-premium-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-brand-blue/20 text-brand-blue flex items-center justify-center shrink-0">
          <Cookie className="w-4 h-4" />
        </div>
        <div className="flex flex-col gap-2 flex-grow">
          <p className="text-xs leading-relaxed text-brand-cream/85">
            Solo usamos una cookie técnica para mantener tu sesión iniciada — nada de publicidad ni
            rastreo.{' '}
            <Link href="/cookies" className="font-bold text-brand-white hover:underline">
              Más información
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="self-start px-3 py-1.5 rounded-lg bg-brand-blue text-brand-white text-[11px] font-extrabold uppercase tracking-wider hover:bg-brand-blue/90 transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar aviso de cookies"
          className="text-brand-cream/50 hover:text-brand-white transition-colors shrink-0 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default CookieNotice;
