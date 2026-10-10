import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  ArrowLeft,
  Download,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Calendar,
  Layers,
  RefreshCw,
  Clock,
  HelpCircle,
  Award
} from 'lucide-react';
import { EvidenceBadge, WorkflowBadge } from '../components/Badge';
import { ScoreGauge } from '../components/ScoreGauge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const CandidateProfilePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const fetchProfile = async () => {
    if (!candidateId) return;
    try {
      const res = await api.getJobCandidate(candidateId);
      setData(res);
      setSelectedStatus(res.jobCandidate?.workflow_status || 'awaiting_review');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [candidateId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!candidateId) return;
    setSelectedStatus(newStatus);
    await api.updateCandidateReview(candidateId, { status: newStatus });
    fetchProfile();
  };

  const handleReevaluate = async () => {
    if (!candidateId) return;
    setIsEvaluating(true);
    try {
      await api.evaluateCandidate(candidateId);
      await fetchProfile();
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCreateInterviewPlan = async () => {
    if (!candidateId) return;
    setIsCreatingPlan(true);
    try {
      const res = await api.createInterviewPlan(candidateId);
      navigate(`/app/interview-plans/${res.plan.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to generate interview guide');
      setIsCreatingPlan(false);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (!data) return <div className="p-8 text-center text-ink-muted dark:text-ink-muted-dark">Candidate profile not found</div>;

  const { jobCandidate, job, candidate, evaluation, requirementVersion, assessments, interviewPlans } = data;
  const requirements = requirementVersion?.requirements_json || [];

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div>
        <button
          onClick={() => navigate(`/app/jobs/${job.id}`)}
          className="text-xs text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {job.title} Pipeline
        </button>

        <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-64 bg-forest/5 dark:bg-forest/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-forest text-white flex items-center justify-center font-serif text-2xl font-bold shadow-xs shrink-0 border border-forest-light/20">
              {candidate.full_name ? candidate.full_name[0] : 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink dark:text-ink-dark tracking-tight">
                  {candidate.full_name}
                </h1>
                <WorkflowBadge status={jobCandidate.workflow_status} />
              </div>
              <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1 flex items-center gap-2 flex-wrap">
                <span>{candidate.email || 'No email stated'}</span>
                <span>•</span>
                <span>{candidate.phone || 'No phone'}</span>
                <span>•</span>
                <span>Applied for <strong className="text-ink dark:text-ink-dark">{job.title}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap relative z-10">
            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl editorial-input text-xs font-semibold text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
            >
              <option value="awaiting_review">Awaiting Review</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="interview_planned">Interview Planned</option>
              <option value="interview_completed">Interview Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <a
              href={api.getResumeDownloadUrl(jobCandidate.id)}
              download
              className="px-3.5 py-2.5 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 border border-stone dark:border-stone-dark shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-forest dark:text-emerald-400" /> Download Resume
            </a>

            {interviewPlans && interviewPlans.length > 0 ? (
              <button
                onClick={() => navigate(`/app/interview-plans/${interviewPlans[0].id}`)}
                className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Calendar className="w-4 h-4" /> Open Interview Guide
              </button>
            ) : (
              <button
                onClick={handleCreateInterviewPlan}
                disabled={isCreatingPlan}
                className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-300" />
                {isCreatingPlan ? 'Generating Guide...' : 'Generate Interview Guide'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Extracted Candidate Resume Profile (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Bio & Skills */}
          <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Candidate Summary & Skills
            </h2>

            {candidate.summary && (
              <div>
                <span className="text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark uppercase block mb-1">Executive Summary</span>
                <p className="text-xs text-ink dark:text-ink-dark leading-relaxed bg-ivory dark:bg-ivory-dark p-3.5 rounded-2xl border border-stone dark:border-stone-dark">
                  {candidate.summary}
                </p>
              </div>
            )}

            <div>
              <span className="text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark uppercase block mb-2">Extracted Competencies</span>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills && candidate.skills.length > 0 ? (
                  candidate.skills.map((s: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-ivory dark:bg-ivory-dark text-xs font-semibold text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-ink-muted dark:text-ink-muted-dark italic font-mono">No skills identified</span>
                )}
              </div>
            </div>
          </div>

          {/* Work History */}
          {candidate.experience && candidate.experience.length > 0 && (
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-400 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Documented Experience
              </h2>

              <div className="space-y-4 divide-y divide-stone dark:divide-stone-dark">
                {candidate.experience.map((exp: any, idx: number) => (
                  <div key={idx} className={`${idx > 0 ? 'pt-4' : ''} text-xs space-y-1`}>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-ink dark:text-ink-dark">{exp.title || 'Role'}</h4>
                      <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-mono">
                        {exp.startDate || ''} - {exp.endDate || 'Present'}
                      </span>
                    </div>
                    <p className="text-forest dark:text-emerald-400 font-semibold text-[11px]">{exp.company}</p>
                    {exp.description && (
                      <p className="text-ink-light dark:text-ink-light-dark text-xs mt-1.5 leading-relaxed">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-forest dark:text-emerald-400 flex items-center gap-2">
                <GraduationCap className="w-4 h-4" /> Education
              </h2>
              <div className="space-y-2 text-xs">
                {candidate.education.map((edu: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark">
                    <div className="font-bold text-ink dark:text-ink-dark">{edu.degree}</div>
                    <div className="text-ink-muted dark:text-ink-muted-dark text-[11px]">{edu.institution} {edu.graduationYear ? `(${edu.graduationYear})` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Evidence-Backed Screening Findings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Score & Calculation Card */}
          {evaluation && (
            <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-5 border-b border-stone dark:border-stone-dark">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-mono font-extrabold text-forest dark:text-emerald-400">
                      {evaluation.overall_score}%
                    </div>
                    <span className="text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider">
                      Overall Match
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-ink-muted dark:text-ink-muted-dark">Requirement Evidence Coverage</div>
                    <div className="text-base font-bold text-ink dark:text-ink-dark font-mono">
                      {evaluation.coverage_percentage}% <span className="text-xs text-ink-muted dark:text-ink-muted-dark font-sans font-normal">overall criteria</span>
                    </div>
                    <div className="text-xs text-forest dark:text-emerald-400 font-bold font-mono">
                      {evaluation.essential_coverage_percentage}% <span className="text-xs text-ink-muted dark:text-ink-muted-dark font-sans font-normal">essential must-haves</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReevaluate}
                  disabled={isEvaluating}
                  className="px-4 py-2 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 border border-stone dark:border-stone-dark shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin text-forest' : ''}`} />
                  Re-evaluate
                </button>
              </div>

              {/* Explainable Formula Banner */}
              {evaluation.calculation_explanation && (
                <div className="p-3.5 rounded-2xl bg-forest-faint dark:bg-forest/20 border border-forest/20 text-xs text-forest dark:text-emerald-300 leading-relaxed font-mono">
                  {evaluation.calculation_explanation}
                </div>
              )}

              {/* AI Objective Synthesis */}
              {evaluation.summary && (
                <div>
                  <h4 className="text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider mb-1.5">Executive Screening Synthesis</h4>
                  <p className="text-xs text-ink dark:text-ink-dark leading-relaxed bg-ivory dark:bg-ivory-dark p-3.5 rounded-2xl border border-stone dark:border-stone-dark">
                    {evaluation.summary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Granular Requirement-by-Requirement Evidence Matrix */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">Requirement Evidence Breakdown</h3>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">Direct verbatim quotes extracted from the resume</p>
              </div>
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark font-mono font-semibold">
                Version {requirementVersion?.version_number || 1}
              </span>
            </div>

            <div className="space-y-3">
              {requirements.map((req: any, idx: number) => {
                const assessment = assessments.find((a: any) => a.requirement_id === req.id);
                const status = assessment ? assessment.status : 'not_evidenced';

                return (
                  <div
                    key={req.id || idx}
                    className="p-5 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-light-dark border border-stone dark:border-stone-dark uppercase tracking-wider">
                            {req.category?.replace('_', ' ')}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${req.importance === 'essential' ? 'bg-brand-error-light dark:bg-rose-950/40 text-brand-error dark:text-rose-300 border border-brand-error/20 dark:border-rose-900/40' : 'bg-ivory dark:bg-ivory-dark text-ink-muted dark:text-ink-muted-dark border border-stone dark:border-stone-dark'}`}>
                            {req.importance === 'essential' ? 'Essential' : 'Preferred'}
                          </span>
                          <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-mono">
                            Weight: {req.weight || 5}/10
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-bold text-ink dark:text-ink-dark leading-snug">{req.text}</h4>
                      </div>

                      <EvidenceBadge status={status} />
                    </div>

                    {/* Evidence Quote Passage */}
                    {assessment && (
                      <div className="space-y-2 pt-2 border-t border-stone/60 dark:border-stone-dark/60">
                        {assessment.evidence_text && assessment.evidence_text !== 'No direct evidence passage identified in resume text.' ? (
                          <div className="bg-forest-faint/60 dark:bg-forest/20 p-4 rounded-2xl border border-forest/20 dark:border-forest/30">
                            <span className="text-[10px] font-bold text-forest dark:text-emerald-300 uppercase tracking-wider block mb-1">
                              Resume Evidence Quote:
                            </span>
                            <blockquote className="text-xs text-ink dark:text-ink-dark italic leading-relaxed font-serif">
                              "{assessment.evidence_text}"
                            </blockquote>
                          </div>
                        ) : (
                          <div className="bg-ivory dark:bg-ivory-dark p-3 rounded-2xl border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-muted-dark italic">
                            No explicit mention or supporting evidence passage found in the uploaded resume.
                          </div>
                        )}

                        {assessment.reasoning_summary && (
                          <div className="text-[11px] text-ink-light dark:text-ink-light-dark leading-relaxed flex items-start gap-1.5">
                            <span className="text-forest dark:text-emerald-400 font-bold">Analysis:</span>
                            <span>{assessment.reasoning_summary}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
