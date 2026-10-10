import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Briefcase,
  Users,
  Clock,
  Calendar,
  Sparkles,
  Plus,
  ArrowRight,
  TrendingUp,
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  Scale,
  Award,
  ChevronRight
} from 'lucide-react';
import { CreateJobModal } from '../components/CreateJobModal';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ScoreGauge } from '../components/ScoreGauge';
import { WorkflowBadge } from '../components/Badge';
import { AmbientBackground } from '../components/AmbientBackground';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState<any>(null);
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await api.getDashboardStats();
      setData(statsRes);

      // Fetch latest candidates if there are active jobs
      if (statsRes.recentJobs && statsRes.recentJobs.length > 0) {
        const topJobId = statsRes.recentJobs[0].id;
        const candRes = await api.getJobCandidates(topJobId);
        setCandidatesList(candRes.candidates || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) return <LoadingSkeleton rows={5} />;

  const stats = data?.stats || {};
  const recentJobs = data?.recentJobs || [];

  return (
    <div className="space-y-8 relative">
      <AmbientBackground variant="dashboard" />
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-forest dark:text-forest-light uppercase tracking-wider">
              TalentrivoX Recruiter Workspace
            </span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-ink dark:text-ink-dark tracking-tight">
            Welcome back, {user?.displayName || 'Recruiter'}
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
            Real-time screening metrics, evidence breakdowns, and candidate evaluation pipelines
          </p>
        </div>

        <div className="flex items-center gap-3">
          {recentJobs.length > 0 && (
            <button
              onClick={() => setUploadJobId(recentJobs[0].id)}
              className="px-4 py-2.5 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone dark:hover:bg-stone-dark/80 text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-forest dark:text-forest-light" />
              Upload Resumes
            </button>
          )}

          <button
            onClick={() => setIsCreateJobOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Job Opening
          </button>
        </div>
      </div>

      {/* Metrics Row (TaleHire Styled Metric Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-2xs hover:border-forest/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider">Active Pipelines</span>
            <div className="w-9 h-9 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 flex items-center justify-center border border-forest/20">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-ink dark:text-ink-dark">{stats.activeJobs || 0}</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium">roles open</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300">
              Active
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-2xs hover:border-forest/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider">Resumes Screened</span>
            <div className="w-9 h-9 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 flex items-center justify-center border border-forest/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-ink dark:text-ink-dark">{stats.totalCandidates || 0}</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium">processed</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 flex items-center gap-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> 100% Parsed
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-2xs hover:border-forest/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider">Awaiting Review</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 flex items-center justify-center border border-amber-200 dark:border-amber-900/30">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-ink dark:text-ink-dark">{stats.awaitingReview || 0}</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium">in queue</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300">
              Action Ready
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-2xs hover:border-forest/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider">Interview Guides</span>
            <div className="w-9 h-9 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 flex items-center justify-center border border-forest/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold font-mono text-ink dark:text-ink-dark">{stats.interviewPlansCount || 0}</span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium">prepared</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300">
              Rubrics Set
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Roles & Recent Candidates */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Roles List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-ink-dark">Active Hiring Pipelines</h2>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Role criteria, candidate volume, and quick screening actions</p>
            </div>
            <button
              onClick={() => navigate('/app/jobs')}
              className="text-xs text-forest dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              View All ({recentJobs.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentJobs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface dark:bg-surface-dark border border-dashed border-stone dark:border-stone-dark text-center space-y-3 shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 flex items-center justify-center mx-auto border border-forest/20">
                <Briefcase className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-ink dark:text-ink-dark">No Job Openings Created Yet</h3>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-sm mx-auto">
                Create your first job description to extract structured requirements and start automated resume matching.
              </p>
              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="px-5 py-2.5 rounded-full bg-forest text-surface text-xs font-semibold hover:bg-forest-hover transition-all cursor-pointer shadow-xs"
              >
                Create First Job Opening
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-2xs hover:border-forest/40 dark:hover:border-forest/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                  onClick={() => navigate(`/app/jobs/${job.id}`)}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/25 uppercase tracking-wider">
                        {job.department}
                      </span>
                      <span className="text-xs text-ink-muted dark:text-ink-muted-dark">• {job.location}</span>
                    </div>
                    <h3 className="text-base font-bold text-ink dark:text-ink-dark group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
                      {job.title}
                    </h3>
                    <p className="text-xs text-ink-muted dark:text-ink-dark-muted line-clamp-1">
                      {job.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setUploadJobId(job.id)}
                      className="px-3.5 py-2 rounded-xl bg-ivory dark:bg-ivory-dark hover:bg-stone-warm dark:hover:bg-stone-dark/80 text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-stone dark:border-stone-dark"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
                      Screen Resumes
                    </button>
                    <button
                      onClick={() => navigate(`/app/jobs/${job.id}`)}
                      className="px-3.5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      Pipeline →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Recent Candidate Evaluations (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-ink-dark">Recent Evaluations</h2>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Latest screened candidate scores</p>
            </div>
            <button
              onClick={() => navigate('/app/candidates')}
              className="text-xs text-forest dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Candidate Pool <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {candidatesList.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface dark:bg-surface-dark border border-dashed border-stone dark:border-stone-dark text-center text-xs text-ink-muted dark:text-ink-muted-dark shadow-2xs">
              <Users className="w-8 h-8 text-sage mx-auto mb-2" />
              <p className="font-semibold text-ink dark:text-ink-dark mb-1">No candidate resumes uploaded</p>
              <p>Upload resumes in PDF/DOCX format to review evidence-backed matches.</p>
            </div>
          ) : (
            <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-2xl divide-y divide-stone dark:divide-stone-dark overflow-hidden shadow-2xs">
              {candidatesList.slice(0, 5).map((cand: any) => (
                <div
                  key={cand.id}
                  onClick={() => navigate(`/app/candidates/${cand.id}`)}
                  className="p-4 hover:bg-ivory dark:hover:bg-ivory-dark/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm text-ink dark:text-ink-dark group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
                      {cand.fullName}
                    </h4>
                    <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark truncate max-w-[200px]">{cand.email || cand.originalFilename}</p>
                    <WorkflowBadge status={cand.workflowStatus} />
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div className="tale-score-bubble">
                      {Math.round(cand.score || 0)}% Match
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateJobModal
        isOpen={isCreateJobOpen}
        onClose={() => setIsCreateJobOpen(false)}
        onSuccess={() => {
          fetchDashboardData();
          navigate('/app/jobs');
        }}
      />

      {uploadJobId && (
        <ResumeUploadModal
          jobId={uploadJobId}
          isOpen={!!uploadJobId}
          onClose={() => setUploadJobId(null)}
          onSuccess={() => {
            fetchDashboardData();
            navigate(`/app/jobs/${uploadJobId}`);
          }}
        />
      )}
    </div>
  );
};
