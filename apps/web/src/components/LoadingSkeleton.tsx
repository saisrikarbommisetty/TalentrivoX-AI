import React from 'react';

export const LoadingSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 bg-stone-light/80 dark:bg-stone-dark/50 rounded-xl w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-stone-light/80 dark:bg-stone-dark/50 rounded-2xl border border-stone/50 dark:border-stone-dark/50" />
        ))}
      </div>
      <div className="space-y-3 pt-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="h-16 bg-stone-light/80 dark:bg-stone-dark/50 rounded-xl border border-stone/40 dark:border-stone-dark/40" />
        ))}
      </div>
    </div>
  );
};
