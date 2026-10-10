import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  FileText,
  ScanSearch,
  PenTool,
  CheckCircle2,
  HelpCircle,
  Compass,
  Kanban,
  BookmarkCheck,
  Settings,
  Sparkles,
  Zap
} from 'lucide-react';

export const SeekerSidebar: React.FC = () => {
  const navItems = [
    { to: '/app/seeker', label: 'Career Overview', icon: LayoutDashboard },
    { to: '/app/seeker/jobs', label: 'AI Job Discovery', icon: Search },
    { to: '/app/seeker/resumes', label: 'My Resumes Vault', icon: FileText },
    { to: '/app/seeker/analysis', label: 'Resume-to-Job Analysis', icon: ScanSearch },
    { to: '/app/seeker/studio', label: 'Resume Studio & Rewrites', icon: PenTool },
    { to: '/app/seeker/ats-check', label: 'ATS Quality Checker', icon: CheckCircle2 },
    { to: '/app/seeker/interview-prep', label: 'Interview Prep & Mocks', icon: HelpCircle },
    { to: '/app/seeker/roadmap', label: 'Skill Roadmap', icon: Compass },
    { to: '/app/seeker/applications', label: 'Application Tracker', icon: Kanban },
    { to: '/app/seeker/saved-jobs', label: 'Saved Target Jobs', icon: BookmarkCheck },
    { to: '/app/settings', label: 'Settings & Privacy', icon: Settings }
  ];

  return (
    <aside className="w-64 editorial-sidebar flex flex-col justify-between p-4 hidden md:flex shrink-0 bg-surface/80 dark:bg-surface-dark/95 border-r border-stone dark:border-stone-dark transition-colors duration-200">
      <div className="space-y-4">
        <div className="px-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-wider text-ink-muted dark:text-ink-dark-muted uppercase">
              Job Seeker Studio
            </p>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-forest-faint dark:bg-forest/25 text-forest dark:text-emerald-300 border border-forest/20">
              Active Role
            </span>
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/app/seeker'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-forest text-white dark:bg-forest shadow-xs'
                      : 'text-ink-light dark:text-ink-dark-secondary hover:text-ink dark:hover:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark/50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-xl bg-ivory dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted shadow-2xs">
        <div className="flex items-center gap-1.5 text-forest dark:text-emerald-400 font-semibold mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>TalentrivoX AI</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Personal career intelligence, resume optimization & interview simulation.
        </p>
      </div>
    </aside>
  );
};
