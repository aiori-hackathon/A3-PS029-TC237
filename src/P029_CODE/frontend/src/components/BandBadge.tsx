import React from 'react';

interface BandBadgeProps {
  band: string;
  small?: boolean;
}

const BAND_CONFIG: Record<string, { bg: string; border: string; text: string }> = {
  Optimal:    { bg: 'bg-emerald-900/50', border: 'border-emerald-700/60', text: 'text-emerald-400' },
  Acceptable: { bg: 'bg-blue-900/50',   border: 'border-blue-700/60',   text: 'text-blue-400'   },
  Degraded:   { bg: 'bg-amber-900/50',  border: 'border-amber-700/60',  text: 'text-amber-400'  },
  Critical:   { bg: 'bg-red-900/50',    border: 'border-red-700/60',    text: 'text-red-400'    },
};

export const BandBadge: React.FC<BandBadgeProps> = ({ band, small = false }) => {
  const cfg = BAND_CONFIG[band] ?? { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400' };
  return (
    <span
      className={`inline-flex items-center font-bold uppercase tracking-widest border rounded-full
        ${cfg.bg} ${cfg.border} ${cfg.text}
        ${small ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-xs'}`}
    >
      {band}
    </span>
  );
};
