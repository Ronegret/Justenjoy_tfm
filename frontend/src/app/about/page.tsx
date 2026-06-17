'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, Sparkles, Server, Cpu, PhoneCall, MessageSquare,
  ArrowRight, CheckCircle2, Database, Map, Calendar,
  ChevronRight, ShieldAlert, ListChecks, Network, ArrowDown
} from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const [activeStep, setActiveStep] = useState(1);

  const stepsData = [
    {
      num: 1,
      title: "Captura Conversacional",
      subtitle: "Voz (Vapi/Twilio) o Chat (Botpress)",
      icon: PhoneCall,
      description: "El usuario inicia la interacción por una llamada telefónica convencional o un chat. Mediante procesamiento de lenguaje natural (NLP) de última generación, la IA extrae las variables del viaje (destino, origen, fechas, presupuesto y restricciones) de forma fluida sin formularios aburridos.",
      badge: "Vapi.ai / Cognigy / OpenAI Realtime API",
      color: "from-blue-500 to-indigo-600"
    },
    {
      num: 2,
      title: "Orquestación en Paralelo",
      subtitle: "n8n Webhook & Buscadores",
      icon: Network,
      description: "n8n recibe las variables y lanza consultas simultáneas en milisegundos a las APIs de Skyscanner/Amadeus (vuelos), Google Hotels (alojamiento) y Civitatis/GetYourGuide (actividades). Esto evita la sobrecarga de consultas y ahorra horas de navegación manual.",
      badge: "n8n Workflow Engine",
      color: "from-brand-coral to-red-500"
    },
    {
      num: 3,
      title: "Razonamiento IA y Scoring",
      subtitle: "Filtros y Explicabilidad",
      icon: Cpu,
      description: "Un nodo AI en n8n pasa los datos sin procesar a un LLM (como Claude 3.5 o GPT-4o). El modelo evalúa las combinaciones, filtra los vuelos incómodos, calcula el Match Score (precio, confort, ubicación) y redacta las justificaciones de por qué es la ruta óptima.",
      badge: "OpenAI GPT-4o / Claude 3.5",
      color: "from-purple-500 to-pink-500"
    },
    {
      num: 4,
      title: "Consolidación de Cockpit",
      subtitle: "Dashboard Next.js",
      icon: Compass,
      description: "n8n guarda la estructura del viaje en una base de datos (Supabase/Firebase) y genera un ID de viaje único. El bot cuelga la llamada o cierra el chat y envía un SMS automatizado al móvil del usuario con el enlace a su Travel Cockpit privado en Next.js.",
      badge: "Next.js 16 + Tailwind CSS v4",
      color: "from-brand-teal to-emerald-600"
    }
  ];

  return (
    <div className="w-full flex-grow py-16 px-4 lg:px-8 bg-brand-cream/30 dark:bg-brand-dark/10">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">

        {/* 1. HERO DIDÁCTICO */}
        <section className="text-center flex flex-col gap-4 max-w-3xl mx-auto">
          <span className="text-xs font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-4 py-1.5 rounded-full w-fit mx-auto uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-coral animate-pulse" />
            <span>¿Cómo funciona Just Enjoy?</span>
          </span>
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-black text-brand-dark dark:text-brand-white uppercase leading-[0.98]">
            La hiperautomatización <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue via-brand-coral to-purple-600">explicada paso a paso</span>
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-2 leading-relaxed font-bold">
            Entiende cómo transformamos una simple conversación por voz de 2 minutos en un itinerario consolidado con mapas reales, vuelos reservados y desglose de costes inteligente.
          </p>
        </section>

        {/* 2. SIMULADOR INTERACTIVO DEL PROYECTO */}
        <section className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 lg:p-8 shadow-premium-xl flex flex-col lg:flex-row gap-8 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-radial-at-t from-brand-blue/5 to-transparent blur-3xl -z-10" />

          {/* LEFT: STEP SELECTOR */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4 shrink-0">
            <h3 className="text-xs font-black text-text-muted uppercase tracking-widest mb-2">
              Flujo del Dato y Arquitectura
            </h3>

            <div className="flex flex-col gap-3">
              {stepsData.map((step) => {
                const isActive = activeStep === step.num;
                const Icon = step.icon;
                return (
                  <button
                    key={step.num}
                    onClick={() => setActiveStep(step.num)}
                    className={`text-left p-4 rounded-2xl border transition-all duration-300 flex gap-4 cursor-pointer relative group ${
                      isActive
                        ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 shadow-md'
                        : 'border-brand-dark/5 dark:border-brand-white/5 bg-transparent hover:bg-brand-cream/50 dark:hover:bg-brand-dark/20'
                    }`}
                  >
                    {/* Active side indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="active-indicator"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-brand-blue rounded-l-2xl"
                      />
                    )}

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isActive
                        ? 'bg-brand-blue text-brand-white scale-105'
                        : 'bg-brand-dark/5 dark:bg-brand-white/5 text-text-muted group-hover:scale-105'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-brand-blue dark:text-brand-white tracking-widest uppercase mb-0.5">
                        PASO {step.num}
                      </span>
                      <h4 className="text-xs font-extrabold text-brand-dark dark:text-brand-white uppercase group-hover:text-brand-blue transition-colors">
                        {step.title}
                      </h4>
                      <span className="text-[9px] text-text-muted font-bold mt-0.5">
                        {step.subtitle}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* RIGHT: INTERACTIVE LIVE PREVIEW */}
          <div className="w-full lg:w-7/12 bg-brand-cream/40 dark:bg-brand-dark/50 border border-brand-dark/5 rounded-2xl p-6 flex flex-col gap-6 min-h-[360px] justify-between">
            <AnimatePresence mode="wait">
              {stepsData.map((step) => {
                if (step.num !== activeStep) return null;
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-5 h-full justify-between"
                  >
                    {/* Header info */}
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center gap-1 bg-gradient-to-r ${step.color} text-brand-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider w-fit`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>Tecnología: {step.badge}</span>
                      </span>
                      <h4 className="text-sm font-black text-brand-dark dark:text-brand-white uppercase mt-1">
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-text-muted leading-relaxed font-bold">
                        {step.description}
                      </p>
                    </div>

                    {/* LIVE DIDACTIC SIMULATORS */}
                    <div className="bg-brand-white dark:bg-brand-dark/70 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 p-4 font-mono text-[10px] text-brand-dark dark:text-brand-cream overflow-hidden">
                      {/* Step 1: Voice simulator */}
                      {step.num === 1 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                            <span className="text-brand-blue font-bold uppercase tracking-wider flex items-center gap-1">
                              <PhoneCall className="w-3.5 h-3.5 text-brand-coral animate-pulse" />
                              Llamada Telefónica Activa (Simulación)
                            </span>
                            <span className="text-brand-teal font-extrabold animate-pulse">● GRABANDO</span>
                          </div>
                          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto">
                            <div className="flex gap-1.5"><span className="text-brand-blue font-bold">IA:</span><span className="italic">"¿Hola! ¿A dónde quieres viajar y qué presupuesto tienes pensado?"</span></div>
                            <div className="flex gap-1.5"><span className="text-brand-coral font-bold">TÚ:</span><span>"Quiero ir a Lisboa en mayo con mi pareja, unos 3 o 4 días. Presupuesto medio."</span></div>
                            <div className="flex gap-1.5"><span className="text-brand-blue font-bold">IA:</span><span className="italic">"¡Apuntado! Lisboa en mayo para 2 adultos, presupuesto equilibrado. ¿Tenéis alguna restricción?"</span></div>
                            <div className="flex gap-1.5"><span className="text-brand-coral font-bold">TÚ:</span><span>"Sí, preferimos hotel céntrico y evitar vuelos que salgan muy temprano."</span></div>
                            <div className="flex gap-1.5"><span className="text-brand-blue font-bold">IA:</span><span className="italic">"Perfecto. Conectando con el orquestador n8n. ¡Dame unos segundos!"</span></div>
                          </div>
                        </div>
                      )}

                      {/* Step 2: n8n simulator */}
                      {step.num === 2 && (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                            <span className="text-brand-coral font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Network className="w-3.5 h-3.5" />
                              Ejecución de Nodos de Automatización (n8n)
                            </span>
                            <span className="text-brand-teal font-extrabold">STATUS: 200 OK</span>
                          </div>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between bg-brand-cream/50 dark:bg-brand-dark/40 p-1.5 rounded-md border border-brand-dark/5">
                              <span className="font-semibold text-brand-blue">1. Webhook HTTP Trigger</span>
                              <span className="text-brand-teal font-black">RECIBIDO ✓</span>
                            </div>
                            <div className="flex items-center justify-between bg-brand-cream/50 dark:bg-brand-dark/40 p-1.5 rounded-md border border-brand-dark/5">
                              <span className="font-semibold text-brand-blue">2. APIs de Vuelos (Skyscanner/Amadeus)</span>
                              <span className="text-brand-teal font-black">3 vuelos directos encontrados ✓</span>
                            </div>
                            <div className="flex items-center justify-between bg-brand-cream/50 dark:bg-brand-dark/40 p-1.5 rounded-md border border-brand-dark/5">
                              <span className="font-semibold text-brand-blue">3. APIs de Alojamientos (Google Hotels)</span>
                              <span className="text-brand-teal font-black">5 estancias en Baixa-Chiado ✓</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3: LLM simulator */}
                      {step.num === 3 && (
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                            <span className="text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5" />
                              Salida JSON Estructurada por LLM
                            </span>
                            <span className="text-purple-600 dark:text-purple-400 font-extrabold">PROMPT COMPLETED</span>
                          </div>
                          <pre className="text-[9px] leading-tight text-brand-dark dark:text-brand-white p-2 bg-brand-cream/20 rounded-md overflow-x-auto">
{`{
  "best_option": {
    "destination": "Lisboa",
    "why_selected": "Vuelo directo BCN-LIS a las 09:20 (evita madrugada) + Hotel Lisboa Centro a 350m del centro",
    "estimated_total_eur": 620
  },
  "justenjoy_score": {
    "overall_match": 94,
    "friction_score": 12,
    "friction_label": "Baja"
  }
}`}
                          </pre>
                        </div>
                      )}

                      {/* Step 4: Cockpit simulator */}
                      {step.num === 4 && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                            <span className="text-brand-teal font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Compass className="w-3.5 h-3.5" />
                              SMS Enviado & URL Generada
                            </span>
                            <span className="text-brand-teal font-extrabold">SENT ✓</span>
                          </div>
                          <div className="flex flex-col gap-2 p-2 bg-brand-cream/50 dark:bg-brand-dark/40 rounded-xl border border-brand-dark/5 max-w-xs mx-auto text-left">
                            <div className="text-[8px] text-text-muted font-bold">Móvil de Rodrigo: SMS</div>
                            <p className="text-[9.5px] leading-relaxed text-brand-dark dark:text-brand-cream mt-0.5">
                              "¡Rodrigo! Tu viaje óptimo a **Lisboa** está listo. He seleccionado vuelo directo y hotel céntrico (Match 94%). Consúltalo aquí: **justenjoy.app/trip/justenjoy-lisbon-2026**"
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Navigation inside right pane */}
                    <div className="flex items-center justify-between pt-2 border-t border-brand-dark/5 dark:border-brand-white/5">
                      <span className="text-[9px] text-text-muted font-bold">Mapeado de Flujo Just Enjoy</span>
                      <button
                        onClick={() => setActiveStep((prev) => (prev % 4) + 1)}
                        className="flex items-center gap-1 text-[9px] font-black text-brand-blue uppercase hover:text-brand-coral transition-colors cursor-pointer"
                      >
                        <span>Ver siguiente paso</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* 3. COMPARATIVA DIDÁCTICA FRENTE A LA COMPETENCIA */}
        <section className="flex flex-col gap-8">
          <div className="text-center max-w-xl mx-auto flex flex-col gap-2">
            <span className="text-[10px] font-black text-brand-coral uppercase tracking-widest">¿Por qué somos diferentes?</span>
            <h3 className="text-2xl lg:text-3xl font-black text-brand-dark dark:text-brand-white uppercase mt-1">
              Just Enjoy vs. Agencias y Chatbots
            </h3>
            <p className="text-xs text-text-muted leading-relaxed">
              Compara cómo se planifica un viaje tradicionalmente frente a la propuesta de hiperautomatización de Just Enjoy.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tradicional */}
            <div className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xs">
              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-black text-brand-coral bg-brand-coral/10 px-2.5 py-1 rounded-md w-fit uppercase">Plataformas Tradicionales</span>
                <h4 className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">20 Pestañas Abiertas</h4>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Tienes que saltar manualmente de Booking a Skyscanner, Civitatis, blogs de Google y Google Maps. Consumes horas cuadrando billetes, distancias del hotel y horarios de monumentos de forma manual.
                </p>
              </div>
              <div className="text-[9px] font-bold text-brand-coral bg-brand-coral/5 border border-brand-coral/10 p-2.5 rounded-lg flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Dolor de cabeza y parálisis por análisis.</span>
              </div>
            </div>

            {/* Chatbots genéricos */}
            <div className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-xs">
              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-black text-purple-600 bg-purple-500/10 px-2.5 py-1 rounded-md w-fit uppercase">Chatbots de IA genéricos</span>
                <h4 className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">Solo Texto de Inspiración</h4>
                <p className="text-[11px] text-text-muted leading-relaxed">
                  Le preguntas a un chatbot convencional y te devuelve una lista bonita en texto. Pero **no busca vuelos reales**, no sabe si el hotel está libre, no calcula precios en tiempo real ni genera mapas interactivos.
                </p>
              </div>
              <div className="text-[9px] font-bold text-purple-600 bg-purple-500/5 border border-purple-500/10 p-2.5 rounded-lg flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Te inspira, pero no te resuelve la reserva.</span>
              </div>
            </div>

            {/* JustGo */}
            <div className="bg-gradient-to-tr from-brand-blue/5 to-brand-coral/5 dark:from-brand-blue/10 dark:to-brand-coral/10 border-2 border-brand-blue/30 rounded-3xl p-6 flex flex-col justify-between gap-6 shadow-premium relative overflow-hidden">
              <div className="absolute top-2 right-2 w-16 h-16 bg-brand-blue/10 rounded-full blur-xl -z-10" />
              <div className="flex flex-col gap-3">
                <span className="text-[9px] font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-2.5 py-1 rounded-md w-fit uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-brand-coral" />
                  JUST ENJOY COCKPIT
                </span>
                <h4 className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">Llamar, Colgar y Reservar</h4>
                <p className="text-[11px] text-brand-dark dark:text-brand-white leading-relaxed font-semibold">
                  Haces una llamada por voz de 2 minutos. La IA orquesta las APIs con n8n en segundo plano y te envía un dashboard Next.js listo con mapas, itinerario completo optimizado, desgloses y botones de reserva real.
                </p>
              </div>
              <div className="text-[9px] font-bold text-brand-teal bg-brand-teal/10 border border-brand-teal/20 p-2.5 rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-brand-teal" />
                <span className="text-brand-teal">Decisión optimizada explicada al instante.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. ARQUITECTURA TECNOLÓGICA GENERAL (DIDÁCTICA) */}
        <section className="bg-brand-white dark:bg-brand-dark/40 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-8 shadow-md flex flex-col gap-8">
          <div>
            <h3 className="text-lg font-black text-brand-dark dark:text-brand-white uppercase tracking-tight">
              Estructura Tecnológica Integrada
            </h3>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Los componentes clave que integran nuestro ecosistema de hiperautomatización.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            {/* Tech 1 */}
            <div className="flex flex-col items-center gap-3 bg-brand-cream/30 dark:bg-brand-dark/20 p-5 rounded-2xl border border-brand-dark/5">
              <div className="w-12 h-12 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center shadow-xs">
                <PhoneCall className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">1. Canal de Entrada</h4>
              <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                Voz (Vapi/Twilio) o Chat (Botpress) capturan variables conversacionales.
              </p>
            </div>

            {/* Tech 2 */}
            <div className="flex flex-col items-center gap-3 bg-brand-cream/30 dark:bg-brand-dark/20 p-5 rounded-2xl border border-brand-dark/5">
              <div className="w-12 h-12 rounded-2xl bg-brand-coral/10 text-brand-coral flex items-center justify-center shadow-xs">
                <Server className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">2. Orquestador n8n</h4>
              <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                Dispara el webhook, paraleliza APIs reales de viajes y guarda en base de datos.
              </p>
            </div>

            {/* Tech 3 */}
            <div className="flex flex-col items-center gap-3 bg-brand-cream/30 dark:bg-brand-dark/20 p-5 rounded-2xl border border-brand-dark/5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 dark:bg-purple-950/40 flex items-center justify-center shadow-xs">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">3. IA Generativa</h4>
              <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                El LLM en n8n filtra y estructura el viaje en base a la lógica de negocio.
              </p>
            </div>

            {/* Tech 4 */}
            <div className="flex flex-col items-center gap-3 bg-brand-cream/30 dark:bg-brand-dark/20 p-5 rounded-2xl border border-brand-dark/5">
              <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 text-brand-teal flex items-center justify-center shadow-xs">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-black text-brand-dark dark:text-brand-white uppercase">4. Cockpit Next.js</h4>
              <p className="text-[10px] text-text-muted leading-relaxed font-medium">
                La interfaz final interactiva con mapas, timelines, presupuestos y checklists.
              </p>
            </div>
          </div>
        </section>

        {/* 5. LLAMADA A LA ACCIÓN (CTA) */}
        <div className="bg-gradient-to-tr from-brand-blue to-brand-coral rounded-3xl p-8 text-center text-brand-white flex flex-col gap-5 items-center max-w-4xl mx-auto shadow-premium-xl">
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight">
            Prueba el Planificador de Viajes Inteligente
          </h3>
          <p className="text-xs max-w-lg leading-relaxed font-bold opacity-90">
            Pon a prueba nuestro Wizard de preferencias en tiempo real. Configura tus filtros y observa cómo simulamos la llamada con n8n para trazar tu viaje.
          </p>
          <Link
            href="/planner"
            className="px-8 py-3.5 rounded-full bg-brand-white text-brand-dark font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer mt-2"
          >
            Comenzar mi planificación
          </Link>
        </div>

      </div>
    </div>
  );
}
