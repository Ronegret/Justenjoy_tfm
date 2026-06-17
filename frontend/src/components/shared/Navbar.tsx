'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Briefcase, CreditCard, Info, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  const navLinks = [
    { name: 'Inicio', href: '/', icon: Compass },
    { name: 'Mis Viajes', href: '/dashboard', icon: Briefcase },
    { name: 'Precios', href: '/pricing', icon: CreditCard },
    { name: 'Nosotros', href: '/about', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-brand-white/10 px-4 lg:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-transparent"
          >
            <img src="/logo.png" alt="JUST ENJOY Logo" className="w-full h-full object-contain" />
          </motion.div>
          <span className="text-xl font-black tracking-tight text-brand-dark dark:text-brand-white uppercase">
            JUST <span className="text-brand-blue font-bold">ENJOY</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-brand-dark/5 dark:bg-brand-white/5 p-1 rounded-full border border-brand-dark/10 dark:border-brand-white/5">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'text-brand-blue dark:text-brand-white'
                    : 'text-text-muted hover:text-brand-dark dark:hover:text-brand-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-nav-indicator"
                    className="absolute inset-0 bg-brand-white dark:bg-brand-dark rounded-full shadow-sm -z-10 border border-brand-dark/5"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4" />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs font-bold text-brand-dark dark:text-brand-white uppercase bg-brand-dark/5 dark:bg-brand-white/5 px-3 py-1.5 rounded-full border border-brand-dark/10 dark:border-brand-white/10">
                👋 {user?.name.split(' ')[0]}
              </span>
              <button
                onClick={logout}
                className="hidden sm:inline-flex text-xs font-black text-brand-coral uppercase tracking-wider hover:text-brand-coral/80 transition-colors cursor-pointer px-2 py-2"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex text-sm font-semibold text-brand-dark dark:text-brand-white hover:text-brand-blue transition-colors px-3 py-2"
            >
              Iniciar Sesión
            </Link>
          )}
          <Link
            href="/planner"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-brand-blue to-brand-coral hover:from-brand-blue/90 hover:to-brand-coral/90 text-brand-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Planificar</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
