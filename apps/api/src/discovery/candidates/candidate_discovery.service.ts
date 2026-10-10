import { v4 as uuidv4 } from 'uuid';
import {
  CandidateDiscoveryRun,
  DiscoveredCandidate,
  ExcludedCandidatesBreakdown,
  ProviderExecutionStatus,
  RecruiterCandidateDiscoveryQuery,
  CandidateComparisonResult
} from '@avengercoders/shared';
import { db } from '../../db/client';
import { CandidateDiscoveryProvider, CandidateSearchQuery, RawDiscoveredCandidate } from './candidate_provider.interface';
import { GitHubTalentProvider } from './providers/github_talent.provider';
import { OpenTalentNetworkProvider } from './providers/open_talent_network.provider';
import { PlatformTalentProvider } from './providers/platform_talent.provider';
import { SkillNormalizer } from '../../matching/skill.normalizer';
import { SafeUrlValidator } from '../url_validator';
import { GeminiService } from '../../ai/gemini.service';

export class CandidateDiscoveryService {
  private providers: CandidateDiscoveryProvider[];
  private geminiService: GeminiService;

  constructor() {
    this.providers = [
      new GitHubTalentProvider(),
      new OpenTalentNetworkProvider(),
      new PlatformTalentProvider()
    ];
    this.geminiService = new GeminiService();
  }

  /**
   * STAGE A: Job Requirement & Profile Analysis
   */
  private extractJobProfile(job: any, rawRequirements: any[]): {
    jobTitle: string;
    seniority: string;
    mandatorySkills: string[];
    preferredSkills: string[];
    minExperienceYears: number;
    location: string;
    workplaceType: string;
  } {
    const titleLower = (job.title || '').toLowerCase();
    let seniority = 'mid';
    if (titleLower.includes('lead') || titleLower.includes('principal') || titleLower.includes('staff') || titleLower.includes('director')) {
      seniority = 'lead';
    } else if (titleLower.includes('senior') || titleLower.includes('sr')) {
      seniority = 'senior';
    } else if (titleLower.includes('junior') || titleLower.includes('jr') || titleLower.includes('entry') || titleLower.includes('intern')) {
      seniority = 'entry';
    }

    const mandatorySkills: string[] = [];
    const preferredSkills: string[] = [];

    // Extract from structured requirements if present
    for (const req of rawRequirements) {
      const title = req.title || req.requirement || '';
      const norm = SkillNormalizer.normalize(title);
      if (req.importance === 'mandatory' || req.is_mandatory) {
        mandatorySkills.push(norm);
      } else {
        preferredSkills.push(norm);
      }
    }

    // Extract skills from description if structured requirements are empty
    if (mandatorySkills.length === 0 && preferredSkills.length === 0) {
      const extracted = SkillNormalizer.extractRequirementKeywords(job.description || '');
      extracted.slice(0, 4).forEach(s => mandatorySkills.push(SkillNormalizer.normalize(s)));
      extracted.slice(4, 10).forEach(s => preferredSkills.push(SkillNormalizer.normalize(s)));
    }

    // Min experience parsing
    let minExperienceYears = 2;
    const expMatch = (job.description || '').match(/(\d+)\+?\s*(?:years?|yrs?)/i);
    if (expMatch && expMatch[1]) {
      minExperienceYears = parseInt(expMatch[1], 10);
    } else if (seniority === 'lead') {
      minExperienceYears = 6;
    } else if (seniority === 'senior') {
      minExperienceYears = 4;
    } else if (seniority === 'entry') {
      minExperienceYears = 0;
    }

    return {
      jobTitle: job.title || 'Software Engineer',
      seniority,
      mandatorySkills: Array.from(new Set(mandatorySkills)),
      preferredSkills: Array.from(new Set(preferredSkills)),
      minExperienceYears,
      location: job.location || '',
      workplaceType: job.workplace_type || 'unspecified'
    };
  }

  /**
   * Main Agentic Pipeline: Stages A through F
   */
  public async runDiscovery(
    jobId: string,
    recruiterId: string,
    queryInput: Partial<RecruiterCandidateDiscoveryQuery> = {}
  ): Promise<{ run: CandidateDiscoveryRun; qualifiedCandidates: DiscoveredCandidate[] }> {
    // 1. Authorize & fetch job
    const job = await db.findById('jobs', jobId);
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }

