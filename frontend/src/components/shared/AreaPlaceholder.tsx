import React from 'react';
import { type LucideIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AreaPlaceholderProps {
  area: 'PUBLIC' | 'USER' | 'ADMIN' | 'INTELLIGENCE';
  title: string;
  description: string;
  route: string;
  icon: LucideIcon;
  features?: string[];
  ctaLink?: string;
  ctaText?: string;
}

const areaThemes = {
  PUBLIC: {
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    accentBorder: 'border-cyan-500/20',
  },
  USER: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    accentBorder: 'border-blue-500/20',
  },
  ADMIN: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    accentBorder: 'border-amber-500/20',
  },
  INTELLIGENCE: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    iconBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/40',
    accentBorder: 'border-cyan-500/30 shadow-[0_0_20px_rgba(0,242,254,0.05)]',
  },
};

export const AreaPlaceholder: React.FC<AreaPlaceholderProps> = ({
  area,
  title,
  description,
  route,
  icon: Icon,
  features,
  ctaLink,
  ctaText,
}) => {
  const theme = areaThemes[area];

  return (
    <div className={`rounded-xl bg-slate-900/50 backdrop-blur-md border ${theme.accentBorder} p-6 sm:p-8 space-y-6 max-w-4xl mx-auto`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${theme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold border ${theme.badge}`}>
                {area} AREA
              </span>
              <span className="text-[11px] font-mono text-slate-500">{route}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg self-start sm:self-center">
          <ShieldCheck className="w-4 h-4" />
          <span>Fase 2: Arsitektur Siap</span>
        </div>
      </div>

      <p className="text-slate-300 text-sm leading-relaxed sm:text-base">
        {description}
      </p>

      {features && features.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400">
            Komponen & Fitur (Tahap Pengembangan):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-200"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {ctaLink && ctaText && (
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <Link
            to={ctaLink}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/20 transition-all hover:gap-3"
          >
            <span>{ctaText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};
