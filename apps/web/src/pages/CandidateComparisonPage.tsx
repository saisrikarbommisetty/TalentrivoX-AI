import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, Scale, Users, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { ScoreGauge } from '../components/ScoreGauge';
import { EvidenceBadge, WorkflowBadge } from '../components/Badge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const CandidateComparisonPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const candidateIds = (searchParams.get('ids') || '').split(',').filter(Boolean);

  const [candidatesData, setCandidatesData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      if (candidateIds.length === 0) {
        setIsLoading(false);
        return;
      }
      try {
        const results = await Promise.all(
          candidateIds.map((id) => api.getJobCandidate(id))
        );
        setCandidatesData(results);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [searchParams]);

  if (isLoading) return <LoadingSkeleton rows={6} />;

  if (candidatesData.length === 0) {
    return (
      <div className="text-center p-12 bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-2xl shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light flex items-center justify-center mx-auto mb-3">
          <Scale className="w-6 h-6" />
        </div>
        <h2 className="font-serif text-xl font-bold text-ink dark:text-ink-dark">No Candidates Selected for Comparison</h2>
        <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-md mx-auto mt-1 mb-6 leading-relaxed">
          Navigate to any job opening's candidate pipeline, check the checkboxes next to candidates, and click "Compare".
        </p>
        <button
          onClick={() => navigate('/app/jobs')}
          className="px-4 py-2 bg-forest hover:bg-forest-hover text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          Browse Job Openings
        </button>
      </div>
    );
  }

  const primaryJob = candidatesData[0]?.job;
  const requirements = candidatesData[0]?.requirementVersion?.requirements_json || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-xs text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Pipeline
        </button>

        <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-64 bg-forest/5 dark:bg-forest/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20 uppercase tracking-wider">
                Candidate Comparison Matrix
              </span>
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-ink dark:text-ink-dark tracking-tight">{primaryJob?.title}</h1>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
              Evaluating {candidatesData.length} candidates side-by-side against standard job criteria
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-3xl overflow-x-auto shadow-xs">
        <table className="w-full text-left text-xs text-ink dark:text-ink-dark border-collapse">
          <thead>
            <tr className="bg-ivory dark:bg-ivory-dark border-b border-stone dark:border-stone-dark">
              <th className="p-5 font-bold text-ink-muted dark:text-ink-muted-dark uppercase text-[10px] tracking-wider w-72 sticky left-0 bg-ivory dark:bg-ivory-dark z-10">
                Evaluation Criteria
              </th>
              {candidatesData.map((data, idx) => (
                <th key={idx} className="p-5 font-semibold text-ink dark:text-ink-dark min-w-[260px] border-l border-stone dark:border-stone-dark">
                  <div className="flex items-center justify-between">
                    <div>
                      <div
                        className="font-serif font-bold text-base text-ink dark:text-ink-dark hover:text-forest dark:hover:text-emerald-400 cursor-pointer transition-colors"
                        onClick={() => navigate(`/app/candidates/${data.jobCandidate.id}`)}
                      >
                        {data.candidate?.full_name}
                      </div>
                      <div className="text-[11px] text-ink-muted dark:text-ink-muted-dark mt-0.5">{data.candidate?.email || 'No email'}</div>
                    </div>
                    <WorkflowBadge status={data.jobCandidate?.workflow_status} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone dark:divide-stone-dark">
            {/* Overall Match Score Row */}
            <tr className="bg-surface dark:bg-surface-dark font-semibold">
              <td className="p-5 text-ink dark:text-ink-dark sticky left-0 bg-surface dark:bg-surface-dark font-serif font-bold text-sm z-10 border-r border-stone dark:border-stone-dark">
                Overall Match Score
              </td>
              {candidatesData.map((data, idx) => (
                <td key={idx} className="p-5 border-l border-stone dark:border-stone-dark">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-faint dark:bg-forest/20 border border-forest/20">
                    <span className="font-mono text-base font-extrabold text-forest dark:text-emerald-400">
                      {data.evaluation?.overall_score || 0}%
                    </span>
                    <span className="text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark uppercase">Match</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Essential Coverage Row */}
            <tr>
              <td className="p-5 text-ink dark:text-ink-dark sticky left-0 bg-surface dark:bg-surface-dark z-10 border-r border-stone dark:border-stone-dark font-semibold">
                Essential Coverage
              </td>
              {candidatesData.map((data, idx) => (
                <td key={idx} className="p-5 border-l border-stone dark:border-stone-dark font-mono font-bold text-forest dark:text-emerald-400 text-sm">
                  {data.evaluation?.essential_coverage_percentage || 0}%
                </td>
              ))}
            </tr>

            {/* Total Coverage Row */}
            <tr>
              <td className="p-5 text-ink dark:text-ink-dark sticky left-0 bg-surface dark:bg-surface-dark z-10 border-r border-stone dark:border-stone-dark font-semibold">
                Total Criteria Coverage
              </td>
              {candidatesData.map((data, idx) => (
                <td key={idx} className="p-5 border-l border-stone dark:border-stone-dark font-mono text-ink dark:text-ink-dark font-semibold">
                  {data.evaluation?.coverage_percentage || 0}%
                </td>
              ))}
            </tr>

            {/* Requirements Section Header */}
            <tr className="bg-ivory dark:bg-ivory-dark">
              <td colSpan={candidatesData.length + 1} className="p-3.5 text-xs font-bold text-forest dark:text-emerald-400 uppercase tracking-wider">
                Requirement-by-Requirement Evidence Comparison
              </td>
            </tr>

            {/* Individual Requirement Rows */}
            {requirements.map((req: any, rIdx: number) => (
              <tr key={rIdx} className="hover:bg-ivory/50 dark:hover:bg-ivory-dark/40 transition-colors">
                <td className="p-5 sticky left-0 bg-surface dark:bg-surface-dark z-10 border-r border-stone dark:border-stone-dark">
                  <div className="font-serif font-bold text-sm text-ink dark:text-ink-dark">{req.text}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-muted-dark">{req.importance}</span>
                    <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-mono">Weight: {req.weight || 5}</span>
                  </div>
                </td>

                {candidatesData.map((cData, cIdx) => {
                  const assessment = cData.assessments?.find((a: any) => a.requirement_id === req.id);
                  const status = assessment ? assessment.status : 'not_evidenced';

                  return (
                    <td key={cIdx} className="p-5 border-l border-stone dark:border-stone-dark align-top space-y-2">
                      <EvidenceBadge status={status} />
                      {assessment?.evidence_text && assessment.evidence_text !== 'No direct evidence passage identified in resume text.' && (
                        <p className="text-[11px] text-ink-light dark:text-ink-light-dark italic bg-forest-faint/60 dark:bg-forest/15 p-3 rounded-2xl border border-forest/20 dark:border-forest/30 line-clamp-3 leading-relaxed font-serif">
                          "{assessment.evidence_text}"
                        </p>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
