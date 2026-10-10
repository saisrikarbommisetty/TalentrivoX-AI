import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2 rounded-xl border border-stone dark:border-stone-dark bg-surface dark:bg-surface-dark text-ink-light dark:text-ink-dark hover:text-forest dark:hover:text-forest-light hover:bg-stone-warm dark:hover:bg-stone-dark/60 transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-forest ${className}`}
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      aria-label={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-dark transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-forest transition-transform duration-300 rotate-0 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-medium">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
};