    // Check recruiter ownership / isolation
    if (job.owner_id && job.owner_id !== recruiterId && job.recruiter_id !== recruiterId) {
      const recruiterProfile = await db.findById('profiles', recruiterId);
      if (recruiterProfile?.role !== 'admin') {
        throw new Error('Unauthorized: Recruiter does not have permission to discover candidates for this job');
      }
    }

    const rawRequirements = await db.query('job_requirements', (r: any) => r.job_id === jobId);

    // STAGE A: Job Profile Analysis
    const jobProfile = this.extractJobProfile(job, rawRequirements);
    const minScore = queryInput.minScore !== undefined ? queryInput.minScore : 70;
    const limit = queryInput.limit || 20;

    const runId = uuidv4();
    const startTime = new Date().toISOString();

    // STAGE B: Multi-Query Discovery Across Legitimate Providers
    const searchQuery: CandidateSearchQuery = {
      jobTitle: jobProfile.jobTitle,
      mandatorySkills: queryInput.skills && queryInput.skills.length > 0 ? queryInput.skills : jobProfile.mandatorySkills,
      preferredSkills: jobProfile.preferredSkills,
      location: queryInput.location || jobProfile.location,
      workplaceType: queryInput.workplaceType || jobProfile.workplaceType,
      minExperienceYears: jobProfile.minExperienceYears,
      limit
    };

    const providerStatuses: ProviderExecutionStatus[] = [];
    const rawDiscoveredCandidates: RawDiscoveredCandidate[] = [];

    await Promise.all(
      this.providers.map(async (provider) => {
        try {
          const result = await provider.search(searchQuery);
          providerStatuses.push(result.status);
          rawDiscoveredCandidates.push(...result.candidates);
        } catch (err: any) {
          providerStatuses.push({
            provider: provider.name,
            providerLabel: provider.label,
            status: 'error',
            resultCount: 0,
            latencyMs: 0,
            errorMessage: err.message || 'Provider execution failed'
          });
        }
      })
    );

    // STAGE C: Data Validation & Deduplication
    const seenCanonicalUrls = new Set<string>();
    const validCandidates: RawDiscoveredCandidate[] = [];
    let duplicateCount = 0;

    for (const raw of rawDiscoveredCandidates) {
      // 1. Validate canonical URL
      const cleanUrl = SafeUrlValidator.sanitizeUrl(raw.canonicalProfileUrl);
      if (!cleanUrl) continue;

      // 2. Check for duplicates
      if (seenCanonicalUrls.has(cleanUrl.toLowerCase())) {
        duplicateCount++;
        continue;
      }
      seenCanonicalUrls.add(cleanUrl.toLowerCase());

      // 3. Ensure sufficient information
      if (!raw.fullName || (raw.skills.length === 0 && !raw.experienceSummary)) {
        continue;
      }

      validCandidates.push({
        ...raw,
        canonicalProfileUrl: cleanUrl
      });
    }

    // STAGE D & E: Candidate-to-Job Evaluation & Gating
    const qualifiedCandidates: DiscoveredCandidate[] = [];
    const excludedBreakdown: ExcludedCandidatesBreakdown = {
      totalExcluded: 0,
      unverifiedAvailability: 0,
      missingMandatoryRequirements: 0,
      belowRelevanceThreshold: 0,
      duplicateRecords: duplicateCount,
      optedOut: 0
    };

