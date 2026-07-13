'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Compass, ArrowRight, EyeOff, Clock, ShieldCheck,
  Sparkles, CheckCircle2, ChevronRight, HelpCircle,
  Plane, Building, Landmark, Star, ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { SmartChip } from '@/components/shared/SmartChip';
import { IntegrationLogoCloud } from '@/components/shared/IntegrationLogoCloud';

export default function Home() {
  const router = useRouter();
  const [destination, setDestination] = useState('');

  const quickChips = [
    'Escapada barata', 'Viaje romántico', 'Familia', 'Aventura',
    'Cultura', 'Playa', 'Gastronomía', 'Fin de semana', 'Sin estrés'
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (destination.trim()) {
      router.push(`/planner?dest=${encodeURIComponent(destination)}`);
    } else {
      router.push('/planner');
    }
  };

  const handleChipClick = (chip: string) => {
    router.push(`/planner?style=${encodeURIComponent(chip)}`);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. HERO SECTION */}
      <section className="w-full max-w-7xl mx-auto px-4 lg:px-8 pt-20 pb-28 flex flex-col lg:flex-row items-center gap-12 relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.003)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.003)_1px,transparent_1px)]" />

        {/* Ambient Blur Backdrops */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-radial-at-c from-brand-blue/5 to-transparent blur-3xl -z-10" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-radial-at-c from-brand-coral/5 to-transparent blur-3xl -z-10" />

        {/* Hero Left Content */}
        <div className="w-full lg:w-1/2 flex flex-col gap-8 text-left z-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-4"
          >
            <span className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-blue/5 to-brand-coral/5 dark:from-brand-blue/15 dark:to-brand-coral/15 border border-brand-blue/10 px-4 py-2 rounded-full text-[11px] font-bold text-brand-blue dark:text-brand-white uppercase tracking-widest w-fit">
              <Sparkles className="w-4 h-4 text-brand-coral animate-pulse" />
              <span>Tu concierge inteligente de viajes</span>
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-brand-dark dark:text-brand-white tracking-normal uppercase leading-[1.02] font-sans">
              De 20 pestañas a tu <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-coral">viaje perfecto</span> <br />
              en 3 minutos
            </h1>

            <p className="text-base sm:text-lg text-text-muted font-semibold max-w-xl mt-1 leading-relaxed">
              Cuéntanos cómo quieres viajar y te preparamos una propuesta clara con vuelos,
              alojamiento, plan diario y presupuesto. Menos dudas, más ganas de hacer la maleta.
            </p>
          </motion.div>

          {/* Search Box Form */}
          <motion.form
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            onSubmit={handleSearchSubmit}
            className="w-full bg-brand-white dark:bg-brand-dark/50 p-2.5 rounded-2xl md:rounded-full border border-brand-dark/10 dark:border-brand-white/10 shadow-premium-xl flex flex-col md:flex-row gap-2 items-center"
          >
            <div className="flex items-center gap-3 flex-grow w-full px-4 py-2 md:py-0">
              <Compass className="w-5 h-5 text-brand-blue shrink-0 animate-spin-slow" />
              <input
                type="text"
                placeholder="¿A dónde quieres ir? Ej. Lisboa, Roma, París..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent border-0 text-brand-dark dark:text-brand-white placeholder-text-muted text-base font-semibold focus:outline-hidden focus:ring-0 tracking-normal"
              />
            </div>
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-4 rounded-xl md:rounded-full bg-brand-blue hover:bg-brand-blue/90 text-brand-white font-black text-sm uppercase tracking-normal shadow-premium hover:shadow-premium-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Crear mi viaje</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.form>

          {/* Chips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Ideas rápidas de viaje</span>
            <div className="flex flex-wrap gap-2">
              {quickChips.map((chip) => (
                <SmartChip
                  key={chip}
                  label={chip}
                  onClick={() => handleChipClick(chip)}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hero Right Visual: OVERLAPPING CARDS MOCKUP */}
        <div className="w-full lg:w-1/2 relative h-[420px] flex items-center justify-center select-none z-10 mt-10 lg:mt-0 overflow-visible">

          {/* Background Blurred Base Card */}
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-blue/5 to-brand-coral/5 rounded-3xl border border-brand-dark/5 dark:border-brand-white/5 backdrop-blur-xs -z-10" />

          {/* Floating Transparent Travel Graphics (User Custom Assets) */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 2, 0]
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -left-12 bottom-0 w-48 h-48 opacity-20 pointer-events-none -z-10"
          >
            <img src="/images/las_sin_fondo/2.png" alt="Decoración de viaje 1" className="w-full h-full object-contain" />
          </motion.div>

          <motion.div
            animate={{
              y: [0, 8, 0],
              rotate: [0, -2, 0]
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -right-8 top-4 w-52 h-52 opacity-25 pointer-events-none -z-10"
          >
            <img src="/images/las_sin_fondo/3.png" alt="Decoración de viaje 2" className="w-full h-full object-contain" />
          </motion.div>

          <motion.div
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 opacity-10 pointer-events-none -z-20"
          >
            <img src="/images/las_sin_fondo/logohorizontal.png" alt="Fondo Logotipo" className="w-full h-full object-contain filter grayscale dark:invert" />
          </motion.div>

          {/* LAYER 1: Match Score Card (Top-Left) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -30, y: -40 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            whileHover={{ scale: 1.03 }}
            className="absolute top-8 left-4 w-56 p-5 bg-brand-white dark:bg-brand-dark/80 rounded-2xl border border-brand-dark/10 dark:border-brand-white/5 shadow-premium-xl z-20"
          >
            <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
              <span className="text-xs font-bold uppercase text-brand-blue tracking-wider">Encaje contigo</span>
              <span className="text-sm font-black text-brand-teal">94%</span>
            </div>
            <p className="text-sm text-text-muted mt-3 leading-relaxed font-semibold">
              Lisboa encaja con tu presupuesto, fechas y forma de viajar.
            </p>
          </motion.div>

          {/* LAYER 2: Flight Option Card (Center, Overlapped, slightly rotated) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 20, y: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            whileHover={{ scale: 1.03, rotate: -1 }}
            className="absolute top-1/3 left-12 w-72 p-5 bg-brand-white dark:bg-brand-dark/80 rounded-2xl border border-brand-dark/10 dark:border-brand-white/10 shadow-premium-xl rotate-[-2deg] z-30"
          >
            <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2 mb-2">
              <span className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1.5">
                <Plane className="w-4 h-4 text-brand-blue" />
                VUELO DIRECTO
              </span>
              <span className="text-[10px] font-bold text-brand-blue bg-brand-blue/10 px-2.5 py-0.5 rounded-full uppercase">
                Ida
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <div className="flex flex-col"><span className="text-sm font-black text-brand-dark">BCN</span><span className="text-xs text-text-muted font-bold">09:20</span></div>
              <div className="h-[1px] bg-brand-dark/10 flex-grow mx-3 relative"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-blue" /></div>
              <div className="flex flex-col text-right"><span className="text-sm font-black text-brand-dark">LIS</span><span className="text-xs text-text-muted font-bold">10:15</span></div>
            </div>
            <div className="flex justify-between items-center mt-2 border-t border-brand-dark/5 pt-2 text-xs font-bold text-text-muted">
              <span>Vueling Airlines</span>
              <span className="text-brand-dark font-extrabold text-base">145€</span>
            </div>
          </motion.div>

          {/* LAYER 3: Hotel Preview Card (Bottom-Right, Overlapped) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 40, y: 60 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            whileHover={{ scale: 1.03, rotate: 1 }}
            className="absolute bottom-8 right-6 w-64 p-5 bg-brand-white dark:bg-brand-dark/80 rounded-2xl border border-brand-dark/10 dark:border-brand-white/10 shadow-premium-xl rotate-[1.5deg] z-40"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-brand-dark uppercase tracking-tight">Hotel Lisboa Centro</h4>
                <p className="text-xs text-text-muted mt-0.5">Zona: Baixa-Chiado</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-md text-xs font-bold shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>4.4</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-brand-blue/5 border border-brand-blue/10 p-2.5 rounded-lg text-xs text-brand-blue font-bold mt-3">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>A 350 m del centro, ideal para moverte sin complicarte.</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 2. THE PROBLEM SECTION */}
      <section className="w-full bg-brand-white dark:bg-brand-dark/15 border-y border-brand-dark/5 dark:border-brand-white/5 py-24 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-14">

          <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
            <span className="text-xs font-bold text-brand-coral uppercase tracking-widest font-sans">El problema del viajero</span>
            <h2 className="text-3xl lg:text-4xl font-black text-brand-dark dark:text-brand-white uppercase mt-2">
              Planificar un viaje no debería sentirse como trabajar
            </h2>
            <p className="text-sm text-text-muted leading-relaxed font-bold">
              La sobrecarga de información puede quitar ilusión. Just Enjoy ordena el caos y te deja una decisión fácil de entender.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Prob 1 */}
            <div className="bg-brand-cream/20 dark:bg-brand-dark/30 border border-brand-dark/10 dark:border-brand-white/5 rounded-3xl p-7 flex flex-col gap-4 shadow-premium">
              <div className="w-10 h-10 rounded-xl bg-brand-coral/10 text-brand-coral flex items-center justify-center">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight">
                Demasiadas pestañas abiertas
              </h3>
              <p className="text-sm text-text-muted leading-relaxed font-medium">
                Saltas entre webs de vuelos, hoteles, mapas y actividades. Al final tienes mucha información, pero poca claridad.
              </p>
            </div>

            {/* Prob 2 */}
            <div className="bg-brand-cream/20 dark:bg-brand-dark/30 border border-brand-dark/10 dark:border-brand-white/5 rounded-3xl p-7 flex flex-col gap-4 shadow-premium">
              <div className="w-10 h-10 rounded-xl bg-brand-coral/10 text-brand-coral flex items-center justify-center">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight">
                Demasiadas opciones parecidas
              </h3>
              <p className="text-sm text-text-muted leading-relaxed font-medium">
                Ver cientos de hoteles y rutas no ayuda si nadie te explica cuál encaja mejor contigo.
              </p>
            </div>

            {/* Prob 3 */}
            <div className="bg-brand-cream/20 dark:bg-brand-dark/30 border border-brand-dark/10 dark:border-brand-white/5 rounded-3xl p-7 flex flex-col gap-4 shadow-premium">
              <div className="w-10 h-10 rounded-xl bg-brand-coral/10 text-brand-coral flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight">
                Horas que se van sin darte cuenta
              </h3>
              <p className="text-sm text-text-muted leading-relaxed font-medium">
                Cuadrar zonas, horarios, traslados y presupuesto consume tiempo que podrías dedicar a disfrutar el viaje.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. THE SOLUTION SECTION */}
      <section className="w-full py-24 px-4 lg:px-8 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        {/* Text */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider">Una decisión clara</span>
            <h2 className="text-3xl lg:text-4xl font-black text-brand-dark dark:text-brand-white uppercase mt-3">
              No te damos una lista infinita. <br />
              Te damos una decisión clara.
            </h2>
            <p className="text-base text-text-muted mt-3 leading-relaxed font-semibold">
              La mayoría de plataformas te enseñan opciones y te dejan todo el trabajo.
              Just Enjoy prepara una propuesta ordenada y te explica por qué merece la pena.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-brand-dark dark:text-brand-white uppercase">Recomendaciones con motivo</h4>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed font-medium">Sabes por qué se propone cada vuelo, hotel o actividad según tu forma de viajar.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-brand-dark dark:text-brand-white uppercase">Todo en una misma propuesta</h4>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed font-medium">Vuelos, alojamiento, actividades, mapa y presupuesto aparecen juntos, sin obligarte a perseguir enlaces.</p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-brand-dark dark:text-brand-white uppercase">Fácil de guardar y compartir</h4>
                <p className="text-sm text-text-muted mt-0.5 leading-relaxed font-medium">Tu propuesta queda guardada para revisarla después o compartirla con quien viaja contigo.</p>
              </div>
            </div>
          </div>

          <div className="mt-2">
            <Link
              href="/planner"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-dark hover:bg-brand-dark/95 dark:bg-brand-white dark:text-brand-dark dark:hover:bg-brand-white/90 text-brand-white font-black text-sm uppercase tracking-normal shadow-premium transition-all"
            >
              <span>Probar el Planificador</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Visual Mockup Card */}
        <div className="w-full lg:w-1/2 bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-7 shadow-premium-xl relative flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-brand-dark/5 dark:border-brand-white/5 pb-3">
            <span className="text-xs font-bold text-brand-blue uppercase tracking-wider font-sans">Vista previa</span>
            <span className="text-xs font-bold text-brand-teal bg-brand-teal/10 px-2.5 py-0.5 rounded-full border border-brand-teal/20 font-sans">MATCH 94%</span>
          </div>

          {/* Decision Mock */}
          <div className="flex flex-col gap-4">
            <div className="p-3.5 bg-brand-cream/40 dark:bg-brand-white/5 rounded-xl border border-brand-dark/5 text-sm text-brand-dark dark:text-brand-cream leading-relaxed italic font-semibold">
              &quot;Lisboa encaja muy bien para tu escapada porque equilibra precio, cercanía, clima y actividades disponibles en tus fechas.&quot;
            </div>

            <div className="flex flex-col gap-2 font-sans">
              <h4 className="text-xs font-extrabold uppercase text-brand-teal flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-brand-teal" />
                <span>¿Por qué Just Enjoy la eligió?</span>
              </h4>
              <ul className="text-xs text-text-muted flex flex-col gap-2 pl-1 font-bold">
                <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-teal" /> Vuelo directo corto desde Barcelona</li>
                <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-teal" /> Alojamiento en Baixa-Chiado con metro cercano</li>
                <li className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-teal" /> Desglose de actividades culturales optimizadas</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INTEGRATIONS LOGO CLOUD */}
      <section className="w-full bg-brand-white dark:bg-brand-dark/15 border-t border-brand-dark/5 dark:border-brand-white/5 py-16">
        <IntegrationLogoCloud />
      </section>
    </div>
  );
}
