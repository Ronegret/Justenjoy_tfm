'use client';

import React from 'react';
import { Check, ShieldCheck, Compass, Sparkles } from 'lucide-react';

export default function PricingPage() {
  const plans = [
    {
      name: 'Plan Free',
      price: '0€',
      period: 'por siempre',
      desc: 'Perfecto para probar la generación de rutas básicas.',
      features: [
        '1 itinerario básico generado al mes',
        'Visualización de vuelos y hoteles estándar',
        'Itinerario de 1 día resumido',
        'Sin landing privada compartible'
      ],
      cta: 'Comenzar Gratis',
      popular: false,
      color: 'border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/30'
    },
    {
      name: 'Plan Plus',
      price: '9€',
      period: 'al mes',
      desc: 'Ideado para viajeros habituales y parejas que buscan optimización sin estrés.',
      features: [
        'Viajes ilimitados creados con IA',
        'Cálculo de Ruta Óptima Justificada',
        'Visualización de Itinerario completo de varios días',
        'Landing privada compartible',
        'Filtros avanzados de restricciones y ritmos',
        'Recomendaciones Civitatis & GetYourGuide'
      ],
      cta: 'Elegir Plus',
      popular: true,
      color: 'border-brand-blue bg-brand-white dark:bg-brand-dark ring-2 ring-brand-blue/20'
    },
    {
      name: 'Plan Pro',
      price: '19€',
      period: 'al mes',
      desc: 'Pensado para viajes de largo recorrido, multidestino y grupos de amigos.',
      features: [
        'Todas las características de Plan Plus',
        'Planificación multi-destino e internacional',
        'Exportación a PDF de alta resolución',
        'Sincronización con Google Calendar',
        'Panel colaborativo para acompañantes',
        'Alertas automáticas de cambios de precio'
      ],
      cta: 'Elegir Pro',
      popular: false,
      color: 'border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/30'
    },
    {
      name: 'Plan Partner / Agencia',
      price: '49€',
      period: 'al mes',
      desc: 'Para agentes de viajes, redactores de contenido e influencers de turismo.',
      features: [
        'Características Pro ilimitadas',
        'Marca blanca (White Label) con tu logo',
        'Conexión directa con tu API de automatización propia',
        'Integración CRM y panel de clientes',
        'Gestión de enlaces de afiliado propios',
        'Soporte técnico preferente'
      ],
      cta: 'Contactar Ventas',
      popular: false,
      color: 'border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/30'
    }
  ];

  return (
    <div className="w-full flex-grow py-16 px-4 lg:px-8 bg-brand-cream/30 dark:bg-brand-dark/10">
      <div className="max-w-7xl mx-auto flex flex-col gap-12">

        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <span className="text-xs font-bold text-brand-blue bg-brand-blue/10 px-3 py-1 rounded-full w-fit mx-auto">
            Planes y Monetización
          </span>
          <h2 className="text-3xl lg:text-4xl font-black text-brand-dark dark:text-brand-white uppercase mt-3">
            Elige el plan ideal para tus aventuras
          </h2>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Te ahorramos abrir 20 pestañas. Empieza a planificar de forma gratuita y escala tu comodidad a medida que viajes.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`p-6 rounded-3xl border flex flex-col justify-between relative shadow-xs hover:shadow-md transition-shadow ${p.color}`}
            >
              {p.popular && (
                <span className="absolute top-4 right-4 text-[9px] font-extrabold uppercase bg-brand-coral text-brand-white px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  Popular
                </span>
              )}

              {/* Top Details */}
              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-base font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-tight">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="py-2 border-y border-brand-dark/5 dark:border-brand-white/5 my-1">
                  <span className="text-3xl font-black text-brand-dark dark:text-brand-white tracking-tight">{p.price}</span>
                  <span className="text-xs text-text-muted font-medium ml-1">/ {p.period}</span>
                </div>

                {/* Features Checklist */}
                <ul className="flex flex-col gap-2.5 text-xs text-brand-dark dark:text-brand-cream">
                  {p.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-brand-teal shrink-0 mt-0.5 stroke-[3px]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => alert(`Suscripción iniciada para: ${p.name}. (Simulación de pasarela de pago Stripe)`)}
                className={`mt-8 w-full py-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                  p.popular
                    ? 'bg-brand-blue hover:bg-brand-blue/90 text-brand-white shadow-md'
                    : 'bg-brand-dark/5 dark:bg-brand-white/5 border border-brand-dark/10 text-brand-dark dark:text-brand-white hover:bg-brand-dark/10'
                }`}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        {/* Security / trust banner */}
        <div className="mt-8 border-t border-brand-dark/10 dark:border-brand-white/5 pt-8 text-center max-w-md mx-auto flex flex-col items-center gap-3">
          <ShieldCheck className="w-10 h-10 text-brand-teal" />
          <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase tracking-wider">
            Garantía de Satisfacción de reservas
          </h4>
          <p className="text-[10px] text-text-muted leading-relaxed">
            Todas las tarifas y disponibilidades de vuelos y hoteles recomendadas por la IA son validadas en tiempo real por los servidores de Civitatis, Amadeus y KAYAK. No cobramos comisiones ocultas por reserva.
          </p>
        </div>

      </div>
    </div>
  );
}
