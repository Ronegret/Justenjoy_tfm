'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass, ArrowRight, Mail, Lock, Sparkles, User,
  Loader2, CheckCircle2, ChevronLeft, ShieldCheck, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, signup, loginWithGoogle, error } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'none' | 'email' | 'google'>('none');
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    'Preparando tu pasaporte digital...',
    'Sincronizando itinerarios guardados...',
    '¡Listo! Entrando a JUST ENJOY...'
  ];

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (user && !isSubmitting) {
      router.push('/dashboard');
    }
  }, [user, router, isSubmitting]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === 'signup' && !name)) return;

    setIsSubmitting(true);
    setLocalError(null);
    setAuthMethod('email');

    try {
      if (mode === 'login') {
        // Trigger simulated steps for nice UX before finishing
        const loginPromise = login(email, password);
        await triggerLoadingSteps();
        await loginPromise;
      } else {
        const signupPromise = signup(email, password, name);
        await triggerLoadingSteps();
        await signupPromise;
      }
      router.push('/dashboard');
    } catch (err: any) {
      setIsSubmitting(false);
      setLocalError(err.message || 'Ocurrió un error al iniciar sesión.');
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setLocalError(null);
    setAuthMethod('google');

    try {
      const googlePromise = loginWithGoogle();
      await triggerLoadingSteps();
      await googlePromise;
      router.push('/dashboard');
    } catch (err: any) {
      setIsSubmitting(false);
      setLocalError('Error al iniciar sesión con Google.');
    }
  };

  const triggerLoadingSteps = async () => {
    setLoadingStep(0);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingStep(1);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoadingStep(2);
    await new Promise((resolve) => setTimeout(resolve, 600));
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] flex items-center justify-center relative bg-brand-cream/30 dark:bg-brand-dark/10 p-4 overflow-hidden">

      {/* Dynamic Ambient Blur Backdrops */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-radial-at-c from-brand-blue/15 to-transparent blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-radial-at-c from-brand-coral/15 to-transparent blur-3xl -z-10 animate-pulse" />

      {/* Floating Travel Elements (Background decoration) */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-10 bottom-20 w-36 h-36 opacity-15 hidden lg:block pointer-events-none"
      >
        <img src="/images/las_sin_fondo/2.png" alt="Deco plane" className="w-full h-full object-contain" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 12, 0], rotate: [0, -6, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute right-16 top-16 w-40 h-40 opacity-20 hidden lg:block pointer-events-none"
      >
        <img src="/images/las_sin_fondo/3.png" alt="Deco travel" className="w-full h-full object-contain" />
      </motion.div>

      {/* Main Login Card Wrapper */}
      <div className="w-full max-w-md z-10">

        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-brand-dark dark:hover:text-brand-white uppercase tracking-wider mb-4 transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al inicio</span>
        </Link>

        {/* The Card */}
        <div className="w-full bg-brand-white dark:bg-brand-dark/50 border border-brand-dark/10 dark:border-brand-white/10 rounded-3xl p-6 md:p-8 shadow-premium relative overflow-hidden backdrop-blur-md">

          <AnimatePresence mode="wait">
            {!isSubmitting ? (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                {/* Header Logo & Greetings */}
                <div className="flex flex-col items-center text-center gap-2">
                  <motion.div
                    whileHover={{ rotate: 10, scale: 1.05 }}
                    className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-transparent shadow-xs mb-1"
                  >
                    <img src="/logo.png" alt="JUST ENJOY Logo" className="w-full h-full object-contain" />
                  </motion.div>

                  <h2 className="text-2xl font-black text-brand-dark dark:text-brand-white uppercase tracking-tight">
                    {mode === 'login' ? '¡Hola, viajero! 👋' : 'Crear tu Cuenta ✈️'}
                  </h2>
                  <p className="text-xs text-text-muted max-w-xs font-bold leading-relaxed">
                    {mode === 'login'
                      ? 'Inicia sesión en JUST ENJOY para gestionar tus itinerarios inteligentes y orquestar nuevas rutas.'
                      : 'Regístrate gratis para empezar a guardar tus viajes inteligentes y editarlos cuando quieras.'
                    }
                  </p>
                </div>

                {/* Error Alert Box */}
                {(localError || error) && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-brand-coral/10 border border-brand-coral/20 text-brand-coral p-3 rounded-xl flex items-start gap-2.5 text-xs font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{localError || error}</span>
                  </motion.div>
                )}

                {/* Google SSO Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  className="w-full py-3 px-4 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-white dark:bg-brand-dark/60 hover:bg-brand-cream/50 dark:hover:bg-brand-dark/40 text-xs font-extrabold text-brand-dark dark:text-brand-white transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-[0.99]"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5.04c1.67 0 3.2.58 4.4 1.71l3.28-3.28C17.7 1.58 15.02 1 12 1 7.35 1 3.37 3.68 1.4 7.62l3.86 3C6.18 7.62 8.86 5.04 12 5.04z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.92c2.2-2.03 3.67-5.02 3.67-8.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.26 14.62c-.25-.76-.39-1.57-.39-2.42s.14-1.66.39-2.42L1.4 6.78C.5 8.56 0 10.56 0 12.7s.5 4.14 1.4 5.92l3.86-3z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.92c-1.05.7-2.39 1.13-4.2 1.13-3.14 0-5.82-2.58-6.74-5.58L1.4 15.64C3.37 19.58 7.35 22 12 23z"
                    />
                  </svg>
                  <span>{mode === 'login' ? 'Acceder con Google' : 'Registrarse con Google'}</span>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 w-full">
                  <div className="h-[1px] bg-brand-dark/10 dark:bg-brand-white/10 flex-grow" />
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">o con tus datos</span>
                  <div className="h-[1px] bg-brand-dark/10 dark:bg-brand-white/10 flex-grow" />
                </div>

                {/* Email Form */}
                <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                  {/* Name Input (Only on Sign Up) */}
                  {mode === 'signup' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-1.5"
                    >
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Tu Nombre</label>
                      <div className="relative flex items-center">
                        <User className="w-4 h-4 text-text-muted absolute left-3.5 pointer-events-none" />
                        <input
                          type="text"
                          required
                          placeholder="Nombre Completo"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-cream/30 dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue"
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Email Input */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Correo Electrónico</label>
                    <div className="relative flex items-center">
                      <Mail className="w-4 h-4 text-text-muted absolute left-3.5 pointer-events-none" />
                      <input
                        type="email"
                        required
                        placeholder="viajero@justenjoy.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-cream/30 dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-text-muted uppercase tracking-wider">Contraseña</label>
                      {mode === 'login' && (
                        <a href="#" className="text-[9px] font-black text-brand-blue uppercase hover:underline">¿La olvidaste?</a>
                      )}
                    </div>
                    <div className="relative flex items-center">
                      <Lock className="w-4 h-4 text-text-muted absolute left-3.5 pointer-events-none" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-dark/10 dark:border-brand-white/10 bg-brand-cream/30 dark:bg-brand-dark/40 text-xs text-brand-dark dark:text-brand-white focus:outline-hidden focus:ring-1 focus:ring-brand-blue"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-coral hover:from-brand-blue/95 hover:to-brand-coral/95 text-brand-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                  >
                    <span>{mode === 'login' ? 'Entrar a mi cabina' : 'Crear mi cuenta'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Footer toggle text */}
                <div className="text-center text-xs text-text-muted mt-2 border-t border-brand-dark/5 dark:border-brand-white/5 pt-4">
                  {mode === 'login' ? (
                    <>
                      <span>¿Aún no tienes cuenta? </span>
                      <button
                        onClick={() => { setMode('signup'); setLocalError(null); }}
                        className="font-extrabold text-brand-blue hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Regístrate gratis
                      </button>
                    </>
                  ) : (
                    <>
                      <span>¿Ya tienes cuenta? </span>
                      <button
                        onClick={() => { setMode('login'); setLocalError(null); }}
                        className="font-extrabold text-brand-blue hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        Inicia sesión
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              /* Premium Mock Loading State Screen */
              <motion.div
                key="loading-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center text-center gap-6 py-8"
              >
                {/* Rotating AI compass */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                  className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-coral flex items-center justify-center text-brand-white shadow-md shadow-brand-blue/20"
                >
                  <Compass className="w-6 h-6" />
                </motion.div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-black text-brand-dark dark:text-brand-white uppercase tracking-tight">
                    {mode === 'login' ? 'Iniciando Sesión' : 'Creando Cuenta'}
                  </h3>
                  <p className="text-xs text-brand-teal flex items-center justify-center gap-1 font-extrabold uppercase">
                    <Sparkles className="w-3.5 h-3.5 text-brand-coral" />
                    <span>Conexión Segura JUST ENJOY</span>
                  </p>
                </div>

                {/* Processing step checks */}
                <div className="w-full bg-brand-cream/50 dark:bg-brand-dark/30 rounded-xl p-4 border border-brand-dark/5 flex flex-col gap-3 text-left">
                  {loadingSteps.map((stepText, idx) => {
                    const isCompleted = idx < loadingStep;
                    const isActive = idx === loadingStep;

                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between text-xs transition-opacity duration-300 ${
                          isCompleted || isActive ? 'opacity-100 font-bold' : 'opacity-30'
                        }`}
                      >
                        <span className={isCompleted ? 'text-brand-teal line-through' : 'text-brand-dark dark:text-brand-white'}>
                          {stepText}
                        </span>
                        <div>
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />
                          ) : isActive ? (
                            <Loader2 className="w-4 h-4 text-brand-blue animate-spin shrink-0" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-brand-dark/20 dark:bg-brand-white/20" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-text-muted flex items-center gap-1.5 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-brand-teal" />
                  <span>Logeado mediante {authMethod === 'google' ? 'Google SSO' : 'Email Encriptado'}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
