import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  ArrowLeft,
  Sparkles,
  Play,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  HelpCircle,
  Clock,
  Layers,
  Award
} from 'lucide-react';
import { InterviewQuestion, QuestionCategory, QuestionDifficulty } from '@avengercoders/shared';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const InterviewPlanBuilderPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [planData, setPlanData] = useState<any>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPlan = async () => {
    if (!planId) return;
    try {
      const res = await api.getInterviewPlan(planId);
      setPlanData(res);
      setQuestions(res.questions || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const handleAddQuestion = () => {
    const newQ: InterviewQuestion = {
      id: `q-${Date.now()}`,
      interviewPlanId: planId,
      category: 'technical_knowledge',
      questionText: '',
      relevanceReason: 'Custom interviewer question',
      relatedProject: null,
      relatedSkills: [],
      relatedRequirement: null,
      resumeEvidence: null,
      jobDescriptionEvidence: null,
      expectedAnswerSignals: ['Clear explanation with practical example'],
      followUpQuestions: ['Can you elaborate on edge cases?'],
      difficulty: 'mid',
      evaluationRubric: {
        poor: 'Unable to explain core concept',
        adequate: 'Basic explanation with standard examples',
        strong: 'Mastery with deep architectural context'
      },
      sortOrder: questions.length
    };
    setQuestions([...questions, newQ]);
  };

  const handleUpdateQuestion = (index: number, field: keyof InterviewQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const handleUpdateRubric = (index: number, level: 'poor' | 'adequate' | 'strong', value: string) => {
    const updated = [...questions];
    const rubric = updated[index].evaluationRubric || { poor: '', adequate: '', strong: '' };
    rubric[level] = value;
    updated[index].evaluationRubric = rubric;
    setQuestions(updated);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!planId) return;
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await api.updateInterviewPlan(planId, { questions });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save interview plan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (!planData) return <div className="p-8 text-center text-ink-muted dark:text-ink-muted-dark">Interview plan not found</div>;

  const { plan, job, candidate, jobCandidate } = planData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(`/app/candidates/${jobCandidate.id}`)}
          className="text-xs text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark flex items-center gap-1.5 mb-3 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Candidate Profile
        </button>

        <div className="p-6 md:p-8 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light uppercase tracking-wider">
                Personalized Interview Guide
              </span>
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark">• {job.title}</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink dark:text-ink-dark tracking-tight">{candidate.full_name}</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAddQuestion}
              className="px-3.5 py-2.5 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone dark:hover:bg-stone-dark/80 text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-forest dark:text-forest-light" /> Add Question
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone dark:hover:bg-stone-dark/80 text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-4 h-4 text-forest dark:text-forest-light" />
              {isSaving ? 'Saving...' : 'Save Guide'}
            </button>

            <button
              onClick={() => navigate(`/app/interview-plans/${planId}/workspace`)}
              className="px-4 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" /> Start Live Interview
            </button>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-forest-faint dark:bg-forest/20 border border-forest/30 text-forest dark:text-forest-light text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-forest dark:text-forest-light shrink-0" />
          Interview plan and evaluator rubrics saved successfully.
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div
            key={q.id || idx}
            className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="w-7 h-7 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-forest/20">
                Q{idx + 1}
              </span>

              <div className="flex-1 space-y-3">
                {/* Resume Grounding Context Tags */}
                <div className="flex flex-wrap items-center gap-2">
                  {q.relatedProject && (
                    <span className="px-2.5 py-1 rounded-lg bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light font-semibold text-[11px] border border-forest/20 flex items-center gap-1">
                      📁 Project: {q.relatedProject}
                    </span>
                  )}
                  {q.relatedSkills && q.relatedSkills.length > 0 && q.relatedSkills.map((skill: string) => (
                    <span key={skill} className="px-2 py-0.5 rounded-md bg-stone-warm dark:bg-stone-dark text-ink dark:text-ink-dark text-[10px] font-mono border border-stone dark:border-stone-dark">
                      ⚡ {skill}
                    </span>
                  ))}
                  {q.relatedRequirement && (
                    <span className="px-2 py-0.5 rounded-md bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light text-[10px] font-medium border border-forest/30">
                      🎯 Req: {q.relatedRequirement.slice(0, 45)}...
                    </span>
                  )}
                </div>

                <textarea
                  rows={2}
                  value={q.questionText}
                  onChange={(e) => handleUpdateQuestion(idx, 'questionText', e.target.value)}
                  placeholder="Question text..."
                  className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs font-bold text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                />

                {/* Resume Evidence Quote */}
                {q.resumeEvidence && (
                  <div className="text-[11px] bg-stone-warm/60 dark:bg-stone-dark/40 p-2.5 rounded-xl border-l-3 border-forest dark:border-forest-light text-ink-muted dark:text-ink-muted-dark">
                    <span className="font-semibold text-ink dark:text-ink-dark not-italic">Resume Evidence: </span>
                    <span className="italic">"{q.resumeEvidence}"</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase">Category</label>
                    <select
                      value={q.category}
                      onChange={(e) => handleUpdateQuestion(idx, 'category', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
                    >
                      <option value="project_verification">Project Verification</option>
                      <option value="technical_knowledge">Technical Knowledge</option>
                      <option value="role_fundamentals">Role Fundamentals</option>
                      <option value="practical_problem_solving">Problem Solving</option>
                      <option value="skill_gap_validation">Skill Gap Validation</option>
                      <option value="behavioral_situational">Behavioral & Situational</option>
                      <option value="hr_communication">HR & Communication</option>
                      <option value="role_specific_scenarios">Role Specific Scenarios</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase">Difficulty</label>
                    <select
                      value={q.difficulty}
                      onChange={(e) => handleUpdateQuestion(idx, 'difficulty', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
                    >
                      <option value="junior">Junior</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                      <option value="lead">Lead Level</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-bold block mb-1 uppercase">Relevance Context</label>
                    <input
                      type="text"
                      value={q.relevanceReason || ''}
                      onChange={(e) => handleUpdateQuestion(idx, 'relevanceReason', e.target.value)}
                      placeholder="Why this question is asked..."
                      className="w-full px-2.5 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
                    />
                  </div>
                </div>

                {/* Adaptive Follow-Up Questions */}
                {q.followUpQuestions && q.followUpQuestions.length > 0 && (
                  <div className="p-3 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs">
                    <span className="text-[10px] font-bold text-ink-muted dark:text-ink-muted-dark uppercase tracking-wider block mb-1">
                      Adaptive Follow-Up Probes:
                    </span>
                    <ul className="space-y-1 text-[11px] text-ink dark:text-ink-dark list-disc list-inside">
                      {q.followUpQuestions.map((fQ: string, fIdx: number) => (
                        <li key={fIdx}>{fQ}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 3-Tier Scoring Rubric Benchmarks */}
                <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2">
                  <span className="text-[10px] font-bold text-ink dark:text-ink-dark uppercase tracking-wider block">
                    3-Tier Evaluator Rubric & Expected Signal Benchmarks
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-brand-error dark:text-rose-300 uppercase block mb-1">Poor (1-2)</span>
                      <input
                        type="text"
                        value={q.evaluationRubric?.poor || ''}
                        onChange={(e) => handleUpdateRubric(idx, 'poor', e.target.value)}
                        placeholder="Poor answer benchmark..."
                        className="w-full px-2.5 py-1.5 rounded-lg editorial-input text-[11px] text-ink dark:text-ink-dark"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-amber dark:text-amber-light uppercase block mb-1">Adequate (3)</span>
                      <input
                        type="text"
                        value={q.evaluationRubric?.adequate || ''}
                        onChange={(e) => handleUpdateRubric(idx, 'adequate', e.target.value)}
                        placeholder="Adequate answer benchmark..."
                        className="w-full px-2.5 py-1.5 rounded-lg editorial-input text-[11px] text-ink dark:text-ink-dark"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-forest dark:text-forest-light uppercase block mb-1">Strong (4-5)</span>
                      <input
                        type="text"
                        value={q.evaluationRubric?.strong || ''}
                        onChange={(e) => handleUpdateRubric(idx, 'strong', e.target.value)}
                        placeholder="Strong answer benchmark..."
                        className="w-full px-2.5 py-1.5 rounded-lg editorial-input text-[11px] text-ink dark:text-ink-dark"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRemoveQuestion(idx)}
                className="p-1.5 text-ink-muted dark:text-ink-muted-dark hover:text-brand-error dark:hover:text-rose-300 hover:bg-brand-error-light dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
