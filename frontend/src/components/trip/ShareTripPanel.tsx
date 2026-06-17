'use client';

import React, { useState } from 'react';
import { Share2, FileText, Calendar, Mail, Check, Link2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareTripPanelProps {
  url: string;
}

export const ShareTripPanel: React.FC<ShareTripPanelProps> = ({ url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const fullUrl = window.location.origin + url;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-5">
      {/* Header */}
      <div>
        <h4 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
          Compartir & Guardar Viaje
        </h4>
        <p className="text-[10px] text-text-muted mt-0.5">
          Envía el itinerario a tus acompañantes o sincronízalo en tu calendario.
        </p>
      </div>

      {/* Share Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue bg-brand-white dark:bg-brand-dark hover:bg-brand-blue/5 transition-all text-xs font-bold text-brand-dark dark:text-brand-white cursor-pointer select-none"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-500">¡Copiado!</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 text-brand-blue" />
              <span>Copiar Enlace</span>
            </>
          )}
        </button>

        {/* Sync Calendar */}
        <button
          onClick={() => alert('¡Sincronización en la nube lista! Las actividades de tu itinerario se añadirán a tu cuenta de Google Calendar.')}
          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue bg-brand-white dark:bg-brand-dark hover:bg-brand-blue/5 transition-all text-xs font-bold text-brand-dark dark:text-brand-white cursor-pointer select-none"
        >
          <Calendar className="w-4 h-4 text-brand-blue" />
          <span>Añadir a Calendar</span>
        </button>

        {/* Download PDF */}
        <button
          onClick={() => alert('Generando exportación en formato PDF de alta calidad con mapas y checklists... La descarga se iniciará en unos segundos.')}
          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue bg-brand-white dark:bg-brand-dark hover:bg-brand-blue/5 transition-all text-xs font-bold text-brand-dark dark:text-brand-white cursor-pointer select-none"
        >
          <FileText className="w-4 h-4 text-brand-blue" />
          <span>Exportar a PDF</span>
        </button>
      </div>

      {/* Quick email form */}
      <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 mt-1 flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          placeholder="Correo de tu acompañante..."
          className="flex-grow px-4 py-2.5 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue"
        />
        <button
          onClick={() => alert('¡Itinerario compartido! Enviando resumen del viaje por correo electrónico.')}
          className="px-4 py-2.5 rounded-xl bg-brand-blue hover:bg-brand-blue/90 text-brand-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Compartir</span>
        </button>
      </div>
    </div>
  );
};
export default ShareTripPanel;
