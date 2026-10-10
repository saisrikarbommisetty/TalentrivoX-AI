import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  HelpCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Star,
  Award,
  BookOpen,
  MessageSquare,
  RotateCcw,
  History,
  Check,
  Send,
  Save,
  AlertCircle
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SeekerInterviewPrepPage: React.FC = () => {
  const [targetJobTitle, setTargetJobTitle] = useState('Senior Full-Stack TypeScript Engineer');
  const [targetJobDesc, setTargetJobDesc] = useState('');
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);

  // Mode: 'practice' | 'mock' | 'history'
  const [activeMode, setActiveMode] = useState<'practice' | 'mock' | 'history'>('practice');

  // Mock Session State
  const [activeMockSession, setActiveMockSession] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<any>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Past Sessions
  const [pastSessions, setPastSessions] = useState<any[]>([]);

  useEffect(() => {
    let timer: any = null;
    if (activeMockSession && !activeMockSession.isCompleted) {
      timer = setInterval(() => setSessionTimer((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [activeMockSession]);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [resumesRes, pastMocksRes] = await Promise.all([
          api.getSeekerResumes(),
          api.listSeekerMockSessions()
        ]);
        setResumes(resumesRes.resumes);
        setPastSessions(pastMocksRes.sessions);

        const active = resumesRes.resumes.find((r: any) => r.isActive) || resumesRes.resumes[0];
        if (active) {
          setSelectedResumeId(active.id);
          generateQuestions(active.id);
        }
      } catch (err) {
        console.error('Failed to load initial interview prep data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const generateQuestions = async (resumeId: string) => {
    setIsGenerating(true);
    try {
      const res = await api.generateSeekerInterviewPrep({
        targetJobTitle,
        targetJobDescription: targetJobDesc || undefined,
        resumeId
      });
      setQuestions(res.questions);
    } catch (err) {
      console.error('Failed to generate interview questions', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartMock = async () => {
    if (questions.length === 0) return;
    try {
      const res = await api.startSeekerMockSession({
        targetJobTitle,
        questions
      });
      setActiveMockSession(res.session);
      setActiveMode('mock');
      setCurrentAnswer('');
      setLastAnswerFeedback(null);
      setSessionTimer(0);
    } catch (err: any) {
      alert(err.message || 'Failed to start mock session');
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeMockSession || !currentAnswer.trim()) return;
    setIsSubmittingAnswer(true);
    try {
      const currentQuestion = activeMockSession.questions[activeMockSession.currentQuestionIndex];
      const res = await api.submitSeekerMockAnswer(activeMockSession.id, {
        questionId: currentQuestion.id,
        userAnswer: currentAnswer,
        timeSpentSeconds: sessionTimer
      });

      setLastAnswerFeedback(res.evaluation);
      setActiveMockSession(res.session);
      setCurrentAnswer('');

      // Refresh past sessions list
      const past = await api.listSeekerMockSessions();
      setPastSessions(past.sessions);
    } catch (err: any) {
      alert(err.message || 'Failed to submit mock answer');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  const currentQIndex = activeMockSession?.currentQuestionIndex || 0;
  const currentMockQ = activeMockSession?.questions?.[currentQIndex];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            Personalized Interview Preparation & AI Simulation
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Technical architecture, STAR behavioral questions, and live mock interview feedback
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex rounded-xl bg-ivory dark:bg-ivory-dark p-1 border border-stone dark:border-stone-dark">
          <button
            type="button"
            onClick={() => setActiveMode('practice')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeMode === 'practice'
                ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            Practice Questions ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('mock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeMode === 'mock'
                ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            Mock Simulator
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('history')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeMode === 'history'
                ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            Transcripts ({pastSessions.length})
          </button>
        </div>
      </div>

      {/* Mode 1: Practice Questions Mode */}
      {activeMode === 'practice' && (
        <div className="space-y-6">
          {/* Target Role Settings & Trigger */}
          <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
                Target Job Title
              </label>
              <input
                type="text"
                value={targetJobTitle}
                onChange={(e) => setTargetJobTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark font-medium"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
                Active Resume Profile
              </label>
              <select
                value={selectedResumeId}
                onChange={(e) => {
                  setSelectedResumeId(e.target.value);
                  generateQuestions(e.target.value);
                }}
                className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink dark:text-ink-dark font-semibold focus:outline-none"
              >
                {resumes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.versionLabel}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => generateQuestions(selectedResumeId)}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark transition-colors cursor-pointer"
              >
                {isGenerating ? 'Synthesizing...' : 'Refresh Questions'}
              </button>

              <button
                type="button"
                onClick={handleStartMock}
                className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Interactive Mock</span>
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryFilter === 'all'
                  ? 'bg-forest text-surface dark:bg-forest shadow-xs'
                  : 'bg-surface dark:bg-surface-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              All Blueprint Questions ({questions.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('project')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryFilter === 'project'
                  ? 'bg-forest text-surface dark:bg-forest shadow-xs'
                  : 'bg-surface dark:bg-surface-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              📁 Resume & Projects ({questions.filter((q) => q.category === 'project_verification' || q.relatedProject).length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('jd_technical')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryFilter === 'jd_technical'
                  ? 'bg-forest text-surface dark:bg-forest shadow-xs'
                  : 'bg-surface dark:bg-surface-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              🎯 JD Technical Scenarios ({questions.filter((q) => q.category === 'technical_knowledge' || q.category === 'skill_gap_validation' || q.category === 'role_specific_scenarios').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('fundamentals')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryFilter === 'fundamentals'
                  ? 'bg-forest text-surface dark:bg-forest shadow-xs'
                  : 'bg-surface dark:bg-surface-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              🏛️ Role Fundamentals ({questions.filter((q) => q.category === 'role_fundamentals' || q.category === 'practical_problem_solving').length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter('hr_behavioral')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryFilter === 'hr_behavioral'
                  ? 'bg-forest text-surface dark:bg-forest shadow-xs'
                  : 'bg-surface dark:bg-surface-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark hover:text-ink dark:hover:text-ink-dark'
              }`}
            >
              🤝 HR & Behavioral ({questions.filter((q) => q.category === 'hr_communication' || q.category === 'behavioral_situational').length})
            </button>
          </div>

          {/* Practice Questions List */}
          <div className="space-y-4">
            {questions
              .filter((q) => {
                if (selectedCategoryFilter === 'all') return true;
                if (selectedCategoryFilter === 'project') return q.category === 'project_verification' || q.relatedProject;
                if (selectedCategoryFilter === 'jd_technical') return q.category === 'technical_knowledge' || q.category === 'skill_gap_validation' || q.category === 'role_specific_scenarios';
                if (selectedCategoryFilter === 'fundamentals') return q.category === 'role_fundamentals' || q.category === 'practical_problem_solving';
                if (selectedCategoryFilter === 'hr_behavioral') return q.category === 'hr_communication' || q.category === 'behavioral_situational';
                return true;
              })
              .map((q, idx) => (
              <div
                key={q.id || idx}
                className="p-6 md:p-7 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 text-xs font-mono font-bold flex items-center justify-center border border-forest/20">
                        {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark">
                        {q.category?.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted font-medium capitalize">
                        {q.difficulty} Level
                      </span>
                      {q.relatedProject && (
                        <span className="px-2.5 py-0.5 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 font-semibold text-[10px] border border-forest/25">
                          📁 Project: {q.relatedProject}
                        </span>
                      )}
                      {q.relatedSkills && q.relatedSkills.length > 0 && q.relatedSkills.map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 rounded-full bg-stone-warm dark:bg-stone-dark text-ink dark:text-ink-dark text-[10px] font-mono border border-stone dark:border-stone-dark">
                          ⚡ {skill}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-base font-serif font-bold text-ink dark:text-ink-dark leading-snug pt-1">
                      {q.questionText}
                    </h3>
                    
                    {q.resumeEvidence && (
                      <div className="text-[11px] bg-forest-faint/50 dark:bg-forest/15 p-3 rounded-2xl border-l-4 border-forest dark:border-emerald-400 text-ink-muted dark:text-ink-muted-dark italic font-serif">
                        <span className="font-semibold text-ink dark:text-ink-dark not-italic font-sans">Resume Evidence: </span>
                        "{q.resumeEvidence}"
                      </div>
                    )}

                    {q.relevanceReason && (
                      <p className="text-xs text-forest dark:text-emerald-400 italic">
                        Context: {q.relevanceReason}
                      </p>
                    )}

                    {q.followUpQuestions && q.followUpQuestions.length > 0 && (
                      <div className="p-3.5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs mt-2">
                        <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block mb-1">
                          Adaptive Follow-Up Probes:
                        </span>
                        <ul className="space-y-1 text-[11px] text-ink-light dark:text-ink-dark-secondary list-disc list-inside">
                          {q.followUpQuestions.map((fQ: string, fIdx: number) => (
                            <li key={fIdx}>{fQ}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expected Signals & Self Rubric Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-stone dark:border-stone-dark text-xs">
                  {/* Expected Signals */}
                  <div className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                      Expected Answer Signals:
                    </span>
                    <ul className="space-y-1 text-ink-light dark:text-ink-dark-secondary list-disc list-inside">
                      {(q.expectedSignals || []).map((sig: string, sIdx: number) => (
                        <li key={sIdx}>{sig}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Benchmark Rubric */}
                  <div className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                      Grading Benchmark:
                    </span>
                    <div className="space-y-1 text-[11px] text-ink-light dark:text-ink-dark-secondary">
                      <div><strong className="text-forest dark:text-emerald-400">Strong (4-5):</strong> {q.selfRubric?.strong}</div>
                      <div><strong className="text-amber dark:text-amber-400">Adequate (3):</strong> {q.selfRubric?.adequate}</div>
                      <div><strong className="text-brand-error dark:text-rose-400">Poor (1-2):</strong> {q.selfRubric?.poor}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mode 2: Interactive Mock Simulator Mode */}
      {activeMode === 'mock' && (
        <div className="space-y-6">
          {activeMockSession ? (
            <div className="space-y-6">
              {/* Session Control Banner */}
              <div className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-editorial">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest text-surface uppercase tracking-wider">
                      Live Simulation
                    </span>
                    <span className="text-xs text-ink-muted dark:text-ink-dark-muted">
                      Question {currentQIndex + 1} of {activeMockSession.questions.length}
                    </span>
                  </div>
                  <h2 className="text-xl font-serif font-bold text-ink dark:text-ink-dark">
                    {activeMockSession.targetJobTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark font-mono text-sm text-forest dark:text-emerald-400 font-bold">
                    <Clock className="w-4 h-4" />
                    <span>{Math.floor(sessionTimer / 60).toString().padStart(2, '0')}:{(sessionTimer % 60).toString().padStart(2, '0')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveMockSession(null)}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark cursor-pointer"
                  >
                    Exit Simulation
                  </button>
                </div>
              </div>

              {!activeMockSession.isCompleted && currentMockQ ? (
                /* Question & Answer Box */
                <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300">
                        {currentMockQ.category?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-ink-muted dark:text-ink-dark-muted font-medium capitalize">
                        {currentMockQ.difficulty} Difficulty
                      </span>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-ink dark:text-ink-dark leading-snug">
                      {currentMockQ.questionText}
                    </h3>
                    <p className="text-xs text-forest dark:text-emerald-400 italic">
                      {currentMockQ.relevanceReason}
                    </p>
                  </div>

                  {/* Answer Input */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-ink dark:text-ink-dark">
                      Type Your Live Answer (Use STAR framework):
                    </label>
                    <textarea
                      rows={6}
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Situation: describe context... Task: your specific challenge... Action: exact steps and tools you used... Result: measurable impact..."
                      className="w-full px-4 py-3 rounded-2xl editorial-input text-xs text-ink dark:text-ink-dark leading-relaxed font-sans"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted">
                      AI evaluates technical clarity, STAR structure, and key competency signals.
                    </span>
                    <button
                      type="button"
                      disabled={isSubmittingAnswer || !currentAnswer.trim()}
                      onClick={handleSubmitAnswer}
                      className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingAnswer ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Evaluating Answer...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit & Get Evaluation</span>
                          <Send className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Immediate Feedback Card */}
                  {lastAnswerFeedback && (
                    <div className="p-5 rounded-2xl bg-forest-faint dark:bg-forest/15 border border-forest/30 space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-forest dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                          Real-Time Evaluator Feedback:
                        </span>
                        <div className="flex items-center gap-1 font-mono font-bold text-sm text-ink dark:text-ink-dark">
                          <span>Score: {lastAnswerFeedback.score}/5</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <strong className="text-forest dark:text-emerald-400">Strengths:</strong>
                        <ul className="list-disc list-inside text-ink-light dark:text-ink-dark-secondary">
                          {lastAnswerFeedback.strengths?.map((str: string, i: number) => (
                            <li key={i}>{str}</li>
                          ))}
                        </ul>
                      </div>

                      {lastAnswerFeedback.weaknesses?.length > 0 && (
                        <div className="space-y-1">
                          <strong className="text-amber dark:text-amber-400">Improvement Opportunities:</strong>
                          <ul className="list-disc list-inside text-ink-light dark:text-ink-dark-secondary">
                            {lastAnswerFeedback.weaknesses.map((w: string, i: number) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-surface dark:bg-surface-dark border border-forest/20 space-y-1">
                        <strong className="text-forest dark:text-emerald-400 block text-[11px]">Model Answer Structure:</strong>
                        <p className="text-ink dark:text-ink-dark leading-relaxed font-mono text-[11px]">
                          {lastAnswerFeedback.modelAnswerGuidance}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Completed Session Summary Card */
                <div className="p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-center space-y-4 shadow-editorial max-w-xl mx-auto">
                  <div className="w-14 h-14 rounded-full bg-forest text-surface flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h3 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark">
                    Mock Interview Completed!
                  </h3>
                  <div className="text-4xl font-mono font-extrabold text-forest dark:text-emerald-400">
                    {activeMockSession.overallScore || 4.2}/5.0
                  </div>
                  <p className="text-xs text-ink-light dark:text-ink-dark-secondary leading-relaxed">
                    {activeMockSession.overallFeedback || 'Great performance across technical depth and structured problem solving.'}
                  </p>
                  <div className="pt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveMode('history')}
                      className="px-5 py-2.5 rounded-xl bg-forest text-surface text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      View Session Transcript
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-surface dark:bg-surface-dark rounded-3xl border border-stone dark:border-stone-dark space-y-4 shadow-xs max-w-lg mx-auto">
              <Sparkles className="w-10 h-10 text-forest dark:text-emerald-400 mx-auto" />
              <h3 className="font-serif text-xl font-bold text-ink dark:text-ink-dark">
                Ready to Start an Interactive Mock Interview?
              </h3>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted leading-relaxed">
                The simulator will ask questions tailored to {targetJobTitle}. Type your answers and receive immediate criterion-based evaluations.
              </p>
              <button
                type="button"
                onClick={handleStartMock}
                className="px-6 py-3 rounded-2xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs inline-flex items-center gap-2 cursor-pointer transition-all"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Begin Simulation Now</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Transcripts & History Mode */}
      {activeMode === 'history' && (
        <div className="space-y-4">
          <h2 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
            Past Mock Interview Transcripts ({pastSessions.length})
          </h2>

          {pastSessions.length > 0 ? (
            <div className="space-y-4">
              {pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-stone dark:border-stone-dark">
                    <div>
                      <h4 className="font-serif font-bold text-ink dark:text-ink-dark text-base">
                        {session.targetJobTitle}
                      </h4>
                      <span className="text-xs text-ink-muted dark:text-ink-dark-muted">
                        {new Date(session.createdAt).toLocaleString()} • {session.answers?.length || 0} Questions Answered
                      </span>
                    </div>

                    {session.overallScore && (
                      <div className="text-right">
                        <div className="text-xl font-mono font-bold text-forest dark:text-emerald-400">
                          {session.overallScore}/5
                        </div>
                        <span className="text-[10px] uppercase font-bold text-ink-muted dark:text-ink-dark-muted">
                          Overall Grade
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Answers review list */}
                  <div className="space-y-3">
                    {(session.answers || []).map((ans: any, aIdx: number) => (
                      <div key={aIdx} className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-ink dark:text-ink-dark font-serif text-sm">
                            Q{aIdx + 1}: {ans.questionText}
                          </strong>
                          <span className="px-2 py-0.5 rounded bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark font-mono font-bold text-forest dark:text-emerald-400 shrink-0">
                            Score: {ans.score}/5
                          </span>
                        </div>

                        <p className="text-ink-light dark:text-ink-dark-secondary italic bg-surface dark:bg-surface-dark p-2.5 rounded border border-stone dark:border-stone-dark">
                          "{ans.userAnswer}"
                        </p>

                        <div className="text-[11px] text-forest dark:text-emerald-400">
                          <strong>Feedback:</strong> {ans.strengths?.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-surface dark:bg-surface-dark rounded-2xl border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted">
              No completed mock sessions recorded yet. Launch a mock interview to track your transcripts.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
