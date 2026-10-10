import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Scale,
  UserPlus,
  RefreshCw,
  ShieldCheck,
  Building,
  MapPin,
  Code,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Info,
  UserCheck,
  Check,
  FileText,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { ScoreGauge } from './ScoreGauge';
import { LoadingSkeleton } from './LoadingSkeleton';

interface CandidateDiscoveryViewProps {
  jobId: string;
  jobTitle: string;
  jobLocation?: string;
  requirements?: any[];
  onImportCandidateSuccess?: () => void;
}

export const CandidateDiscoveryView: React.FC<CandidateDiscoveryViewProps> = ({
  jobId,
  jobTitle,
  jobLocation,
  requirements = [],
  onImportCandidateSuccess
}) => {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [latestRun, setLatestRun] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [minScore, setMinScore] = useState<number>(0);
  const [providerFilter, setProviderFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'verified_only'>('all');
  const [savedOnly, setSavedOnly] = useState(false);

  // Comparison
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Candidate Details Modal
  const [selectedCandidateForModal, setSelectedCandidateForModal] = useState<any | null>(null);

  // Import In-Flight
  const [importingId, setImportingId] = useState<string | null>(null);
  const [expandedEvidenceId, setExpandedEvidenceId] = useState<string | null>(null);

  const fetchDiscoveryData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [runsRes, candRes] = await Promise.all([
        api.getCandidateDiscoveryRuns(jobId),
        api.getDiscoveredCandidates(jobId, 0)
      ]);

      if (runsRes.runs && runsRes.runs.length > 0) {
        setLatestRun(runsRes.runs[0]);
      }
      setCandidates(candRes.candidates || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load discovered candidates');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscoveryData();
  }, [jobId]);

  const handleRunDiscovery = async () => {
    setIsRunningDiscovery(true);
    setError('');
    try {
      const res = await api.runCandidateDiscovery(jobId, {
        minScore: 0,
        location: jobLocation
      });
      setLatestRun(res.run);
      setCandidates(res.qualifiedCandidates || []);
    } catch (err: any) {
      setError(err.message || 'Candidate discovery run failed');
    } finally {
      setIsRunningDiscovery(false);
    }
  };

  const handleToggleSave = async (candidate: any) => {
    try {
      if (candidate.isSaved) {
        await api.unsaveDiscoveredCandidate(jobId, candidate.id);
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, isSaved: false } : c));
        if (selectedCandidateForModal?.id === candidate.id) {
          setSelectedCandidateForModal((prev: any) => prev ? { ...prev, isSaved: false } : null);
        }
      } else {
        await api.saveDiscoveredCandidate(jobId, candidate.id);
        setCandidates(prev => prev.map(c => c.id === candidate.id ? { ...c, isSaved: true } : c));
        if (selectedCandidateForModal?.id === candidate.id) {
          setSelectedCandidateForModal((prev: any) => prev ? { ...prev, isSaved: true } : null);
        }
      }
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  };

  const handleImportCandidate = async (candidateId: string) => {
    setImportingId(candidateId);
    try {
      await api.importDiscoveredCandidate(jobId, candidateId);
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, isImported: true } : c));
      if (selectedCandidateForModal?.id === candidateId) {
        setSelectedCandidateForModal((prev: any) => prev ? { ...prev, isImported: true } : null);
      }
      if (onImportCandidateSuccess) {
        onImportCandidateSuccess();
      }
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
    } finally {
      setImportingId(null);
    }
  };

  const handleToggleComparison = (candidateId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length >= 4) {
        alert('You can compare up to 4 candidates simultaneously.');
        return prev;
      }
      return [...prev, candidateId];
    });
  };

  const handleOpenComparisonModal = async () => {
    if (selectedForComparison.length === 0) return;
    setIsComparing(true);
    try {
      const res = await api.compareDiscoveredCandidates(jobId, selectedForComparison);
      setComparisonResult(res);
    } catch (err: any) {
      alert(`Comparison failed: ${err.message}`);
      setIsComparing(false);
    }
  };

  // Client-side filtering
  const filteredCandidates = candidates.filter(c => {
    if (c.relevanceScore < minScore) return false;
    if (savedOnly && !c.isSaved) return false;
    if (providerFilter !== 'all' && c.sourceProvider !== providerFilter) return false;
    if (availabilityFilter === 'verified_only' && (!c.availabilitySignal?.isOpenToWork || c.availabilitySignal?.verificationStatus !== 'verified')) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.fullName?.toLowerCase().includes(q);
      const matchHeadline = c.headline?.toLowerCase().includes(q);
      const matchSkills = (c.skills || []).some((s: string) => s.toLowerCase().includes(q));
      if (!matchName && !matchHeadline && !matchSkills) return false;
    }

    return true;
  });

  if (isLoading) {
    return <LoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Agent Discovery Controls Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Agentic Candidate Sourcing
              </span>
              <span className="text-xs text-ink-muted dark:text-ink-muted-dark">
                Targeting: <strong className="text-ink dark:text-ink-dark font-serif">{jobTitle}</strong>
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-serif font-bold text-ink dark:text-ink-dark">
              Legitimate Public Candidate Discovery
            </h2>
            <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-2xl leading-relaxed">
              Discovers, validates, and screens candidates from legitimate public profiles (GitHub Open Talent, TalentrivoX Opted-in Network) against this job's actual criteria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunDiscovery}
              disabled={isRunningDiscovery}
              className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isRunningDiscovery ? 'animate-spin' : ''}`} />
              {isRunningDiscovery ? 'Agent Sourcing in Progress...' : latestRun ? 'Re-Run Candidate Discovery' : 'Discover Candidates'}
            </button>
          </div>
        </div>

        {/* 2. Diagnostic Exclusion Metrics Bar */}
        {latestRun && (
          <div className="pt-4 border-t border-stone/60 dark:border-stone-dark/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-stone-light/50 dark:bg-stone-dark/40 border border-stone/50 dark:border-stone-dark/50">
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark font-medium block">Total Sourced</span>
              <span className="text-lg font-serif font-bold text-ink dark:text-ink-dark">{latestRun.totalDiscovered || candidates.length}</span>
            </div>

            <div className="p-3 rounded-2xl bg-forest-faint/50 dark:bg-forest/10 border border-forest/20">
              <span className="text-[11px] text-forest dark:text-forest-light font-medium block">Qualified & Available</span>
              <span className="text-lg font-serif font-bold text-forest dark:text-forest-light">
                {candidates.filter(c => c.availabilitySignal?.isOpenToWork).length}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-light/50 dark:bg-stone-dark/40 border border-stone/50 dark:border-stone-dark/50">
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark font-medium block">Candidate Cards Loaded</span>
              <span className="text-lg font-serif font-bold text-ink dark:text-ink-dark">{candidates.length}</span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-light/50 dark:bg-stone-dark/40 border border-stone/50 dark:border-stone-dark/50">
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark font-medium block">Excluded (Mandatory Gap)</span>
              <span className="text-lg font-serif font-bold text-ink dark:text-ink-dark">{latestRun.excludedBreakdown?.missingMandatoryRequirements || 0}</span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-light/50 dark:bg-stone-dark/40 border border-stone/50 dark:border-stone-dark/50">
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark font-medium block">Excluded (&lt; Threshold)</span>
              <span className="text-lg font-serif font-bold text-ink dark:text-ink-dark">{latestRun.excludedBreakdown?.belowRelevanceThreshold || 0}</span>
            </div>

            <div className="p-3 rounded-2xl bg-stone-light/50 dark:bg-stone-dark/40 border border-stone/50 dark:border-stone-dark/50">
              <span className="text-[11px] text-ink-muted dark:text-ink-muted-dark font-medium block">Duplicates Filtered</span>
              <span className="text-lg font-serif font-bold text-ink dark:text-ink-dark">{latestRun.excludedBreakdown?.duplicateRecords || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Filter Controls Bar */}
      <div className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-muted dark:text-ink-muted-dark absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by name, skill, title..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark placeholder-ink-faint dark:placeholder-ink-muted-dark/50"
            />
          </div>

          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
          >
            <option value="all">All Sourcing Providers</option>
            <option value="github_talent">GitHub Open Talent</option>
            <option value="platform_talent">TalentrivoX Opted-In Pool</option>
            <option value="open_talent_network">Authorized Open Network</option>
          </select>

          <select
            value={availabilityFilter}
            onChange={(e: any) => setAvailabilityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl editorial-input text-xs text-ink dark:text-ink-dark bg-surface dark:bg-surface-dark"
          >
            <option value="all">All Sourced Candidates ({candidates.length})</option>
            <option value="verified_only">Verified Open-to-Work Only</option>
          </select>

          <div className="flex items-center gap-2 text-xs text-ink-muted dark:text-ink-muted-dark bg-stone-light/60 dark:bg-stone-dark/60 px-3 py-1.5 rounded-xl">
            <span className="font-semibold">Min Score:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-20 accent-forest"
            />
            <span className="font-mono text-ink dark:text-ink-dark font-bold">{minScore}%</span>
          </div>

          <button
            onClick={() => setSavedOnly(!savedOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              savedOnly
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-stone-light dark:bg-stone-dark text-ink dark:text-ink-dark hover:bg-stone'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" /> Saved ({candidates.filter(c => c.isSaved).length})
          </button>
        </div>

        {selectedForComparison.length > 0 && (
          <button
            onClick={handleOpenComparisonModal}
            className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Scale className="w-3.5 h-3.5" /> Compare ({selectedForComparison.length}) Discovered Candidates
          </button>
        )}
      </div>

      {/* 4. Discovered Candidate Cards List */}
      {filteredCandidates.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-serif font-bold text-base text-ink dark:text-ink-dark">
            {candidates.length === 0 ? 'No Discovered Candidates Yet' : 'No Candidates Match Your Current Filters'}
          </h3>
          <p className="text-xs text-ink-muted dark:text-ink-muted-dark max-w-md mx-auto leading-relaxed">
            {candidates.length === 0
              ? 'Click "Discover Candidates" above to let the agent search public developer directories and evaluate candidates against your requirements.'
              : `Found ${candidates.length} total candidates for this job. Lower the minimum score slider (${minScore}%) or change filters to view their details.`}
          </p>
          {candidates.length === 0 ? (
            <button
              onClick={handleRunDiscovery}
              disabled={isRunningDiscovery}
              className="mt-2 px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-hover transition-colors cursor-pointer"
            >
              {isRunningDiscovery ? 'Searching...' : 'Run Discovery Now'}
            </button>
          ) : (
            <button
              onClick={() => {
                setMinScore(0);
                setProviderFilter('all');
                setAvailabilityFilter('all');
                setSearchQuery('');
                setSavedOnly(false);
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone text-ink dark:text-ink-dark text-xs font-semibold transition-colors"
            >
              Reset Filters to View All ({candidates.length}) Candidates
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredCandidates.map((candidate) => {
            const isComparingThis = selectedForComparison.includes(candidate.id);
            const isEvidenceExpanded = expandedEvidenceId === candidate.id;
            const isVerifiedOpen = candidate.availabilitySignal?.isOpenToWork && candidate.availabilitySignal?.verificationStatus === 'verified';

            // Get initials
            const nameParts = (candidate.fullName || 'Candidate').split(' ');
            const initials = nameParts.length >= 2 
              ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
              : (candidate.fullName || 'C').substring(0, 2).toUpperCase();

            return (
              <div
                key={candidate.id}
                className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark hover:border-forest/50 dark:hover:border-forest/50 transition-all shadow-xs space-y-4"
              >
                {/* Top Row: Avatar, Info, Badges, Score */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Avatar Badge */}
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-light to-forest text-white flex items-center justify-center font-serif font-bold text-base shadow-xs shrink-0">
                      {initials}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-ink dark:text-ink-dark">
                          {candidate.fullName}
                        </h3>

                        {/* Availability Status Badge */}
                        {isVerifiedOpen ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1" title={candidate.availabilitySignal?.signalEvidence}>
                            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Verified Open to Work
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-light dark:bg-stone-dark text-ink-muted dark:text-ink-muted-dark border border-stone dark:border-stone-dark flex items-center gap-1">
                            <Info className="w-3 h-3" />
                            Public Profile
                          </span>
                        )}

                        {/* Provider Badge */}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-light dark:bg-stone-dark text-ink-muted dark:text-ink-muted-dark">
                          {candidate.sourceLabel}
                        </span>
                      </div>

                      <p className="text-xs text-ink-light dark:text-ink-light-dark font-medium">
                        {candidate.headline}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted dark:text-ink-muted-dark pt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-ink-muted" /> {candidate.location} ({candidate.workArrangement})
                        </span>
                        {candidate.experienceYears !== undefined && candidate.experienceYears !== null && (
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5 text-ink-muted" /> ~{candidate.experienceYears} Years Exp
                          </span>
                        )}
                        {candidate.discoveredAt && (
                          <span className="text-[11px] text-ink-faint">
                            • Sourced: {new Date(candidate.discoveredAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Score & Evaluation Gauge */}
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Relevance</span>
                      <span className="text-xs font-bold text-forest dark:text-forest-light capitalize">
                        {candidate.matchRating} Fit
                      </span>
                    </div>
                    <ScoreGauge score={candidate.relevanceScore} size="md" />
                  </div>
                </div>

                {/* Match Explanation Text */}
                <div className="p-3.5 rounded-2xl bg-stone-light/40 dark:bg-stone-dark/30 border border-stone/50 dark:border-stone-dark/50 text-xs text-ink dark:text-ink-dark space-y-1">
                  <div className="font-semibold text-[11px] text-ink-muted dark:text-ink-muted-dark flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-forest" /> AI Sourcing Evaluation:
                  </div>
                  <p className="leading-relaxed">{candidate.matchExplanation}</p>
                </div>

                {/* Experience & Projects Summary */}
                {(candidate.experienceSummary || candidate.projectsSummary) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {candidate.experienceSummary && (
                      <div className="p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-stone/60 dark:border-stone-dark/60 space-y-1">
                        <span className="text-[11px] font-bold text-ink-muted dark:text-ink-muted-dark block">Professional Summary & Background:</span>
                        <p className="text-ink dark:text-ink-dark leading-relaxed">{candidate.experienceSummary}</p>
                      </div>
                    )}
                    {candidate.projectsSummary && (
                      <div className="p-3 rounded-2xl bg-surface dark:bg-surface-dark border border-stone/60 dark:border-stone-dark/60 space-y-1">
                        <span className="text-[11px] font-bold text-ink-muted dark:text-ink-muted-dark block">Portfolio & Public Repositories:</span>
                        <p className="text-ink dark:text-ink-dark leading-relaxed">{candidate.projectsSummary}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills Row */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-ink-muted mr-1">Matched Skills:</span>
                    {candidate.matchedSkills && candidate.matchedSkills.map((s: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light border border-forest/20 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" /> {s}
                      </span>
                    ))}
                    {candidate.preferredSkillsMatched && candidate.preferredSkillsMatched.map((s: string, idx: number) => (
                      <span
                        key={`pref_${idx}`}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-stone-light dark:bg-stone-dark text-ink dark:text-ink-dark"
                      >
                        + {s}
                      </span>
                    ))}
                    {(!candidate.matchedSkills || candidate.matchedSkills.length === 0) && (candidate.skills || []).map((s: string, idx: number) => (
                      <span
                        key={`skill_${idx}`}
                        className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-stone-light dark:bg-stone-dark text-ink dark:text-ink-dark"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {candidate.missingRequirements && candidate.missingRequirements.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mr-1">Unverified in Public Profile:</span>
                      {candidate.missingRequirements.map((mr: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/30"
                        >
                          {mr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Expandable Traceable Evidence */}
                {isEvidenceExpanded && (
                  <div className="p-3.5 rounded-2xl bg-stone-light/60 dark:bg-stone-dark/50 border border-stone dark:border-stone-dark text-xs space-y-2 animate-in fade-in">
                    <div className="font-semibold text-ink dark:text-ink-dark flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-forest" /> Traceable Sourcing Evidence & Provenance:
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-ink-muted dark:text-ink-muted-dark">
                      {(candidate.evidenceSnippets || []).map((snip: string, i: number) => (
                        <li key={i}>{snip}</li>
                      ))}
                      <li>Availability Verification: {candidate.availabilitySignal?.signalEvidence}</li>
                      <li>Evaluation Type: {candidate.evaluationType === 'full_resume_evaluation' ? 'Full Resume Extraction' : 'Verified Public Profile & Repositories'}</li>
                    </ul>
                  </div>
                )}

                {/* Bottom Action Footer */}
                <div className="pt-3 border-t border-stone/50 dark:border-stone-dark/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* View Full Profile Modal Button */}
                    <button
                      onClick={() => setSelectedCandidateForModal(candidate)}
                      className="px-3.5 py-1.5 rounded-xl bg-forest-faint dark:bg-forest/20 hover:bg-forest-light dark:hover:bg-forest/30 text-forest dark:text-forest-light text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-forest/20"
                    >
                      <Eye className="w-3.5 h-3.5" /> Full Profile & Resume
                    </button>

                    {/* View External Profile Link */}
                    {candidate.canonicalProfileUrl && (
                      <a
                        href={candidate.canonicalProfileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-forest" /> View Public Profile
                      </a>
                    )}

                    {/* Evidence Toggle */}
                    <button
                      onClick={() => setExpandedEvidenceId(isEvidenceExpanded ? null : candidate.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-ink-muted dark:text-ink-muted-dark hover:text-ink flex items-center gap-1 cursor-pointer"
                    >
                      {isEvidenceExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isEvidenceExpanded ? 'Hide Traceable Evidence' : 'Show Sourcing Evidence'}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Compare Checkbox */}
                    <button
                      onClick={() => handleToggleComparison(candidate.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isComparingThis
                          ? 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light border border-forest/30'
                          : 'bg-stone-light dark:bg-stone-dark text-ink dark:text-ink-dark hover:bg-stone'
                      }`}
                    >
                      <Scale className="w-3.5 h-3.5" /> {isComparingThis ? 'Selected for Compare' : 'Compare'}
                    </button>

                    {/* Bookmark / Save */}
                    <button
                      onClick={() => handleToggleSave(candidate)}
                      className="p-2 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone text-ink dark:text-ink-dark transition-colors cursor-pointer"
                      title={candidate.isSaved ? 'Unsave candidate' : 'Save candidate'}
                    >
                      {candidate.isSaved ? (
                        <BookmarkCheck className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Bookmark className="w-4 h-4 text-ink-muted" />
                      )}
                    </button>

                    {/* Import to Job Pipeline */}
                    <button
                      onClick={() => handleImportCandidate(candidate.id)}
                      disabled={candidate.isImported || importingId === candidate.id}
                      className={`px-4 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                        candidate.isImported
                          ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 cursor-default'
                          : 'bg-forest hover:bg-forest-hover text-white'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      {candidate.isImported ? 'Imported to Pipeline' : importingId === candidate.id ? 'Importing...' : 'Import to Candidates'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Full Profile & Resume Details Modal */}
      {selectedCandidateForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl max-h-[90vh] bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-stone dark:border-stone-dark flex items-start justify-between gap-4 bg-stone-light/30 dark:bg-stone-dark/30">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-forest-light to-forest text-white flex items-center justify-center font-serif font-bold text-xl shadow-xs shrink-0">
                  {selectedCandidateForModal.fullName?.substring(0, 2).toUpperCase() || 'CD'}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-serif text-xl font-bold text-ink dark:text-ink-dark">
                      {selectedCandidateForModal.fullName}
                    </h2>
                    {selectedCandidateForModal.availabilitySignal?.isOpenToWork && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Verified Open to Work
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-light dark:bg-stone-dark text-ink-muted dark:text-ink-muted-dark">
                      {selectedCandidateForModal.sourceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-ink-light dark:text-ink-light-dark font-medium">
                    {selectedCandidateForModal.headline}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted dark:text-ink-muted-dark">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-ink-muted" /> {selectedCandidateForModal.location} ({selectedCandidateForModal.workArrangement})
                    </span>
                    {selectedCandidateForModal.experienceYears !== undefined && selectedCandidateForModal.experienceYears !== null && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-ink-muted" /> ~{selectedCandidateForModal.experienceYears} Years Exp
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ScoreGauge score={selectedCandidateForModal.relevanceScore} size="md" />
                <button
                  onClick={() => setSelectedCandidateForModal(null)}
                  className="p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-ink-dark hover:bg-stone-light dark:hover:bg-stone-dark transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* AI Evaluation */}
              <div className="p-4 rounded-2xl bg-forest-faint dark:bg-forest/20 border border-forest/20 space-y-1">
                <div className="font-semibold text-forest dark:text-forest-light flex items-center gap-1.5 text-xs">
                  <Sparkles className="w-4 h-4" /> AI Candidate Evaluation for "{jobTitle}":
                </div>
                <p className="text-ink dark:text-ink-dark leading-relaxed">
                  {selectedCandidateForModal.matchExplanation}
                </p>
              </div>

              {/* Matched & Extracted Skills */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-ink dark:text-ink-dark flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-forest" /> Technical Skills & Competencies
                </h4>
                <div className="flex flex-wrap items-center gap-2">
                  {(selectedCandidateForModal.skills || []).map((s: string, idx: number) => {
                    const isMatched = (selectedCandidateForModal.matchedSkills || []).includes(s);
                    return (
                      <span
                        key={idx}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                          isMatched
                            ? 'bg-forest-faint dark:bg-forest/20 text-forest dark:text-forest-light border border-forest/30'
                            : 'bg-stone-light dark:bg-stone-dark text-ink dark:text-ink-dark border border-stone/50'
                        }`}
                      >
                        {isMatched && <CheckCircle2 className="w-3 h-3" />}
                        {s}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Experience Details */}
              {selectedCandidateForModal.experienceSummary && (
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-sm text-ink dark:text-ink-dark flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4 text-forest" /> Professional Background & Experience
                  </h4>
                  <div className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark leading-relaxed text-ink dark:text-ink-dark">
                    {selectedCandidateForModal.experienceSummary}
                  </div>
                </div>
              )}

              {/* Portfolio & Projects */}
              {selectedCandidateForModal.projectsSummary && (
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-sm text-ink dark:text-ink-dark flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-forest" /> Portfolio, Projects & Repositories
                  </h4>
                  <div className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark leading-relaxed text-ink dark:text-ink-dark">
                    {selectedCandidateForModal.projectsSummary}
                  </div>
                </div>
              )}

              {/* Education & Credentials */}
              {selectedCandidateForModal.educationSummary && (
                <div className="space-y-2">
                  <h4 className="font-serif font-bold text-sm text-ink dark:text-ink-dark flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-forest" /> Education & Credentials
                  </h4>
                  <div className="p-4 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark leading-relaxed text-ink dark:text-ink-dark">
                    {selectedCandidateForModal.educationSummary}
                  </div>
                </div>
              )}

              {/* Provenance & Sourcing Evidence */}
              <div className="p-4 rounded-2xl bg-stone-light/50 dark:bg-stone-dark/40 border border-stone dark:border-stone-dark space-y-2">
                <div className="font-semibold text-ink dark:text-ink-dark flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-forest" /> Sourcing Provenance & Evidence Verification
                </div>
                <ul className="list-disc pl-5 space-y-1 text-ink-muted dark:text-ink-muted-dark">
                  {(selectedCandidateForModal.evidenceSnippets || []).map((snip: string, i: number) => (
                    <li key={i}>{snip}</li>
                  ))}
                  <li>Availability Signal: {selectedCandidateForModal.availabilitySignal?.signalEvidence}</li>
                  <li>Sourced Time: {new Date(selectedCandidateForModal.discoveredAt).toLocaleString()}</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone dark:border-stone-dark bg-stone-light/30 dark:bg-stone-dark/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {selectedCandidateForModal.canonicalProfileUrl && (
                  <a
                    href={selectedCandidateForModal.canonicalProfileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-forest" /> Open External Profile
                  </a>
                )}
                <button
                  onClick={() => handleToggleSave(selectedCandidateForModal)}
                  className="px-3.5 py-2 rounded-xl bg-stone-light dark:bg-stone-dark hover:bg-stone text-ink dark:text-ink-dark text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  {selectedCandidateForModal.isSaved ? (
                    <>
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-500" /> Saved
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-3.5 h-3.5 text-ink-muted" /> Bookmark
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCandidateForModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink dark:hover:text-ink-dark"
                >
                  Close
                </button>
                <button
                  onClick={() => handleImportCandidate(selectedCandidateForModal.id)}
                  disabled={selectedCandidateForModal.isImported || importingId === selectedCandidateForModal.id}
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    selectedCandidateForModal.isImported
                      ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 cursor-default'
                      : 'bg-forest hover:bg-forest-hover text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {selectedCandidateForModal.isImported ? 'Imported to Candidates' : importingId === selectedCandidateForModal.id ? 'Importing...' : 'Import to Candidate Pipeline'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Side-by-Side Candidate Comparison Modal */}
      {isComparing && comparisonResult && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[85vh] bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-3xl shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-stone dark:border-stone-dark flex items-center justify-between">
              <div>
                <h3 className="font-serif text-xl font-bold text-ink dark:text-ink-dark">
                  Candidate Comparison Matrix
                </h3>
                <p className="text-xs text-ink-muted dark:text-ink-muted-dark">
                  Evaluating {comparisonResult.candidates?.length} candidates for <strong>{jobTitle}</strong>
                </p>
              </div>
              <button
                onClick={() => {
                  setIsComparing(false);
                  setComparisonResult(null);
                }}
                className="p-2 rounded-xl text-ink-muted hover:text-ink dark:hover:text-ink-dark hover:bg-stone-light dark:hover:bg-stone-dark"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Recommendation Summary */}
              {comparisonResult.recommendationSummary && (
                <div className="p-4 rounded-2xl bg-forest-faint dark:bg-forest/20 border border-forest/20 text-xs text-forest dark:text-forest-light font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  {comparisonResult.recommendationSummary}
                </div>
              )}

              {/* Comparison Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone dark:border-stone-dark text-ink-muted dark:text-ink-muted-dark">
                      <th className="py-3 px-4 font-bold">Criterion</th>
                      {comparisonResult.candidates?.map((c: any) => (
                        <th key={c.id} className="py-3 px-4 font-serif font-bold text-ink dark:text-ink-dark">
                          {c.fullName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonResult.comparisonMatrix?.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-stone/60 dark:border-stone-dark/60">
                        <td className="py-3 px-4 font-semibold text-ink-muted dark:text-ink-muted-dark">
                          {row.criterion}
                        </td>
                        {comparisonResult.candidates?.map((c: any) => (
                          <td key={c.id} className="py-3 px-4 font-medium text-ink dark:text-ink-dark">
                            {row.scores[c.id]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-stone dark:border-stone-dark bg-stone-light/30 dark:bg-stone-dark/30 flex justify-end">
              <button
                onClick={() => {
                  setIsComparing(false);
                  setComparisonResult(null);
                }}
                className="px-5 py-2 rounded-xl bg-forest text-white text-xs font-semibold hover:bg-forest-hover"
              >
                Close Comparison
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
