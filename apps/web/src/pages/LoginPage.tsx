import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Lock,
  Mail,
  User,
  HelpCircle,
  X,
  Scale,
  Award,
  ChevronLeft,
  Briefcase,
  UserCheck,
  Compass,
  FileText
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';

export const LoginPage: React.FC = () => {
  const { user, login, signup, demoLogin, forgotPassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check URL params for mode=signup or tab=signup
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'job_seeker'>('job_seeker');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('tab') === 'signup' || location.pathname === '/signup') {
      setMode('signup');
    } else {
      setMode('login');
    }
  }, [location]);

  // If user is already authenticated, redirect to the appropriate dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'job_seeker') {
        navigate('/app/seeker', { replace: true });
      } else {
        navigate('/app', { replace: true });
      }
    }
  }, [user, navigate]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email');
      return;
    }

    if (mode === 'signup' && !fullName) {
      setError('Please enter your full name');
      return;
    }

    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const msg = await signup(fullName, email, password || 'seeker123', selectedRole);
        if (msg) {
          setSuccessMessage(msg);
        }
        if (selectedRole === 'job_seeker') {
          navigate('/app/seeker', { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } else {
        await login(email, password);
        // auth effect will navigate based on user.role
      }
    } catch (err: any) {
      setError(err.message || (mode === 'login' ? 'Authentication failed' : 'Registration failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoRecruiter = async () => {
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      await demoLogin('recruiter');
      navigate('/app', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo workspace initialization failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSeeker = async () => {
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    try {
      await demoLogin('job_seeker');
      navigate('/app/seeker', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo workspace initialization failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      const msg = await forgotPassword(forgotEmail);
      setForgotStatus(msg || 'Password reset link sent to your email.');
    } catch (err: any) {
      setForgotStatus(err.message || 'Unable to process reset request.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5EE] dark:bg-[#0F1D17] text-[#26372F] dark:text-[#F4F5EE] flex flex-col lg:flex-row selection:bg-forest selection:text-surface transition-colors duration-200 relative overflow-hidden">
      {/* LEFT PANEL: Editorial Brand Identity & Two-Sided Platform with Clean Static Imagery */}
      <div className="lg:w-1/2 p-6 md:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#D9E2D9] dark:border-[#24483B] relative overflow-hidden bg-gradient-to-b from-[#F5F5EE] to-[#E8EEE6] dark:from-[#0F1D17] dark:to-[#162720] z-10">
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <BrandLogo size="lg" showTagline={true} />
            <Link
              to="/"
              className="text-xs font-semibold text-[#68766D] dark:text-[#9BB0A4] hover:text-[#17362D] dark:hover:text-white flex items-center gap-1.5 transition-colors tale-pill"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Home
            </Link>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#17362D]/10 dark:bg-forest/20 text-[#17362D] dark:text-emerald-300 text-xs font-semibold mb-4 border border-[#17362D]/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Recruitment & Career Platform</span>
          </div>

          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-normal tracking-tight text-[#17362D] dark:text-white leading-[1.15] mb-4">
            Two-Sided Career Intelligence. <span className="tale-serif-italic text-[#24483B] dark:text-emerald-400">Recruiters & Job Seekers.</span>
          </h1>

          <p className="text-xs md:text-sm text-[#47584F] dark:text-[#DDE7DF] leading-relaxed max-w-lg mb-6 font-sans">
            Whether evaluating candidate cohorts or preparing for high-stakes career moves, TalentrivoX AI delivers transparent evidence matching, deterministic gap analysis, and interactive interview rubrics.
          </p>

          {/* Featured Visual Panel Container */}
          <div className="relative rounded-2xl overflow-hidden border border-[#D9E2D9] dark:border-[#24483B] shadow-sm mb-6 max-w-lg group">
            <img
              src="/images/interview_panel_session.jpg"
              alt="TalentrivoX Collaborative Interview and Evaluation Platform"
              className="w-full h-44 sm:h-52 object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#11231D]/90 via-[#11231D]/40 to-transparent flex flex-col justify-end p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#17362D] text-white border border-[#347B60]">Verified AI Evidence</span>
                <span className="text-[11px] font-mono text-[#C4E65D] font-bold">98.4% Match Precision</span>
              </div>
              <p className="text-white text-xs font-medium leading-snug">
                Deterministic scoring backed by verbatim resume citations — zero AI hallucinations.
              </p>
            </div>
          </div>

          {/* Role Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <div className="p-3.5 rounded-xl bg-surface/90 dark:bg-surface-dark/90 border border-stone dark:border-stone-dark shadow-xs backdrop-blur-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs text-ink dark:text-ink-dark">For Recruiters</span>
              </div>
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark leading-relaxed block">
                Batch resume screening, transparent criteria evidence, and discovery.
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface/90 dark:bg-surface-dark/90 border border-stone dark:border-stone-dark shadow-xs backdrop-blur-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light flex items-center justify-center shrink-0">
                  <Compass className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs text-ink dark:text-ink-dark">For Job Seekers</span>
              </div>
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark leading-relaxed block">
                Resume vault, JD match audits, STAR rewrite studio, and mock sessions.
              </span>
            </div>
          </div>
        </div>

        {/* Footer Meta */}
        <div className="pt-6 mt-6 border-t border-stone dark:border-stone-dark text-[11px] text-ink-muted dark:text-ink-muted-dark flex items-center justify-between">
          <span>TalentrivoX AI • Commercial Grade</span>
          <span className="font-mono text-[10px] bg-forest-faint dark:bg-forest/20 px-2 py-0.5 rounded text-forest dark:text-forest-light font-semibold">
            Evidence-Backed Platform
          </span>
        </div>
      </div>

      {/* RIGHT PANEL: Auth Form Card */}
      <div className="lg:w-1/2 p-6 md:p-12 lg:p-16 flex items-center justify-center bg-ivory dark:bg-ivory-dark">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-surface dark:bg-surface-dark p-8 md:p-10 rounded-3xl border border-stone dark:border-stone-dark shadow-editorial">
            {/* 1-Click Demo Buttons */}
            <div className="mb-6 pb-6 border-b border-stone dark:border-stone-dark space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted-dark text-center mb-1">
                Instant 1-Click Demo Access
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleDemoSeeker}
                  disabled={isSubmitting || isLoading}
                  className="py-2.5 px-3 rounded-xl bg-surface dark:bg-surface-dark hover:bg-forest-faint dark:hover:bg-forest/20 text-forest dark:text-forest-light border border-forest/30 text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Job Seeker Demo</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={handleDemoRecruiter}
                  disabled={isSubmitting || isLoading}
                  className="py-2.5 px-3 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-all group disabled:opacity-50 cursor-pointer"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Recruiter Demo</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>

            {/* Mode Toggle (Sign In vs Create Account) */}
            <div className="flex rounded-xl bg-ivory dark:bg-ivory-dark p-1 border border-stone dark:border-stone-dark mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
                    : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                  setSuccessMessage('');
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
                    : 'text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error & Success Messages */}
            {error && (
              <div className="p-3 mb-4 rounded-xl bg-brand-error-light dark:bg-rose-950/40 border border-brand-error/20 text-brand-error dark:text-rose-300 text-xs font-medium flex items-start gap-2">
                <span className="font-bold">Error:</span> {error}
              </div>
            )}

            {successMessage && (
              <div className="p-3 mb-4 rounded-xl bg-forest-faint dark:bg-forest/20 border border-forest/30 text-forest dark:text-forest-light text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  {/* Role Selector Card */}
                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1.5">
                      I want to use TalentrivoX AI as a:
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRole('job_seeker')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest/50 ${
                          selectedRole === 'job_seeker'
                            ? 'border-forest dark:border-forest-light bg-forest-faint dark:bg-forest/20 shadow-xs ring-1 ring-forest/30'
                            : 'border-stone dark:border-stone-dark bg-surface dark:bg-surface-dark hover:border-forest/40 dark:hover:border-forest/60 hover:bg-stone-warm dark:hover:bg-surface-dark'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Compass className={`w-4 h-4 shrink-0 ${selectedRole === 'job_seeker' ? 'text-forest dark:text-forest-light' : 'text-ink-muted dark:text-ink-muted-dark'}`} />
                            <span className={`text-xs ${selectedRole === 'job_seeker' ? 'font-bold text-ink dark:text-ink-dark' : 'font-semibold text-ink dark:text-ink-dark'}`}>
                              Job Seeker
                            </span>
                          </div>
                          {selectedRole === 'job_seeker' && (
                            <span className="w-2 h-2 rounded-full bg-forest dark:bg-forest-light" />
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark leading-snug">
                          Audit resumes, fix ATS gaps, practice mock interviews
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRole('recruiter')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-forest/50 ${
                          selectedRole === 'recruiter'
                            ? 'border-forest dark:border-forest-light bg-forest-faint dark:bg-forest/20 shadow-xs ring-1 ring-forest/30'
                            : 'border-stone dark:border-stone-dark bg-surface dark:bg-surface-dark hover:border-forest/40 dark:hover:border-forest/60 hover:bg-stone-warm dark:hover:bg-surface-dark'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className={`w-4 h-4 shrink-0 ${selectedRole === 'recruiter' ? 'text-forest dark:text-forest-light' : 'text-ink-muted dark:text-ink-muted-dark'}`} />
                            <span className={`text-xs ${selectedRole === 'recruiter' ? 'font-bold text-ink dark:text-ink-dark' : 'font-semibold text-ink dark:text-ink-dark'}`}>
                              Recruiter
                            </span>
                          </div>
                          {selectedRole === 'recruiter' && (
                            <span className="w-2 h-2 rounded-full bg-forest dark:bg-forest-light" />
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark leading-snug">
                          Screen candidate batches, verify JD criteria
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink dark:text-ink-dark mb-1.5">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === 'signup' && selectedRole === 'job_seeker' ? 'alex@gmail.com' : 'recruiter@company.com'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-ink dark:text-ink-dark">
                    Password {mode === 'signup' ? '*' : '(Optional for Demo)'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-[11px] text-forest dark:text-forest-light hover:underline font-medium cursor-pointer"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Minimum 6 characters' : 'Enter password (or leave blank)'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-forest dark:bg-forest-light hover:bg-forest-hover dark:hover:bg-forest text-white dark:text-surface-dark font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing {mode === 'signup' ? 'Registration' : 'Sign In'}...</span>
                  </>
                ) : (
                  <span>{mode === 'signup' ? `Create ${selectedRole === 'job_seeker' ? 'Job Seeker' : 'Recruiter'} Account` : 'Sign In to Workspace'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-stone dark:border-stone-dark max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">Reset Password</h3>
              <button onClick={() => setShowForgotModal(false)} className="p-1 rounded text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            {forgotStatus ? (
              <div className="space-y-4">
                <p className="text-xs text-forest dark:text-forest-light bg-forest-faint dark:bg-forest/20 p-3 rounded-xl border border-forest/30">
                  {forgotStatus}
                </p>
                <button
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStatus('');
                  }}
                  className="w-full py-2 rounded-xl bg-forest text-white text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  Enter your registered work email and we will send password recovery instructions.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.email@company.com"
                  className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-hover transition-colors cursor-pointer"
                >
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
