import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  ScanSearch,
  PenTool,
  CheckCircle2,
  HelpCircle,
  Compass,
  Kanban,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Briefcase,
  Layers,
  Award,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { ScoreGauge } from '../../components/ScoreGauge';
import { AmbientBackground } from '../../components/AmbientBackground';

export const JobSeekerDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.getSeekerDashboard();
        setData(res);
      } catch (err) {
        console.error('Failed to load seeker dashboard', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (isLoading) {
    return <LoadingSkeleton rows={6} />;
  }

  const activeResume = data?.activeResume;
  const recentAnalyses = data?.recentAnalyses || [];
  const applications = data?.applications || [];
  const roadmapProgress = data?.roadmapProgress || { totalTasks: 0, completedTasks: 0, inProgressTasks: 0 };
  const readinessScore = data?.careerReadinessScore || 75;

  return (
    <div className="space-y-8 relative">
      <AmbientBackground variant="dashboard" />
      {/* 1. Executive Welcome & Quick Action Bar */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden z-10">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-64 bg-forest/5 dark:bg-forest/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20">
              Career Intelligence Hub
            </span>
            <span className="text-xs text-ink-muted dark:text-ink-dark-muted">• TalentrivoX AI</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            Welcome back, {user?.displayName?.split(' ')[0] || 'Candidate'}
          </h1>
          <p className="text-xs md:text-sm text-ink-light dark:text-ink-dark-secondary max-w-xl leading-relaxed">
            Optimize your resume with evidence-backed matching, close technical skill gaps, and practice tailored interview simulations for top-tier roles.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            to="/app/seeker/jobs"
            className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Discover Real Jobs</span>
          </Link>
          <Link
            to="/app/seeker/analysis"
            className="px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold border border-stone dark:border-stone-dark shadow-xs flex items-center gap-2 transition-all"
          >
            <ScanSearch className="w-4 h-4 text-forest dark:text-emerald-400" />
            <span>Analyze Target Job</span>
          </Link>
          <Link
            to="/app/seeker/interview-prep"
            className="px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold border border-stone dark:border-stone-dark shadow-xs flex items-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-ink-muted dark:text-ink-dark-muted" />
            <span>Practice Mocks</span>
          </Link>
          <Link
            to="/app/seeker/resumes"
            className="px-4 py-2.5 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold border border-stone dark:border-stone-dark shadow-xs flex items-center gap-2 transition-all"
          >
            <FileText className="w-4 h-4 text-ink-muted dark:text-ink-dark-muted" />
            <span>Vault ({data?.totalResumesCount || 0})</span>
          </Link>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Readiness Score */}
        <div className="p-5 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1">
              Target Readiness
            </span>
            <div className="text-3xl font-mono font-extrabold text-forest dark:text-emerald-400">
              {readinessScore}%
            </div>
            <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
              Based on active profile evidence
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-forest-faint dark:bg-forest/20 flex items-center justify-center text-forest dark:text-emerald-300 border border-forest/20">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Completed Analyses */}
        <div className="p-5 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1">
              Job Match Audits
            </span>
            <div className="text-3xl font-mono font-extrabold text-ink dark:text-ink-dark">
              {data?.totalAnalysesCount || 0}
            </div>
            <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
              {recentAnalyses.length > 0 ? `${recentAnalyses[0].overallScore}% latest match` : 'No audits yet'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark flex items-center justify-center text-forest dark:text-emerald-400">
            <ScanSearch className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Active Applications */}
        <div className="p-5 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1">
              Active Pipeline
            </span>
            <div className="text-3xl font-mono font-extrabold text-amber dark:text-amber-400">
              {applications.length}
            </div>
            <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
              {applications.filter((a: any) => a.status === 'interview').length} interviewing stage
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-light dark:bg-amber/20 border border-amber/30 flex items-center justify-center text-amber dark:text-amber-300">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Skill Roadmap Completion */}
        <div className="p-5 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1">
              Skill Roadmap
            </span>
            <div className="text-3xl font-mono font-extrabold text-ink dark:text-ink-dark">
              {roadmapProgress.completedTasks}/{roadmapProgress.totalTasks}
            </div>
            <span className="text-[11px] text-forest dark:text-emerald-400 font-semibold">
              {roadmapProgress.inProgressTasks} in-progress task(s)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-forest-faint dark:bg-forest/20 border border-forest/20 flex items-center justify-center text-forest dark:text-emerald-300">
            <Compass className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Resume Vault Card & Recent Analyses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Resume Card */}
          <div className="p-6 md:p-7 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone dark:border-stone-dark">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-forest dark:text-emerald-400" />
                <h2 className="text-sm font-serif font-bold text-ink dark:text-ink-dark uppercase tracking-wider">
                  Active Resume in Vault
                </h2>
              </div>
              <Link
                to="/app/seeker/resumes"
                className="text-xs text-forest dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Manage Versions</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {activeResume ? (
              <div className="p-5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink dark:text-ink-dark text-sm">
                        {activeResume.versionLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-forest text-surface">
                        ACTIVE
                      </span>
                    </div>
                    <span className="text-xs text-ink-muted dark:text-ink-dark-muted">
                      {activeResume.fileName} • {(activeResume.fileSize / 1024).toFixed(1)} KB
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/app/seeker/studio"
                      className="px-3.5 py-2 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark hover:border-forest transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <PenTool className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
                      <span>Studio Rewrites</span>
                    </Link>
                    <Link
                      to="/app/seeker/ats-check"
                      className="px-3.5 py-2 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark hover:border-forest transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber dark:text-amber-400" />
                      <span>ATS Check</span>
                    </Link>
                  </div>
                </div>

                {/* Extracted Skills Preview */}
                {activeResume.parsedData?.skills && (
                  <div className="pt-2 border-t border-stone dark:border-stone-dark">
                    <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1.5">
                      Extracted Verified Skills ({activeResume.parsedData.skills.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeResume.parsedData.skills.slice(0, 10).map((skill: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2.5 py-0.5 rounded-full bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-[11px] font-mono font-medium text-ink-light dark:text-ink-dark-secondary"
                        >
                          {skill}
                        </span>
                      ))}
                      {activeResume.parsedData.skills.length > 10 && (
                        <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted self-center">
                          +{activeResume.parsedData.skills.length - 10} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center bg-ivory dark:bg-ivory-dark rounded-2xl border border-dashed border-stone dark:border-stone-dark space-y-3">
                <FileText className="w-8 h-8 text-ink-muted dark:text-ink-dark-muted mx-auto opacity-50" />
                <h3 className="font-serif font-bold text-ink dark:text-ink-dark text-base">No active resume uploaded</h3>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-sm mx-auto">
                  Upload your master resume in PDF or DOCX format to unlock instant role matching and interview practice.
                </p>
                <Link
                  to="/app/seeker/resumes"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-surface text-xs font-semibold shadow-xs hover:bg-forest-hover transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Resume Now</span>
                </Link>
              </div>
            )}
          </div>

          {/* Recent Match Analyses */}
          <div className="p-6 md:p-7 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone dark:border-stone-dark">
              <div className="flex items-center gap-2">
                <ScanSearch className="w-4 h-4 text-forest dark:text-emerald-400" />
                <h2 className="text-sm font-serif font-bold text-ink dark:text-ink-dark uppercase tracking-wider">
                  Recent Target Role Analyses
                </h2>
              </div>
              <Link
                to="/app/seeker/analysis"
                className="text-xs text-forest dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>New Analysis</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {recentAnalyses.map((analysis: any) => (
                  <div
                    key={analysis.id}
                    onClick={() => navigate('/app/seeker/analysis')}
                    className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark hover:border-forest/40 dark:hover:border-forest/50 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif font-bold text-ink dark:text-ink-dark text-sm group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
                          {analysis.targetJobTitle}
                        </h4>
                        <span className="text-xs text-ink-muted dark:text-ink-dark-muted">
                          • {analysis.targetCompany || 'Target Role'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-light dark:text-ink-dark-secondary line-clamp-1">
                        {analysis.summary}
                      </p>
                      <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted">
                        Evaluated against {analysis.resumeVersionLabel} • {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-faint dark:bg-forest/20 border border-forest/20">
                        <span className="text-sm font-mono font-extrabold text-forest dark:text-emerald-400">
                          {analysis.overallScore}%
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-ink-muted dark:text-ink-dark-muted group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-ivory dark:bg-ivory-dark rounded-2xl border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted">
                No job analyses performed yet. Paste a target job description to see your deterministic match score.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Quick Career Actions & Application Pipeline */}
        <div className="space-y-6">
          {/* Quick Mock Interview Practice Trigger */}
          <div className="p-6 md:p-7 rounded-3xl bg-forest dark:bg-surface-dark border border-forest/30 dark:border-stone-dark text-white space-y-4 shadow-editorial relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2 text-emerald-300 dark:text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-4 h-4" />
                <span>AI Interview Simulator</span>
              </div>
              <h3 className="font-serif text-lg font-bold">
                Tailored Mock Interview Prep
              </h3>
              <p className="text-xs text-emerald-100 dark:text-ink-dark-secondary leading-relaxed">
                Practice answering behavioral, technical architecture, and skill gap validation questions with real-time feedback.
              </p>
            </div>

            <Link
              to="/app/seeker/interview-prep"
              className="relative z-10 w-full py-2.5 px-4 rounded-xl bg-surface dark:bg-forest text-forest dark:text-surface font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:opacity-90 transition-opacity"
            >
              <span>Launch Mock Session</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Application Pipeline Overview */}
          <div className="p-6 md:p-7 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone dark:border-stone-dark">
              <div className="flex items-center gap-2">
                <Kanban className="w-4 h-4 text-forest dark:text-emerald-400" />
                <h2 className="text-sm font-serif font-bold text-ink dark:text-ink-dark uppercase tracking-wider">
                  Applications Tracker
                </h2>
              </div>
              <Link
                to="/app/seeker/applications"
                className="text-xs text-forest dark:text-emerald-400 hover:underline font-semibold"
              >
                View Board
              </Link>
            </div>

            {applications.length > 0 ? (
              <div className="space-y-2.5">
                {applications.slice(0, 4).map((app: any) => (
                  <div
                    key={app.id}
                    onClick={() => navigate('/app/seeker/applications')}
                    className="p-3.5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark hover:border-forest/40 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold text-ink dark:text-ink-dark text-xs">{app.jobTitle}</h4>
                      <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">{app.company}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      app.status === 'interview'
                        ? 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300'
                        : app.status === 'offer'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-light dark:bg-stone-dark text-ink-light dark:text-ink-dark-secondary'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center bg-ivory dark:bg-ivory-dark rounded-2xl text-xs text-ink-muted dark:text-ink-dark-muted">
                No active job applications tracked yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
