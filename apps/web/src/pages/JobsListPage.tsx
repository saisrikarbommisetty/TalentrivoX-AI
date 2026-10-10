import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Search, Briefcase, Users, FileCode2, UploadCloud, ArrowRight, Trash2 } from 'lucide-react';
import { CreateJobModal } from '../components/CreateJobModal';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

export const JobsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      const res = await api.getJobs();
      setJobs(res.jobs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (jobId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this job opening and all associated candidate evaluations?')) {
      await api.deleteJob(jobId);
      fetchJobs();
    }
  };

  if (isLoading) return <LoadingSkeleton rows={4} />;

  const filtered = jobs.filter((j) => {
    const matchesSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.department.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || j.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink dark:text-ink-dark tracking-tight">Job Openings</h1>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
            Manage hiring positions, structured criteria versions, and candidate screening pipelines
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Job Opening
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by job title, department, or keywords..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark w-full sm:w-auto font-medium"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Openings</option>
          <option value="archived">Archived</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Jobs Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No job openings found"
          description="Create a role or adjust your search filter to start screening candidates."
          actionLabel="Create Job Opening"
          onAction={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/app/jobs/${job.id}`)}
              className="p-6 md:p-7 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs hover:border-forest/40 dark:hover:border-emerald-500/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20 uppercase tracking-wider">
                    {job.department}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${job.status === 'active' ? 'bg-forest dark:bg-emerald-400' : 'bg-stone dark:bg-stone-dark'}`} />
                    <span className="text-[11px] font-semibold text-ink-muted dark:text-ink-muted-dark capitalize">{job.status}</span>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors leading-snug">
                  {job.title}
                </h3>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-2 line-clamp-2 leading-relaxed">
                  {job.description}
                </p>

                {/* Metadata */}
                <div className="flex items-center gap-4 mt-5 text-xs text-ink-muted dark:text-ink-muted-dark pt-3.5 border-t border-stone dark:border-stone-dark">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-forest dark:text-emerald-400" />
                    <span className="font-bold text-ink dark:text-ink-dark font-mono">{job.candidateCount}</span> candidates
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileCode2 className="w-4 h-4 text-forest dark:text-emerald-400" />
                    <span className="font-bold text-ink dark:text-ink-dark font-mono">{job.requirementCount}</span> criteria (v{job.latestVersionNumber})
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-5 border-t border-stone dark:border-stone-dark flex items-center justify-between">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadJobId(job.id);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-forest-faint dark:bg-forest/20 hover:bg-forest text-forest dark:text-emerald-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 border border-forest/20 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  Screen Resumes
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDelete(job.id, e)}
                    className="p-2 rounded-xl text-ink-muted dark:text-ink-muted-dark hover:text-brand-error dark:hover:text-rose-300 hover:bg-brand-error-light dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-forest dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateJobModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchJobs()}
      />

      {uploadJobId && (
        <ResumeUploadModal
          jobId={uploadJobId}
          isOpen={!!uploadJobId}
          onClose={() => setUploadJobId(null)}
          onSuccess={() => {
            fetchJobs();
            navigate(`/app/jobs/${uploadJobId}`);
          }}
        />
      )}
    </div>
  );
};
