import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Settings,
  Scale,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const navItems = [
    { to: '/app', label: 'Recruiter Dashboard', icon: LayoutDashboard },
    { to: '/app/jobs', label: 'Job Openings', icon: Briefcase },
    { to: '/app/candidates', label: 'Candidate Pool', icon: Users },
    { to: '/app/comparison', label: 'Compare Candidates', icon: Scale },
    { to: '/app/analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { to: '/app/settings', label: 'Settings & Health', icon: Settings }
  ];

  return (
    <aside className="w-64 editorial-sidebar flex flex-col justify-between p-4 hidden md:flex shrink-0 bg-surface/80 dark:bg-surface-dark/95 border-r border-stone dark:border-stone-dark transition-colors duration-200">
      <div className="space-y-6">
        <div className="px-3 pt-2">
          <p className="text-[11px] font-semibold tracking-wider text-ink-muted dark:text-ink-muted-dark uppercase">
            Workspace
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-forest text-white dark:bg-forest shadow-xs'
                      : 'text-ink-light dark:text-ink-light-dark hover:text-ink dark:hover:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark/50'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-xl bg-ivory dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-muted-dark shadow-2xs">
        <div className="flex items-center gap-1.5 text-forest dark:text-forest-light font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TalentrivoX AI</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Evidence-backed candidate evaluation & interview preparation.
        </p>
      </div>
    </aside>
  );
};
