import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Settings,
  Cpu,
  ShieldCheck,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Server,
  Lock,
  FileCode2,
  Trash2,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useTheme } from '../context/ThemeContext';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    api.getHealth()
      .then((res) => setHealthData(res))
      .catch((err) => setHealthData({ status: 'offline', error: err.message }))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  const aiProvider = healthData?.aiProvider || {};

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">System Settings & Health</h1>
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
          Visual appearance, operational infrastructure, AI provider configuration, and security controls
        </p>
      </div>

      {/* Appearance & Theme Selector Card */}
      <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-faint dark:bg-forest/20 border border-forest/20 flex items-center justify-center text-forest dark:text-forest-light">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-ink dark:text-ink-dark">Appearance & Theme</h2>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Customize the workspace color scheme and visual contrast</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              theme === 'light'
                ? 'border-forest bg-forest-faint/40 dark:bg-forest/10 ring-1 ring-forest'
                : 'border-stone dark:border-stone-dark bg-ivory dark:bg-ivory-dark hover:border-forest/40'
            }`}
          >
            <Sun className="w-5 h-5 text-amber shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs text-ink dark:text-ink-dark block">Light Mode (Editorial Warm)</span>
              <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark mt-0.5">Warm ivory surfaces, deep charcoal typography, forest-green accents</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'border-forest bg-forest/20 ring-1 ring-forest'
                : 'border-stone dark:border-stone-dark bg-ivory dark:bg-ivory-dark hover:border-forest/40'
            }`}
          >
            <Moon className="w-5 h-5 text-forest dark:text-forest-light shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-xs text-ink dark:text-ink-dark block">Dark Mode (Deep Forest Night)</span>
              <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark mt-0.5">Deep charcoal backgrounds, warm off-white headings, high contrast</p>
            </div>
          </button>
        </div>
      </div>

      {/* AI Provider Architecture Card */}
      <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-faint dark:bg-forest/20 border border-forest/20 flex items-center justify-center text-forest dark:text-forest-light">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-ink dark:text-ink-dark">AI Engine Configuration</h2>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Google Gemini LLM Integration & Transparent Fallbacks</p>
            </div>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${aiProvider.isAvailable ? 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light border border-forest/20' : 'bg-amber-light dark:bg-amber/20 text-amber dark:text-amber-light border border-amber/20'}`}>
            {aiProvider.isAvailable ? 'Gemini API Connected' : 'Deterministic Fallback Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1">
            <span className="text-ink-muted dark:text-ink-muted-dark font-semibold uppercase text-[10px] tracking-wider">Active Model</span>
            <p className="font-mono text-ink dark:text-ink-dark text-sm font-semibold">{aiProvider.model || 'gemini-1.5-flash'}</p>
          </div>
          <div className="p-3.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1">
            <span className="text-ink-muted dark:text-ink-muted-dark font-semibold uppercase text-[10px] tracking-wider">Provider Service</span>
            <p className="font-mono text-ink dark:text-ink-dark text-sm font-semibold">Google Generative AI (REST + Schema Validation)</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink-light dark:text-ink-light-dark leading-relaxed">
          <strong className="text-ink dark:text-ink-dark">Architecture Fallback Guarantee:</strong> When the Gemini API key is not configured or experiences transient rate limits, the platform transparently executes the deterministic pattern-matching engine and heuristic rule generator. Zero fake data or simulated qualifications are ever generated.
        </div>
      </div>

      {/* Security & Private Storage Card */}
      <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-forest-faint dark:bg-forest/20 border border-forest/20 flex items-center justify-center text-forest dark:text-forest-light">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-serif font-bold text-ink dark:text-ink-dark">Security & Private Resume Storage</h2>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Multi-tenant privacy, Row Level Security, and cryptographic validation</p>
          </div>
        </div>

        <div className="space-y-2.5 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-forest-light shrink-0" />
              <span className="text-ink dark:text-ink-dark">Private File Storage (No public resume URLs)</span>
            </div>
            <span className="text-forest dark:text-forest-light font-semibold font-mono">Enforced</span>
          </div>

          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-forest-light shrink-0" />
              <span className="text-ink dark:text-ink-dark">PostgreSQL Row-Level Security (RLS) Policies</span>
            </div>
            <span className="text-forest dark:text-forest-light font-semibold font-mono">Active</span>
          </div>

          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-forest-light shrink-0" />
              <span className="text-ink dark:text-ink-dark">SHA-256 Checksum Deduplication & Magic Bytes Checking</span>
            </div>
            <span className="text-forest dark:text-forest-light font-semibold font-mono">Enabled</span>
          </div>

          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-forest-light shrink-0" />
              <span className="text-ink dark:text-ink-dark">CSV Injection Sanitization on All Exports</span>
            </div>
            <span className="text-forest dark:text-forest-light font-semibold font-mono">Active</span>
          </div>
        </div>
      </div>

      {/* System Health Info */}
      <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-3 text-xs shadow-xs">
        <h3 className="font-serif font-bold text-ink dark:text-ink-dark uppercase tracking-wider text-forest dark:text-forest-light">Node API Service</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
            <span className="text-ink-muted dark:text-ink-muted-dark block text-[10px] uppercase font-bold tracking-wider">API Status</span>
            <span className="text-forest dark:text-forest-light font-bold capitalize">{healthData.status}</span>
          </div>
          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
            <span className="text-ink-muted dark:text-ink-muted-dark block text-[10px] uppercase font-bold tracking-wider">Server Uptime</span>
            <span className="text-ink dark:text-ink-dark font-mono font-bold">{Math.round(healthData.uptime || 0)}s</span>
          </div>
          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
            <span className="text-ink-muted dark:text-ink-muted-dark block text-[10px] uppercase font-bold tracking-wider">Max Upload Size</span>
            <span className="text-ink dark:text-ink-dark font-mono font-bold">10 MB</span>
          </div>
          <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
            <span className="text-ink-muted dark:text-ink-muted-dark block text-[10px] uppercase font-bold tracking-wider">Platform</span>
            <span className="text-forest dark:text-forest-light font-bold">TalentrivoX AI</span>
          </div>
        </div>
      </div>
    </div>
  );
};
