'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="flex items-center justify-center w-9 h-9 rounded-xl bg-brand-dark/5 dark:bg-brand-white/10 border border-brand-dark/10 dark:border-brand-white/10 text-brand-dark dark:text-brand-white transition-colors hover:bg-brand-dark/10 dark:hover:bg-brand-white/20 cursor-pointer"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

export default ThemeToggle;
