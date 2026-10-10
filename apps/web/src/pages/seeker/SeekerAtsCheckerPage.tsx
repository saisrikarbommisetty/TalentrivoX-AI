import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Search,
  BookOpen
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SeekerAtsCheckerPage: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetJobTitle, setTargetJobTitle] = useState('Senior Full-Stack TypeScript Engineer');
  const [targetJobDesc, setTargetJobDesc] = useState('');
  const [report, setReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await api.getSeekerResumes();
        setResumes(res.resumes);
        const active = res.resumes.find((r: any) => r.isActive) || res.resumes[0];
        if (active) {
          setSelectedResumeId(active.id);
          runAudit(active.id);
        }
      } catch (err) {
        console.error('Failed to load resumes for ATS check', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const runAudit = async (resumeId: string) => {
    setIsAuditing(true);
    try {
      const res = await api.checkSeekerAtsQuality({
        resumeId,
        jobTitle: targetJobTitle,
        jobDescription: targetJobDesc || undefined
      });
      setReport(res.report);
    } catch (err) {
      console.error('Failed to run ATS audit', err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedResumeId(rId);
    runAudit(rId);
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            ATS-Oriented Resume Quality Checker
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Audit keyword density, layout linearity, standard headings, and contact information
          </p>
        </div>
      </div>

      {/* Target Role & Resume Selector Bar */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
            Resume to Inspect
          </label>
          <select
            value={selectedResumeId}
            onChange={handleResumeChange}
            className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink dark:text-ink-dark font-semibold focus:outline-none"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.versionLabel} ({r.fileName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
            Target Job Title for Keyword Coverage
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetJobTitle}
              onChange={(e) => setTargetJobTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
            />
            <button
              type="button"
              onClick={() => runAudit(selectedResumeId)}
              disabled={isAuditing}
              className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50 transition-colors"
            >
              {isAuditing ? 'Scanning...' : 'Re-Scan'}
            </button>
          </div>
        </div>
      </div>

      {/* Audit Results */}
      {report && (
        <div className="space-y-6">
          {/* Executive ATS Score Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  report.rating === 'excellent'
                    ? 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300'
                    : 'bg-amber-light text-amber-900'
                }`}>
                  ATS Readiness: {report.rating.replace('_', ' ')}
                </span>
                <span className="text-xs text-ink-muted dark:text-ink-dark-muted">• 5 Essential Quality Checks</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark">
                Applicant Tracking System Audit
              </h2>
              <p className="text-xs text-ink-light dark:text-ink-dark-secondary max-w-xl leading-relaxed">
                {report.summaryAdvice}
              </p>
            </div>

            {/* Score Ring */}
            <div className="flex items-center gap-6 self-start md:self-auto bg-ivory dark:bg-ivory-dark p-5 rounded-2xl border border-stone dark:border-stone-dark shadow-xs">
              <div className="text-center">
                <div className="text-3xl font-mono font-extrabold text-forest dark:text-emerald-400">
                  {report.score}/100
                </div>
                <span className="text-[10px] font-bold uppercase text-ink-muted dark:text-ink-dark-muted tracking-wider">
                  Quality Score
                </span>
              </div>
              <div className="h-8 w-px bg-stone dark:bg-stone-dark" />
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-ink dark:text-ink-dark">
                  {report.keywordMatchRate}%
                </div>
                <span className="text-[10px] font-bold uppercase text-ink-muted dark:text-ink-dark-muted tracking-wider">
                  Keyword Alignment
                </span>
              </div>
            </div>
          </div>

          {/* Checklist Grid */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
              Inspection Checklist & Remediation Steps
            </h3>

            <div className="space-y-3">
              {report.checks.map((chk: any) => {
                const isPassed = chk.status === 'passed';
                const isWarning = chk.status === 'warning';

                return (
                  <div
                    key={chk.id}
                    className={`p-5 rounded-2xl bg-surface dark:bg-surface-dark border transition-all shadow-xs space-y-2 ${
                      isPassed
                        ? 'border-stone dark:border-stone-dark'
                        : isWarning
                        ? 'border-amber/40 dark:border-amber/30'
                        : 'border-brand-error/40 dark:border-rose-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-forest dark:text-emerald-400 shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-amber dark:text-amber-400 shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-brand-error shrink-0" />
                          )}
                          <h4 className="font-serif font-bold text-ink dark:text-ink-dark text-sm">
                            {chk.title}
                          </h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-ivory dark:bg-ivory-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark">
                            {chk.category}
                          </span>
                        </div>
                        <p className="text-xs text-ink-light dark:text-ink-dark-secondary pl-6">
                          {chk.detail}
                        </p>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        isPassed
                          ? 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300'
                          : isWarning
                          ? 'bg-amber-light text-amber-900'
                          : 'bg-brand-error-light text-brand-error'
                      }`}>
                        {chk.status}
                      </span>
                    </div>

                    {/* Remediation Note */}
                    <div className="ml-6 p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted">
                      <strong className="text-forest dark:text-emerald-400">Remediation:</strong> {chk.remediation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compliance & ATS Disclaimer */}
          <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted space-y-1">
            <strong className="text-ink dark:text-ink-dark">ATS Transparency Notice:</strong>
            <p>
              Different applicant tracking systems (e.g. Workday, Greenhouse, Lever, Taleo) employ different parsing parsers and screening workflows. This audit verifies formatting cleanliness, heading standards, and token coverage to maximize parsing fidelity, rather than guaranteeing a hiring outcome.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
