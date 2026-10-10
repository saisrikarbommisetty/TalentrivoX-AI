import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart3,
  Download,
  Printer,
  PieChart,
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  FileText
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const AnalyticsReportsPage: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.getJobs();
        setJobs(res.jobs);
        if (res.jobs.length > 0) {
          setSelectedJobId(res.jobs[0].id);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedJobId) return;
      setIsLoading(true);
      try {
        const res = await api.getJobAnalytics(selectedJobId);
        setAnalytics(res);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [selectedJobId]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading && !analytics) return <LoadingSkeleton />;

  const buckets = analytics?.scoreBuckets || { excellent: 0, strong: 0, moderate: 0, low: 0 };
  const funnel = analytics?.funnel || {};
  const reqBreakdown = analytics?.requirementBreakdown || [];

  const totalEvaluated = analytics?.evaluationsCount || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">Analytics & Audit Reports</h1>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Real database metrics, score distributions, and compliance exports
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedJobId && (
            <a
              href={api.getExportCsvUrl(selectedJobId)}
              className="px-4 py-2 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary text-xs font-semibold flex items-center gap-1.5 border border-stone dark:border-stone-dark shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-forest dark:text-emerald-400" /> Export CSV (Sanitized)
            </a>
          )}
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Role Picker */}
      <div className="p-5 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark flex items-center gap-4 shadow-xs">
        <div className="w-full sm:w-80">
          <label className="text-[10px] text-ink-muted dark:text-ink-dark-muted font-bold block mb-1.5 uppercase tracking-wider">Select Role</label>
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark font-semibold bg-surface dark:bg-surface-dark"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.candidateCount} candidates)
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs text-ink-muted dark:text-ink-dark-muted self-end pb-2 hidden sm:block">
          Showing real screening distributions for <strong className="text-ink dark:text-ink-dark">{analytics?.job?.title}</strong>
        </div>
      </div>

      {/* Distributions & Funnel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Chart */}
        <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4 shadow-xs">
          <h2 className="text-sm font-serif font-bold text-ink dark:text-ink-dark flex items-center gap-2 uppercase tracking-wider text-forest dark:text-emerald-400">
            <BarChart3 className="w-4 h-4" /> Match Score Distribution
          </h2>

          <div className="space-y-4 pt-2">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-forest dark:text-emerald-400 font-semibold">Tier 1: High Alignment (80% - 100%)</span>
                <span className="font-mono text-ink dark:text-ink-dark font-bold">{buckets.excellent} candidate(s)</span>
              </div>
              <div className="w-full h-2.5 bg-stone-light dark:bg-stone-dark/40 rounded-full overflow-hidden border border-stone dark:border-stone-dark">
                <div
                  className="h-full bg-forest rounded-full transition-all duration-500"
                  style={{ width: `${(buckets.excellent / Math.max(1, totalEvaluated)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-forest-light dark:text-emerald-300 font-semibold">Tier 2: Strong Match (60% - 79%)</span>
                <span className="font-mono text-ink dark:text-ink-dark font-bold">{buckets.strong} candidate(s)</span>
              </div>
              <div className="w-full h-2.5 bg-stone-light dark:bg-stone-dark/40 rounded-full overflow-hidden border border-stone dark:border-stone-dark">
                <div
                  className="h-full bg-forest-light rounded-full transition-all duration-500"
                  style={{ width: `${(buckets.strong / Math.max(1, totalEvaluated)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-amber dark:text-amber-400 font-semibold">Tier 3: Moderate / Gaps (40% - 59%)</span>
                <span className="font-mono text-ink dark:text-ink-dark font-bold">{buckets.moderate} candidate(s)</span>
              </div>
              <div className="w-full h-2.5 bg-stone-light dark:bg-stone-dark/40 rounded-full overflow-hidden border border-stone dark:border-stone-dark">
                <div
                  className="h-full bg-amber rounded-full transition-all duration-500"
                  style={{ width: `${(buckets.moderate / Math.max(1, totalEvaluated)) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-brand-error dark:text-rose-400 font-semibold">Tier 4: Low Evidence (0% - 39%)</span>
                <span className="font-mono text-ink dark:text-ink-dark font-bold">{buckets.low} candidate(s)</span>
              </div>
              <div className="w-full h-2.5 bg-stone-light dark:bg-stone-dark/40 rounded-full overflow-hidden border border-stone dark:border-stone-dark">
                <div
                  className="h-full bg-brand-error rounded-full transition-all duration-500"
                  style={{ width: `${(buckets.low / Math.max(1, totalEvaluated)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Workflow Funnel */}
        <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4 shadow-xs">
          <h2 className="text-sm font-serif font-bold text-ink dark:text-ink-dark flex items-center gap-2 uppercase tracking-wider text-forest dark:text-emerald-400">
            <TrendingUp className="w-4 h-4" /> Candidate Workflow Funnel
          </h2>

          <div className="grid grid-cols-2 gap-3.5 pt-2 text-xs">
            <div className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
              <span className="text-ink-muted dark:text-ink-dark-muted block text-[10px] uppercase font-bold tracking-wider mb-1">Total Uploaded</span>
              <span className="text-2xl font-extrabold text-ink dark:text-ink-dark font-mono">{funnel.uploaded || 0}</span>
            </div>

            <div className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
              <span className="text-ink-muted dark:text-ink-dark-muted block text-[10px] uppercase font-bold tracking-wider mb-1">Awaiting Review</span>
              <span className="text-2xl font-extrabold text-amber dark:text-amber-400 font-mono">{funnel.awaiting_review || 0}</span>
            </div>

            <div className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
              <span className="text-ink-muted dark:text-ink-dark-muted block text-[10px] uppercase font-bold tracking-wider mb-1">Shortlisted</span>
              <span className="text-2xl font-extrabold text-forest dark:text-emerald-400 font-mono">{funnel.shortlisted || 0}</span>
            </div>

            <div className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
              <span className="text-ink-muted dark:text-ink-dark-muted block text-[10px] uppercase font-bold tracking-wider mb-1">Interview Planned</span>
              <span className="text-2xl font-extrabold text-forest-light dark:text-emerald-300 font-mono">{funnel.interview_planned || 0}</span>
            </div>

            <div className="p-4 rounded-2xl bg-forest-faint dark:bg-forest/20 border border-forest/20 dark:border-forest/40 col-span-2">
              <span className="text-forest dark:text-emerald-300 block text-[10px] uppercase font-bold tracking-wider mb-1">Interviews Completed</span>
              <span className="text-2xl font-extrabold text-forest-deep dark:text-emerald-200 font-mono">{funnel.interview_completed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Requirement Pass Rate Analysis */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4 shadow-xs">
        <div>
          <h2 className="text-base font-serif font-bold text-ink dark:text-ink-dark">Requirement Demonstration Breakdown</h2>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
            Pass rates and evidence frequency across all candidates for each job requirement
          </p>
        </div>

        <div className="space-y-3 pt-2">
          {reqBreakdown.map((item: any, idx: number) => {
            const demonstratedPct = item.totalEvaluated > 0 ? Math.round((item.demonstrated / item.totalEvaluated) * 100) : 0;
            const partialPct = item.totalEvaluated > 0 ? Math.round((item.partial / item.totalEvaluated) * 100) : 0;

            return (
              <div key={idx} className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-semibold text-ink dark:text-ink-dark">{item.text}</span>
                    <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted ml-2">({item.importance})</span>
                  </div>
                  <div className="font-mono text-xs text-forest dark:text-emerald-400 font-bold">
                    {demonstratedPct}% Demonstrated
                  </div>
                </div>

                <div className="w-full h-2 bg-stone-light dark:bg-stone-dark rounded-full flex overflow-hidden">
                  <div className="bg-forest h-full" style={{ width: `${demonstratedPct}%` }} title="Demonstrated" />
                  <div className="bg-amber h-full" style={{ width: `${partialPct}%` }} title="Partial" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legal & Compliance Notice */}
      <div className="p-5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-ink-muted dark:text-ink-dark-muted text-xs leading-relaxed space-y-1">
        <p className="font-bold text-ink dark:text-ink-dark">Auditable Decision-Support Notice (Compliance / Fair Hiring):</p>
        <p>
          All scores and evidence coverage in this report are calculated deterministically against the approved requirement version. Scores are intended solely as an objective review aid for human recruiters. Consequential employment decisions require human review and validation.
        </p>
      </div>
    </div>
  );
};
