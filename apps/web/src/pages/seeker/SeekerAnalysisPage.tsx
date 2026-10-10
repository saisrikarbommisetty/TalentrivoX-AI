import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  FileText,
  BookmarkCheck,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  History,
  PenTool
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ScoreGauge } from '../../components/ScoreGauge';
import { Badge } from '../../components/Badge';

export const SeekerAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [resumes, setResumes] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [pastAnalyses, setPastAnalyses] = useState<any[]>([]);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);

  // Form input state
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [inputMode, setInputMode] = useState<'paste' | 'saved'>('paste');
  const [selectedSavedJobId, setSelectedSavedJobId] = useState('');
  const [jobTitle, setJobTitle] = useState('Senior Full-Stack TypeScript Engineer');
  const [jobDescription, setJobDescription] = useState(
`We are seeking a Senior Full-Stack Engineer with deep experience in TypeScript, React, Node.js, and PostgreSQL.
Key Requirements:
- 5+ years building web applications with TypeScript, React 18, and state management.
- Backend proficiency in Node.js, REST API architecture, and microservices.
- Relational database schema design and query optimization with PostgreSQL.
- Experience with automated testing (Vitest/Jest), Docker, and CI/CD pipelines.
- Technical leadership, peer code reviews, and architectural decision making.`
  );

  // Analysis running & results state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analysisError, setAnalysisError] = useState('');

  useEffect(() => {
    const initData = async () => {
      try {
        const [resumesRes, jobsRes, analysesRes] = await Promise.all([
          api.getSeekerResumes(),
          api.getSeekerSavedJobs(),
          api.getSeekerAnalyses()
        ]);
        setResumes(resumesRes.resumes);
        setSavedJobs(jobsRes.savedJobs);
        setPastAnalyses(analysesRes.analyses);

        // Auto-select active resume
        const active = resumesRes.resumes.find((r: any) => r.isActive) || resumesRes.resumes[0];
        if (active) setSelectedResumeId(active.id);

        if (jobsRes.savedJobs.length > 0) {
          setSelectedSavedJobId(jobsRes.savedJobs[0].id);
        }

        // Check if query param specified past analysis id
        const analysisIdParam = searchParams.get('id');
        if (analysisIdParam) {
          const matching = analysesRes.analyses.find((a: any) => a.id === analysisIdParam);
          if (matching) setAnalysisResult(matching);
        } else if (analysesRes.analyses.length > 0) {
          setAnalysisResult(analysesRes.analyses[0]);
        }
      } catch (err) {
        console.error('Failed to load analysis prerequisite data', err);
      } finally {
        setIsLoadingInitial(false);
      }
    };
    initData();
  }, [searchParams]);

  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setAnalysisError('Please select a resume version from your vault.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');
    try {
      const payload: any = {
        resumeId: selectedResumeId
      };

      if (inputMode === 'saved' && selectedSavedJobId) {
        payload.savedJobId = selectedSavedJobId;
      } else {
        payload.jobTitle = jobTitle;
        payload.jobDescription = jobDescription;
      }

      const res = await api.analyzeSeekerResume(payload);
      setAnalysisResult(res.analysis);
      setPastAnalyses((prev) => [res.analysis, ...prev]);
    } catch (err: any) {
      setAnalysisError(err.message || 'Analysis failed. Please check inputs and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoadingInitial) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            Personal Resume-to-Job Match Analysis
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Deterministic evidence-based matching, gap analysis, and quote verification against target job descriptions
          </p>
        </div>

        {pastAnalyses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted dark:text-ink-dark-muted">Past Audits:</span>
            <select
              value={analysisResult?.id || ''}
              onChange={(e) => {
                const found = pastAnalyses.find((a) => a.id === e.target.value);
                if (found) setAnalysisResult(found);
              }}
              className="px-3 py-1.5 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs text-ink dark:text-ink-dark font-semibold focus:outline-none"
            >
              {pastAnalyses.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.targetJobTitle} ({a.overallScore}%) - {new Date(a.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Input Configuration Grid */}
      <form onSubmit={handleRunAnalysis} className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Resume Version Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink dark:text-ink-dark uppercase tracking-wider block">
              1. Select Resume from Vault *
            </label>
            {resumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink dark:text-ink-dark font-semibold focus:outline-none focus:border-forest"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.versionLabel} {r.isActive ? '★ (Active)' : ''} — {r.fileName}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark text-xs text-ink-muted dark:text-ink-dark-muted flex items-center justify-between">
                <span>No resumes in vault.</span>
                <Link to="/app/seeker/resumes" className="text-forest dark:text-emerald-400 font-semibold hover:underline">
                  Upload Resume First
                </Link>
              </div>
            )}
          </div>

          {/* Right: Mode Switcher */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink dark:text-ink-dark uppercase tracking-wider block">
              2. Target Role Source *
            </label>
            <div className="flex rounded-xl bg-ivory dark:bg-ivory-dark p-1 border border-stone dark:border-stone-dark">
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  inputMode === 'paste'
                    ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
                    : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                Paste Job Description
              </button>
              <button
                type="button"
                onClick={() => setInputMode('saved')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  inputMode === 'saved'
                    ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
                    : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
                }`}
              >
                Saved Target Jobs ({savedJobs.length})
              </button>
            </div>
          </div>
        </div>

        {/* Input Details */}
        {inputMode === 'paste' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-light dark:text-ink-dark-secondary mb-1">
                Target Role Title
              </label>
              <input
                type="text"
                required
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Lead TypeScript Engineer"
                className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-light dark:text-ink-dark-secondary mb-1">
                Paste Complete Job Requirements & Description
              </label>
              <textarea
                rows={5}
                required
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job post with responsibilities, required skills, preferred qualifications..."
                className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark font-sans leading-relaxed"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-ink-light dark:text-ink-dark-secondary mb-1">
              Select Saved Target Job
            </label>
            {savedJobs.length > 0 ? (
              <select
                value={selectedSavedJobId}
                onChange={(e) => setSelectedSavedJobId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink dark:text-ink-dark font-semibold focus:outline-none"
              >
                {savedJobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} — {j.company} ({j.location || 'Remote'})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark text-xs text-ink-muted dark:text-ink-dark-muted">
                No saved jobs found.{' '}
                <Link to="/app/seeker/saved-jobs" className="text-forest dark:text-emerald-400 font-semibold hover:underline">
                  Save a target role first
                </Link>{' '}
                or switch to "Paste Job Description".
              </div>
            )}
          </div>
        )}

        {analysisError && (
          <div className="p-3 rounded-xl bg-brand-error-light dark:bg-rose-950/40 text-brand-error dark:text-rose-300 text-xs">
            {analysisError}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-between pt-2 border-t border-stone dark:border-stone-dark">
          <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
            Evaluation uses deterministic rules matching resume text with essential & preferred weightings.
          </span>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running Evidence Match Engine...</span>
              </>
            ) : (
              <>
                <ScanSearch className="w-4 h-4" />
                <span>Run Match Analysis</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Executive Match Score & Coverage Card */}
          <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-6 relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-80 h-64 bg-forest/5 dark:bg-forest/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone dark:border-stone-dark relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20 uppercase tracking-wider">
                    Evidence Audit Result
                  </span>
                  <span className="text-xs text-ink-muted dark:text-ink-dark-muted">• {analysisResult.targetCompany || 'Target Role'}</span>
                </div>
                <h2 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark">
                  {analysisResult.targetJobTitle}
                </h2>
                <span className="text-xs text-ink-muted dark:text-ink-dark-muted block">
                  Analyzed against {analysisResult.resumeVersionLabel} • {new Date(analysisResult.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Score Gauges */}
              <div className="flex items-center gap-6 self-start md:self-auto relative z-10">
                <div className="text-center">
                  <div className="text-4xl font-mono font-extrabold text-forest dark:text-emerald-400">
                    {analysisResult.overallScore}%
                  </div>
                  <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted tracking-wider">
                    Overall Match
                  </span>
                </div>
                <div className="h-10 w-px bg-stone dark:bg-stone-dark" />
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-ink dark:text-ink-dark">
                    {analysisResult.essentialScore}%
                  </div>
                  <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted tracking-wider">
                    Essential Req
                  </span>
                </div>
                <div className="h-10 w-px bg-stone dark:bg-stone-dark" />
                <div className="text-center">
                  <div className="text-2xl font-mono font-bold text-amber dark:text-amber-400">
                    {analysisResult.preferredScore}%
                  </div>
                  <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted tracking-wider">
                    Preferred Req
                  </span>
                </div>
              </div>
            </div>

            {/* Objective Synthesis */}
            <div className="p-5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2 relative z-10">
              <span className="text-[10px] font-bold text-forest dark:text-emerald-400 uppercase tracking-wider block">
                Executive Synthesis (Audit Summary)
              </span>
              <p className="text-xs md:text-sm text-ink-light dark:text-ink-dark-secondary leading-relaxed font-sans">
                {analysisResult.summary}
              </p>
              <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted italic block pt-1">
                Notice: Match score indicates deterministic evidence coverage in your current resume version, not an absolute guarantee of hiring.
              </span>
            </div>

            {/* Quick Actions to Studio & Interview Prep */}
            <div className="flex flex-wrap items-center gap-3 pt-2 relative z-10">
              <Link
                to="/app/seeker/studio"
                className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Open in Resume Improvement Studio</span>
              </Link>
              <Link
                to="/app/seeker/interview-prep"
                className="px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold border border-stone dark:border-stone-dark shadow-xs flex items-center gap-1.5 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
                <span>Prepare Target Interview Questions</span>
              </Link>
              <Link
                to="/app/seeker/roadmap"
                className="px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold border border-stone dark:border-stone-dark shadow-xs flex items-center gap-1.5 transition-all"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber dark:text-amber-400" />
                <span>Update Skill Roadmap</span>
              </Link>
            </div>
          </div>

          {/* Requirement-by-Requirement Evidence Matrix */}
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
              Requirement Evidence Breakdown ({analysisResult.matches?.length || 0} Criteria)
            </h3>

            <div className="space-y-4">
              {(analysisResult.matches || []).map((m: any, idx: number) => {
                const isDemonstrated = m.status === 'demonstrated';
                const isPartial = m.status === 'partial';

                return (
                  <div
                    key={idx}
                    className={`p-6 md:p-7 rounded-3xl bg-surface dark:bg-surface-dark border transition-all shadow-xs space-y-4 ${
                      isDemonstrated
                        ? 'border-forest/40 dark:border-emerald-500/40'
                        : isPartial
                        ? 'border-amber/40 dark:border-amber/40'
                        : 'border-brand-error/30 dark:border-rose-900/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark">
                            {m.category?.replace('_', ' ')}
                          </span>
                          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            m.importance === 'essential'
                              ? 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20'
                              : 'bg-stone-warm dark:bg-stone-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark'
                          }`}>
                            {m.importance} (Weight {m.weight})
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-ink dark:text-ink-dark text-base pt-1">
                          {m.requirementText}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${
                        isDemonstrated
                          ? 'bg-forest text-surface'
                          : isPartial
                          ? 'bg-amber text-surface'
                          : 'bg-brand-error text-surface'
                      }`}>
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Resume Evidence Quote */}
                    {m.resumeEvidenceText ? (
                      <div className="p-4 rounded-2xl bg-forest-faint/60 dark:bg-forest/20 border border-forest/20 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-forest dark:text-emerald-300 uppercase tracking-wider block">
                          Verified Excerpt from Resume:
                        </span>
                        <blockquote className="font-serif italic text-xs text-ink dark:text-ink-dark leading-relaxed">
                          "{m.resumeEvidenceText}"
                        </blockquote>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-brand-error-light dark:bg-rose-950/30 text-xs text-brand-error dark:text-rose-300">
                        No supporting passage or keywords found in the selected resume text.
                      </div>
                    )}

                    {/* Gap Explanation & Recommendation */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                      <div className="p-3.5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
                        <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1">
                          Analysis Assessment
                        </span>
                        <p className="text-ink dark:text-ink-dark leading-relaxed">{m.gapExplanation}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
                        <span className="text-[10px] font-bold text-forest dark:text-emerald-400 uppercase tracking-wider block mb-1">
                          Actionable Resume Recommendation
                        </span>
                        <p className="text-ink dark:text-ink-dark leading-relaxed">{m.recommendation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