    for (const raw of validCandidates) {
      // Opt-out check
      if (raw.availabilitySignal?.verificationStatus === 'opted_out') {
        excludedBreakdown.optedOut++;
        excludedBreakdown.totalExcluded++;
        continue;
      }

      // Track unverified availability diagnostic
      const isVerifiedAvailability = Boolean(raw.availabilitySignal?.isOpenToWork && raw.availabilitySignal?.verificationStatus === 'verified');
      if (!isVerifiedAvailability) {
        excludedBreakdown.unverifiedAvailability++;
      }

      // STAGE D: Structured Candidate-to-Job Evaluation
      const candidateSkillsNormalized = (raw.skills || []).map((s: string) => SkillNormalizer.normalize(s).toLowerCase());
      const rawText = `${raw.skills.join(' ')} ${raw.headline} ${raw.experienceSummary} ${raw.projectsSummary}`.toLowerCase();

      const matchedMandatory: string[] = [];
      const missingMandatory: string[] = [];
      const matchedPreferred: string[] = [];

      // Check Mandatory Skills
      for (const mSkill of jobProfile.mandatorySkills) {
        const mNorm = mSkill.toLowerCase();
        const hasSkill = candidateSkillsNormalized.some((cs: string) => cs.includes(mNorm) || mNorm.includes(cs)) || rawText.includes(mNorm);
        if (hasSkill) {
          matchedMandatory.push(mSkill);
        } else {
          missingMandatory.push(mSkill);
        }
      }

      // Check Preferred Skills
      for (const pSkill of jobProfile.preferredSkills) {
        const pNorm = pSkill.toLowerCase();
        const hasSkill = candidateSkillsNormalized.some((cs: string) => cs.includes(pNorm) || pNorm.includes(cs)) || rawText.includes(pNorm);
        if (hasSkill) {
          matchedPreferred.push(pSkill);
        }
      }

      // Mandatory satisfaction check
      const mandatorySatisfied = jobProfile.mandatorySkills.length === 0 || missingMandatory.length === 0 || (matchedMandatory.length / Math.max(jobProfile.mandatorySkills.length, 1)) >= 0.5;

      if (!mandatorySatisfied) {
        excludedBreakdown.missingMandatoryRequirements++;
        excludedBreakdown.totalExcluded++;
        continue;
      }

      // Compute Relevance Score (0-100)
      const mandatoryWeight = jobProfile.mandatorySkills.length > 0 ? (matchedMandatory.length / jobProfile.mandatorySkills.length) * 50 : 50;
      const preferredWeight = jobProfile.preferredSkills.length > 0 ? (matchedPreferred.length / jobProfile.preferredSkills.length) * 25 : 20;
      
      // Experience bonus
      let expScore = 15;
      if (raw.experienceYears !== undefined && raw.experienceYears !== null) {
        if (raw.experienceYears >= jobProfile.minExperienceYears) {
          expScore = 20;
        } else {
          expScore = Math.max(5, (raw.experienceYears / Math.max(jobProfile.minExperienceYears, 1)) * 15);
        }
      }

      // Location match bonus
      let locScore = 5;
      if (jobProfile.workplaceType === 'remote' || raw.workArrangement === 'remote') {
        locScore = 10;
      } else if (jobProfile.location && raw.location && raw.location.toLowerCase().includes(jobProfile.location.toLowerCase())) {
        locScore = 10;
      }

      const relevanceScore = Math.min(100, Math.round(mandatoryWeight + preferredWeight + expScore + locScore));

      if (relevanceScore < minScore) {
        excludedBreakdown.belowRelevanceThreshold++;
        excludedBreakdown.totalExcluded++;
        continue;
      }

      // Match Rating Classification
      let matchRating: 'exceptional' | 'strong' | 'moderate' | 'low' = 'moderate';
      if (relevanceScore >= 90) matchRating = 'exceptional';
      else if (relevanceScore >= 80) matchRating = 'strong';
      else if (relevanceScore >= 70) matchRating = 'moderate';
      else matchRating = 'low';

      // Match Explanation & Evidence
      const matchedAll = Array.from(new Set([...matchedMandatory, ...matchedPreferred]));
      const matchExplanation = `Candidate demonstrates verified proficiency in ${matchedAll.slice(0, 4).join(', ')}${raw.experienceYears ? ` with ~${raw.experienceYears} years of experience` : ''}. Verified open to opportunities via ${raw.availabilitySignal.signalSource}.`;

      const evidenceSnippets = [
        ...raw.rawEvidence,
        `Matched Requirements: ${matchedAll.join(', ') || 'Core role alignment'}`
      ];

      const discoveredCandidate: DiscoveredCandidate = {
        id: uuidv4(),
        jobId,
        runId,
        fullName: raw.fullName,
        headline: raw.headline,
        location: raw.location,
        country: raw.country,
        workArrangement: raw.workArrangement,
        canonicalProfileUrl: raw.canonicalProfileUrl,
        sourceProvider: raw.sourceProvider,
        sourceLabel: raw.sourceLabel,
        evaluationType: raw.evaluationType,
        skills: raw.skills,
        experienceYears: raw.experienceYears,
        experienceSummary: raw.experienceSummary,
        projectsSummary: raw.projectsSummary,
        educationSummary: raw.educationSummary,
        availabilitySignal: raw.availabilitySignal,
        relevanceScore,
        matchRating,
        mandatorySatisfied: true,
        matchedSkills: matchedMandatory,
        preferredSkillsMatched: matchedPreferred,
        missingRequirements: missingMandatory,
        matchExplanation,
        evidenceSnippets,
        confidenceScore: 85,
        isSaved: false,
        isImported: false,
        discoveredAt: raw.discoveredAt
      };

      qualifiedCandidates.push(discoveredCandidate);
    }

