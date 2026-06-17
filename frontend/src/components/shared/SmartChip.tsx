'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface SmartChipProps {
  label: string;
  isSelected?: boolean;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
}

export const SmartChip: React.FC<SmartChipProps> = ({
  label,
  isSelected = false,
  onClick,
  icon: Icon
}) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold shadow-sm transition-all border cursor-pointer ${
        isSelected
          ? 'bg-brand-blue text-brand-white border-brand-blue'
          : 'bg-brand-white dark:bg-brand-dark/40 text-text-dark dark:text-brand-cream border-brand-dark/10 dark:border-brand-white/10 hover:border-brand-blue/30'
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5" />}
      <span>{label}</span>
      {isSelected && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        >
          <Check className="w-3 h-3 stroke-[3px]" />
        </motion.span>
      )}
    </motion.button>
  );
};
export default SmartChip;
