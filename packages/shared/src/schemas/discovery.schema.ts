import { z } from 'zod';
import { ApplicationStatus } from '../constants';

// 1. Job Search Preferences Schema
export const JobSearchPreferencesSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  targetJobTitles: z.array(z.string()).default([]),
  primarySkills: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  isRemoteOnly: z.boolean().default(false),
  workplaceTypes: z.array(z.enum(['remote', 'hybrid', 'onsite'])).default(['remote', 'hybrid', 'onsite']),
  employmentTypes: z.array(z.enum(['full-time', 'part-time', 'contract', 'internship'])).default(['full-time']),
  minSalary: z.number().nullable().optional(),
  maxSalary: z.number().nullable().optional(),
  salaryCurrency: z.string().default('USD'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'all']).default('all'),
  targetIndustries: z.array(z.string()).default([]),
  autoDiscover: z.boolean().default(true),
  updatedAt: z.string().optional()
});

export type JobSearchPreferences = z.infer<typeof JobSearchPreferencesSchema>;

// 2. Job Discovery Query Schema
export const JobDiscoveryQuerySchema = z.object({
  query: z.string().optional(),
  role: z.string().optional(),
  skills: z.array(z.string()).optional(),
  location: z.string().optional(),
  country: z.string().default('us'),
  workplaceType: z.enum(['remote', 'hybrid', 'onsite', 'all']).default('all'),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'all']).default('all'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'all']).default('all'),
  minSalary: z.number().optional(),
  company: z.string().optional(),
  postedWithinDays: z.number().optional(),
  page: z.number().default(1),
  limit: z.number().default(15),
  useResumeProfile: z.boolean().default(true),
  resumeId: z.string().nullable().optional().transform(v => (v === '' || v === null ? undefined : v)),
  sortBy: z.enum(['relevance', 'date', 'salary', 'match_score']).default('relevance')
});

export type JobDiscoveryQuery = z.infer<typeof JobDiscoveryQuerySchema>;

// 3. Normalized Discovered Job Schema
export const DiscoveredJobSchema = z.object({
  id: z.string(),
  source: z.string(), // 'adzuna' | 'jsearch' | 'arbeitnow' | 'remotive' | 'open_web'
  sourceLabel: z.string(),
  externalJobId: z.string(),
  title: z.string(),
  company: z.string(),
  companyLogoUrl: z.string().nullable().optional(),
  location: z.string(),
  country: z.string().nullable().optional(),
  isRemote: z.boolean().default(false),
  workplaceType: z.enum(['remote', 'hybrid', 'onsite', 'unspecified']).default('unspecified'),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'unspecified']).default('unspecified'),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'unspecified']).default('unspecified'),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  salaryCurrency: z.string().nullable().optional(),
  salaryFormatted: z.string().nullable().optional(),
  postedAt: z.string().nullable().optional(),
  applicationUrl: z.string(),
  description: z.string(),
  descriptionSnippet: z.string(),
  extractedSkills: z.array(z.string()).default([]),
  
  // Agentic Match Assessment Fields
  matchScore: z.number().min(0).max(100).default(70),
  matchRating: z.enum(['exceptional', 'strong', 'moderate', 'exploratory']).default('moderate'),
  matchedSkills: z.array(z.string()).default([]),
  unmatchedSkills: z.array(z.string()).default([]),
  transferableSkills: z.array(z.string()).default([]),
  resumeEvidence: z.array(z.string()).default([]),
  matchExplanation: z.string().default(''),
  preparationTip: z.string().default(''),
  
  // User action states
  isSaved: z.boolean().default(false),
  isApplied: z.boolean().default(false),
  applicationStatus: z.nativeEnum(ApplicationStatus).nullable().optional(),
  isDismissed: z.boolean().default(false)
});

export type DiscoveredJob = z.infer<typeof DiscoveredJobSchema>;

// 4. Provider Execution Status
export const ProviderExecutionStatusSchema = z.object({
  provider: z.string(),
  providerLabel: z.string(),
  status: z.enum(['success', 'rate_limited', 'missing_credentials', 'timeout', 'error']),
  resultCount: z.number(),
  latencyMs: z.number(),
  errorMessage: z.string().optional()
});

export type ProviderExecutionStatus = z.infer<typeof ProviderExecutionStatusSchema>;

// 5. Platform Fallback Search Link
export const PlatformFallbackLinkSchema = z.object({
  platform: z.string(),
  label: z.string(),
  searchUrl: z.string(),
  icon: z.string(),
  badgeText: z.string(),
  description: z.string()
});

export type PlatformFallbackLink = z.infer<typeof PlatformFallbackLinkSchema>;

// 6. Discovery Session Result Schema
export const DiscoverySessionResultSchema = z.object({
  sessionId: z.string(),
  query: JobDiscoveryQuerySchema,
  totalFound: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
  jobs: z.array(DiscoveredJobSchema),
  providerStatuses: z.array(ProviderExecutionStatusSchema),
  platformFallbackLinks: z.array(PlatformFallbackLinkSchema),
  candidateContext: z.object({
    resumeId: z.string().optional(),
    versionLabel: z.string().optional(),
    candidateName: z.string().optional(),
    topSkills: z.array(z.string()),
    targetRole: z.string()
  }).nullable().optional(),
  generatedAt: z.string()
});

