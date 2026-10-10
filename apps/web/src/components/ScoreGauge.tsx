import React from 'react';

interface ScoreGaugeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md', label }) => {
  if (score === null || score === undefined) {
    return <span className="text-xs text-ink-muted dark:text-ink-muted-dark italic font-mono">Unscored</span>;
  }

  const rounded = Math.round(score * 10) / 10;

  let colorClasses = {
    text: 'text-brand-error dark:text-rose-300',
    bg: 'bg-brand-error-light dark:bg-rose-950/40',
    border: 'border-brand-error/20 dark:border-rose-900/40',
    bar: 'bg-brand-error dark:bg-rose-400'
  };

  if (rounded >= 80) {
    colorClasses = {
      text: 'text-forest dark:text-forest-light',
      bg: 'bg-forest-faint dark:bg-forest/20',
      border: 'border-forest/20 dark:border-forest/40',
      bar: 'bg-forest dark:bg-forest-light'
    };
  } else if (rounded >= 60) {
    colorClasses = {
      text: 'text-ink dark:text-ink-dark',
      bg: 'bg-stone-warm dark:bg-stone-dark',
      border: 'border-stone dark:border-stone-dark',
      bar: 'bg-forest/70 dark:bg-forest-light/70'
    };
  } else if (rounded >= 40) {
    colorClasses = {
      text: 'text-amber dark:text-amber-light',
      bg: 'bg-amber-light dark:bg-amber/20',
      border: 'border-amber/30 dark:border-amber/40',
      bar: 'bg-amber dark:bg-amber-light'
    };
  }

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-lg font-mono font-bold text-xs border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}>
        {rounded}%
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center">
        <div className={`w-24 h-24 rounded-3xl flex flex-col items-center justify-center border-2 ${colorClasses.border} ${colorClasses.bg} shadow-xs`}>
          <span className={`text-3xl font-extrabold font-mono tracking-tight ${colorClasses.text}`}>
            {rounded}
          </span>
          <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark uppercase tracking-widest font-bold font-sans">Match</span>
        </div>
        {label && <span className="text-xs text-ink-muted dark:text-ink-muted-dark mt-2 font-semibold">{label}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}>
        {rounded}%
      </div>
      <div className="w-16 h-2 bg-stone-light dark:bg-stone-dark/80 rounded-full overflow-hidden">
        <div className={`h-full ${colorClasses.bar} rounded-full transition-all duration-300`} style={{ width: `${Math.min(100, rounded)}%` }} />
      </div>
    </div>
  );
};
