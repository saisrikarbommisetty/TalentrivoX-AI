import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Users,
  Search,
  Scale,
  Briefcase,
  Filter,
  ArrowRight,
  Sparkles,
  Download
} from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';
import { EvidenceBadge, WorkflowBadge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

export const CandidateListPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [sortBy, setSortBy] = useState('score_desc');

  // Multi-select for comparison
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

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

  const fetchCandidates = async () => {
    if (!selectedJobId) return;
    setIsLoading(true);
    try {
      const res = await api.getJobCandidates(selectedJobId, {
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        minScore,
        sortBy
      });
      setCandidates(res.candidates);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [selectedJobId, search, statusFilter, minScore, sortBy]);

  const toggleCompare = (candidateId: string) => {
    if (selectedForComparison.includes(candidateId)) {
      setSelectedForComparison(selectedForComparison.filter((id) => id !== candidateId));
    } else {
      if (selectedForComparison.length >= 4) {
        alert('You can compare up to 4 candidates simultaneously.');
        return;
      }
      setSelectedForComparison([...selectedForComparison, candidateId]);
    }
  };

  if (isLoading && !candidates) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink dark:text-ink-dark tracking-tight">Candidate Pool</h1>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
            Search, filter, and inspect evidence citations across all screened applicants
          </p>
        </div>

        {selectedForComparison.length > 0 && (
          <button
            onClick={() => navigate(`/app/comparison?ids=${selectedForComparison.join(',')}`)}
            className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
          >
            <Scale className="w-4 h-4" /> Compare ({selectedForComparison.length}) Candidates
          </button>
        )}
      </div>

      {/* Role Picker & Filter Bar */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase tracking-wider">
              Selected Role Opening
            </label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs font-semibold text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.candidateCount} candidates)
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-end">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search candidate name or skill keywords..."
                className="w-full pl-10 pr-4 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
              />
            </div>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-stone dark:border-stone-dark">
          <div className="w-full sm:w-44">
            <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
            >
              <option value="all">All Statuses</option>
              <option value="awaiting_review">Awaiting Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_planned">Interview Planned</option>
              <option value="interview_completed">Interview Completed</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="w-full sm:w-44">
            <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase tracking-wider">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
            >
              <option value="score_desc">Highest Match Score</option>
              <option value="score_asc">Lowest Match Score</option>
              <option value="name_asc">Candidate Name</option>
              <option value="date_desc">Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Candidates Table */}
      {candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          description="Try modifying your search filter or upload candidate resumes for this role."
          actionLabel="View Job Pipeline"
          onAction={() => selectedJobId && navigate(`/app/jobs/${selectedJobId}`)}
        />
      ) : (
        <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink dark:text-ink-dark">
              <thead className="bg-ivory dark:bg-ivory-dark text-ink-muted dark:text-ink-muted-dark font-semibold border-b border-stone dark:border-stone-dark text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10">
                    <span className="sr-only">Select</span>
                  </th>
                  <th className="p-4">Candidate & Extracted Skills</th>
                  <th className="p-4">Match Score</th>
                  <th className="p-4">Coverage</th>
                  <th className="p-4">Workflow Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone dark:divide-stone-dark">
                {candidates.map((cand) => (
                  <tr
                    key={cand.id}
                    className="hover:bg-ivory dark:hover:bg-ivory-dark/60 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/app/candidates/${cand.id}`)}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedForComparison.includes(cand.id)}
                        onChange={() => toggleCompare(cand.id)}
                        className="rounded border-stone dark:border-stone-dark text-forest focus:ring-forest cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="font-serif font-bold text-base text-ink dark:text-ink-dark group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
                        {cand.fullName}
                      </div>
                      <div className="text-[11px] text-ink-muted dark:text-ink-muted-dark mt-0.5">
                        {cand.email || 'No email'} • <span>{cand.originalFilename}</span>
                      </div>
                      {cand.skills && cand.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {cand.skills.slice(0, 4).map((s: string, idx: number) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-ivory dark:bg-ivory-dark text-[10px] font-semibold text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-faint dark:bg-forest/20 border border-forest/20">
                        <span className="font-mono text-xs font-extrabold text-forest dark:text-emerald-400">{cand.score}%</span>
                        <span className="text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark uppercase">Match</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1 max-w-[130px]">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-ink-muted dark:text-ink-muted-dark">Overall:</span>
                          <span className="font-mono font-bold text-ink dark:text-ink-dark">{cand.coveragePercentage || 0}%</span>
                        </div>
                        <div className="tale-match-bar">
                          <div className="tale-match-fill" style={{ width: `${cand.coveragePercentage || 0}%` }} />
                        </div>
                        <div className="text-[10px] text-forest dark:text-emerald-400 font-mono font-bold">
                          {cand.essentialCoveragePercentage || 0}% essential
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <WorkflowBadge status={cand.workflowStatus} />
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/app/candidates/${cand.id}`)}
                        className="px-3.5 py-1.5 rounded-xl bg-forest-faint dark:bg-forest/20 hover:bg-forest text-forest dark:text-emerald-300 hover:text-white text-xs font-bold transition-all cursor-pointer border border-forest/20"
                      >
                        Inspect Evidence →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
