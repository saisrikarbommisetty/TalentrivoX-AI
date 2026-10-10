import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Sparkles,
  ShieldCheck,
  FileCheck,
  Zap,
  ArrowRight,
  Layers,
  Check,
  Info
} from 'lucide-react';
import { ScoreGauge } from './ScoreGauge';

interface ResumeUploadModalProps {
  jobId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ResumeUploadModal: React.FC<ResumeUploadModalProps> = ({ jobId, isOpen, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<number>(0);
  const [uploadResults, setUploadResults] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const validExts = ['.pdf', '.docx', '.doc'];
    const newFiles: File[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lower = file.name.toLowerCase();
      if (validExts.some((ext) => lower.endsWith(ext))) {
        newFiles.push(file);
      }
    }

    if (newFiles.length < files.length) {
      setError('Some unsupported files were excluded. Only PDF and DOCX formats are supported.');
    } else {
      setError('');
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Sample Resume Generator for 1-Click Testing
  const handleLoadSampleResumes = () => {
    setError('');
    const sample1 = new File(
      [
        `Sarah Chen\nEmail: sarah.chen@techmail.io | San Francisco, CA | 10+ Years Experience\n` +
        `Summary: Principal Software Architect specializing in distributed systems, high-concurrency Go microservices, and Kafka event streaming.\n` +
        `Experience:\n` +
        `- Staff Backend Architect at FinCloud (2020-Present): Architected distributed event pipelines handling 250,000 req/sec with sub-10ms P99 latency. Built resilient consensus systems using Raft and Go.\n` +
        `- Senior Systems Engineer at DataStream (2016-2020): Led PostgreSQL optimization, indexing, and connection pool clustering resulting in 65% latency reduction.\n` +
        `Skills: Go, Distributed Systems, Apache Kafka, PostgreSQL, Kubernetes, Microservices, System Architecture, Redis, gRPC, Docker.`
      ],
      'Sarah_Chen_Staff_Architect.pdf',
      { type: 'application/pdf' }
    );

    const sample2 = new File(
      [
        `Elena Rostova\nEmail: elena.rostova@cloudscale.dev | Seattle, WA | 8 Years Experience\n` +
        `Summary: Senior Backend Engineer with extensive experience in cloud-native microservices, Go backends, and high-throughput PostgreSQL databases.\n` +
        `Experience:\n` +
        `- Senior Backend Engineer at FinTech Corp (2021-Present): Designed asynchronous event-driven architecture with Apache Kafka and Go workers with 99.999% SLA.\n` +
        `- Backend Software Engineer at Nexus Cloud (2018-2021): Implemented scalable REST & gRPC APIs in Go and managed Kubernetes deployments on AWS EKS.\n` +
        `Skills: Go, PostgreSQL, Apache Kafka, Kubernetes, Microservices, Docker, CI/CD, AWS, Redis.`
      ],
      'Elena_Rostova_Senior_Backend.pdf',
      { type: 'application/pdf' }
    );

    const sample3 = new File(
      [
        `Marcus Vance\nEmail: marcus.vance@infrasoft.com | Austin, TX | 6 Years Experience\n` +
        `Summary: Full Stack & Cloud Engineer focused on microservice delivery, Kubernetes cluster administration, and API design.\n` +
        `Experience:\n` +
        `- Cloud Engineer at Enterprise Cloud (2022-Present): Maintained Kubernetes clusters and Docker containers. Designed internal developer portals in TypeScript and Python.\n` +
        `- Junior Software Developer at AppMatrix (2019-2022): Developed Python backends and relational database schema migrations.\n` +
        `Skills: Kubernetes, Docker, Python, TypeScript, PostgreSQL, CI/CD, Terraform, Cloud Architecture.`
      ],
      'Marcus_Vance_Cloud_Engineer.pdf',
      { type: 'application/pdf' }
    );

    setSelectedFiles([sample1, sample2, sample3]);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one resume file to evaluate.');
      return;
    }

    setIsUploading(true);
    setError('');
    setUploadStep(1);

    const stepTimer1 = setTimeout(() => setUploadStep(2), 700);
    const stepTimer2 = setTimeout(() => setUploadStep(3), 1400);

    try {
      const res = await api.uploadResumes(jobId, selectedFiles);
      setUploadStep(4);
      setTimeout(() => {
        setUploadResults(res.results);
        setIsUploading(false);
        onSuccess();
      }, 500);
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      setIsUploading(false);
      setError(err.message || 'Screening pipeline encountered an error.');
    }
  };

  const handleFinish = () => {
    setSelectedFiles([]);
    setUploadResults(null);
    setUploadStep(0);
    onClose();
  };

  const totalSizeMB = (
    selectedFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)
  ).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/70 dark:bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-3xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden max-h-[92vh] my-auto transition-colors duration-200">
        
        {/* MODAL HEADER */}
        <div className="p-6 md:p-8 border-b border-stone dark:border-stone-dark bg-stone-light/40 dark:bg-stone-dark/30 flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-forest-faint dark:bg-forest/20 border border-forest/20 text-[10px] font-mono font-bold text-forest dark:text-forest-light uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Evidence Screening Engine</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink dark:text-ink-dark tracking-tight">
              Resume Intake & Candidate Evaluation
            </h2>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark leading-relaxed">
              Upload candidate CVs to extract verified experience, map essential criteria, and generate auditable match scores.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 rounded-xl text-ink-muted dark:text-ink-muted-dark hover:text-ink dark:hover:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECURITY & INTEGRITY TRUST STRIP */}
        <div className="px-6 py-2.5 bg-ivory dark:bg-ivory-dark border-b border-stone dark:border-stone-dark flex flex-wrap items-center justify-between gap-3 text-[11px] text-ink-muted dark:text-ink-muted-dark">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-forest dark:text-forest-light" />
            <span>Private Storage & SHA-256 Deduplication</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5 text-forest dark:text-forest-light" />
            <span>Deterministic Scoring Guarantee</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-surface dark:bg-surface-dark">
          {error && (
            <div className="p-4 rounded-2xl bg-brand-error-light dark:bg-rose-950/40 border border-brand-error/20 dark:border-rose-900/40 text-brand-error dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Upload Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* STATE 1: UPLOAD QUEUE & DROPZONE */}
          {!uploadResults && !isUploading && (
            <div className="space-y-5">
              {/* Interactive Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group ${
                  isDragOver
                    ? 'border-forest bg-forest-faint/50 dark:bg-forest/20 scale-[0.99]'
                    : 'border-stone dark:border-stone-dark hover:border-forest/60 dark:hover:border-forest-light/60 bg-ivory dark:bg-ivory-dark hover:bg-stone-warm dark:hover:bg-surface-dark'
                }`}
              >
                <div className="w-14 h-14 rounded-2xl bg-forest-faint dark:bg-forest/20 border border-forest/30 flex items-center justify-center text-forest dark:text-forest-light mb-4 shadow-xs group-hover:scale-110 transition-transform duration-200">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <h3 className="text-sm sm:text-base font-serif font-bold text-ink dark:text-ink-dark mb-1">
                  Drag and drop resumes here, or <span className="text-forest dark:text-forest-light underline underline-offset-2">browse files</span>
                </h3>

                <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-sm mb-4">
                  Multi-file batch upload enabled. Candidate text and skills will be parsed automatically.
                </p>

                {/* File format badges */}
                <div className="flex items-center gap-2 text-[10px] font-mono font-semibold text-ink-muted dark:text-ink-muted-dark">
                  <span className="px-2 py-0.5 rounded-md bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark">
                    .PDF
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark">
                    .DOCX
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark">
                    Max 10 MB per file
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {/* 1-Click Sample Pack Helper */}
              {selectedFiles.length === 0 && (
                <div className="p-4 rounded-2xl bg-forest-faint/60 dark:bg-forest/10 border border-forest/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-forest text-white flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-amber fill-amber" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-ink dark:text-ink-dark">Want to test without local files?</h4>
                      <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                        Load 3 realistic senior engineering resumes to preview instant screening.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLoadSampleResumes}
                    className="px-3.5 py-1.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                  >
                    Load Sample Pack (3)
                  </button>
                </div>
              )}

              {/* Selected Files Queue Table */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-serif font-bold text-ink dark:text-ink-dark">
                        Ready for Screening
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light text-[10px] font-mono font-bold">
                        {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} ({totalSizeMB} MB)
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleLoadSampleResumes}
                        className="text-[11px] text-forest dark:text-forest-light hover:underline font-semibold cursor-pointer"
                      >
                        Reset to Samples
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-[11px] text-brand-error dark:text-rose-300 hover:underline font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs transition-all hover:border-forest/40"
                      >
                        <div className="flex items-center gap-3 truncate">
                          <div className="w-8 h-8 rounded-lg bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-ink dark:text-ink-dark truncate">{file.name}</p>
                            <span className="text-[10px] text-ink-muted dark:text-ink-muted-dark font-mono">
                              {(file.size / 1024).toFixed(1)} KB • Ready
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1.5 rounded-lg text-ink-muted dark:text-ink-muted-dark hover:text-brand-error dark:hover:text-rose-300 hover:bg-stone-warm dark:hover:bg-stone-dark transition-colors cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 2: LIVE MULTI-STAGE SCREENING PROGRESS */}
          {isUploading && (
            <div className="py-8 px-4 text-center space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-forest-faint dark:bg-forest/20 border border-forest/30 flex items-center justify-center text-forest dark:text-forest-light animate-pulse">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-ink dark:text-ink-dark">
                  Evaluating {selectedFiles.length} {selectedFiles.length === 1 ? 'Candidate' : 'Candidates'}...
                </h3>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark mt-1">
                  Parsing verbatim text and benchmarking against immutable job criteria.
                </p>
              </div>

              {/* Step indicator sequence */}
              <div className="max-w-md mx-auto space-y-2.5 text-left text-xs">
                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  uploadStep >= 1
                    ? 'bg-brand-success-light dark:bg-forest/20 border-forest/30 text-forest dark:text-forest-light'
                    : 'bg-ivory dark:bg-ivory-dark border-stone dark:border-stone-dark text-ink-muted'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${uploadStep >= 1 ? 'text-forest dark:text-forest-light' : 'opacity-30'}`} />
                  <span className="font-medium">1. Cryptographic SHA-256 Checksum & File Validation</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  uploadStep >= 2
                    ? 'bg-brand-success-light dark:bg-forest/20 border-forest/30 text-forest dark:text-forest-light'
                    : 'bg-ivory dark:bg-ivory-dark border-stone dark:border-stone-dark text-ink-muted'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${uploadStep >= 2 ? 'text-forest dark:text-forest-light' : 'opacity-30'}`} />
                  <span className="font-medium">2. Unstructured Text & Skill Evidence Extraction</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  uploadStep >= 3
                    ? 'bg-brand-success-light dark:bg-forest/20 border-forest/30 text-forest dark:text-forest-light'
                    : 'bg-ivory dark:bg-ivory-dark border-stone dark:border-stone-dark text-ink-muted'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${uploadStep >= 3 ? 'text-forest dark:text-forest-light' : 'opacity-30'}`} />
                  <span className="font-medium">3. Requirement Rubric Matching & Gap Analysis</span>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
                  uploadStep >= 4
                    ? 'bg-brand-success-light dark:bg-forest/20 border-forest/30 text-forest dark:text-forest-light'
                    : 'bg-ivory dark:bg-ivory-dark border-stone dark:border-stone-dark text-ink-muted'
                }`}>
                  <CheckCircle2 className={`w-4 h-4 ${uploadStep >= 4 ? 'text-forest dark:text-forest-light' : 'opacity-30'}`} />
                  <span className="font-medium">4. Match Scoring & Interview Plan Generation</span>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: RESULTS STUDIO SCREEN */}
          {uploadResults && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Batch Success Summary Banner */}
              <div className="p-4 rounded-2xl bg-brand-success-light dark:bg-forest/20 border border-forest/30 text-forest dark:text-forest-light flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-forest text-white flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-serif">Screening Complete</h4>
                    <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark">
                      Successfully processed {uploadResults.filter((r) => r.status === 'success').length} of {uploadResults.length} candidate resumes.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-surface dark:bg-surface-dark border border-forest/30 text-xs font-mono font-bold text-forest dark:text-forest-light">
                  {uploadResults.length} Assessed
                </span>
              </div>

              {/* Candidate Results Cards */}
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {uploadResults.map((res, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark flex items-center justify-between gap-4 transition-all hover:border-forest/40"
                  >
                    <div className="flex items-start gap-3 truncate">
                      <div className="w-10 h-10 rounded-xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light font-serif font-bold text-sm flex items-center justify-center shrink-0 border border-forest/20">
                        {res.fullName ? res.fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2) : 'CV'}
                      </div>
                      <div className="truncate space-y-0.5">
                        <h5 className="font-serif font-bold text-sm text-ink dark:text-ink-dark truncate">
                          {res.fullName || res.filename}
                        </h5>
                        <p className="text-[11px] text-ink-muted dark:text-ink-muted-dark truncate font-mono">
                          {res.filename}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {res.score !== null && res.score !== undefined ? (
                        <div className="text-right">
                          <ScoreGauge score={res.score} size="sm" />
                          <span className="block text-[10px] text-ink-muted dark:text-ink-muted-dark font-mono mt-0.5">
                            Automated Score
                          </span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-stone-light dark:bg-stone-dark text-ink-muted dark:text-ink-muted-dark text-[11px] italic">
                          Awaiting Review
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 border-t border-stone dark:border-stone-dark flex items-center justify-between bg-stone-light/40 dark:bg-stone-dark/30">
          {!uploadResults ? (
            <>
              <div className="text-xs text-ink-muted dark:text-ink-muted-dark font-mono hidden sm:block">
                {selectedFiles.length > 0 ? `${selectedFiles.length} files queued` : 'No files selected'}
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-stone-warm dark:bg-stone-dark text-ink dark:text-ink-dark hover:bg-stone dark:hover:bg-stone-dark/80 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading || selectedFiles.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Evaluating Candidates...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber" />
                      <span>Screen Resumes ({selectedFiles.length})</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setUploadResults(null);
                  setSelectedFiles([]);
                  setUploadStep(0);
                }}
                className="text-xs font-semibold text-forest dark:text-forest-light hover:underline cursor-pointer"
              >
                + Screen More Resumes
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Candidate Pipeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
