import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../services/api';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Trash2,
  Edit3,
  Download,
  Eye,
  Star,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Plus,
  PenTool,
  ScanSearch,
  X
} from 'lucide-react';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SeekerResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspection modal state
  const [selectedResume, setSelectedResume] = useState<any>(null);

  // Rename modal state
  const [renamingResume, setRenamingResume] = useState<any>(null);
  const [newLabel, setNewLabel] = useState('');

  const fetchResumes = async () => {
    try {
      const res = await api.getSeekerResumes();
      setResumes(res.resumes);
    } catch (err) {
      console.error('Failed to load resumes', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    setUploadError('');
    try {
      await api.uploadSeekerResume(file, versionLabel || undefined, resumes.length === 0);
      setVersionLabel('');
      await fetchResumes();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload and parse resume file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSetActive = async (resumeId: string) => {
    try {
      await api.updateSeekerResume(resumeId, { isActive: true });
      await fetchResumes();
    } catch (err: any) {
      alert(err.message || 'Failed to set active resume');
    }
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume version and its associated records?')) return;
    try {
      await api.deleteSeekerResume(resumeId);
      await fetchResumes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resume');
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renamingResume || !newLabel) return;
    try {
      await api.updateSeekerResume(renamingResume.id, { versionLabel: newLabel });
      setRenamingResume(null);
      await fetchResumes();
    } catch (err: any) {
      alert(err.message || 'Failed to update version label');
    }
  };

  const handleLoadSampleResume = async () => {
    setIsUploading(true);
    setUploadError('');
    try {
      const sampleText = `Jordan Rivera
Full-Stack Software Engineer
Email: jordan.rivera@example.com | GitHub: github.com/jrivera

PROFESSIONAL SUMMARY
Versatile Full-Stack Engineer with 4+ years of hands-on experience building scalable applications using TypeScript, React 18, Node.js, and PostgreSQL.

TECHNICAL SKILLS
TypeScript, React, Next.js, TailwindCSS, Node.js, Express, PostgreSQL, Redis, Docker, Git, CI/CD, Vitest, AWS

EXPERIENCE
Software Engineer | Nexus Digital Solutions (2022 - Present)
- Engineered responsive web apps in React and TypeScript serving 40k+ users.
- Built Node.js microservices with PostgreSQL and reduced API response times by 30%.
- Integrated Vitest test suites achieving 88% test coverage.

Junior Web Developer | CloudScale Apps (2020 - 2022)
- Maintained RESTful APIs and PostgreSQL migrations.
- Built responsive UI components in TypeScript and TailwindCSS.

EDUCATION
B.S. in Computer Science, State University (2020)`;

      const blob = new Blob([sampleText], { type: 'application/pdf' });
      const sampleFile = new File([blob], 'Jordan_Rivera_Sample_Resume.pdf', { type: 'application/pdf' });
      await api.uploadSeekerResume(sampleFile, 'v3.0 - Senior Full-Stack Sample', resumes.length === 0);
      await fetchResumes();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to load sample resume.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone dark:border-stone-dark">
        <div>
          <h1 className="text-2xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            Personal Resume Vault
          </h1>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
            Store, version, and inspect your master and tailored resumes with deterministic parsing
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleResume}
          disabled={isUploading}
          className="px-3.5 py-2 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/30 text-xs font-semibold hover:bg-forest-faint/80 flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-forest dark:text-emerald-400" />
          <span>Load Verified Sample (1-Click)</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`p-8 md:p-10 rounded-3xl border-2 border-dashed transition-all text-center space-y-4 relative overflow-hidden ${
          isDragOver
            ? 'border-forest bg-forest-faint/30 dark:bg-forest/10 scale-[1.01]'
            : 'border-stone dark:border-stone-dark bg-surface dark:bg-surface-dark shadow-xs'
        }`}
      >
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-48 bg-forest/5 dark:bg-forest/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-14 h-14 rounded-2xl bg-forest-faint dark:bg-forest/20 flex items-center justify-center text-forest dark:text-emerald-300 mx-auto border border-forest/20 relative z-10">
          <UploadCloud className="w-7 h-7" />
        </div>

        <div className="space-y-1 relative z-10">
          <h3 className="font-serif font-bold text-ink dark:text-ink-dark text-lg">
            Upload New Resume Version
          </h3>
          <p className="text-xs text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto leading-relaxed">
            Drag and drop your PDF or Word DOCX resume here, or browse from your device.
          </p>
        </div>

        {/* Optional Version Label Input */}
        <div className="max-w-xs mx-auto relative z-10">
          <input
            type="text"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            placeholder="Version label (e.g. v3.0 - Frontend Specialist)"
            className="w-full px-3.5 py-2.5 text-xs rounded-xl editorial-input text-center text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-dark-faint"
          />
        </div>

        <div className="pt-2 relative z-10">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-surface text-xs font-semibold shadow-xs inline-flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Extracting Text & Skills...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Select File from Computer</span>
              </>
            )}
          </button>
        </div>

        {uploadError && (
          <div className="p-3.5 max-w-md mx-auto rounded-2xl bg-brand-error-light dark:bg-rose-950/40 text-brand-error dark:text-rose-300 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Resume Versions List */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-ink dark:text-ink-dark flex items-center gap-2">
          <FileText className="w-4 h-4 text-forest dark:text-emerald-400" />
          <span>Uploaded Resume Versions ({resumes.length})</span>
        </h2>

        {resumes.length > 0 ? (
          <div className="space-y-4">
            {resumes.map((resume) => (
              <div
                key={resume.id}
                className={`p-6 md:p-7 rounded-3xl bg-surface dark:bg-surface-dark border transition-all shadow-xs ${
                  resume.isActive
                    ? 'border-forest dark:border-emerald-500/50 ring-2 ring-forest/15 dark:ring-emerald-500/20'
                    : 'border-stone dark:border-stone-dark'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif font-bold text-ink dark:text-ink-dark text-base">
                        {resume.versionLabel}
                      </h3>
                      {resume.isActive ? (
                        <span className="px-3 py-0.5 rounded-full text-[10px] font-bold bg-forest text-surface flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ACTIVE VERSION
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetActive(resume.id)}
                          className="text-[11px] font-semibold text-forest dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          Set as Active
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-ink-muted dark:text-ink-dark-muted flex-wrap">
                      <span>File: <strong>{resume.fileName}</strong></span>
                      <span>•</span>
                      <span>Size: {(resume.fileSize / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>Uploaded: {new Date(resume.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Extracted Skills Preview */}
                    {resume.parsedData?.skills && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {resume.parsedData.skills.slice(0, 8).map((s: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-2.5 py-0.5 rounded-full bg-ivory dark:bg-ivory-dark text-[10px] font-mono font-medium text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark"
                          >
                            {s}
                          </span>
                        ))}
                        {resume.parsedData.skills.length > 8 && (
                          <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted self-center">
                            +{resume.parsedData.skills.length - 8} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedResume(resume)}
                      className="px-3 py-1.5 rounded-xl bg-ivory dark:bg-ivory-dark hover:bg-stone-warm dark:hover:bg-stone-dark text-ink dark:text-ink-dark text-xs font-semibold border border-stone dark:border-stone-dark flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
                      <span>Inspect Extracted Data</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRenamingResume(resume);
                        setNewLabel(resume.versionLabel);
                      }}
                      className="p-2 rounded-xl text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark/50 transition-colors cursor-pointer"
                      title="Rename Version Label"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(resume.id)}
                      className="p-2 rounded-xl text-brand-error hover:bg-brand-error-light dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Delete Resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-surface dark:bg-surface-dark rounded-2xl border border-stone dark:border-stone-dark text-xs text-ink-muted dark:text-ink-dark-muted">
            No resume versions saved in your vault. Upload your first resume above.
          </div>
        )}
      </div>

      {/* Extracted Data Inspection Modal */}
      {selectedResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="bg-surface dark:bg-surface-dark p-6 md:p-8 rounded-3xl border border-stone dark:border-stone-dark max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone dark:border-stone-dark">
              <div>
                <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
                  Extracted Resume Intelligence
                </h3>
                <span className="text-xs text-ink-muted dark:text-ink-dark-muted">
                  {selectedResume.versionLabel} ({selectedResume.fileName})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResume(null)}
                className="p-1 rounded-lg text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Extracted Sections */}
            <div className="space-y-4 text-xs">
              {/* Profile Summary */}
              {selectedResume.parsedData?.summary && (
                <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-1">
                  <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block">
                    Professional Summary
                  </span>
                  <p className="text-ink dark:text-ink-dark leading-relaxed">
                    {selectedResume.parsedData.summary}
                  </p>
                </div>
              )}

              {/* Skills */}
              <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2">
                <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block">
                  Identified Technical & Domain Skills
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedResume.parsedData?.skills || []).map((skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-[11px] font-mono text-forest dark:text-emerald-300 font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Raw Extracted Text */}
              <div className="p-4 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-2">
                <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase tracking-wider block">
                  Sanitized Text Extraction
                </span>
                <pre className="p-3 rounded-lg bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark font-mono text-[11px] text-ink-light dark:text-ink-dark-secondary whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedResume.extractedText}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedResume(null)}
                className="px-4 py-2 rounded-xl bg-forest text-surface text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-xs">
          <div className="bg-surface dark:bg-surface-dark p-6 rounded-2xl border border-stone dark:border-stone-dark max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="font-serif text-base font-bold text-ink dark:text-ink-dark">
              Rename Version Label
            </h3>
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                required
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenamingResume(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-ink-muted dark:text-ink-dark-muted cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-forest text-surface text-xs font-semibold cursor-pointer"
                >
                  Save Label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
