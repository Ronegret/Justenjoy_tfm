'use client';

import React, { useState } from 'react';
import { Share2, FileText, Calendar, Mail, Check, Link2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareTripPanelProps {
  url: string;
  onPdf?: () => void;
  isGeneratingPdf?: boolean;
}

export const ShareTripPanel: React.FC<ShareTripPanelProps> = ({ url, onPdf, isGeneratingPdf }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const fullUrl = window.location.origin + url;
    try {
      // navigator.clipboard solo existe en contexto seguro (HTTPS o localhost);
      // sobre http por IP de LAN es undefined y lanza. Se maneja el fallo en vez
      // de mostrar "¡Copiado!" cuando en realidad no se copió (ver auditoría #28).
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        // Fallback para contextos no seguros: textarea + execCommand.
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (!ok) throw new Error('execCommand copy no soportado');
      }
      setCopyError(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('No se pudo copiar el enlace al portapapeles:', err);
      setCopyError(true);
      setTimeout(() => setCopyError(false), 3000);
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
          ) : copyError ? (
            <>
              <Link2 className="w-4 h-4 text-brand-coral" />
              <span className="text-brand-coral">Copia manualmente</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 text-brand-blue" />
              <span>Copiar Enlace</span>
            </>
          )}
        </button>

        {/* Sync Calendar — funcionalidad no implementada aún. Antes hacía un
            alert() afirmando falsamente que la sincronización estaba lista
            (auditoría #29): se deshabilita y se marca "Próximamente" hasta que
            exista integración real con Google Calendar. */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Función en desarrollo"
          className="relative flex items-center justify-center gap-2 p-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark text-xs font-bold text-text-muted opacity-60 cursor-not-allowed select-none"
        >
          <Calendar className="w-4 h-4" />
          <span>Añadir a Calendar</span>
          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-brand-dark/60 text-brand-white text-[8px] font-bold uppercase tracking-wider">Pronto</span>
        </button>

        {/* Download PDF */}
        <button
          onClick={onPdf}
          disabled={isGeneratingPdf}
          className="flex items-center justify-center gap-2 p-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue bg-brand-white dark:bg-brand-dark hover:bg-brand-blue/5 transition-all text-xs font-bold text-brand-dark dark:text-brand-white cursor-pointer select-none disabled:opacity-60 disabled:cursor-wait"
        >
          {isGeneratingPdf ? (
            <>
              <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
              <span>Generando...</span>
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 text-brand-blue" />
              <span>Exportar a PDF</span>
            </>
          )}
        </button>
      </div>

      {/* Quick email form — envío por correo no implementado aún. Antes el
          botón hacía un alert() afirmando falsamente que el itinerario se había
          enviado (auditoría #29). Se deshabilita y se marca "Próximamente"
          hasta que exista un backend real de envío. */}
      <div className="border-t border-brand-dark/5 dark:border-brand-white/5 pt-4 mt-1 flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            disabled
            placeholder="Correo de tu acompañante..."
            className="flex-grow px-4 py-2.5 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white opacity-60 cursor-not-allowed focus:outline-hidden"
          />
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Función en desarrollo"
            className="px-4 py-2.5 rounded-xl bg-brand-blue/50 text-brand-white text-xs font-bold flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed select-none"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Compartir</span>
          </button>
        </div>
        <p className="text-[10px] text-text-muted">
          El envío por correo estará disponible próximamente. Mientras tanto, usa
          &ldquo;Copiar Enlace&rdquo; para compartir el viaje.
        </p>
      </div>
    </div>
  );
};
export default ShareTripPanel;
