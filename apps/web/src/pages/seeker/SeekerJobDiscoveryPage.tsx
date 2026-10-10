import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Briefcase,
  Globe,
  Sparkles,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ExternalLink,
  SlidersHorizontal,
  ArrowUpRight,
  Clock,
  Building2,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Kanban,
  Check,
  X,
  Compass,
  FileText,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { api } from '../../services/api';
import {
  DiscoveredJob,
  JobSearchPreferences,
  ProviderExecutionStatus,
  PlatformFallbackLink
} from '@avengercoders/shared';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';

export const SeekerJobDiscoveryPage: React.FC = () => {
  const navigate = useNavigate();

  // Active Tab Mode
  const [activeTab, setActiveTab] = useState<'discover' | 'recommended' | 'saved' | 'preferences'>('discover');

  // Search State
  const [queryRole, setQueryRole] = useState('Full Stack Engineer');
  const [queryLocation, setQueryLocation] = useState('');
  const [workplaceType, setWorkplaceType] = useState<'all' | 'remote' | 'hybrid' | 'onsite'>('all');
  const [employmentType, setEmploymentType] = useState<'all' | 'full-time' | 'contract' | 'internship'>('all');
  const [experienceLevel, setExperienceLevel] = useState<'all' | 'entry' | 'mid' | 'senior' | 'lead'>('all');
  const [sortBy, setSortBy] = useState<'relevance' | 'match_score' | 'date' | 'salary'>('match_score');

  // Resumes & Active Profile
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Results State
  const [jobs, setJobs] = useState<DiscoveredJob[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<DiscoveredJob[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<ProviderExecutionStatus[]>([]);
  const [platformLinks, setPlatformLinks] = useState<PlatformFallbackLink[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Preferences State
  const [preferences, setPreferences] = useState<JobSearchPreferences | null>(null);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [prefsSavedNotice, setPrefsSavedNotice] = useState(false);

  // Application Tracker Modal State
  const [trackingJob, setTrackingJob] = useState<DiscoveredJob | null>(null);
  const [selectedAppStatus, setSelectedAppStatus] = useState<string>('applied');
  const [appNotes, setAppNotes] = useState<string>('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appSuccessNotice, setAppSuccessNotice] = useState<string | null>(null);

  // Quick Location Chips
  const popularLocations = [
    { label: 'Remote Worldwide', value: 'Remote', workplace: 'remote' as const },
    { label: 'Bangalore, IN', value: 'Bangalore', workplace: 'all' as const },
    { label: 'San Francisco, US', value: 'San Francisco', workplace: 'all' as const },
    { label: 'London, UK', value: 'London', workplace: 'all' as const },
    { label: 'Hyderabad, IN', value: 'Hyderabad', workplace: 'all' as const },
    { label: 'New York, US', value: 'New York', workplace: 'all' as const },
    { label: 'Berlin, DE', value: 'Berlin', workplace: 'all' as const },
    { label: 'Singapore', value: 'Singapore', workplace: 'all' as const }
  ];

  // Quick Tech Roles
  const popularRoles = [
    'Full Stack Engineer',
    'React Developer',
    'Node.js Architect',
    'TypeScript Developer',
    'Frontend Engineer',
    'Backend Engineer',
    'DevOps / Cloud Engineer',
    'Python AI Engineer'
  ];

  // Initial Data Fetch
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitialLoading(true);
        const [resumesRes, prefsRes, savedRes] = await Promise.all([
          api.getSeekerResumes(),
          api.getSearchPreferences(),
          api.getSeekerSavedJobs()
        ]);

        setResumes(resumesRes.resumes || []);
        const active = resumesRes.resumes?.find((r: any) => r.isActive) || resumesRes.resumes?.[0];
        
        let initialRole = 'Full Stack Engineer';
        let initialLocation = '';
        let initialWorkplace: 'all' | 'remote' | 'hybrid' | 'onsite' = 'all';

        if (active) {
          setSelectedResumeId(active.id);
          if (active.parsedData?.skills?.[0]) {
            initialRole = `${active.parsedData.skills[0]} Developer`;
            setQueryRole(initialRole);
          }
        }

        if (prefsRes?.preferences) {
          setPreferences(prefsRes.preferences);
          if (prefsRes.preferences.targetJobTitles?.[0]) {
            initialRole = prefsRes.preferences.targetJobTitles[0];
            setQueryRole(initialRole);
          }
          if (prefsRes.preferences.preferredLocations?.[0]) {
            initialLocation = prefsRes.preferences.preferredLocations[0];
            setQueryLocation(initialLocation);
          }
          if (prefsRes.preferences.isRemoteOnly) {
            initialWorkplace = 'remote';
            setWorkplaceType('remote');
          }
        }

        setSavedJobs(savedRes.savedJobs || []);

        // Trigger initial discovery
        await executeSearch({
          role: initialRole,
          location: initialLocation,
          workplaceType: initialWorkplace,
          resumeId: active?.id
        });
      } catch (err: any) {
        console.error('Failed to initialize job discovery page', err);
        setErrorNotice('Using standard discovery network parameters.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    initialize();
  }, []);

  // Execute Real Search
  const executeSearch = async (overrides?: {
    role?: string;
    location?: string;
    workplaceType?: 'all' | 'remote' | 'hybrid' | 'onsite';
    employmentType?: 'all' | 'full-time' | 'contract' | 'internship';
    experienceLevel?: 'all' | 'entry' | 'mid' | 'senior' | 'lead';
    sortBy?: 'relevance' | 'match_score' | 'date' | 'salary';
    resumeId?: string;
  }) => {
    try {
      setIsSearching(true);
      setErrorNotice(null);

      const targetRole = overrides?.role !== undefined ? overrides.role : queryRole;
      const targetLocation = overrides?.location !== undefined ? overrides.location : queryLocation;
      const targetWorkplace = overrides?.workplaceType !== undefined ? overrides.workplaceType : workplaceType;
      const targetEmployment = overrides?.employmentType !== undefined ? overrides.employmentType : employmentType;
      const targetExperience = overrides?.experienceLevel !== undefined ? overrides.experienceLevel : experienceLevel;
      const targetSort = overrides?.sortBy !== undefined ? overrides.sortBy : sortBy;
      const targetResumeId = overrides?.resumeId !== undefined ? overrides.resumeId : selectedResumeId;

      const payload = {
        role: targetRole,
        query: targetRole,
        location: targetLocation,
        workplaceType: targetWorkplace,
        employmentType: targetEmployment,
        experienceLevel: targetExperience,
        sortBy: targetSort,
        resumeId: targetResumeId,
        page: 1,
        limit: 30,
        useResumeProfile: true
      };

      const [searchRes, linksRes] = await Promise.all([
        api.discoverJobs(payload),
        api.getPlatformLinks({
          role: targetRole,
          location: targetLocation,
          workplaceType: targetWorkplace
        })
      ]);

      setJobs(searchRes.jobs || []);
      setTotalFound(searchRes.totalFound || (searchRes.jobs || []).length);
      setProviderStatuses(searchRes.providerStatuses || []);
      setPlatformLinks(linksRes.links || searchRes.platformFallbackLinks || []);

      if (activeTab === 'recommended' || recommendedJobs.length === 0) {
        setRecommendedJobs((searchRes.jobs || []).filter((j: DiscoveredJob) => j.matchScore >= 70));
      }
    } catch (err: any) {
      console.error('Job discovery failed', err);
      setErrorNotice('Search encountered a problem with external providers. You can still use the direct platform links below.');
    } finally {
      setIsSearching(false);
    }
  };

  // Quick Location Chip Click
  const handleSelectLocationChip = (loc: { label: string; value: string; workplace: 'all' | 'remote' }) => {
    setQueryLocation(loc.value);
    setWorkplaceType(loc.workplace);
    executeSearch({ location: loc.value, workplaceType: loc.workplace });
  };

  // Quick Role Chip Click
  const handleSelectRoleChip = (role: string) => {
    setQueryRole(role);
    executeSearch({ role });
  };

  // Clear All Filters
  const handleClearAllFilters = () => {
    setQueryRole('Software Engineer');
    setQueryLocation('');
    setWorkplaceType('all');
    setEmploymentType('all');
    setExperienceLevel('all');
    setSortBy('match_score');
    executeSearch({
      role: 'Software Engineer',
      location: '',
      workplaceType: 'all',
      employmentType: 'all',
      experienceLevel: 'all',
      sortBy: 'match_score'
    });
  };

  // Save Discovered Job
  const handleSaveJob = async (job: DiscoveredJob) => {
    try {
      await api.saveDiscoveredJob({ job });
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id || j.externalJobId === job.externalJobId ? { ...j, isSaved: true } : j))
      );
      setRecommendedJobs((prev) =>
        prev.map((j) => (j.id === job.id || j.externalJobId === job.externalJobId ? { ...j, isSaved: true } : j))
      );

      const savedRes = await api.getSeekerSavedJobs();
      setSavedJobs(savedRes.savedJobs || []);
    } catch (err) {
      console.error('Failed to save job', err);
    }
  };

  // Track Application Submission
  const handleOpenTrackingModal = (job: DiscoveredJob) => {
    setTrackingJob(job);
    setSelectedAppStatus('applied');
    setAppNotes('');
    setAppSuccessNotice(null);
  };

  const handleConfirmTracking = async () => {
    if (!trackingJob) return;
    try {
      setIsSubmittingApp(true);
      await api.trackDiscoveredApplication({
        job: trackingJob,
        status: selectedAppStatus,
        resumeId: selectedResumeId,
        notes: appNotes
      });

      setJobs((prev) =>
        prev.map((j) =>
          j.id === trackingJob.id || j.externalJobId === trackingJob.externalJobId
            ? { ...j, isApplied: true, applicationStatus: selectedAppStatus as any }
            : j
        )
      );

      setAppSuccessNotice(`Job logged in Application Tracker as '${selectedAppStatus}'!`);
      setTimeout(() => {
        setTrackingJob(null);
        setAppSuccessNotice(null);
      }, 1400);
    } catch (err) {
      console.error('Failed to record application', err);
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Save Search Preferences
  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    try {
      setIsSavingPrefs(true);
      const res = await api.updateSearchPreferences(preferences);
      setPreferences(res.preferences);
      setPrefsSavedNotice(true);
      setTimeout(() => setPrefsSavedNotice(false), 3000);
    } catch (err) {
      console.error('Failed to save preferences', err);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  if (isInitialLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  const activeResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];
  const hasActiveFilters =
    queryLocation !== '' ||
    workplaceType !== 'all' ||
    employmentType !== 'all' ||
    experienceLevel !== 'all' ||
    queryRole !== 'Software Engineer';

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 py-6 pb-20">
      {/* 1. Header & Flagship Banner */}
      <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-96 h-64 bg-forest/5 dark:bg-forest/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-forest text-white shadow-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Flagship AI Job Discovery</span>
            </span>
            <span className="text-xs text-ink-light dark:text-ink-dark-secondary font-medium">
              • Live Multi-Source Job Matching Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-ink dark:text-ink-dark tracking-tight">
            Discover Real-World Jobs Tailored to Your Resume
          </h1>
          <p className="text-xs md:text-sm text-ink-light dark:text-ink-dark-secondary leading-relaxed">
            Real-time tech opportunities evaluated against your indexed skills, experience, and preferred location with direct genuine application links.
          </p>
        </div>

        {/* Active Resume Context Selector */}
        <div className="z-10 bg-ivory dark:bg-ivory-dark p-5 rounded-2xl border border-stone dark:border-stone-dark min-w-[280px] space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
              Matching Resume Profile:
            </label>
            <span className="text-[10px] font-bold text-forest dark:text-emerald-400">
              {activeResume?.parsedData?.skills?.length || 0} skills indexed
            </span>
          </div>
          <select
            value={selectedResumeId}
            onChange={(e) => {
              setSelectedResumeId(e.target.value);
              executeSearch({ resumeId: e.target.value });
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.versionLabel} ({r.fileName})
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[11px] text-ink-muted dark:text-ink-dark-muted pt-1">
            <span className="truncate max-w-[170px] font-medium">{activeResume?.parsedData?.fullName || 'Active Profile'}</span>
            <Link to="/app/seeker/resumes" className="text-forest dark:text-emerald-400 font-semibold hover:underline">
              Resume Vault &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Mode Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone dark:border-stone-dark pb-2">
        <div className="flex flex-wrap rounded-2xl bg-ivory dark:bg-ivory-dark p-1.5 border border-stone dark:border-stone-dark gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'discover'
                ? 'bg-forest text-white shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Discover Live Jobs ({jobs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('recommended');
              if (recommendedJobs.length === 0) executeSearch();
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'recommended'
                ? 'bg-forest text-white shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Recommended for You ({recommendedJobs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'saved'
                ? 'bg-forest text-white shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Saved Jobs ({savedJobs.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'preferences'
                ? 'bg-forest text-white shadow-xs'
                : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Search Preferences</span>
          </button>
        </div>

        <Link
          to="/app/seeker/applications"
          className="px-4 py-2 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark flex items-center gap-2 transition-colors shadow-2xs"
        >
          <Kanban className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
          <span>Application Tracker</span>
        </Link>
      </div>

      {/* 3. Live Providers Transparency Banner */}
      <div className="p-3.5 rounded-2xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-ink dark:text-ink-dark">Active Live Sources:</span>
          <div className="flex flex-wrap items-center gap-2">
            {providerStatuses.map((p, idx) => (
              <span
                key={idx}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                  p.status === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : p.status === 'missing_credentials'
                    ? 'bg-stone-warm dark:bg-stone-dark text-ink-muted dark:text-ink-dark-muted border-stone dark:border-stone-dark'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                }`}
              >
                {p.providerLabel}: {p.status === 'success' ? `${p.resultCount} active` : p.status === 'missing_credentials' ? 'Config Available' : p.status}
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => executeSearch()}
          disabled={isSearching}
          className="text-[11px] font-semibold text-forest dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isSearching ? 'animate-spin' : ''}`} />
          <span>Refresh Live Opportunities</span>
        </button>
      </div>

      {/* 4. Tab 1: Discover Live Jobs */}
      {activeTab === 'discover' && (
        <div className="space-y-6">
          {/* Enhanced Search & Filter Center */}
          <div className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-5">
            {/* Primary Search Inputs (Role, Location, Search Action) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Role Query Input */}
              <div className="md:col-span-6 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1.5">
                  Target Role or Keywords
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-ink-muted dark:text-ink-dark-muted" />
                  <input
                    type="text"
                    value={queryRole}
                    onChange={(e) => setQueryRole(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                    placeholder="e.g. Full Stack Engineer, React Developer, Node.js..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl editorial-input text-xs font-semibold text-ink dark:text-ink-dark"
                  />
                  {queryRole && (
                    <button
                      type="button"
                      onClick={() => {
                        setQueryRole('');
                      }}
                      className="absolute right-3 top-2.5 text-ink-muted hover:text-ink p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Location Query Input */}
              <div className="md:col-span-4 relative">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1.5">
                  City, Region or "Remote"
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-3 text-ink-muted dark:text-ink-dark-muted" />
                  <input
                    type="text"
                    value={queryLocation}
                    onChange={(e) => setQueryLocation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && executeSearch()}
                    placeholder="e.g. Remote, Bangalore, San Francisco, London..."
                    className="w-full pl-10 pr-8 py-2.5 rounded-xl editorial-input text-xs font-semibold text-ink dark:text-ink-dark"
                  />
                  {queryLocation && (
                    <button
                      type="button"
                      onClick={() => {
                        setQueryLocation('');
                        executeSearch({ location: '' });
                      }}
                      className="absolute right-3 top-2.5 text-ink-muted hover:text-ink p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Trigger Button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  type="button"
                  onClick={() => executeSearch()}
                  disabled={isSearching}
                  className="w-full h-[42px] px-4 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Search className={`w-4 h-4 ${isSearching ? 'animate-spin' : ''}`} />
                  <span>{isSearching ? 'Searching...' : 'Search Jobs'}</span>
                </button>
              </div>
            </div>

            {/* Quick Location Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                Quick Location Presets:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {popularLocations.map((loc) => {
                  const isSelected = queryLocation.toLowerCase() === loc.value.toLowerCase();
                  return (
                    <button
                      key={loc.value}
                      type="button"
                      onClick={() => handleSelectLocationChip(loc)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-forest text-white border-forest shadow-xs'
                          : 'bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border-stone dark:border-stone-dark hover:border-forest/40 hover:text-ink dark:hover:text-ink-dark'
                      }`}
                    >
                      <span>{loc.label}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filter Pill Controls (Workplace, Experience, Employment, Sort) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-stone dark:border-stone-dark text-xs">
              {/* Workplace Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Workplace Mode:
                </label>
                <div className="flex rounded-xl bg-ivory dark:bg-ivory-dark p-1 border border-stone dark:border-stone-dark">
                  {(['all', 'remote', 'hybrid', 'onsite'] as const).map((wt) => (
                    <button
                      key={wt}
                      type="button"
                      onClick={() => {
                        setWorkplaceType(wt);
                        executeSearch({ workplaceType: wt });
                      }}
                      className={`flex-1 py-1.5 text-[11px] font-semibold capitalize rounded-lg transition-all cursor-pointer text-center ${
                        workplaceType === wt
                          ? 'bg-forest text-white shadow-2xs'
                          : 'text-ink-muted dark:text-ink-dark-muted hover:text-ink dark:hover:text-ink-dark'
                      }`}
                    >
                      {wt === 'all' ? 'All' : wt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Seniority Level:
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => {
                    const newExp = e.target.value as any;
                    setExperienceLevel(newExp);
                    executeSearch({ experienceLevel: newExp });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none cursor-pointer"
                >
                  <option value="all">All Seniority Levels</option>
                  <option value="entry">Entry Level (0 - 2 yrs)</option>
                  <option value="mid">Mid Level (2 - 5 yrs)</option>
                  <option value="senior">Senior Level (5+ yrs)</option>
                  <option value="lead">Lead / Principal (8+ yrs)</option>
                </select>
              </div>

              {/* Employment Type Filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Employment Type:
                </label>
                <select
                  value={employmentType}
                  onChange={(e) => {
                    const newEmp = e.target.value as any;
                    setEmploymentType(newEmp);
                    executeSearch({ employmentType: newEmp });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none cursor-pointer"
                >
                  <option value="all">All Employment Types</option>
                  <option value="full-time">Full-Time</option>
                  <option value="contract">Contract / Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              {/* Sorting */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Sort Opportunities:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    const newSort = e.target.value as any;
                    setSortBy(newSort);
                    executeSearch({ sortBy: newSort });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none cursor-pointer"
                >
                  <option value="match_score">Highest Match Score</option>
                  <option value="date">Date Posted (Newest)</option>
                  <option value="salary">Salary (Highest First)</option>
                  <option value="relevance">Relevance</option>
                </select>
              </div>
            </div>

            {/* Active Filter Badges & Reset */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone dark:border-stone-dark text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase text-ink-muted dark:text-ink-dark-muted mr-1">
                    Active Filters:
                  </span>
                  {queryRole && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 font-semibold text-[11px] border border-forest/20 flex items-center gap-1">
                      Role: {queryRole}
                    </span>
                  )}
                  {queryLocation && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      Location: {queryLocation}
                      <button
                        type="button"
                        onClick={() => {
                          setQueryLocation('');
                          executeSearch({ location: '' });
                        }}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {workplaceType !== 'all' && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-stone-warm dark:bg-stone-dark text-ink dark:text-ink-dark font-semibold text-[11px] border border-stone dark:border-stone-dark capitalize flex items-center gap-1">
                      Workplace: {workplaceType}
                      <button
                        type="button"
                        onClick={() => {
                          setWorkplaceType('all');
                          executeSearch({ workplaceType: 'all' });
                        }}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {experienceLevel !== 'all' && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-stone-warm dark:bg-stone-dark text-ink dark:text-ink-dark font-semibold text-[11px] border border-stone dark:border-stone-dark capitalize flex items-center gap-1">
                      Level: {experienceLevel}
                      <button
                        type="button"
                        onClick={() => {
                          setExperienceLevel('all');
                          executeSearch({ experienceLevel: 'all' });
                        }}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {employmentType !== 'all' && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-stone-warm dark:bg-stone-dark text-ink dark:text-ink-dark font-semibold text-[11px] border border-stone dark:border-stone-dark capitalize flex items-center gap-1">
                      Type: {employmentType}
                      <button
                        type="button"
                        onClick={() => {
                          setEmploymentType('all');
                          executeSearch({ employmentType: 'all' });
                        }}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="text-[11px] font-bold text-ink-muted dark:text-ink-dark-muted hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Popular Role Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase mr-1">
              Popular Tracks:
            </span>
            {popularRoles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleSelectRoleChip(role)}
                className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer border ${
                  queryRole.toLowerCase() === role.toLowerCase()
                    ? 'bg-forest text-white border-forest'
                    : 'bg-surface dark:bg-surface-dark hover:bg-stone-warm dark:hover:bg-stone-dark border-stone dark:border-stone-dark text-ink-light dark:text-ink-dark-secondary'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Direct Platform Fallback Shortcuts (Naukri, Indeed, LinkedIn, Foundit, Google Jobs) */}
          <div className="p-6 rounded-3xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink dark:text-ink-dark flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-forest dark:text-emerald-400" />
                  <span>Direct Major Platform Shortcuts (Naukri, LinkedIn, Indeed, Foundit, Google)</span>
                </h3>
                <p className="text-[11px] text-ink-muted dark:text-ink-dark-muted mt-0.5">
                  Pre-filtered deep-search links with your active role ({queryRole}) and location ({queryLocation || 'Remote/Global'}):
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {platformLinks.map((pLink) => (
                <a
                  key={pLink.platform}
                  href={pLink.searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl bg-surface dark:bg-surface-dark hover:bg-stone-warm dark:hover:bg-stone-dark border border-stone dark:border-stone-dark flex flex-col justify-between gap-2.5 group transition-all shadow-2xs hover:border-forest/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300">
                      {pLink.badgeText}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-ink-muted dark:text-ink-dark-muted group-hover:text-forest dark:group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-ink dark:text-ink-dark">{pLink.label}</h4>
                    <p className="text-[10px] text-ink-muted dark:text-ink-dark-muted truncate mt-0.5">{pLink.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Error Notice */}
          {errorNotice && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Discovered Jobs List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-serif font-bold text-ink dark:text-ink-dark flex items-center gap-2">
                <span>Verified Real-World Opportunities</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300">
                  {jobs.length} Found
                </span>
              </h2>
              <span className="text-xs text-ink-muted dark:text-ink-dark-muted hidden sm:inline">
                Evaluated against: {activeResume?.versionLabel || 'Active Resume'}
              </span>
            </div>

            {isSearching ? (
              <div className="p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark">
                <LoadingSkeleton rows={4} />
              </div>
            ) : jobs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-4">
                <Search className="w-10 h-10 text-ink-muted dark:text-ink-dark-muted mx-auto opacity-40" />
                <div className="space-y-1">
                  <h3 className="text-lg font-serif font-bold text-ink dark:text-ink-dark">No live listings matched current filters</h3>
                  <p className="text-xs text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto">
                    Try selecting "Remote Worldwide" or clear specific workplace filters to discover broader tech roles.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-5 transition-all hover:border-forest/40"
                  >
                    {/* Top Row: Title, Company, Badges & Match Gauge */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-faint dark:bg-forest/20 text-forest dark:text-emerald-300 border border-forest/20">
                            {job.sourceLabel}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark capitalize">
                            {job.workplaceType}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark capitalize">
                            {job.employmentType}
                          </span>
                          {job.postedAt && (
                            <span className="text-[10px] text-ink-muted dark:text-ink-dark-muted flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(job.postedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        <h3 className="text-lg md:text-xl font-serif font-bold text-ink dark:text-ink-dark leading-snug">
                          {job.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-light dark:text-ink-dark-secondary">
                          <span className="font-semibold text-ink dark:text-ink-dark flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-forest dark:text-emerald-400" />
                            {job.company}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-ink-light dark:text-ink-dark-secondary font-medium">
                            <MapPin className="w-3.5 h-3.5 text-forest dark:text-emerald-400" />
                            {job.location}
                          </span>
                          {job.salaryFormatted && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-forest dark:text-emerald-400 flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5" />
                                {job.salaryFormatted}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Match Score Badge */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-2xl font-serif font-bold text-forest dark:text-emerald-400">
                              {job.matchScore}%
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                              {job.matchRating} Match
                            </span>
                          </div>
                          <div className="w-11 h-11 rounded-2xl bg-forest-faint dark:bg-forest/20 flex items-center justify-center text-forest dark:text-emerald-300 font-bold text-sm border border-forest/20">
                            {job.matchScore >= 85 ? '🎯' : job.matchScore >= 70 ? '⚡' : '💡'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description Snippet */}
                    <p className="text-xs text-ink-light dark:text-ink-dark-secondary leading-relaxed line-clamp-3">
                      {job.descriptionSnippet || job.description}
                    </p>

                    {/* Skills Grid: Matched Resume Skills vs Growth Areas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-2xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs">
                      {/* Matched Skills */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Matched Resume Skills ({job.matchedSkills?.length || 0})</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(job.matchedSkills || []).length > 0 ? (
                            job.matchedSkills.map((s) => (
                              <span
                                key={s}
                                className="px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px] border border-emerald-200 dark:border-emerald-800"
                              >
                                ✓ {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted italic">
                              Transferable engineering skill alignment
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Growth Skills */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Adjacent Growth Areas ({job.unmatchedSkills?.length || 0})</span>
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(job.unmatchedSkills || []).length > 0 ? (
                            job.unmatchedSkills.slice(0, 4).map((s) => (
                              <span
                                key={s}
                                className="px-2.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-[11px] border border-amber-200 dark:border-amber-800"
                              >
                                + {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Full core skill coverage evidenced!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Recommendation Rationale & Tip */}
                    <div className="p-3.5 rounded-xl bg-stone-warm/50 dark:bg-stone-dark/40 border-l-4 border-forest dark:border-forest-light text-xs space-y-1 text-ink-light dark:text-ink-dark-secondary">
                      <p className="font-semibold text-ink dark:text-ink-dark text-[11px]">
                        AI Recommendation Rationale:
                      </p>
                      <p className="text-[11px] italic">
                        "{job.matchExplanation}"
                      </p>
                      {job.preparationTip && (
                        <p className="text-[11px] text-forest dark:text-emerald-400 font-semibold pt-0.5">
                          💡 Preparation Strategy: {job.preparationTip}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone dark:border-stone-dark">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveJob(job)}
                          disabled={job.isSaved}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            job.isSaved
                              ? 'bg-stone-warm dark:bg-stone-dark text-ink-muted dark:text-ink-dark-muted border border-stone dark:border-stone-dark cursor-default'
                              : 'bg-surface dark:bg-surface-dark hover:bg-stone-warm dark:hover:bg-stone-dark text-ink dark:text-ink-dark border border-stone dark:border-stone-dark shadow-2xs'
                          }`}
                        >
                          {job.isSaved ? <BookmarkCheck className="w-4 h-4 text-forest dark:text-emerald-400" /> : <Bookmark className="w-4 h-4" />}
                          <span>{job.isSaved ? 'Saved in Vault' : 'Save Job'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenTrackingModal(job)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            job.isApplied
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-surface dark:bg-surface-dark hover:bg-stone-warm dark:hover:bg-stone-dark text-ink dark:text-ink-dark border border-stone dark:border-stone-dark shadow-2xs'
                          }`}
                        >
                          <Kanban className="w-4 h-4 text-forest dark:text-emerald-400" />
                          <span>{job.isApplied ? `Status: ${job.applicationStatus || 'Applied'}` : 'Log in Tracker'}</span>
                        </button>
                      </div>

                      {/* Genuine External Application Button */}
                      <a
                        href={job.applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer ml-auto"
                        onClick={() => {
                          if (!job.isApplied) {
                            setTimeout(() => handleOpenTrackingModal(job), 900);
                          }
                        }}
                      >
                        <span>Apply on {job.sourceLabel || 'Platform'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Tab 2: Recommended for You */}
      {activeTab === 'recommended' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-2">
            <div className="flex items-center gap-2 text-forest dark:text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Personalized Career Intelligence Feed</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-ink dark:text-ink-dark">
              Top Verified Role Matches for {activeResume?.versionLabel || 'Your Profile'}
            </h2>
            <p className="text-xs text-ink-light dark:text-ink-dark-secondary">
              Opportunities ranked by evidence in your resume, tech stack alignment, and salary/location targets.
            </p>
          </div>

          <div className="space-y-4">
            {recommendedJobs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-3">
                <Sparkles className="w-8 h-8 text-forest dark:text-emerald-400 mx-auto" />
                <h3 className="text-base font-serif font-bold text-ink dark:text-ink-dark">No high-confidence matches found yet</h3>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto">
                  Try refreshing the discovery feed to synthesize top recommendations.
                </p>
                <button
                  type="button"
                  onClick={() => executeSearch()}
                  className="px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Refresh Recommendations
                </button>
              </div>
            ) : (
              recommendedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-forest/30 dark:border-forest/40 shadow-editorial space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest text-white">
                          ★ High Match ({job.matchScore}%)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark capitalize">
                          {job.workplaceType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-ivory dark:bg-ivory-dark text-ink-light dark:text-ink-dark-secondary border border-stone dark:border-stone-dark">
                          {job.sourceLabel}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif font-bold text-ink dark:text-ink-dark pt-1">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-ink-light dark:text-ink-dark-secondary">
                        <span className="font-semibold text-ink dark:text-ink-dark">{job.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-forest dark:text-emerald-400" />
                          {job.location}
                        </span>
                        {job.salaryFormatted && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-forest dark:text-emerald-400">{job.salaryFormatted}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-serif font-bold text-forest dark:text-emerald-400">
                        {job.matchScore}%
                      </div>
                      <span className="text-[10px] font-bold text-ink-muted dark:text-ink-dark-muted uppercase">
                        Evidence Match
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-ink-light dark:text-ink-dark-secondary leading-relaxed line-clamp-2">
                    {job.descriptionSnippet || job.description}
                  </p>

                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-stone dark:border-stone-dark">
                    <button
                      type="button"
                      onClick={() => handleSaveJob(job)}
                      className="px-3.5 py-2 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark flex items-center gap-1.5 cursor-pointer"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{job.isSaved ? 'Saved' : 'Save to Vault'}</span>
                    </button>

                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer"
                    >
                      <span>Apply on {job.sourceLabel}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Saved Jobs */}
      {activeTab === 'saved' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-serif font-bold text-ink dark:text-ink-dark">
                Saved Target Jobs ({savedJobs.length})
              </h2>
              <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1">
                Bookmarked opportunities for resume customization, gap auditing, and interview preparation.
              </p>
            </div>
            <Link
              to="/app/seeker/saved-jobs"
              className="px-4 py-2 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark shadow-2xs"
            >
              Saved Jobs Studio &rarr;
            </Link>
          </div>

          <div className="space-y-4">
            {savedJobs.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark space-y-3">
                <Bookmark className="w-8 h-8 text-ink-muted dark:text-ink-dark-muted mx-auto opacity-40" />
                <h3 className="text-base font-serif font-bold text-ink dark:text-ink-dark">No saved jobs yet</h3>
                <p className="text-xs text-ink-muted dark:text-ink-dark-muted max-w-md mx-auto">
                  Click 'Save Job' on any discovered opportunity to bookmark it here for deep analysis.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('discover')}
                  className="px-5 py-2.5 rounded-xl bg-forest text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Discover Live Jobs
                </button>
              </div>
            ) : (
              savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <h3 className="text-base font-serif font-bold text-ink dark:text-ink-dark">{job.title}</h3>
                    <p className="text-xs text-ink-light dark:text-ink-dark-secondary">
                      {job.company} • {job.location || 'Remote'}
                    </p>
                    {job.notes && (
                      <p className="text-[11px] text-forest dark:text-emerald-400 italic mt-1">
                        Note: {job.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/app/seeker/analysis"
                      className="px-3.5 py-2 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark"
                    >
                      Audit Gap
                    </Link>
                    {job.job_url || job.jobUrl ? (
                      <a
                        href={job.job_url || job.jobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-xl bg-forest text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <span>Apply</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 7. Tab 4: Search Preferences */}
      {activeTab === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="space-y-6">
          <div className="p-6 md:p-8 rounded-3xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark shadow-editorial space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-serif font-bold text-ink dark:text-ink-dark">
                Job Search & Career Preferences
              </h2>
              <p className="text-xs text-ink-light dark:text-ink-dark-secondary">
                Customize your target roles, locations, and compensation targets to refine AI discovery feeds.
              </p>
            </div>

            {prefsSavedNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Search preferences saved successfully!</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Target Job Titles */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Target Job Titles (comma separated)
                </label>
                <input
                  type="text"
                  value={(preferences?.targetJobTitles || []).join(', ')}
                  onChange={(e) =>
                    setPreferences((prev: any) => ({
                      ...prev,
                      targetJobTitles: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    }))
                  }
                  placeholder="e.g. Full Stack Engineer, React Developer, Tech Lead"
                  className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs font-medium text-ink dark:text-ink-dark"
                />
              </div>

              {/* Preferred Locations */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Preferred Locations (comma separated)
                </label>
                <input
                  type="text"
                  value={(preferences?.preferredLocations || []).join(', ')}
                  onChange={(e) =>
                    setPreferences((prev: any) => ({
                      ...prev,
                      preferredLocations: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    }))
                  }
                  placeholder="e.g. Remote, Bangalore, San Francisco, London"
                  className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs font-medium text-ink dark:text-ink-dark"
                />
              </div>

              {/* Primary Tech Skills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Primary Technical Skills (comma separated)
                </label>
                <input
                  type="text"
                  value={(preferences?.primarySkills || []).join(', ')}
                  onChange={(e) =>
                    setPreferences((prev: any) => ({
                      ...prev,
                      primarySkills: e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                    }))
                  }
                  placeholder="e.g. React, Node.js, TypeScript, PostgreSQL, AWS"
                  className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs font-medium text-ink dark:text-ink-dark"
                />
              </div>

              {/* Experience Level */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block">
                  Target Seniority Level
                </label>
                <select
                  value={preferences?.experienceLevel || 'all'}
                  onChange={(e) =>
                    setPreferences((prev: any) => ({
                      ...prev,
                      experienceLevel: e.target.value
                    }))
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none"
                >
                  <option value="all">All Seniority Levels</option>
                  <option value="entry">Entry Level (0 - 2 years)</option>
                  <option value="mid">Mid Level (2 - 5 years)</option>
                  <option value="senior">Senior Level (5 - 8 years)</option>
                  <option value="lead">Lead / Principal (8+ years)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-stone dark:border-stone-dark flex items-center justify-between">
              <button
                type="submit"
                disabled={isSavingPrefs}
                className="px-6 py-2.5 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-bold shadow-xs flex items-center gap-2 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingPrefs ? 'Saving Changes...' : 'Save Preferences'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 8. Log in Application Tracker Modal */}
      {trackingJob && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-forest dark:text-emerald-400 block mb-1">
                  Track Job Application
                </span>
                <h3 className="text-lg font-serif font-bold text-ink dark:text-ink-dark">
                  {trackingJob.title}
                </h3>
                <p className="text-xs text-ink-light dark:text-ink-dark-secondary">
                  {trackingJob.company} • {trackingJob.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTrackingJob(null)}
                className="p-1.5 rounded-xl hover:bg-stone-warm dark:hover:bg-stone-dark text-ink-muted dark:text-ink-dark-muted cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {appSuccessNotice && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{appSuccessNotice}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
                  Application Stage
                </label>
                <select
                  value={selectedAppStatus}
                  onChange={(e) => setSelectedAppStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory dark:bg-ivory-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark focus:outline-none"
                >
                  <option value="applied">Applied (Submitted)</option>
                  <option value="preparing">Preparing Application</option>
                  <option value="interested">Bookmarked / Interested</option>
                  <option value="assessment">Technical Assessment</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="offer">Offer Received</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-dark-muted block mb-1">
                  Personal Notes / Follow-Up Actions
                </label>
                <textarea
                  rows={3}
                  value={appNotes}
                  onChange={(e) => setAppNotes(e.target.value)}
                  placeholder="e.g. Applied via career page. Follow up next week on LinkedIn."
                  className="w-full px-3.5 py-2.5 rounded-xl editorial-input text-xs font-medium text-ink dark:text-ink-dark"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone dark:border-stone-dark">
              <button
                type="button"
                onClick={() => setTrackingJob(null)}
                className="px-4 py-2 rounded-xl bg-surface dark:bg-surface-dark border border-stone dark:border-stone-dark text-xs font-semibold text-ink dark:text-ink-dark hover:bg-stone-warm dark:hover:bg-stone-dark cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTracking}
                disabled={isSubmittingApp}
                className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-hover text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSubmittingApp ? 'Saving...' : 'Save to Pipeline'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
