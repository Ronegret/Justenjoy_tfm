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
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      .catch((err: any) => {
        if (err.code === 'auth/no-auth-event') return; // Normal on non-redirect loads
        console.error('[Auth] getRedirectResult error — code:', err.code, err.message);
        setError(mapFirebaseError(err.code));
      });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
          });
        } catch (e) {
          console.error('[Auth] Error al establecer cookie de sesión:', e);
        }
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Viajero',
          email: firebaseUser.email || ''
        });
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

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('[Auth] login error:', err.code, err.message);
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        setUser({ name, email });
      }
    } catch (err: any) {
      console.error('[Auth] signup error:', err.code, err.message);
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      // Attempt popup first — faster UX, no cross-origin cookie dependency
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('[Auth] signInWithPopup error:', err.code, err.message);

      if (err.code === 'auth/popup-blocked' || err.code === 'auth/cancelled-popup-request') {
        // Fallback: full-page redirect if popup is blocked
        try {
          await signInWithRedirect(auth, googleProvider);
          return; // Browser navigates away
        } catch (redirectErr: any) {
          console.error('[Auth] signInWithRedirect error:', redirectErr.code, redirectErr.message);
          const msg = mapFirebaseError(redirectErr.code);
          setError(msg);
          throw new Error(msg);
        }
      }

      // Any other error: show message
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('[Auth] logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, signup, loginWithGoogle, logout, error }}
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
