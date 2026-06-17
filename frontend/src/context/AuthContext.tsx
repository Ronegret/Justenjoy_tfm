'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
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

  // Synchronize authentication state in real time with Firebase
  useEffect(() => {
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

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      console.error('Firebase Login Error:', err.code, err.message);
      let msg = 'Error al iniciar sesión.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        msg = 'El correo electrónico o la contraseña son incorrectos.';
      }
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
        // Manually update local user state
        setUser({ name, email });
      }
    } catch (err: any) {
      console.error('Firebase Signup Error:', err.code, err.message);
      let msg = 'Error al registrar el usuario.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Este correo electrónico ya está registrado.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'El formato del correo electrónico no es válido.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Firebase Google Login Error:', err.code, err.message);
      let msg = 'Error al iniciar sesión con Google.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Ventana cerrada. Vuelve a intentarlo.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'El navegador bloqueó la ventana de Google. Permite los pop-ups para este sitio.';
      } else if (err.code === 'auth/unauthorized-domain') {
        msg = 'Dominio no autorizado en Firebase. Añade este dominio en Firebase Console → Authentication → Dominios autorizados.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'El inicio de sesión con Google no está habilitado. Actívalo en Firebase Console → Authentication → Sign-in method → Google.';
      } else if (err.code === 'auth/cancelled-popup-request') {
        msg = 'Solicitud cancelada. Vuelve a intentarlo.';
      } else if (err.code === 'auth/network-request-failed') {
        msg = 'Error de red. Comprueba tu conexión a internet.';
      }
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
