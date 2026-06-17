'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
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

  useEffect(() => {
    // Capture redirect result when user comes back from Google
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
        console.error('Google redirect error:', err.code, err.message);
        const msg = mapFirebaseError(err.code);
        setError(msg);
      });

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Viajero',
          email: firebaseUser.email || ''
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const mapFirebaseError = (code: string): string => {
    switch (code) {
      case 'auth/popup-closed-by-user':
      case 'auth/cancelled-popup-request':
        return 'Inicio de sesión cancelado. Vuelve a intentarlo.';
      case 'auth/popup-blocked':
        return 'El navegador bloqueó la ventana de Google. Permite los pop-ups para este sitio.';
      case 'auth/unauthorized-domain':
        return 'Dominio no autorizado en Firebase. Contacta al administrador.';
      case 'auth/operation-not-allowed':
        return 'El inicio de sesión con Google no está habilitado. Actívalo en Firebase Console.';
      case 'auth/network-request-failed':
        return 'Error de red. Comprueba tu conexión a internet.';
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'El correo electrónico o la contraseña son incorrectos.';
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      default:
        return `Error de autenticación (${code || 'desconocido'}).`;
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Firebase Login Error:', err.code, err.message);
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName: name });
        setUser({ name, email });
      }
    } catch (err: any) {
      console.error('Firebase Signup Error:', err.code, err.message);
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  // Redirects to Google — user comes back to the app after authenticating
  const loginWithGoogle = async () => {
    setError(null);
    try {
      await signInWithRedirect(auth, googleProvider);
      // Execution stops here — browser navigates to Google
    } catch (err: any) {
      console.error('Google redirect error:', err.code, err.message);
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
