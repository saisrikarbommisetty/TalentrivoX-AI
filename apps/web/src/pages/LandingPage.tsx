import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  ShieldCheck,
  Scale,
  Award,
  Users,
  Briefcase,
  Layers,
  ChevronRight,
  Clock,
  HelpCircle,
  BarChart3,
  Quote,
  Check,
  AlertCircle,
  Menu,
  X,
  Target,
  FileSearch,
  Sliders,
  CheckCheck,
  Zap,
  Star,
  Flame
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { ThemeToggle } from '../components/ThemeToggle';
import { AmbientBackground } from '../components/AmbientBackground';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'screening' | 'evidence' | 'interview'>('screening');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-ivory dark:bg-ivory-dark text-ink dark:text-ink-dark selection:bg-forest selection:text-surface transition-colors duration-200 relative overflow-x-hidden tale-ambient-bg">
      <AmbientBackground variant="hero" />

      {/* Background Ambient Glows */}
      <div className="tale-hero-glow top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px]" />
      <div className="tale-hero-glow top-[800px] right-0 w-[500px] h-[400px] opacity-10" />

      {/* SECTION A: Dark Public Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#11231D]/95 dark:bg-[#0A1612]/95 backdrop-blur-md border-b border-[#24483B] text-[#F4F5EE] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <BrandLogo size="md" showTagline={false} variant="dark" />

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-[#A8BDAF]">
            <button
              onClick={() => scrollToSection('product')}
              className="hover:text-[#C4E65D] transition-colors cursor-pointer"
            >
              Why TalentrivoX
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="hover:text-[#C4E65D] transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('workspaces')}
              className="hover:text-[#C4E65D] transition-colors cursor-pointer"
            >
              Workspaces
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="hover:text-[#C4E65D] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('responsible-ai')}
              className="hover:text-[#C4E65D] transition-colors cursor-pointer"
            >
              Trust & Ethics
            </button>
          </nav>

          {/* Header Actions (Theme Toggle & Auth) */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="px-4 py-2 text-xs font-semibold text-[#DCE9DF] hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/login?tab=signup"
              className="px-5 py-2.5 rounded-full bg-[#2F8064] hover:bg-[#389474] text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 focus:outline-none hover:-translate-y-0.5 cursor-pointer border border-[#3E9F7D]/40"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu & Theme Controls */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-[#24483B] text-white hover:bg-[#1A3028] transition-colors cursor-pointer"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-3 pb-6 border-b border-[#24483B] bg-[#11231D] text-[#DCE9DF] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2 text-sm font-medium text-[#DCE9DF]">
              <button
                onClick={() => scrollToSection('product')}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#1A3028] hover:text-[#C4E65D] transition-colors"
              >
                Why TalentrivoX
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#1A3028] hover:text-[#C4E65D] transition-colors"
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('workspaces')}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#1A3028] hover:text-[#C4E65D] transition-colors"
              >
                Workspaces
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#1A3028] hover:text-[#C4E65D] transition-colors"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('responsible-ai')}
                className="text-left px-3 py-2 rounded-lg hover:bg-[#1A3028] hover:text-[#C4E65D] transition-colors"
              >
                Trust & Ethics
              </button>
            </nav>
            <div className="pt-3 border-t border-[#24483B] flex flex-col gap-2">
              <Link
                to="/login"
                className="w-full text-center py-2.5 rounded-xl border border-[#24483B] text-xs font-semibold text-white hover:bg-[#1A3028] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login?tab=signup"
                className="w-full text-center py-2.5 rounded-full bg-[#2F8064] hover:bg-[#389474] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* SECTION B: TaleHire-Inspired Hero Composition with Layered Floating Cards */}
      <section id="product" className="relative pt-14 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16 md:mb-20">
            {/* TaleHire Style Live Online Badge */}
            <div className="inline-flex items-center justify-center">
              <div className="tale-badge-pulse">
                <span>TALENTRIVOX INTELLIGENCE ENGINE</span>
                <span className="text-stone dark:text-stone-dark font-light">•</span>
                <span className="text-forest dark:text-emerald-400 font-bold">100% EVIDENCE-BACKED</span>
              </div>
            </div>

            {/* Editorial Headline with Playfair Display Italic Serif Accent */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-extrabold text-ink dark:text-ink-dark tracking-tight leading-[1.12]">
              Screen talent with{' '}
              <span className="tale-serif-italic text-forest dark:text-emerald-400 font-bold">
                intelligent,
              </span>{' '}
              deterministic precision.
            </h1>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg text-ink-muted dark:text-ink-dark-muted leading-relaxed max-w-2xl mx-auto font-normal">
              Turn messy multi-page resumes and job descriptions into transparent match scores, verbatim evidence citations, and calibrated interview blueprints in seconds.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                to="/login?tab=signup"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-forest hover:bg-forest-hover text-surface text-sm font-semibold shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                <span>Start Screening Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-surface dark:bg-surface-dark hover:bg-stone-warm dark:hover:bg-stone-dark text-ink dark:text-ink-dark text-sm font-semibold border border-stone dark:border-stone-dark transition-all cursor-pointer shadow-2xs"
              >
                Explore How It Works
              </button>
            </div>

            {/* Social Proof & Confidence Markers */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-muted dark:text-ink-dark-muted">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400" />
                <span className="font-semibold text-ink-light dark:text-ink-dark-secondary">Zero AI Hallucination</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400" />
                <span className="font-semibold text-ink-light dark:text-ink-dark-secondary">Multi-Page Parsing Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400" />
                <span className="font-semibold text-ink-light dark:text-ink-dark-secondary">Deterministic Scoring Audit</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Composition: Layered Floating UI Panels (TaleHire Signature Style) */}
          <div className="relative max-w-5xl mx-auto">
            {/* Floating Top-Right Highlight Bubble (Top 1% Candidate Detected) */}
            <div className="hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-surface/95 dark:bg-surface-dark/95 border border-stone dark:border-stone-dark shadow-xl backdrop-blur-md absolute -top-8 -right-6 z-20 animate-in fade-in duration-500 hover:-translate-y-1 transition-transform">
              <div className="w-10 h-10 rounded-full bg-forest dark:bg-forest text-surface font-serif font-bold text-sm flex items-center justify-center shadow-xs">
                ER
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink dark:text-ink-dark">Elena Rostova</span>
                  <span className="tale-score-bubble">98% Match</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-forest dark:text-emerald-400 font-semibold mt-0.5">
                  <Sparkles className="w-3 h-3" />
                  <span>Top Verified Candidate</span>
                </div>
              </div>
            </div>

            {/* Floating Bottom-Left Highlight Bubble (Deterministic Evidence Proof) */}
            <div className="hidden lg:flex items-center gap-3 p-3.5 rounded-2xl bg-surface/95 dark:bg-surface-dark/95 border border-stone dark:border-stone-dark shadow-xl backdrop-blur-md absolute -bottom-6 -left-6 z-20 animate-in fade-in duration-500 hover:-translate-y-1 transition-transform">
              <div className="w-9 h-9 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 flex items-center justify-center border border-forest/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-ink dark:text-ink-dark">Verbatim Resume Citations</div>
                <div className="text-[10px] text-ink-muted dark:text-ink-dark-muted font-mono">4/4 Mandatory Requirements Met</div>
              </div>
            </div>

            {/* Central Master Interface Showcase Window */}
            <div className="tale-card-floating overflow-hidden relative z-10 border-stone dark:border-stone-dark">
              {/* Window Header Bar */}
              <div className="px-6 py-4 bg-ivory dark:bg-ivory-dark border-b border-stone dark:border-stone-dark flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone dark:bg-stone-dark" />
                    <span className="w-2.5 h-2.5 rounded-full bg-stone dark:bg-stone-dark" />
                    <span className="w-2.5 h-2.5 rounded-full bg-stone dark:bg-stone-dark" />
                  </div>
                  <span className="text-xs font-mono font-semibold text-ink-light dark:text-ink-dark-secondary truncate">
                    TalentrivoX Screening / Staff Platform Architect
                  </span>
                </div>

                {/* Interactive Preview Tabs */}
                <div className="flex items-center gap-1 bg-surface dark:bg-surface-dark p-1 rounded-xl border border-stone dark:border-stone-dark text-xs font-semibold shadow-2xs">
                  <button
                    onClick={() => setActiveTab('screening')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'screening'
                        ? 'bg-forest text-surface shadow-xs'
                        : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
                    }`}
                  >
                    AI Match Scoring
                  </button>
                  <button
                    onClick={() => setActiveTab('evidence')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'evidence'
                        ? 'bg-forest text-surface shadow-xs'
                        : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
                    }`}
                  >
                    Verbatim Citations
                  </button>
                  <button
                    onClick={() => setActiveTab('interview')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      activeTab === 'interview'
                        ? 'bg-forest text-surface shadow-xs'
                        : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
                    }`}
                  >
                    Interview Blueprint
                  </button>
                </div>
              </div>

              {/* Showcase Body */}
              <div className="p-6 md:p-8 space-y-5 bg-surface dark:bg-surface-dark">
                {/* Candidate Summary Header Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-forest text-surface flex items-center justify-center font-serif font-bold text-lg shadow-xs shrink-0">
                      ER
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-ink dark:text-ink-dark">Elena Rostova</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/25 uppercase">
                          Shortlisted
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-0.5">
                        Staff Distributed Systems Architect • 8+ Years Experience • 2-Page PDF Parsed
                      </p>
                    </div>
                  </div>

                  {/* Match Gauge & Essential Coverage */}
                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase text-ink-muted dark:text-ink-dark-muted tracking-wider block">
                        Match Score
                      </span>
                      <span className="text-2xl font-mono font-bold text-forest dark:text-emerald-400">98%</span>
                    </div>
                    <div className="h-8 w-px bg-stone dark:border-stone-dark" />
                    <div className="text-center">
                      <span className="text-[10px] font-bold uppercase text-ink-muted dark:text-ink-dark-muted tracking-wider block">
                        Mandatory
                      </span>
                      <span className="text-2xl font-mono font-bold text-ink dark:text-ink-dark">4/4 Met</span>
                    </div>
                  </div>
                </div>

                {/* Tab 1: AI Match Scoring */}
                {activeTab === 'screening' && (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-ink dark:text-ink-dark">Distributed Systems & High-Throughput Message Queues</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20">
                            Mandatory
                          </span>
                        </div>
                        <span className="font-mono text-forest dark:text-emerald-400 font-bold">100% Match</span>
                      </div>
                      <p className="text-xs text-ink-muted dark:text-ink-dark-muted pl-6 leading-relaxed">
                        Verified from resume: "Designed asynchronous event-driven architecture handling 250K ops/sec utilizing Apache Kafka and Go workers."
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
                          <span className="font-bold text-ink dark:text-ink-dark">Kubernetes & Multi-Region Cloud Deployments</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20">
                            Mandatory
                          </span>
                        </div>
                        <span className="font-mono text-forest dark:text-emerald-400 font-bold">100% Match</span>
                      </div>
                      <p className="text-xs text-ink-muted dark:text-ink-muted-dark pl-6 leading-relaxed">
                        Verified from resume: "Managed multi-cluster EKS infrastructure across 3 AWS availability zones with 99.999% SLA."
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Verbatim Evidence Citations */}
                {activeTab === 'evidence' && (
                  <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-3">
                    <span className="text-[10px] font-bold text-forest dark:text-emerald-400 uppercase tracking-wider block">
                      Verbatim Resume Excerpt (Page 1 • Section: Experience)
                    </span>
                    <blockquote className="text-xs text-ink dark:text-ink-dark italic font-serif leading-relaxed border-l-2 border-forest dark:border-emerald-400 pl-3.5">
                      "Spearheaded core backend migration to Go microservices, reducing p99 latency from 450ms to 28ms across 40M daily active users."
                    </blockquote>
                    <div className="text-[11px] text-ink-muted dark:text-ink-dark-muted flex items-center justify-between pt-1">
                      <span>Requirement: Scalable Microservice Architecture (Weight: 25%)</span>
                      <span className="font-semibold text-forest dark:text-emerald-400">Deterministic Match Score: 98/100</span>
                    </div>
                  </div>
                )}

                {/* Tab 3: Interview Blueprint */}
                {activeTab === 'interview' && (
                  <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-forest dark:text-emerald-400 uppercase tracking-wider">
                        Tailored Technical Rubric Question
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300">
                        Senior Level
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-ink dark:text-ink-dark">
                      "In your 250K ops/sec Kafka architecture, what strategies did you employ to prevent head-of-line blocking and handle consumer group rebalancing spikes?"
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-xl bg-forest-faint dark:bg-forest/20 border border-forest/20">
                        <strong className="text-forest dark:text-emerald-300 block text-[11px] mb-0.5 font-bold">Strong Signal (4-5):</strong>
                        <span className="text-[10.5px] text-ink-muted dark:text-ink-dark-muted">Mentions static membership, partition key hashing, and sticky assignors.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30">
                        <strong className="text-amber-700 dark:text-amber-300 block text-[11px] mb-0.5 font-bold">Adequate (3):</strong>
                        <span className="text-[10.5px] text-ink-muted dark:text-ink-dark-muted">Explains consumer offsets and DLQ without partition detail.</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30">
                        <strong className="text-rose dark:text-rose block text-[11px] mb-0.5 font-bold">Weak (1-2):</strong>
                        <span className="text-[10.5px] text-ink-muted dark:text-ink-dark-muted">Confuses consumer partitions with DB transaction locks.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: TaleHire-Style Stats Banner */}
      <section className="py-12 bg-surface dark:bg-surface-dark border-y border-stone dark:border-stone-dark transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <span className="text-3xl sm:text-4xl font-mono font-bold text-forest dark:text-emerald-400 block">10x</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium mt-1 block">Faster Candidate Screening</span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-mono font-bold text-forest dark:text-emerald-400 block">99.4%</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium mt-1 block">Multi-Page Parsing Accuracy</span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-mono font-bold text-forest dark:text-emerald-400 block">100%</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium mt-1 block">Deterministic Verifiable Proof</span>
            </div>
            <div>
              <span className="text-3xl sm:text-4xl font-mono font-bold text-forest dark:text-emerald-400 block">0%</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium mt-1 block">Hallucinated Evaluation Decisions</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION D: Dual Workspaces: Recruiter & Job Seeker */}
      <section id="workspaces" className="py-20 md:py-28 bg-[#F5F5EE] dark:bg-[#0F1D17] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold text-[#24483B] dark:text-emerald-400 uppercase tracking-widest">
              TWO POWERFUL WORKSPACES • ONE INTELLIGENT PLATFORM
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-[#17362D] dark:text-white tracking-tight">
              Engineered for hiring teams and ambitious talent.
            </h2>
            <p className="text-sm text-[#47584F] dark:text-[#DDE7DF] max-w-xl mx-auto leading-relaxed">
              TalentrivoX AI bridges both sides of recruitment with structured candidate intelligence and personalized career roadmap optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Recruiter Workspace Card */}
            <div className="p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs hover:border-forest/40 transition-all space-y-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center border border-[#17362D]/15">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#24483B] dark:text-emerald-400 uppercase tracking-wider">
                    Recruiter Intelligence Suite
                  </span>
                  <h3 className="text-2xl font-bold text-[#17362D] dark:text-white">
                    Automate screening with zero guesswork
                  </h3>
                </div>
                <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                  Post hiring jobs, parse 100s of multi-page resumes, run deterministic scoring against weighted rubrics, and discover verified public talent automatically.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs text-[#26372F] dark:text-[#DDE7DF]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>Multi-Page PDF/DOCX Resume Extraction</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>Agentic Candidate Discovery from Public Sources</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>Verbatim Evidence Citations & Side-by-Side Matrix</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>Automated Tailored Interview Plan Builder</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#D9E2D9] dark:border-[#24483B]">
                <Link
                  to="/login?tab=signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#17362D] hover:bg-[#24483B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Enter Recruiter Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Job Seeker Workspace Card */}
            <div className="p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs hover:border-forest/40 transition-all space-y-6 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#C4E65D]/20 text-[#17362D] dark:text-[#C4E65D] flex items-center justify-center border border-[#C4E65D]/30">
                  <Target className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-[#24483B] dark:text-emerald-400 uppercase tracking-wider">
                    Job Seeker Career Studio
                  </span>
                  <h3 className="text-2xl font-bold text-[#17362D] dark:text-white">
                    Optimize resumes & ace your next interview
                  </h3>
                </div>
                <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                  Analyze your resume against real target jobs, identify critical skill gaps, rewrite bullets for ATS readability, and practice simulated mock interview questions.
                </p>

                <ul className="space-y-2.5 pt-2 text-xs text-[#26372F] dark:text-[#DDE7DF]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>AI Resume-to-Job Fit Gap Analyzer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>Resume Studio & Action-Verb Bullet Rewriter</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>Targeted Mock Interview Prep & Category Filters</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F8064] dark:text-emerald-400 shrink-0" />
                    <span>Visual Application Kanban Board & Roadmap</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-[#D9E2D9] dark:border-[#24483B]">
                <Link
                  to="/login?tab=signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#17362D] hover:bg-[#24483B] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <span>Enter Job Seeker Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION E: 6-Stage Comprehensive Product Features Flow */}
      <section id="features" className="py-20 md:py-28 bg-[#E8EEE6]/60 dark:bg-[#162720]/70 border-t border-[#D9E2D9] dark:border-[#24483B] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold text-[#24483B] dark:text-emerald-400 uppercase tracking-widest">
              END-TO-END RECRUITMENT & CAREER LIFECYCLE
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-[#17362D] dark:text-white tracking-tight">
              Six intelligent pillars powering the entire hiring journey.
            </h2>
            <p className="text-sm text-[#47584F] dark:text-[#DDE7DF] max-w-xl mx-auto leading-relaxed">
              Every stage reflects the live features built directly into TalentrivoX AI—providing transparency, speed, and evidence-backed decisions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1: Choose your workspace */}
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-[#17362D] dark:text-white">Choose Your Workspace</h3>
              <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                Dedicated interfaces for Hiring Teams (batch screening, criteria tuning) and Job Seekers (resume audits, interview simulations).
              </p>
            </div>

            {/* Feature 2: Upload & Manage Resumes */}
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-[#17362D] dark:text-white">Upload & Vault Resumes</h3>
              <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                Parse multi-page PDFs and DOCX files with high-precision text extraction, SHA-256 deduplication, and active version management.
              </p>
            </div>

            {/* Feature 3: Analyze Job Fit */}
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-[#17362D] dark:text-white">Analyze Job Fit & Criteria</h3>
              <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                Deterministic matching against mandatory and preferred requirements with transparent mathematical scoring weights.
              </p>
            </div>

            {/* Feature 4: Review Useful Insights */}
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                04
              </div>
              <h3 className="text-base font-bold text-[#17362D] dark:text-white">Review Evidence & Insights</h3>
              <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                Inspect verbatim resume citations, missing skills, candidate comparison matrices, and clear explanations for every score.
              </p>
            </div>

            {/* Feature 5: Prepare for Interviews */}
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                05
              </div>
              <h3 className="text-base font-bold text-[#17362D] dark:text-white">Prepare for Interviews</h3>
              <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                Tailored technical & behavioral STAR questions, live timers, 1-5 scoring benchmarks, and interactive practice simulations.
              </p>
            </div>

            {/* Feature 6: Discover & Track Opportunities */}
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-sm">
                06
              </div>
              <h3 className="text-base font-bold text-[#17362D] dark:text-white">Discover & Track Opportunities</h3>
              <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                Agentic candidate discovery for hiring teams; real-time job discovery and visual Kanban application tracker for candidates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION F: Step-by-Step Screening Pipeline with Recruitment Image */}
      <section id="how-it-works" className="py-20 md:py-28 bg-[#F5F5EE] dark:bg-[#0F1D17] border-t border-[#D9E2D9] dark:border-[#24483B] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <span className="text-xs font-bold text-[#24483B] dark:text-emerald-400 uppercase tracking-widest">
              HOW IT WORKS IN PRACTICE
            </span>
            <h2 className="text-3xl sm:text-4xl font-sans font-extrabold text-[#17362D] dark:text-white tracking-tight">
              From open vacancy to calibrated interview session.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Image Panel (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-[#D9E2D9] dark:border-[#24483B] shadow-md relative group">
              <img
                src="/images/hero_recruitment_collaborative.jpg"
                alt="TalentrivoX Collaborative Hiring Team Workflow"
                className="w-full h-80 lg:h-96 object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#11231D]/90 via-[#11231D]/30 to-transparent flex flex-col justify-end p-6">
                <span className="text-xs font-mono font-bold text-[#C4E65D]">EVIDENCE-BACKED RECRUITMENT</span>
                <p className="text-white text-xs font-medium mt-1">
                  Empowering hiring managers and candidates with transparent data.
                </p>
              </div>
            </div>

            {/* Pipeline Steps (7 cols) */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#17362D] text-white text-xs font-mono font-bold flex items-center justify-center">
                  01
                </div>
                <h4 className="text-sm font-bold text-[#17362D] dark:text-white">Define Job Criteria</h4>
                <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                  Specify essential and preferred qualifications, weights, and expectations.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#17362D] text-white text-xs font-mono font-bold flex items-center justify-center">
                  02
                </div>
                <h4 className="text-sm font-bold text-[#17362D] dark:text-white">Upload Candidate Resumes</h4>
                <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                  Batch parse PDF and DOCX files with entity recognition and automated deduplication.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#17362D] text-white text-xs font-mono font-bold flex items-center justify-center">
                  03
                </div>
                <h4 className="text-sm font-bold text-[#17362D] dark:text-white">Review Evidence Matrix</h4>
                <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                  Inspect explainable match scores, candidate comparison matrices, and verbatim citations.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#17362D] text-white text-xs font-mono font-bold flex items-center justify-center">
                  04
                </div>
                <h4 className="text-sm font-bold text-[#17362D] dark:text-white">Interview Blueprint</h4>
                <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] leading-relaxed">
                  Conduct interviews with tailored questions, live timers, and 1-5 star rubrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION G: Responsible AI & Trust Charter */}
      <section id="responsible-ai" className="py-20 md:py-28 bg-[#E8EEE6]/50 dark:bg-[#162720]/60 border-t border-[#D9E2D9] dark:border-[#24483B] transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 md:p-12 rounded-3xl bg-surface dark:bg-surface-dark border border-[#D9E2D9] dark:border-[#24483B] shadow-xs space-y-8">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 flex items-center justify-center border border-[#17362D]/15 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#17362D] dark:text-white">Responsible AI & Transparency Charter</h3>
                <p className="text-xs text-[#47584F] dark:text-[#DDE7DF] mt-0.5">Our core engineering principles for fair, evidence-backed hiring</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs leading-relaxed text-[#47584F] dark:text-[#DDE7DF]">
              <div className="p-5 rounded-2xl bg-[#F5F5EE] dark:bg-[#0F1D17] border border-[#D9E2D9] dark:border-[#24483B] space-y-1.5">
                <strong className="text-[#17362D] dark:text-white font-bold block text-sm">Job-Related Criteria Only</strong>
                <p>
                  Evaluations strictly measure candidate evidence against validated, role-relevant requirements. Demographic indicators are stripped during screening.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F5EE] dark:bg-[#0F1D17] border border-[#D9E2D9] dark:border-[#24483B] space-y-1.5">
                <strong className="text-[#17362D] dark:text-white font-bold block text-sm">Verbatim Traceability</strong>
                <p>
                  Every positive match is paired with an exact sentence from the candidate's resume so human recruiters can instantly verify claims.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F5EE] dark:bg-[#0F1D17] border border-[#D9E2D9] dark:border-[#24483B] space-y-1.5">
                <strong className="text-[#17362D] dark:text-white font-bold block text-sm">Transparent Scoring Formula</strong>
                <p>
                  Scores are calculated through documented deterministic weighting formulas—never opaque, unpredictable algorithmic black boxes.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#F5F5EE] dark:bg-[#0F1D17] border border-[#D9E2D9] dark:border-[#24483B] space-y-1.5">
                <strong className="text-[#17362D] dark:text-white font-bold block text-sm">Human-in-the-Loop Safeguard</strong>
                <p>
                  TalentrivoX AI acts solely as a decision-support aid. No candidate is ever automatically rejected based solely on an automated score.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION H: Final Call To Action Banner */}
      <section className="py-20 md:py-28 bg-[#17362D] text-white transition-colors duration-200 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-sans font-extrabold tracking-tight">
            Make every hiring decision{' '}
            <span className="tale-serif-italic font-bold text-[#C4E65D]">intentional.</span>
          </h2>
          <p className="text-sm sm:text-base text-[#DCE9DF] max-w-xl mx-auto leading-relaxed">
            Bring multi-page resume extraction, deterministic matching, and structured interview blueprints into one unified platform.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login?tab=signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-[#17362D] hover:bg-[#F5F5EE] font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#24483B] hover:bg-[#2F8064] text-white font-semibold text-sm border border-[#347B60] transition-colors cursor-pointer"
            >
              Sign In to Workspace
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION I: Dark Footer */}
      <footer className="bg-[#11231D] border-t border-[#24483B] py-14 text-xs text-[#A8BDAF] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-3 md:col-span-2">
              <BrandLogo size="md" showTagline={true} variant="dark" />
              <p className="text-xs text-[#A8BDAF] max-w-sm leading-relaxed mt-2">
                TalentrivoX AI is an evidence-first candidate screening and interview intelligence workspace designed for modern hiring teams and ambitious professionals.
              </p>
            </div>

            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F4F5EE] block">
                Platform
              </span>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => scrollToSection('product')} className="hover:text-[#C4E65D] transition-colors cursor-pointer">
                    Why TalentrivoX
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-[#C4E65D] transition-colors cursor-pointer">
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('workspaces')} className="hover:text-[#C4E65D] transition-colors cursor-pointer">
                    Workspaces
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-[#C4E65D] transition-colors cursor-pointer">
                    How It Works
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('responsible-ai')} className="hover:text-[#C4E65D] transition-colors cursor-pointer">
                    Trust & Transparency
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#F4F5EE] block">
                Portal Access
              </span>
              <ul className="space-y-2">
                <li>
                  <Link to="/login" className="hover:text-[#C4E65D] transition-colors">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link to="/login?tab=signup" className="hover:text-[#C4E65D] transition-colors">
                    Create Free Account
                  </Link>
                </li>
                <li>
                  <Link to="/app" className="hover:text-[#C4E65D] transition-colors">
                    Recruiter Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/app/seeker" className="hover:text-[#C4E65D] transition-colors">
                    Job Seeker Studio
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-[#24483B] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#A8BDAF]">
            <p>
              &copy; {new Date().getFullYear()} TalentrivoX AI. All rights reserved. Built for evidence-based hiring.
            </p>
            <div className="flex items-center gap-6">
              <span>Security & Integrity Verified</span>
              <span>Deterministic Auditable Scoring</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