export type DiscoverySessionResult = z.infer<typeof DiscoverySessionResultSchema>;

// ==========================================
// RECRUITER CANDIDATE DISCOVERY SCHEMAS
// ==========================================

// 7. Candidate Availability & Willingness Signal Schema
export const CandidateAvailabilitySignalSchema = z.object({
  isOpenToWork: z.boolean(),
  signalSource: z.enum(['github_hireable', 'verified_open_network', 'recruitment_opt_in', 'authorized_profile_status']),
  verificationStatus: z.enum(['verified', 'unverified', 'opted_out']),
  signalEvidence: z.string(),
  timestamp: z.string().optional()
});

export type CandidateAvailabilitySignal = z.infer<typeof CandidateAvailabilitySignalSchema>;

// 8. Recruiter Candidate Discovery Query Schema
export const RecruiterCandidateDiscoveryQuerySchema = z.object({
  jobId: z.string(),
  minScore: z.number().min(0).max(100).default(70),
  location: z.string().optional(),
  workplaceType: z.enum(['remote', 'hybrid', 'onsite', 'all']).default('all'),
  skills: z.array(z.string()).optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead', 'all']).default('all'),
  limit: z.number().min(1).max(50).default(20),
  forceRefresh: z.boolean().default(false)
});

export type RecruiterCandidateDiscoveryQuery = z.infer<typeof RecruiterCandidateDiscoveryQuerySchema>;

// 9. Excluded Candidate Diagnostic Breakdown
export const ExcludedCandidatesBreakdownSchema = z.object({
  totalExcluded: z.number().default(0),
  unverifiedAvailability: z.number().default(0),
  missingMandatoryRequirements: z.number().default(0),
  belowRelevanceThreshold: z.number().default(0),
  duplicateRecords: z.number().default(0),
  optedOut: z.number().default(0)
});

export type ExcludedCandidatesBreakdown = z.infer<typeof ExcludedCandidatesBreakdownSchema>;

// 10. Discovered Candidate Schema
export const DiscoveredCandidateSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  runId: z.string(),
  fullName: z.string(),
  headline: z.string().default(''),
  location: z.string().default(''),
  country: z.string().nullable().optional(),
  workArrangement: z.enum(['remote', 'hybrid', 'onsite', 'unspecified']).default('unspecified'),
  canonicalProfileUrl: z.string(),
  sourceProvider: z.string(),
  sourceLabel: z.string(),
  evaluationType: z.enum(['profile_evaluation', 'full_resume_evaluation']).default('profile_evaluation'),
  skills: z.array(z.string()).default([]),
  experienceYears: z.number().nullable().optional(),
  experienceSummary: z.string().default(''),
  projectsSummary: z.string().default(''),
  educationSummary: z.string().nullable().optional(),
  availabilitySignal: CandidateAvailabilitySignalSchema,
  relevanceScore: z.number().min(0).max(100).default(70),
  matchRating: z.enum(['exceptional', 'strong', 'moderate', 'low']).default('moderate'),
  mandatorySatisfied: z.boolean().default(true),
  matchedSkills: z.array(z.string()).default([]),
  preferredSkillsMatched: z.array(z.string()).default([]),
  missingRequirements: z.array(z.string()).default([]),
  matchExplanation: z.string().default(''),
  evidenceSnippets: z.array(z.string()).default([]),
  confidenceScore: z.number().min(0).max(100).default(80),
  isSaved: z.boolean().default(false),
  savedAt: z.string().nullable().optional(),
  isImported: z.boolean().default(false),
  importedCandidateId: z.string().nullable().optional(),
  discoveredAt: z.string()
});

export type DiscoveredCandidate = z.infer<typeof DiscoveredCandidateSchema>;

// 11. Candidate Discovery Run Schema
export const CandidateDiscoveryRunSchema = z.object({
  id: z.string(),
  jobId: z.string(),
  recruiterId: z.string(),
  organizationId: z.string().nullable().optional(),
  status: z.enum(['queued', 'running', 'completed', 'partial', 'failed']).default('completed'),
  jobTitle: z.string(),
  targetSkills: z.array(z.string()).default([]),
  minScore: z.number().default(70),
  totalDiscovered: z.number().default(0),
  totalQualified: z.number().default(0),
  excludedBreakdown: ExcludedCandidatesBreakdownSchema,
  providerStatuses: z.array(ProviderExecutionStatusSchema).default([]),
  errorMessage: z.string().nullable().optional(),
  startedAt: z.string(),
  completedAt: z.string().nullable().optional()
});

export type CandidateDiscoveryRun = z.infer<typeof CandidateDiscoveryRunSchema>;

// 12. Candidate Comparison Matrix Schema
export const CandidateComparisonResultSchema = z.object({
  jobId: z.string(),
  jobTitle: z.string(),
  candidates: z.array(DiscoveredCandidateSchema),
  comparisonMatrix: z.array(z.object({
    criterion: z.string(),
    weight: z.number(),
    scores: z.record(z.string(), z.union([z.number(), z.string(), z.boolean(), z.array(z.string())]))
  })),
  recommendationSummary: z.string()
});

export type CandidateComparisonResult = z.infer<typeof CandidateComparisonResultSchema>;

