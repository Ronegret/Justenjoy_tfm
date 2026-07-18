'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CheckCircle2, Compass, GraduationCap, Heart, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react';

const team = [
  { name: 'Roberto Barrios', initials: 'RB', color: 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' },
  { name: 'Enrique Izquierdo', initials: 'EI', color: 'bg-brand-coral/10 text-brand-coral border-brand-coral/20' },
  { name: 'Rodrigo Negrete', initials: 'RN', color: 'bg-brand-teal/10 text-brand-teal border-brand-teal/20' }
];

const builtShowcase = [
  {
    title: 'Planifica en minutos, no en pestañas',
    text: 'Un concierge conversacional recoge destino, fechas, viajeros, presupuesto y estilo de viaje en un formulario guiado — sin abrir veinte pestañas para comparar.',
    src: '/images/about/planificador-inicio.png'
  },
  {
    title: 'Un agente de IA construye el plan',
    text: 'Un agente orquestado con n8n busca vuelos, hoteles y actividades reales (SerpAPI, Google Maps, Tavily) y redacta el itinerario día a día con un LLM.',
    src: '/images/about/concierge-conversacional.png'
  },
  {
    title: 'Itinerario, mapa y presupuesto reales',
    text: 'Cada parada del viaje queda geolocalizada en un mapa interactivo, con rutas a pie reales y un desglose de presupuesto honesto — sin cifras inventadas.',
    src: '/images/about/itinerario-y-mapa.png'
  }
];

const values = [
  {
    title: 'Menos ruido',
    text: 'Te ayudamos a pasar de muchas opciones sueltas a una propuesta clara y fácil de comparar.',
    icon: Compass
  },
  {
    title: 'Viajes con sentido',
    text: 'Cada plan tiene en cuenta tus fechas, presupuesto, ritmo y forma de viajar.',
    icon: Heart
  },
  {
    title: 'Todo más fácil',
    text: 'Destino, vuelos, alojamiento, actividades y presupuesto quedan reunidos en un mismo lugar.',
    icon: MapPin
  }
];

const promises = [
  'Propuestas pensadas para personas, no para expertos en reservas.',
  'Explicaciones claras para entender por qué un viaje encaja contigo.',
  'Una experiencia visual, sencilla y cómoda de compartir.',
  'Sin llenar la pantalla de datos que no necesitas para decidir.'
];

export default function AboutPage() {
  return (
    <div className="w-full flex-grow bg-brand-cream/30 py-16 px-4 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">
        <section className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 text-xs font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-4 py-2 rounded-full w-fit uppercase">
              <Sparkles className="w-4 h-4 text-brand-coral" />
              Sobre Just Enjoy
            </span>
            <div className="flex flex-col gap-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-brand-dark uppercase leading-[1.03] tracking-normal">
                Planificar un viaje debería dar ilusión, no cansancio
              </h1>
              <p className="text-base sm:text-lg text-text-muted leading-relaxed font-semibold max-w-2xl">
                Just Enjoy nace para simplificar esa parte del viaje que suele hacerse pesada:
                comparar vuelos, mirar hoteles, cuadrar actividades y decidir si todo encaja.
              </p>
              <p className="text-base text-text-muted leading-relaxed max-w-2xl">
                Queremos que cualquier persona pueda tener una propuesta bonita, clara y lista para revisar,
                sin perder horas saltando entre pestañas.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/planner"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-brand-blue text-brand-white font-black text-sm uppercase shadow-premium hover:shadow-premium-xl transition-all"
              >
                Crear mi viaje
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-7 py-3.5 rounded-full bg-brand-white text-brand-dark border border-brand-dark/10 font-black text-sm uppercase shadow-premium hover:shadow-premium-xl transition-all"
              >
                Volver al inicio
              </Link>
            </div>
          </div>

          <div className="bg-brand-white border border-brand-dark/10 rounded-3xl p-7 shadow-premium-xl flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-brand-dark uppercase">Para viajeros reales</h2>
                <p className="text-sm text-text-muted">Parejas, familias, amigos o escapadas en solitario.</p>
              </div>
            </div>
            <div className="rounded-2xl bg-brand-cream/50 border border-brand-dark/5 p-5">
              <p className="text-sm text-brand-dark leading-relaxed font-semibold">
                No buscamos que el usuario entienda herramientas, proveedores o procesos internos.
                Buscamos que pueda decir: “este viaje me encaja y sé por qué”.
              </p>
            </div>
            <div className="flex items-start gap-3 text-sm text-text-muted leading-relaxed">
              <ShieldCheck className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
              <p>La experiencia está pensada para acompañarte antes de reservar, con información ordenada y fácil de revisar.</p>
            </div>
          </div>
        </section>

        <section className="bg-brand-white border border-brand-dark/10 rounded-3xl p-7 lg:p-9 shadow-premium-xl flex flex-col gap-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-transparent shrink-0">
              <Image src="/logo.png" alt="Logo de Just Enjoy" width={48} height={48} className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-black text-brand-blue uppercase">
                <GraduationCap className="w-4 h-4 text-brand-coral" />
                Quién lo hizo
              </span>
              <h2 className="text-2xl font-black text-brand-dark uppercase mt-1">El equipo detrás de Just Enjoy</h2>
              <p className="text-sm text-text-muted leading-relaxed mt-2 max-w-2xl">
                Just Enjoy es el Trabajo Final del Máster en Agentes de IA e Hiperautomatización de Procesos
                (EBIS Business Techschool), construido por tres compañeros de promoción como una solución
                real de principio a fin: desde el agente de IA que orquesta la búsqueda hasta la web que ves aquí.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {team.map((member) => (
              <div key={member.name} className="flex items-center gap-3 rounded-2xl bg-brand-cream/40 border border-brand-dark/5 p-4">
                <div className={`w-11 h-11 rounded-full border flex items-center justify-center font-black text-sm shrink-0 ${member.color}`}>
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-black text-brand-dark">{member.name}</p>
                  <p className="text-[11px] text-text-muted font-semibold">Equipo TFM · Hiperautomatización</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="bg-brand-white border border-brand-dark/10 rounded-3xl p-7 shadow-premium flex flex-col gap-4">
                <div className="w-11 h-11 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-brand-dark uppercase">{item.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </section>

        <section className="flex flex-col gap-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 text-xs font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-4 py-2 rounded-full uppercase">
              <Sparkles className="w-4 h-4 text-brand-coral" />
              Qué construimos
            </span>
            <h2 className="text-3xl font-black text-brand-dark uppercase mt-4 leading-tight">
              De la idea al viaje, en tres pantallas
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mt-3">
              Capturas reales de la aplicación en marcha — sin maquetas, esto es exactamente lo que ves al usarla.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {builtShowcase.map((item) => (
              <div key={item.title} className="bg-brand-white border border-brand-dark/10 rounded-3xl overflow-hidden shadow-premium flex flex-col">
                <div className="relative w-full aspect-[16/10] bg-brand-cream/50 border-b border-brand-dark/5">
                  <Image src={item.src} alt={item.title} fill className="object-cover object-top" />
                </div>
                <div className="p-6 flex flex-col gap-2">
                  <h3 className="text-sm font-black text-brand-dark uppercase tracking-tight">{item.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-brand-white border border-brand-dark/10 rounded-3xl p-7 lg:p-9 shadow-premium-xl grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-8 items-center">
          <div>
            <span className="text-xs font-black text-brand-coral uppercase">Nuestra promesa</span>
            <h2 className="text-3xl font-black text-brand-dark uppercase mt-2 leading-tight">
              Que decidir tu próximo viaje sea simple
            </h2>
            <p className="text-sm text-text-muted leading-relaxed mt-3">
              Just Enjoy no pretende abrumarte con información. Te muestra lo importante,
              lo ordena y te ayuda a avanzar con confianza.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {promises.map((promise) => (
              <div key={promise} className="flex items-start gap-3 rounded-2xl bg-brand-cream/40 border border-brand-dark/5 p-4">
                <CheckCircle2 className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                <p className="text-sm text-brand-dark leading-relaxed font-medium">{promise}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
