import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import {
  ArrowLeft,
  Clock,
  Star,
  CheckCircle2,
  Save,
  MessageSquare,
  HelpCircle,
  Award,
  Sparkles
} from 'lucide-react';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

export const InterviewWorkspacePage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();

  const [planData, setPlanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Feedback State: map questionId -> { rating, notes }
  const [feedbackMap, setFeedbackMap] = useState<Record<string, { rating: number; notes: string }>>({});
  const [overallNotes, setOverallNotes] = useState('');

  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning) {
      timer = setInterval(() => setSecondsElapsed((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const fetchPlan = async () => {
    if (!planId) return;
    try {
      const res = await api.getInterviewPlan(planId);
      setPlanData(res);

      // Initialize feedback state
      const initial: Record<string, { rating: number; notes: string }> = {};
      (res.questions || []).forEach((q: any) => {
        initial[q.id] = { rating: 3, notes: '' };
      });
      setFeedbackMap(initial);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [planId]);

  const handleRating = (qId: string, rating: number) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], rating }
    }));
  };

  const handleNotes = (qId: string, notes: string) => {
    setFeedbackMap((prev) => ({
      ...prev,
      [qId]: { ...prev[qId], notes }
    }));
  };

  const handleSubmit = async () => {
    if (!planId) return;
    setIsSubmitting(true);
    try {
      const feedbackPayload = Object.entries(feedbackMap).map(([questionId, val]) => ({
        questionId,
        rating: val.rating,
        notes: val.notes
      }));

      await api.createInterviewSession(planId, {
        interviewerNotes: overallNotes,
        feedback: feedbackPayload
      });

      alert('Interview session completed and feedback recorded successfully.');
      navigate(`/app/candidates/${planData.jobCandidate.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (!planData) return <div className="text-ink-muted dark:text-ink-dark-muted text-sm">Interview plan not found</div>;

  const { plan, job, candidate, questions } = planData;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Session Bar */}
      <div>
        <button
          onClick={() => navigate(`/app/interview-plans/${planId}`)}
          className="text-xs text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark flex items-center gap-1.5 mb-3 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Guide Editor
        </button>

        <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-20 z-20 shadow-editorial">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-faint text-forest dark:bg-forest/20 dark:text-emerald-300 border border-forest/20 dark:border-forest/40 uppercase tracking-wider">
                Live Interview Session
              </span>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted">• {job.title}</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">{candidate.full_name}</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Session Timer */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark font-mono text-sm text-forest dark:text-emerald-400 font-bold shadow-xs">
              <Clock className="w-4 h-4 text-forest dark:text-emerald-400" />
              <span>{formatTime(secondsElapsed)}</span>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Submitting Feedback...' : 'Complete & Save Feedback'}
            </button>
          </div>
        </div>
      </div>

      {/* Questions & Scoring List */}
      <div className="space-y-6">
        {questions.map((q: any, idx: number) => {
          const currentFeedback = feedbackMap[q.id] || { rating: 3, notes: '' };

          return (
            <div
              key={q.id || idx}
              className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 text-xs font-mono font-bold flex items-center justify-center border border-forest/20 dark:border-forest/40">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark">
                      {q.category?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted font-medium capitalize">
                      {q.difficulty} Level
                    </span>
                    {q.related_project && (
                      <span className="px-2 py-0.5 rounded-md bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light font-semibold text-[10px] border border-forest/20">
                        📁 {q.related_project}
                      </span>
                    )}
                    {q.related_skills && q.related_skills.length > 0 && q.related_skills.map((skill: string) => (
                      <span key={skill} className="px-1.5 py-0.5 rounded bg-stone-warm dark:bg-stone-dark text-ink dark:text-ink-dark text-[10px] font-mono">
                        ⚡ {skill}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-base font-serif font-bold text-ink dark:text-ink-dark leading-snug pt-1">{q.question_text}</h3>
                  {q.resume_evidence && (
                    <div className="text-[11px] bg-stone-warm/50 dark:bg-stone-dark/40 p-2 rounded-lg border-l-2 border-forest dark:border-forest-light text-ink-muted dark:text-ink-muted-dark italic">
                      Resume Evidence: "{q.resume_evidence}"
                    </div>
                  )}
                  {q.relevance_reason && (
                    <p className="text-xs text-forest dark:text-emerald-400 mt-1 italic">
                      Context: {q.relevance_reason}
                    </p>
                  )}
                </div>

                {/* 1-5 Star Rating */}
                <div className="flex items-center gap-1 shrink-0 bg-ivory dark:bg-ivory-dark p-2 rounded-xl border border-stone dark:border-stone-dark shadow-xs">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRating(q.id, star)}
                      className="p-1 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= currentFeedback.rating
                            ? 'text-amber fill-amber'
                            : 'text-stone dark:text-stone-dark'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-ink dark:text-ink-dark ml-2">
                    {currentFeedback.rating}/5
                  </span>
                </div>
              </div>

              {/* Expected Signals & Rubric Reference */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone dark:border-stone-dark">
                {q.expected_answer_signals && q.expected_answer_signals.length > 0 && (
                  <div className="bg-ivory dark:bg-ivory-dark p-3.5 rounded-xl border border-stone dark:border-stone-dark text-xs">
                    <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1.5">
                      Expected Answer Signals:
                    </span>
                    <ul className="space-y-1 text-ink-light dark:text-ink-dark-secondary list-disc list-inside">
                      {q.expected_answer_signals.map((sig: string, sIdx: number) => (
                        <li key={sIdx}>{sig}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {q.evaluation_rubric && (
                  <div className="bg-ivory dark:bg-ivory-dark p-3.5 rounded-xl border border-stone dark:border-stone-dark text-xs">
                    <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1.5">
                      Grading Benchmark:
                    </span>
                    <div className="space-y-1 text-[11px] text-ink-light dark:text-ink-dark-secondary">
                      <div><strong className="text-forest dark:text-emerald-400">Strong (4-5):</strong> {q.evaluation_rubric.strong}</div>
                      <div><strong className="text-amber dark:text-amber-400">Adequate (3):</strong> {q.evaluation_rubric.adequate}</div>
                      <div><strong className="text-brand-error dark:text-rose-400">Poor (1-2):</strong> {q.evaluation_rubric.poor}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Interviewer Notes Input */}
              <div className="pt-2">
                <label className="text-[11px] font-semibold text-ink-light dark:text-ink-dark-secondary block mb-1">
                  Interviewer Live Notes & Observations:
                </label>
                <textarea
                  rows={2}
                  value={currentFeedback.notes}
                  onChange={(e) => handleNotes(q.id, e.target.value)}
                  placeholder="Record key technical responses, code clarity, problem solving approach..."
                  className="w-full px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-dark-faint"
                />
              </div>
            </div>
          );
        })}

        {/* Overall Summary Notes */}
        <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-3 shadow-xs">
          <h3 className="text-sm font-serif font-bold text-forest dark:text-emerald-400 uppercase tracking-wider">
            Overall Interview Summary & Recommendation
          </h3>
          <textarea
            rows={3}
            value={overallNotes}
            onChange={(e) => setOverallNotes(e.target.value)}
            placeholder="Executive summary of technical strengths, culture fit, communication, and recommendation..."
            className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-dark-faint"
          />
        </div>
      </div>
    </div>
  );
};
