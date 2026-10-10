import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  PenTool,
  Sparkles,
  CheckCircle2,
  XCircle,
  Edit3,
  Copy,
  Printer,
  Download,
  ArrowRight,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
  Save,
  RotateCcw
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SeekerResumeStudioPage: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [targetRole, setTargetRole] = useState('Senior Full-Stack TypeScript Engineer');
  const [targetJobDesc, setTargetJobDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'editor' | 'preview'>('suggestions');

  // Structured Editor state
  const [editorSummary, setEditorSummary] = useState('');
  const [editorSkills, setEditorSkills] = useState('');
  const [editorExperience, setEditorExperience] = useState('');
  const [editorProjects, setEditorProjects] = useState('');
  const [editorEducation, setEditorEducation] = useState('');

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const resumesRes = await api.getSeekerResumes();
        setResumes(resumesRes.resumes);
        const active = resumesRes.resumes.find((r: any) => r.isActive) || resumesRes.resumes[0];
        if (active) {
          setSelectedResumeId(active.id);
          populateEditorFromResume(active);
          loadSuggestionsForResume(active.id);
        }
      } catch (err) {
        console.error('Failed to load resumes for studio', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitial();
  }, []);

  const populateEditorFromResume = (resume: any) => {
    if (!resume) return;
    setEditorSummary(resume.parsedData?.summary || '');
    setEditorSkills((resume.parsedData?.skills || []).join(', '));
    const expText = (resume.parsedData?.experience || [])
      .map((e: any) => `${e.title} | ${e.company} (${e.startDate || ''} - ${e.endDate || 'Present'})\n• ${e.description || 'Delivered key features.'}`)
      .join('\n\n');
    setEditorExperience(expText);
    const projText = (resume.parsedData?.projects || [])
      .map((p: any) => `${p.name}: ${p.description}`)
      .join('\n\n');
    setEditorProjects(projText);
    const eduText = (resume.parsedData?.education || [])
      .map((ed: any) => `${ed.degree} — ${ed.institution} (${ed.graduationYear || ''})`)
      .join('\n');
    setEditorEducation(eduText);
  };

  const loadSuggestionsForResume = async (resumeId: string) => {
    setIsGenerating(true);
    try {
      const res = await api.getSeekerImprovementSuggestions({
        resumeId,
        targetJobTitle: targetRole,
        targetJobDescription: targetJobDesc || undefined
      });
      setSuggestions(res.suggestions || []);
    } catch (err) {
      console.error('Failed to fetch suggestions', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedResumeId(rId);
    const found = resumes.find((r) => r.id === rId);
    if (found) {
      populateEditorFromResume(found);
      loadSuggestionsForResume(rId);
    }
  };

  const handleAcceptSuggestion = (sug: any) => {
    if (sug.section === 'summary') {
      setEditorSummary(sug.suggestedRevision);
    } else if (sug.section === 'skills') {
      setEditorSkills(sug.suggestedRevision);
    } else if (sug.section === 'experience') {
      setEditorExperience((prev) => `${prev}\n• ${sug.suggestedRevision}`);
    } else if (sug.section === 'projects') {
      setEditorProjects((prev) => `${prev}\n\n${sug.suggestedRevision}`);
    }

    setSuggestions((prev) =>
      prev.map((item) => (item.id === sug.id ? { ...item, isAccepted: true } : item))
    );
  };

  const handleSaveState = async () => {
    try {
      await api.saveSeekerImprovementState({
        resumeId: selectedResumeId,
        targetJobTitle: targetRole,
        suggestions,
        structuredEditorContent: {
          summary: editorSummary,
          skills: editorSkills,
          experience: editorExperience,
          projects: editorProjects,
          education: editorEducation
        }
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save studio state');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            Resume Improvement Studio
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            STAR framework enhancements, achievement rewrites, and ATS-optimized document export
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveState}
            className="px-4 py-2 rounded-xl bg-surface dark:bg-surface-dark hover:bg-ivory dark:hover:bg-ivory-dark text-ink dark:text-ink-dark text-xs font-semibold border border-stone dark:border-stone-dark flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
            <span>{isSaved ? 'Saved to Vault!' : 'Save Progress'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Target Role & Resume Selector Bar */}
      <div className="p-5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
            Active Resume Version
          </label>
          <select
            value={selectedResumeId}
            onChange={handleResumeChange}
            className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink dark:text-ink-dark font-semibold focus:outline-none"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.versionLabel} ({r.fileName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
            Target Job Title
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3 py-2 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
            />
            <button
              type="button"
              onClick={() => loadSuggestionsForResume(selectedResumeId)}
              disabled={isGenerating}
              className="px-3 py-2 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/30 text-xs font-semibold shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? 'Analyzing...' : 'Re-Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Studio Navigation Tabs */}
      <div className="flex rounded-xl bg-ivory dark:bg-ivory-dark p-1 border border-stone dark:border-stone-dark max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('suggestions')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'suggestions'
              ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
              : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
          }`}
        >
          STAR Suggestions ({suggestions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'editor'
              ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
              : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
          }`}
        >
          Structured Editor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-surface dark:bg-surface-dark text-ink dark:text-ink-dark shadow-xs'
              : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
          }`}
        >
          Printable ATS Preview
        </button>
      </div>

      {/* Tab 1: STAR Suggestions List */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-forest-faint dark:bg-forest/15 border border-forest/25 text-xs text-forest dark:text-emerald-300 space-y-1">
            <span className="font-bold block">Objective Achievement Writing Rules:</span>
            <p className="text-ink-light dark:text-ink-dark-secondary leading-relaxed">
              Every bullet point follows Situation → Task → Action → Result. Explicit placeholders like <code className="bg-surface dark:bg-surface-dark px-1.5 py-0.5 rounded border border-stone">[insert % metric]</code> prompt you for your real data without fabricating history.
            </p>
          </div>

          <div className="space-y-4">
            {suggestions.map((sug, idx) => (
              <div
                key={sug.id || idx}
                className="p-6 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20">
                      {sug.section}
                    </span>
                    {sug.targetRequirementText && (
                      <span className="text-xs text-ink-muted dark:text-ink-dark-muted">
                        Supports: <strong>{sug.targetRequirementText}</strong>
                      </span>
                    )}
                  </div>

                  {sug.isAccepted ? (
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-forest text-surface flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ACCEPTED
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAcceptSuggestion(sug)}
                      className="px-4 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Accept Revision</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Side by Side Diff Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Original */}
                  <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1">
                    <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block">
                      Original Snippet
                    </span>
                    <p className="text-ink-light dark:text-ink-dark-secondary italic leading-relaxed">
                      "{sug.originalSnippet}"
                    </p>
                  </div>

                  {/* Suggested STAR Revision */}
                  <div className="p-4 rounded-xl bg-forest-faint/40 dark:bg-forest/10 border border-forest/30 space-y-1">
                    <span className="text-[10px] font-bold text-forest dark:text-emerald-400 uppercase tracking-wider block">
                      Suggested STAR Rewrite
                    </span>
                    <p className="font-semibold text-ink dark:text-ink-dark leading-relaxed">
                      {sug.suggestedRevision}
                    </p>
                  </div>
                </div>

                {/* Reason & Guide */}
                <div className="p-3.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted space-y-1">
                  <div><strong className="text-ink dark:text-ink-dark">Why it's better:</strong> {sug.improvementReason}</div>
                  {sug.starContextGuide && (
                    <div className="text-[11px] text-forest dark:text-emerald-400 pt-0.5">
                      <strong>Coach Note:</strong> {sug.starContextGuide}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Structured Editor */}
      {activeTab === 'editor' && (
        <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-6">
          <div className="space-y-1">
            <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
              Structured Resume Content Editor
            </h3>
            <p className="text-xs text-ink-muted dark:text-ink-dark-muted">
              Edit accepted revisions, update metrics, and prepare an ATS-ready linear document.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-ink dark:text-ink-dark mb-1">
                Professional Summary
              </label>
              <textarea
                rows={3}
                value={editorSummary}
                onChange={(e) => setEditorSummary(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark leading-relaxed font-sans"
              />
            </div>

            <div>
              <label className="block font-bold text-ink dark:text-ink-dark mb-1">
                Categorized Skills
              </label>
              <textarea
                rows={2}
                value={editorSkills}
                onChange={(e) => setEditorSkills(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark leading-relaxed font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-ink dark:text-ink-dark mb-1">
                Professional Experience & STAR Bullets
              </label>
              <textarea
                rows={8}
                value={editorExperience}
                onChange={(e) => setEditorExperience(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark leading-relaxed font-sans"
              />
            </div>

            <div>
              <label className="block font-bold text-ink dark:text-ink-dark mb-1">
                Highlighted Projects
              </label>
              <textarea
                rows={4}
                value={editorProjects}
                onChange={(e) => setEditorProjects(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark leading-relaxed font-sans"
              />
            </div>

            <div>
              <label className="block font-bold text-ink dark:text-ink-dark mb-1">
                Education & Certifications
              </label>
              <textarea
                rows={3}
                value={editorEducation}
                onChange={(e) => setEditorEducation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark leading-relaxed font-sans"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Printable ATS Preview */}
      {activeTab === 'preview' && (
        <div className="p-8 md:p-12 rounded-3xl bg-white text-gray-900 border border-stone shadow-2xl max-w-4xl mx-auto space-y-6 font-sans">
          {/* Resume Header */}
          <div className="text-center pb-4 border-b border-gray-300 space-y-1">
            <h2 className="text-2xl font-bold font-serif text-gray-950 uppercase tracking-tight">
              {resumes.find((r) => r.id === selectedResumeId)?.parsedData?.fullName || 'Candidate Name'}
            </h2>
            <p className="text-xs text-gray-600">
              {resumes.find((r) => r.id === selectedResumeId)?.parsedData?.email || 'email@example.com'} • {resumes.find((r) => r.id === selectedResumeId)?.parsedData?.phone || '+1 555-0100'} • Portfolio / LinkedIn
            </p>
          </div>

          {/* Summary */}
          {editorSummary && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Professional Summary
              </h3>
              <p className="text-xs text-gray-800 leading-relaxed pt-1">{editorSummary}</p>
            </div>
          )}

          {/* Skills */}
          {editorSkills && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Technical Skills
              </h3>
              <p className="text-xs text-gray-800 leading-relaxed pt-1">{editorSkills}</p>
            </div>
          )}

          {/* Experience */}
          {editorExperience && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Professional Experience
              </h3>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed pt-1">
                {editorExperience}
              </pre>
            </div>
          )}

          {/* Projects */}
          {editorProjects && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Technical Projects
              </h3>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed pt-1">
                {editorProjects}
              </pre>
            </div>
          )}

          {/* Education */}
          {editorEducation && (
            <div className="space-y-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Education & Certifications
              </h3>
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-sans leading-relaxed pt-1">
                {editorEducation}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
