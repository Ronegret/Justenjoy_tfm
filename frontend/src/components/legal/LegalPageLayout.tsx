import React from 'react';
import Link from 'next/link';
import { ChevronLeft, LucideIcon } from 'lucide-react';

interface LegalPageLayoutProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro: string;
  children: React.ReactNode;
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-black text-brand-dark uppercase tracking-tight">{title}</h2>
      <div className="text-sm text-text-muted leading-relaxed flex flex-col gap-3">{children}</div>
    </section>
  );
}

export default function LegalPageLayout({ icon: Icon, eyebrow, title, lastUpdated, intro, children }: LegalPageLayoutProps) {
  return (
    <div className="w-full flex-grow bg-brand-cream/30 py-16 px-4 lg:px-8">
      <div className="max-w-3xl mx-auto flex flex-col gap-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-brand-dark uppercase tracking-wider w-fit transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al inicio</span>
        </Link>

        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 text-xs font-black text-brand-blue bg-brand-blue/10 border border-brand-blue/20 px-4 py-2 rounded-full w-fit uppercase">
            <Icon className="w-4 h-4 text-brand-coral" />
            {eyebrow}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark uppercase leading-tight tracking-normal">
            {title}
          </h1>
          <p className="text-sm text-text-muted">Última actualización: {lastUpdated}</p>
          <p className="text-base text-text-muted leading-relaxed max-w-2xl font-medium">{intro}</p>
        </div>

        <div className="bg-brand-white border border-brand-dark/10 rounded-3xl p-7 lg:p-9 shadow-premium flex flex-col gap-8">
          {children}
        </div>
      </div>
    </div>
  );
}
