import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { LogOut, User, Sparkles, HelpCircle, ScanSearch, PlusCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { ThemeToggle } from './ThemeToggle';
import { Link, useNavigate } from 'react-router-dom';

export const SeekerNavbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    api.getHealth()
      .then((res) => setAiStatus(res.aiProvider))
      .catch(() => setAiStatus({ isAvailable: false, reason: 'Offline' }));
  }, []);

  return (
    <header className="h-16 px-6 md:px-8 flex items-center justify-between sticky top-0 z-30 bg-[#11231D]/95 dark:bg-[#0A1612]/95 backdrop-blur-md border-b border-[#24483B] text-[#F4F5EE] transition-colors duration-200">
      {/* Brand & Mode */}
      <div className="flex items-center gap-3">
        <BrandLogo to="/app/seeker" size="sm" showTagline={false} variant="dark" />
        <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1A3028] text-[#C4E65D] border border-[#24483B] uppercase tracking-wider">
          Job Seeker Workspace
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Quick Match Action */}
        <Link
          to="/app/seeker/analysis"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2F8064] hover:bg-[#389474] text-white text-xs font-semibold shadow-xs transition-colors border border-[#3E9F7D]/40"
        >
          <ScanSearch className="w-3.5 h-3.5" />
          <span>Analyze Target Job</span>
        </Link>

        {/* AI Engine Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A3028] border border-[#24483B] text-xs shadow-xs">
          <div className={`w-2 h-2 rounded-full ${aiStatus?.isAvailable ? 'bg-[#C4E65D] animate-pulse' : 'bg-amber'}`} />
          <span className="text-[#DCE9DF] font-medium text-[11px]">
            {aiStatus?.isAvailable ? `Gemini (${aiStatus.model})` : 'Deterministic Engine'}
          </span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile & Sign Out */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#24483B]">
          <div className="flex items-center gap-2 text-xs text-[#F4F5EE]">
            <div className="w-7 h-7 rounded-full bg-[#2F8064] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {user?.displayName ? user.displayName[0].toUpperCase() : 'J'}
            </div>
            <div className="hidden md:block leading-tight text-left">
              <span className="block font-semibold">{user?.displayName || 'Job Seeker'}</span>
              <span className="text-[10px] text-[#A8BDAF] capitalize">{user?.role?.replace('_', ' ') || 'Candidate'}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-[#A8BDAF] hover:text-white hover:bg-[#1A3028] transition-colors cursor-pointer"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

