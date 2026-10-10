import React from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
  isDark?: boolean;
  variant?: 'light' | 'dark' | 'auto';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  to = '/',
  size = 'md',
  showTagline = false,
  className = '',
  isDark,
  variant = 'auto'
}) => {
  const iconSize = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-10 h-10' : 'w-8 h-8';
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';
  const forceDark = isDark || variant === 'dark';

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon Symbol */}
      <div className={`${iconSize} rounded-xl ${forceDark ? 'bg-[#24483B] border border-[#347B60]/60' : 'bg-forest'} flex items-center justify-center text-white shadow-sm shrink-0 relative overflow-hidden group`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-4/5 h-4/5 text-white stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7V4h16v3" />
          <path d="M9 20h6" />
          <path d="M12 4v16" />
          <circle cx="18" cy="18" r="2.5" className="fill-amber stroke-none" />
        </svg>
      </div>

      {/* Typography Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`${textSize} font-bold font-sans tracking-tight ${forceDark ? 'text-white' : 'text-ink dark:text-ink-dark'}`}>
            Talentrivo<span className={forceDark ? 'text-[#C4E65D]' : 'text-forest dark:text-forest-light'}>X</span>
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
            forceDark
              ? 'bg-[#1A3028] text-[#C4E65D] border border-[#24483B]'
              : 'bg-sage-light text-forest border border-sage/40 dark:bg-forest/30 dark:text-sage-light dark:border-forest/40'
          }`}>
            AI
          </span>
        </div>
        {showTagline && (
          <span className={`text-[10px] tracking-tight mt-0.5 font-medium ${forceDark ? 'text-[#A8BDAF]' : 'text-ink-muted dark:text-ink-muted-dark'}`}>
            Evidence-Backed Candidate Intelligence
          </span>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex hover:opacity-95 transition-opacity focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
};
