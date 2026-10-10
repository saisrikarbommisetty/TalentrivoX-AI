import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  Briefcase,
  Users,
  FileCode2,
  UploadCloud,
  Download,
  Plus,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Sparkles,
  Save,
  Search,
  Scale,
  Eye,
  ChevronRight,
  Filter,
  Layers
} from 'lucide-react';
import { ResumeUploadModal } from '../components/ResumeUploadModal';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { ScoreGauge } from '../components/ScoreGauge';
import { EvidenceBadge, WorkflowBadge } from '../components/Badge';
import { JobRequirement } from '@avengercoders/shared';
import { CandidateDiscoveryView } from '../components/CandidateDiscoveryView';

const EmptyState: React.FC<{
  icon: any;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="p-12 text-center rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-3 relative overflow-hidden">
    <div className="w-14 h-14 rounded-2xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-400 flex items-center justify-center mx-auto border border-forest/20">
      <Icon className="w-7 h-7" />
    </div>
    <h3 className="font-serif font-bold text-lg text-ink dark:text-ink-dark">{title}</h3>
    <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-sm mx-auto leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-2 px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-hover transition-all shadow-xs cursor-pointer"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'candidates' | 'discovery' | 'requirements' | 'details'>('candidates');

  // Candidate Filters
  const [candidateSearch, setCandidateSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [minScore, setMinScore] = useState<number>(0);

  // Compare Candidates Selection (up to 4)
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);

  // Modals & Requirements state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editableRequirements, setEditableRequirements] = useState<JobRequirement[]>([]);
  const [isSavingReqs, setIsSavingReqs] = useState(false);
  const [isExtractingReqs, setIsExtractingReqs] = useState(false);
  const [reqSaveMessage, setReqSaveMessage] = useState('');

  const fetchJobAndCandidates = async () => {
    if (!jobId) return;
    try {
      const [jobRes, candRes] = await Promise.all([
        api.getJob(jobId),
        api.getJobCandidates(jobId)
      ]);
      setData(jobRes);
      setCandidates(candRes.candidates || []);

      if (jobRes.requirementVersion?.requirements_json) {
        setEditableRequirements(jobRes.requirementVersion.requirements_json);
      } else if (jobRes.requirements) {
        setEditableRequirements(jobRes.requirements);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobAndCandidates();
  }, [jobId]);

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !data) {
    return (
      <div className="p-8 text-center text-xs text-brand-error bg-brand-error-light dark:bg-rose-950/40 rounded-3xl border border-brand-error/20">
        {error || 'Job not found'}
      </div>
    );
  }

  const { job, requirementVersion } = data;

  const handleAddRequirement = () => {
    setEditableRequirements([
      ...editableRequirements,
      {
        id: `req_${Date.now()}`,
        text: '',
        category: 'technical_skill',
        importance: 'essential',
        weight: 5,
        evidenceExpectations: '',
        assessableFromResume: true
      }
    ]);
  };

  const handleUpdateReqField = (index: number, field: string, value: any) => {
    const updated = [...editableRequirements];
    updated[index] = { ...updated[index], [field]: value };
    setEditableRequirements(updated);
  };

  const handleRemoveReq = (index: number) => {
    setEditableRequirements(editableRequirements.filter((_, i) => i !== index));
  };

  const handleSaveRequirements = async () => {
    if (!jobId) return;
    setIsSavingReqs(true);
    setReqSaveMessage('');
    try {
      const res = await api.updateRequirements(jobId, editableRequirements);
      setReqSaveMessage(res.message);
      fetchJobAndCandidates();
    } catch (err: any) {
      alert(err.message || 'Failed to save requirements');
    } finally {
      setIsSavingReqs(false);
    }
  };

  const handleExtractWithAI = async () => {
    if (!jobId) return;
    setIsExtractingReqs(true);
    try {
      const res = await api.extractRequirements(jobId);
      setEditableRequirements(res.requirements);
      setReqSaveMessage('AI extracted fresh criteria from description. Review and click Save New Version.');
    } catch (err: any) {
      alert(err.message || 'AI extraction failed');
    } finally {
      setIsExtractingReqs(false);
    }
  };

  const toggleCompare = (candidateId: string) => {
    if (selectedForComparison.includes(candidateId)) {
      setSelectedForComparison(selectedForComparison.filter((id) => id !== candidateId));
    } else {
      if (selectedForComparison.length >= 4) {
        alert('You can compare up to 4 candidates at a time.');
        return;
      }
      setSelectedForComparison([...selectedForComparison, candidateId]);
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      c.skills.some((s: string) => s.toLowerCase().includes(candidateSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.workflowStatus === statusFilter;
    const matchesScore = c.score === null || c.score >= minScore;
    return matchesSearch && matchesStatus && matchesScore;
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Job Header */}
      <div>
        <button
          onClick={() => navigate('/app/jobs')}
          className="text-xs text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Job Openings
        </button>

        <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-64 bg-forest/5 dark:bg-forest/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 relative z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20 uppercase tracking-wider">
                {job.department}
              </span>
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark">• {job.location} • {job.employmentType}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-stone-light dark:bg-stone-dark text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark">
                Criteria v{requirementVersion?.version_number || 1}
              </span>
            </div>

            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink dark:text-ink-dark tracking-tight">
              {job.title}
            </h1>

            <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-2xl leading-relaxed">
              {job.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button
              onClick={() => setActiveTab('discovery')}
              className="px-4 py-2.5 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 hover:bg-forest-light dark:hover:bg-forest/30 text-xs font-semibold border border-forest/30 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
            >
              <Sparkles className="w-4 h-4 text-forest dark:text-emerald-400" /> Discover Candidates
            </button>

            {jobId && (
              <a
                href={api.getExportCsvUrl(jobId)}
                className="px-3.5 py-2.5 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 border border-stone dark:border-stone-dark shadow-xs transition-colors"
              >
                <Download className="w-4 h-4 text-forest dark:text-emerald-400" /> Export CSV
              </a>
            )}

            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" /> Upload Resumes
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-stone dark:border-stone-dark text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveTab('candidates')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'candidates'
              ? 'border-forest text-forest dark:text-emerald-400 font-bold'
              : 'border-transparent text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
          }`}
        >
          <Users className="w-4 h-4" /> Screened Candidates ({candidates.length})
        </button>

        <button
          onClick={() => setActiveTab('discovery')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'discovery'
              ? 'border-forest text-forest dark:text-emerald-400 font-bold'
              : 'border-transparent text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
          }`}
        >
          <Sparkles className="w-4 h-4 text-forest dark:text-emerald-400" /> Discover Candidates
        </button>

        <button
          onClick={() => setActiveTab('requirements')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'requirements'
              ? 'border-forest text-forest dark:text-emerald-400 font-bold'
              : 'border-transparent text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
          }`}
        >
          <FileCode2 className="w-4 h-4" /> Job Criteria ({editableRequirements.length})
        </button>

        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'details'
              ? 'border-forest text-forest dark:text-emerald-400 font-bold'
              : 'border-transparent text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark'
          }`}
        >
          <Briefcase className="w-4 h-4" /> Role Overview
        </button>
      </div>

      {/* TAB 1: Candidates Pipeline */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs">
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search candidate or skill..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark w-full sm:w-auto font-medium"
              >
                <option value="all">All Workflow Statuses</option>
                <option value="awaiting_review">Awaiting Review</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_planned">Interview Planned</option>
                <option value="interview_completed">Interview Completed</option>
                <option value="rejected">Rejected</option>
              </select>

              <div className="flex items-center gap-2 text-xs text-ink-muted dark:text-ink-muted-dark">
                <span className="font-semibold">Min Score:</span>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="10"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-20 accent-forest"
                />
                <span className="font-mono text-ink dark:text-ink-dark font-bold">{minScore}%</span>
              </div>
            </div>

            {selectedForComparison.length > 0 && (
              <button
                onClick={() => navigate(`/app/comparison?ids=${selectedForComparison.join(',')}`)}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5" /> Compare ({selectedForComparison.length}) Candidates
              </button>
            )}
          </div>

          {filteredCandidates.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No candidates match your filters"
              description="Upload candidate resumes in PDF/DOCX format to start automated evidence extraction and scoring."
              actionLabel="Upload Resumes"
              onAction={() => setIsUploadOpen(true)}
            />
          ) : (
            <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-ink dark:text-ink-dark">
                  <thead className="bg-ivory dark:bg-ivory-dark text-ink-muted dark:text-ink-muted-dark font-semibold border-b border-stone dark:border-stone-dark text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="p-4 w-10">
                        <span className="sr-only">Compare</span>
                      </th>
                      <th className="p-4">Candidate & Resume</th>
                      <th className="p-4">Match Score</th>
                      <th className="p-4">Criteria Coverage</th>
                      <th className="p-4">Workflow Status</th>
                      <th className="p-4">Interview Plan</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone dark:divide-stone-dark">
                    {filteredCandidates.map((cand) => (
                      <tr
                        key={cand.id}
                        onClick={() => navigate(`/app/candidates/${cand.id}`)}
                        className="hover:bg-ivory dark:hover:bg-ivory-dark/60 transition-colors cursor-pointer group"
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
                          <div className="font-serif font-bold text-sm text-ink dark:text-ink-dark group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors">
                            {cand.fullName}
                          </div>
                          <div className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                            {cand.email || cand.originalFilename} • {cand.experienceYears || 0} yrs exp
                          </div>
                          {cand.skills && cand.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {cand.skills.slice(0, 4).map((s: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 rounded-full bg-ivory dark:bg-ivory-dark text-[10px] font-semibold text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark">
                                  {s}
                                </span>
                              ))}
                              {cand.skills.length > 4 && (
                                <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark self-center">
                                  +{cand.skills.length - 4} more
                                </span>
                              )}
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
                          <div className="space-y-1.5 max-w-[140px]">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-ink-muted dark:text-ink-muted-dark">Overall:</span>
                              <span className="font-mono font-bold text-ink dark:text-ink-dark">{cand.coveragePercentage || 0}%</span>
                            </div>
                            <div className="tale-match-bar">
                              <div className="tale-match-fill" style={{ width: `${cand.coveragePercentage || 0}%` }} />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-forest dark:text-emerald-400 font-semibold">
                              <span>Essential:</span>
                              <span className="font-mono">{cand.essentialCoveragePercentage || 0}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <WorkflowBadge status={cand.workflowStatus} />
                        </td>
                        <td className="p-4">
                          {cand.hasInterviewPlan ? (
                            <span className="inline-flex items-center gap-1 text-forest dark:text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Prepared
                            </span>
                          ) : (
                            <span className="text-ink-muted dark:text-ink-muted-dark text-xs italic font-mono">Not generated</span>
                          )}
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
      )}

      {/* TAB 2: Agentic Candidate Discovery */}
      {activeTab === 'discovery' && (
        <CandidateDiscoveryView
          jobId={jobId!}
          jobTitle={job.title}
          jobLocation={job.location}
          requirements={editableRequirements}
          onImportCandidateSuccess={fetchJobAndCandidates}
        />
      )}

      {/* TAB 3: Requirements Editor */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">Structured Criteria & Weighting</h2>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-0.5">
                Screening calculations are deterministic and auditable. Saving changes creates an immutable new version.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExtractWithAI}
                disabled={isExtractingReqs}
                className="px-3.5 py-2 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone dark:hover:bg-stone-dark/80 text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber" />
                {isExtractingReqs ? 'Extracting...' : 'AI Re-Extract'}
              </button>

              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-3.5 py-2 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone dark:hover:bg-stone-dark/80 text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-forest dark:text-forest-light" /> Add Criterion
              </button>

              <button
                type="button"
                onClick={handleSaveRequirements}
                disabled={isSavingReqs}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSavingReqs ? 'Saving Version...' : 'Save New Version'}
              </button>
            </div>
          </div>

          {reqSaveMessage && (
            <div className="p-3.5 rounded-xl bg-forest-faint dark:bg-forest/20 border border-forest/30 text-forest dark:text-forest-light text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-forest dark:text-forest-light shrink-0" />
              {reqSaveMessage}
            </div>
          )}

          <div className="space-y-3">
            {editableRequirements.map((req, idx) => (
              <div
                key={req.id || idx}
                className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="w-6 h-6 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-forest/20">
                    {idx + 1}
                  </span>

                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={req.text}
                      onChange={(e) => handleUpdateReqField(idx, 'text', e.target.value)}
                      placeholder="Requirement description (e.g. 5+ years experience in React and TypeScript)"
                      className="w-full px-3.5 py-2 rounded-xl editorial-input text-xs font-bold text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase">Category</label>
                        <select
                          value={req.category}
                          onChange={(e) => handleUpdateReqField(idx, 'category', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
                        >
                          <option value="technical_skill">Technical Skill</option>
                          <option value="domain_knowledge">Domain Knowledge</option>
                          <option value="experience">Experience</option>
                          <option value="education">Education</option>
                          <option value="certification">Certification</option>
                          <option value="responsibility">Responsibility</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase">Importance</label>
                        <select
                          value={req.importance}
                          onChange={(e) => handleUpdateReqField(idx, 'importance', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
                        >
                          <option value="essential">Essential (Must-Have)</option>
                          <option value="preferred">Preferred (Nice-to-Have)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase">
                          Weight: <span className="font-mono text-forest dark:text-forest-light font-bold">{req.weight || 5}/10</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={req.weight || 5}
                          onChange={(e) => handleUpdateReqField(idx, 'weight', Number(e.target.value))}
                          className="w-full accent-forest"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase">Assessable</label>
                        <select
                          value={req.assessableFromResume !== false ? 'yes' : 'no'}
                          onChange={(e) => handleUpdateReqField(idx, 'assessableFromResume', e.target.value === 'yes')}
                          className="w-full px-2.5 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
                        >
                          <option value="yes">Resume Evidence</option>
                          <option value="no">Interview Only</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={req.evidenceExpectations || ''}
                        onChange={(e) => handleUpdateReqField(idx, 'evidenceExpectations', e.target.value)}
                        placeholder="Expected keywords, projects, or proof signals (e.g. React hooks, Redux, state management)"
                        className="w-full px-3 py-1.5 rounded-xl editorial-input text-xs text-ink-light dark:text-ink-light-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveReq(idx)}
                    className="p-1.5 text-ink-muted dark:text-ink-muted-dark hover:text-brand-error dark:hover:text-rose-300 hover:bg-brand-error-light dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Job Description Details */}
      {activeTab === 'details' && (
        <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-2xl p-8 space-y-6 shadow-xs">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-forest-light mb-2">Role Overview</h3>
            <p className="text-sm text-ink dark:text-ink-dark leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.responsibilities && job.responsibilities.length > 0 && (
            <div className="pt-4 border-t border-stone dark:border-stone-dark">
              <h3 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-forest-light mb-3">Core Responsibilities</h3>
              <ul className="space-y-2 text-xs text-ink-light dark:text-ink-light-dark list-disc list-inside">
                {job.responsibilities.map((r: string, idx: number) => (
                  <li key={idx} className="leading-relaxed">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <ResumeUploadModal
        jobId={job.id}
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => fetchJobAndCandidates()}
      />
    </div>
  );
};
