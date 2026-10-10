import React from 'react';

interface AmbientBackgroundProps {
  variant?: 'auth' | 'dashboard' | 'hero' | 'minimal';
  className?: string;
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({
  variant = 'dashboard',
  className = ''
}) => {
  return (
    <div
      className={`tale-bubble-layer select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {variant === 'auth' && (
        <>
          {/* Ambient Orbs for Auth Split Screen */}
          <div className="tale-bubble tale-bubble-emerald tale-anim-float-1 w-96 h-96 -top-20 -left-20" />
          <div className="tale-bubble tale-bubble-mint tale-anim-float-2 w-80 h-80 top-1/3 -right-20 opacity-70" />
          <div className="tale-bubble tale-bubble-lime tale-anim-float-3 w-64 h-64 -bottom-10 left-1/4 opacity-60" />
          <div className="tale-bubble tale-bubble-ring tale-anim-float-1 w-48 h-48 top-16 right-1/4" />
          <div className="tale-bubble tale-bubble-ring tale-anim-float-2 w-28 h-28 bottom-24 right-12" />
        </>
      )}

      {variant === 'hero' && (
        <>
          {/* Hero Vibrant Ambient Lighting */}
          <div className="tale-bubble tale-bubble-emerald tale-anim-float-1 w-[500px] h-[500px] -top-32 left-1/2 -translate-x-1/2 opacity-80" />
          <div className="tale-bubble tale-bubble-mint tale-anim-float-2 w-96 h-96 top-24 -left-20 opacity-70" />
          <div className="tale-bubble tale-bubble-lime tale-anim-float-3 w-80 h-80 top-40 -right-20 opacity-60" />
          <div className="tale-bubble tale-bubble-ring tale-anim-float-2 w-64 h-64 top-1/2 left-12" />
          <div className="tale-bubble tale-bubble-ring tale-anim-float-1 w-40 h-40 top-1/3 right-16" />
          <div className="tale-bubble tale-bubble-sage tale-anim-pulse w-[600px] h-96 -bottom-20 left-1/2 -translate-x-1/2" />
        </>
      )}

      {variant === 'dashboard' && (
        <>
          {/* Subtle Workspace Ambience */}
          <div className="tale-bubble tale-bubble-emerald tale-anim-float-1 w-80 h-80 -top-20 right-10 opacity-40 dark:opacity-50" />
          <div className="tale-bubble tale-bubble-mint tale-anim-float-2 w-72 h-72 top-1/3 -left-20 opacity-35 dark:opacity-45" />
          <div className="tale-bubble tale-bubble-lime tale-anim-float-3 w-56 h-56 -bottom-10 right-1/4 opacity-30 dark:opacity-40" />
          <div className="tale-bubble tale-bubble-ring tale-anim-float-1 w-36 h-36 top-12 left-1/3 opacity-50" />
          <div className="tale-bubble tale-bubble-ring tale-anim-float-2 w-24 h-24 bottom-1/3 right-10 opacity-40" />
        </>
      )}

      {variant === 'minimal' && (
        <>
          <div className="tale-bubble tale-bubble-emerald tale-anim-float-1 w-64 h-64 -top-10 -right-10 opacity-30" />
          <div className="tale-bubble tale-bubble-mint tale-anim-float-2 w-48 h-48 -bottom-10 -left-10 opacity-30" />
        </>
      )}
    </div>
  );
};
