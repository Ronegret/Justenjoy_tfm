'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Bell, CheckCircle2, Clock, Sparkles } from 'lucide-react';

const upcoming = [
  'Guardar y comparar varias propuestas de viaje.',
  'Compartir planes con acompañantes.',
  'Exportar propuestas para revisarlas fuera de la web.',
  'Recibir mejoras y nuevas funciones sin complicarte.'
];

export default function PricingPage() {
  return (
    <div className="w-full flex-grow bg-brand-cream/30 py-16 px-4 lg:px-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-10">
        <section className="bg-brand-white border border-brand-dark/10 rounded-3xl p-8 lg:p-12 shadow-premium-xl text-center flex flex-col items-center gap-6">
          <span className="inline-flex items-center gap-2 text-xs font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-4 py-2 rounded-full uppercase">
            <Clock className="w-4 h-4 text-brand-coral" />
            Próximamente
          </span>

          <div className="flex flex-col gap-4 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-dark uppercase leading-[1.03] tracking-normal">
              Los planes de Just Enjoy aún se están preparando
            </h1>
            <p className="text-base sm:text-lg text-text-muted leading-relaxed font-semibold">
              De momento queremos centrarnos en que la experiencia de crear viajes funcione bien,
              sea clara y resulte útil para usuarios reales.
            </p>
            <p className="text-sm text-text-muted leading-relaxed">
              Cuando los planes estén listos, esta página mostrará opciones sencillas y transparentes,
              sin letra pequeña ni promesas confusas.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/planner"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-brand-blue text-brand-white font-black text-sm uppercase shadow-premium hover:shadow-premium-xl transition-all"
            >
              Probar el planificador
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-brand-white text-brand-dark border border-brand-dark/10 font-black text-sm uppercase shadow-premium hover:shadow-premium-xl transition-all"
            >
              Volver al inicio
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="bg-brand-dark text-brand-cream rounded-3xl p-7 shadow-premium-xl flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-white/10 text-brand-blue flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-brand-white uppercase leading-tight">
              Estamos afinando la experiencia antes de hablar de precios
            </h2>
            <p className="text-sm text-brand-cream/75 leading-relaxed">
              Preferimos enseñar una web honesta: si algo todavía no está disponible,
              lo marcamos como próximo en vez de venderlo antes de tiempo.
            </p>
          </div>

          <div className="bg-brand-white border border-brand-dark/10 rounded-3xl p-7 shadow-premium flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-coral" />
              <h3 className="text-lg font-black text-brand-dark uppercase">Qué llegará después</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcoming.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-brand-cream/40 border border-brand-dark/5 p-4">
                  <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                  <p className="text-sm text-brand-dark leading-relaxed font-medium">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
