import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-10 md:p-12 text-center rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light flex items-center justify-center mb-4 border border-forest/20 shadow-2xs">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark mb-1">{title}</h3>
      <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-sm mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
