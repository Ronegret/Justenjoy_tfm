'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth, googleProvider } from '@/lib/firebase';

interface User {
  name: string;
  email: string;
}

// Normaliza un error desconocido de un catch a { code, message } sin usar `any`.
// Firebase lanza FirebaseError (con `code`); el resto se degrada a Error/string.
function firebaseErr(err: unknown): { code: string; message: string } {
  if (err instanceof FirebaseError) return { code: err.code, message: err.message };
  if (err instanceof Error) return { code: '', message: err.message };
  return { code: '', message: String(err) };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Establece la cookie de sesión del servidor a partir del usuario de Firebase
  // ya autenticado en el cliente. Antes esto solo ocurría dentro del listener
  // onAuthStateChanged, de forma asíncrona y desacoplada de login()/signup() —
  // la página de login navegaba con window.location.assign() en cuanto el SDK
  // de Firebase confirmaba el login, sin esperar a esta petición. Si la
  // navegación empezaba antes de que el fetch terminara, el navegador la
  // cancelaba (TypeError: Failed to fetch), dejando cliente y servidor
  // desincronizados hasta que un segundo intento (o la siguiente carga de
  // página) lo arreglaba solo. Ahora login()/signup()/loginWithGoogle()
  // esperan explícitamente a que esto termine antes de resolver.
  const establishServerSession = async (firebaseUser: FirebaseUser): Promise<boolean> => {
    try {
      const idToken = await firebaseUser.getIdToken(true);
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
      if (!res.ok) {
        console.error('[Auth] el servidor no pudo crear la sesión:', res.status);
      }
      return res.ok;
    } catch (e) {
      console.error('[Auth] Error al establecer cookie de sesión:', e);
      return false;
    }
  };

  const mapFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
      case 'auth/redirect-cancelled-by-user':
        return 'Inicio de sesión cancelado. Vuelve a intentarlo.';
      case 'auth/popup-blocked':
        return 'Popup bloqueado — redirigiendo a Google...';
      case 'auth/unauthorized-domain':
        return 'Dominio no autorizado en Firebase Console → Authentication → Dominios autorizados.';
      case 'auth/operation-not-allowed':
        return 'Google Sign-In no habilitado en Firebase Console → Authentication → Sign-in method.';
      case 'auth/account-exists-with-different-credential':
        return 'Ya existe una cuenta con ese email. Prueba con email y contraseña.';
      case 'auth/network-request-failed':
        return 'Error de red. Comprueba tu conexión.';
      case 'auth/web-storage-unsupported':
        return 'El navegador bloquea el almacenamiento. Desactiva el modo privado o permite cookies.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Este correo ya está registrado.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'Formato de correo no válido.';
      default:
        return `Error Firebase [${code || 'sin-código'}] — revisa la consola del navegador (F12).`;
    }
  };

  useEffect(() => {
    // Capture result when returning from signInWithRedirect
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser({
            name: result.user.displayName || result.user.email?.split('@')[0] || 'Viajero',
            email: result.user.email || ''
          });
        }
      })
      .catch((err: unknown) => {
        const { code, message } = firebaseErr(err);
        if (code === 'auth/no-auth-event') return; // Normal on non-redirect loads
        console.error('[Auth] getRedirectResult error — code:', code, message);
        setError(mapFirebaseError(code));
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fuerza un ID token fresco: createSessionCookie es estricto con la
        // antigüedad del token y rechazaría uno cacheado al restaurar sesión.
        const sessionOk = await establishServerSession(firebaseUser);
        if (sessionOk) {
          setUser({
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Viajero',
            email: firebaseUser.email || ''
          });
        } else {
          // Sin cookie de sesión válida, el cliente y el servidor quedarían
          // desincronizados (UI "logueada" que no puede usar rutas protegidas).
          // Reconciliamos cerrando sesión y mostrando el error.
          setError('No se pudo iniciar sesión en el servidor. Vuelve a intentarlo.');
          setUser(null);
          await signOut(auth);
        }
      } else {
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (e) {
          console.error('[Auth] Error al eliminar cookie de sesión:', e);
        }
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Mensaje/reconciliación compartidos cuando el login de Firebase (cliente)
  // funciona pero el servidor no logra establecer la cookie de sesión —
  // mismo caso que ya manejaba onAuthStateChanged, reutilizado aquí para que
  // login()/signup()/loginWithGoogle() no resuelvan con una sesión a medias.
  const failSessionEstablishment = async (): Promise<never> => {
    const msg = 'No se pudo iniciar sesión en el servidor. Vuelve a intentarlo.';
    setError(msg);
    setUser(null);
    await signOut(auth);
    throw new Error(msg);
  };

  const login = async (email: string, password: string) => {
    setError(null);
    let cred;
    try {
      cred = await signInWithEmailAndPassword(auth, email, password);
    } catch (err: unknown) {
      const { code, message } = firebaseErr(err);
      console.error('[Auth] login error:', code, message);
      const msg = mapFirebaseError(code);
      setError(msg);
      throw new Error(msg);
    }
    // Esperamos a que la cookie de sesión del servidor quede establecida
    // ANTES de resolver: la página de login navega en cuanto esta promesa
    // termina, y si no esperamos aquí esa navegación cancela el fetch en
    // curso (ver establishServerSession más arriba).
    if (!(await establishServerSession(cred.user))) {
      await failSessionEstablishment();
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    let cred;
    try {
      cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
    } catch (err: unknown) {
      const { code, message } = firebaseErr(err);
      console.error('[Auth] signup error:', code, message);
      const msg = mapFirebaseError(code);
      setError(msg);
      throw new Error(msg);
    }
    if (!(await establishServerSession(cred.user))) {
      await failSessionEstablishment();
      return;
    }
    setUser({ name, email });
  };

  const loginWithGoogle = async () => {
    setError(null);
    let cred;
    try {
      // Attempt popup first — faster UX, no cross-origin cookie dependency
      cred = await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const { code, message } = firebaseErr(err);
      console.error('[Auth] signInWithPopup error:', code, message);

      if (
        code === 'auth/popup-blocked' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cross-origin-opener-policy-same-origin'
      ) {
        // Fallback: full-page redirect if popup is blocked or closed
        try {
          await signInWithRedirect(auth, googleProvider);
          // Wait indefinitely while browser navigates away, to prevent success logic from firing
          return new Promise<void>(() => {});
        } catch (redirectErr: unknown) {
          const re = firebaseErr(redirectErr);
          console.error('[Auth] signInWithRedirect error:', re.code, re.message);
          const msg = mapFirebaseError(re.code);
          setError(msg);
          throw new Error(msg);
        }
      }

      // Any other error: show message
      const msg = mapFirebaseError(code);
      setError(msg);
      throw new Error(msg);
    }
    if (!(await establishServerSession(cred.user))) {
      await failSessionEstablishment();
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[Auth] logout error:', err);
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: unknown) {
      const { code, message } = firebaseErr(err);
      console.error('[Auth] resetPassword error:', code, message);
      // Firebase Auth puede tener "email enumeration protection" activado
      // (por defecto en proyectos nuevos): en ese caso siempre devuelve éxito
      // aunque el email no exista, así que auth/user-not-found solo aparece
      // con proyectos configurados a la antigua. Lo tratamos igual que un
      // envío correcto para no filtrar qué emails están registrados.
      if (code === 'auth/user-not-found') return;
      const msg = mapFirebaseError(code);
      setError(msg);
      throw new Error(msg);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, loginWithGoogle, logout, resetPassword, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