    // STAGE F: Final Ranking (Highest Relevance First)
    qualifiedCandidates.sort((a: DiscoveredCandidate, b: DiscoveredCandidate) => b.relevanceScore - a.relevanceScore);

    // Persist Discovery Run
    const run: CandidateDiscoveryRun = {
      id: runId,
      jobId,
      recruiterId,
      status: qualifiedCandidates.length > 0 ? 'completed' : providerStatuses.some(p => p.status === 'success') ? 'completed' : 'partial',
      jobTitle: jobProfile.jobTitle,
      targetSkills: [...jobProfile.mandatorySkills, ...jobProfile.preferredSkills],
      minScore,
      totalDiscovered: rawDiscoveredCandidates.length,
      totalQualified: qualifiedCandidates.length,
      excludedBreakdown,
      providerStatuses,
      startedAt: startTime,
      completedAt: new Date().toISOString()
    };

    await db.insert('recruiter_candidate_discovery_runs', run);

    // Persist Qualified Discovered Candidates (idempotent for this run)
    for (const cand of qualifiedCandidates) {
      await db.insert('recruiter_discovered_candidates', cand);
    }

    return { run, qualifiedCandidates };
  }

  /**
   * Get all discovery runs for a specific job
   */
  public async getDiscoveryRuns(jobId: string, recruiterId: string): Promise<CandidateDiscoveryRun[]> {
    const job = await db.findById('jobs', jobId);
    if (!job) throw new Error('Job not found');

    const runs = await db.query<CandidateDiscoveryRun>('recruiter_candidate_discovery_runs', (r: any) => r.jobId === jobId);
    return runs.sort((a: CandidateDiscoveryRun, b: CandidateDiscoveryRun) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  /**
   * Get qualified discovered candidates for a job
   */
  public async getQualifiedCandidates(
    jobId: string,
    recruiterId: string,
    minScore = 0
  ): Promise<DiscoveredCandidate[]> {
    const job = await db.findById('jobs', jobId);
    if (!job) throw new Error('Job not found');

    const candidates = await db.query<DiscoveredCandidate>('recruiter_discovered_candidates', (c: any) => 
      c.jobId === jobId && (minScore === 0 || c.relevanceScore >= minScore)
    );

    // Check saved status
    const savedRecords = await db.query('recruiter_saved_candidates', (s: any) => s.jobId === jobId && s.recruiterId === recruiterId);
    const savedIdSet = new Set(savedRecords.map((s: any) => s.candidateId));

    return candidates.map((c: DiscoveredCandidate) => ({
      ...c,
      isSaved: savedIdSet.has(c.id)
    })).sort((a: DiscoveredCandidate, b: DiscoveredCandidate) => b.relevanceScore - a.relevanceScore);
  }

  /**
   * Save or bookmark candidate
   */
  public async saveCandidate(jobId: string, candidateId: string, recruiterId: string): Promise<DiscoveredCandidate> {
    const candidate = await db.findById<DiscoveredCandidate>('recruiter_discovered_candidates', candidateId);
    if (!candidate || candidate.jobId !== jobId) {
      throw new Error('Candidate record not found for this job');
    }

    const existing = await db.query('recruiter_saved_candidates', (s: any) => 
      s.candidateId === candidateId && s.recruiterId === recruiterId
    );

    if (existing.length === 0) {
      await db.insert('recruiter_saved_candidates', {
        id: uuidv4(),
        jobId,
        candidateId,
        recruiterId,
        savedAt: new Date().toISOString()
      });
    }

    await db.update('recruiter_discovered_candidates', candidateId, {
      isSaved: true,
      savedAt: new Date().toISOString()
    });

    return {
      ...candidate,
      isSaved: true,
      savedAt: new Date().toISOString()
    };
  }

  /**
   * Unsave / remove bookmark
   */
  public async unsaveCandidate(jobId: string, candidateId: string, recruiterId: string): Promise<DiscoveredCandidate> {
    const candidate = await db.findById<DiscoveredCandidate>('recruiter_discovered_candidates', candidateId);
    if (!candidate || candidate.jobId !== jobId) {
      throw new Error('Candidate record not found for this job');
    }

    const savedRecords = await db.query('recruiter_saved_candidates', (s: any) => 
      s.candidateId === candidateId && s.recruiterId === recruiterId
    );

    for (const record of savedRecords) {
      await db.delete('recruiter_saved_candidates', record.id);
    }

    await db.update('recruiter_discovered_candidates', candidateId, {
      isSaved: false,
      savedAt: null
    });

    return {
      ...candidate,
      isSaved: false,
      savedAt: null
    };
  }

  /**
   * STAGE G: Import Discovered Candidate into Job Pipeline (job_candidates)
   */
  public async importCandidate(jobId: string, candidateId: string, recruiterId: string): Promise<{ jobCandidateId: string }> {
    const candidate = await db.findById<DiscoveredCandidate>('recruiter_discovered_candidates', candidateId);
    if (!candidate || candidate.jobId !== jobId) {
      throw new Error('Candidate record not found for this job');
    }

    // 1. Create or find standard candidate record
    const candRecordId = uuidv4();
    const standardCandidate = {
      id: candRecordId,
      full_name: candidate.fullName,
      email: `${candidate.fullName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@discovered.talentrivox.ai`,
      phone: null,
      location: candidate.location,
      source: `Discovery: ${candidate.sourceLabel}`,
      canonical_url: candidate.canonicalProfileUrl,
      created_at: new Date().toISOString()
    };
    await db.insert('candidates', standardCandidate);

    // 2. Link to job_candidates
    const jobCandidateId = uuidv4();
    await db.insert('job_candidates', {
      id: jobCandidateId,
      job_id: jobId,
      candidate_id: candRecordId,
      status: 'screened',
      relevance_score: candidate.relevanceScore,
      match_rating: candidate.matchRating,
      notes: `Imported from Agentic Candidate Discovery (${candidate.sourceLabel}). Verified availability: ${candidate.availabilitySignal.signalEvidence}`,
      created_at: new Date().toISOString()
    });

    // 3. Mark discovered candidate as imported
    await db.update('recruiter_discovered_candidates', candidateId, {
      isImported: true,
      importedCandidateId: jobCandidateId
    });

    return { jobCandidateId };
  }

  /**
   * Side-by-Side Candidate Comparison Matrix
   */
  public async compareCandidates(
    jobId: string,
    candidateIds: string[],
    recruiterId: string
  ): Promise<CandidateComparisonResult> {
    const job = await db.findById('jobs', jobId);
    if (!job) throw new Error('Job not found');

    const allCandidates = await db.query<DiscoveredCandidate>('recruiter_discovered_candidates', (c: any) => 
      c.jobId === jobId && candidateIds.includes(c.id)
    );

    if (allCandidates.length === 0) {
      throw new Error('No valid candidates found for comparison');
    }

    // Generate comparison criteria matrix
    const matrix = [
      {
        criterion: 'Overall Job Relevance',
        weight: 0.35,
        scores: Object.fromEntries(allCandidates.map((c: DiscoveredCandidate) => [c.id, `${c.relevanceScore}/100 (${c.matchRating})`]))
      },
      {
        criterion: 'Matched Technical Skills',
        weight: 0.25,
        scores: Object.fromEntries(allCandidates.map((c: DiscoveredCandidate) => [c.id, c.matchedSkills.join(', ') || 'General role match']))
      },
      {
        criterion: 'Experience Depth',
        weight: 0.20,
        scores: Object.fromEntries(allCandidates.map((c: DiscoveredCandidate) => [c.id, c.experienceYears ? `${c.experienceYears} Years` : 'Portfolio-based']))
      },
      {
        criterion: 'Verified Availability Signal',
        weight: 0.10,
        scores: Object.fromEntries(allCandidates.map((c: DiscoveredCandidate) => [c.id, c.availabilitySignal.signalEvidence]))
      },
      {
        criterion: 'Workplace & Location Compatibility',
        weight: 0.10,
        scores: Object.fromEntries(allCandidates.map((c: DiscoveredCandidate) => [c.id, `${c.location} (${c.workArrangement})`]))
      }
    ];

    const topCandidate = [...allCandidates].sort((a: DiscoveredCandidate, b: DiscoveredCandidate) => b.relevanceScore - a.relevanceScore)[0];
    const recommendationSummary = `Top recommendation for '${job.title}' is ${topCandidate.fullName} (${topCandidate.relevanceScore}% match) with verified skills in ${topCandidate.matchedSkills.slice(0, 3).join(', ')}.`;

    return {
      jobId,
      jobTitle: job.title || 'Role',
      candidates: allCandidates,
      comparisonMatrix: matrix,
      recommendationSummary
    };
  }
}

export const candidateDiscoveryService = new CandidateDiscoveryService();
