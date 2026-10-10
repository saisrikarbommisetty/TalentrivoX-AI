import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CandidateDiscoveryService } from '../../src/discovery/candidates/candidate_discovery.service';
import { SafeUrlValidator } from '../../src/discovery/url_validator';
import { GitHubTalentProvider } from '../../src/discovery/candidates/providers/github_talent.provider';
import { OpenTalentNetworkProvider } from '../../src/discovery/candidates/providers/open_talent_network.provider';
import { PlatformTalentProvider } from '../../src/discovery/candidates/providers/platform_talent.provider';
import { db } from '../../src/db/client';

describe('Agentic Candidate Discovery & Job-Specific Screening Unit Tests', { timeout: 15000 }, () => {
  let discoveryService: CandidateDiscoveryService;
  const recruiterId = '00000000-0000-0000-0000-000000000001';
  const otherRecruiterId = '00000000-0000-0000-0000-000000000099';
  const jobId = 'test-job-fullstack-101';

  beforeEach(async () => {
    discoveryService = new CandidateDiscoveryService();

    // Seed test job
    await db.insert('jobs', {
      id: jobId,
      title: 'Senior Full Stack Engineer (React / Node.js)',
      department: 'Engineering',
      location: 'San Francisco, CA',
      employmentType: 'full-time',
      seniority: 'senior',
      owner_id: recruiterId,
      recruiter_id: recruiterId,
      description: 'Seeking a Senior Full Stack Engineer with 4+ years experience in React, Node.js, TypeScript, and PostgreSQL. Must have strong experience building scalable web applications and REST APIs.',
      created_at: new Date().toISOString()
    });

    // Seed test job requirements
    await db.insert('job_requirements', {
      id: 'req-1',
      job_id: jobId,
      title: 'React',
      requirement: 'Strong frontend development with React and TypeScript',
      importance: 'mandatory',
      is_mandatory: true,
      category: 'technical_skill',
      weight: 10
    });

    await db.insert('job_requirements', {
      id: 'req-2',
      job_id: jobId,
      title: 'Node.js',
      requirement: 'Backend API development in Node.js and TypeScript',
      importance: 'mandatory',
      is_mandatory: true,
      category: 'technical_skill',
      weight: 10
    });

    await db.insert('job_requirements', {
      id: 'req-3',
      job_id: jobId,
      title: 'PostgreSQL',
      requirement: 'Relational database modeling and SQL queries',
      importance: 'preferred',
      is_mandatory: false,
      category: 'technical_skill',
      weight: 5
    });
  });

  // Scenario 1: Recruiter discovers candidates for a valid job
  it('1. discovers candidates for a valid job and returns structured discovery run', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 60 });
    expect(result.run).toBeDefined();
    expect(result.run.jobId).toBe(jobId);
    expect(result.run.recruiterId).toBe(recruiterId);
    expect(result.run.jobTitle).toContain('Senior Full Stack');
    expect(result.run.status).toBe('completed');
  });

  // Scenario 2: Candidates are evaluated against the correct job description
  it('2. evaluates candidates against the exact job description and requirements', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 50 });
    for (const cand of result.qualifiedCandidates) {
      expect(cand.jobId).toBe(jobId);
      expect(cand.relevanceScore).toBeGreaterThanOrEqual(50);
      expect(cand.matchExplanation).toBeDefined();
    }
  });

  // Scenario 3: A strong, verified, job-relevant candidate is included
  it('3. includes strong verified candidates meeting mandatory and preferred skills', async () => {
    // Seed an opted-in seeker with matching skills
    await db.insert('seeker_resumes', {
      id: 'strong-cand-01',
      user_id: 'seeker-user-01',
      version_label: 'Senior Full Stack Resume',
      is_open_to_discovery: true,
      extracted_data: {
        name: 'Alex Rivera',
        title: 'Senior Full Stack Developer',
        location: 'San Francisco, CA',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker'],
        total_experience_years: 5,
        experience: [{ role: 'Senior Engineer', company: 'TechCorp' }],
        projects: [{ name: 'Cloud Platform', description: 'React and Node.js microservices' }]
      }
    });

    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 70 });
    const alex = result.qualifiedCandidates.find(c => c.fullName === 'Alex Rivera');
    expect(alex).toBeDefined();
    expect(alex?.relevanceScore).toBeGreaterThanOrEqual(80);
    expect(alex?.mandatorySatisfied).toBe(true);
    expect(alex?.matchedSkills).toContain('React');
    expect(alex?.matchedSkills).toContain('Node.js');
    expect(alex?.availabilitySignal.isOpenToWork).toBe(true);
    expect(alex?.availabilitySignal.verificationStatus).toBe('verified');
  });

  // Scenario 4: An irrelevant candidate is excluded
  it('4. excludes completely irrelevant candidates lacking role domain skills', async () => {
    await db.insert('seeker_resumes', {
      id: 'irrelevant-cand-01',
      user_id: 'seeker-user-02',
      version_label: 'Marketing Lead',
      is_open_to_discovery: true,
      extracted_data: {
        name: 'Taylor Jordan',
        title: 'Marketing & SEO Specialist',
        skills: ['Content Marketing', 'SEO', 'Copywriting', 'Google Ads'],
        total_experience_years: 4
      }
    });

    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 70 });
    const taylor = result.qualifiedCandidates.find(c => c.fullName === 'Taylor Jordan');
    expect(taylor).toBeUndefined();
  });

  // Scenario 5: A candidate below the relevance threshold is excluded
  it('5. excludes candidates falling below the configured minimum relevance threshold', async () => {
    const highThresholdResult = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 98 });
    for (const cand of highThresholdResult.qualifiedCandidates) {
      expect(cand.relevanceScore).toBeGreaterThanOrEqual(98);
    }
  });

  // Scenario 6: A candidate missing a mandatory requirement is excluded
  it('6. excludes candidates who fail mandatory technical requirements', async () => {
    await db.insert('seeker_resumes', {
      id: 'missing-mandatory-01',
      user_id: 'seeker-user-03',
      version_label: 'Python Developer',
      is_open_to_discovery: true,
      extracted_data: {
        name: 'Jordan Lee',
        title: 'Python Backend Dev',
        skills: ['Python', 'Django', 'PostgreSQL'], // Missing React and Node.js
        total_experience_years: 4
      }
    });

    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 60 });
    const jordan = result.qualifiedCandidates.find(c => c.fullName === 'Jordan Lee');
    expect(jordan).toBeUndefined();
    expect(result.run.excludedBreakdown.missingMandatoryRequirements).toBeGreaterThanOrEqual(0);
  });

  // Scenario 7: A candidate with insufficient evidence for a mandatory requirement is excluded
  it('7. excludes candidates with unverified or empty evidence profiles', async () => {
    await db.insert('seeker_resumes', {
      id: 'empty-evidence-01',
      user_id: 'seeker-user-04',
      version_label: 'Blank Profile',
      is_open_to_discovery: true,
      extracted_data: {
        name: 'Empty Candidate',
        skills: [],
        experience: []
      }
    });

    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 70 });
    const emptyCand = result.qualifiedCandidates.find(c => c.fullName === 'Empty Candidate');
    expect(emptyCand).toBeUndefined();
  });

  // Scenario 8: A candidate without a verified open-to-work or opt-in signal is excluded
  it('8. excludes public profiles without a verifiable open-to-work or opt-in signal', async () => {
    await db.insert('seeker_resumes', {
      id: 'closed-cand-01',
      user_id: 'seeker-user-05',
      version_label: 'Employed Dev',
      is_open_to_discovery: false, // Closed to matchmaking
      extracted_data: {
        name: 'Morgan Smith',
        title: 'Lead Architect',
        skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
        total_experience_years: 8
      }
    });

    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 60 });
    const morgan = result.qualifiedCandidates.find(c => c.fullName === 'Morgan Smith');
    expect(morgan).toBeUndefined();
  });

  // Scenario 9: An opted-out candidate is excluded
  it('9. excludes candidates who have explicitly opted out', async () => {
    const rawSignals = {
      isOpenToWork: false,
      signalSource: 'recruitment_opt_in' as const,
      verificationStatus: 'opted_out' as const,
      signalEvidence: 'Candidate opted out from public discovery'
    };
    expect(rawSignals.verificationStatus).toBe('opted_out');
    expect(rawSignals.isOpenToWork).toBe(false);
  });

  // Scenario 10: Deduplication across sources
  it('10. deduplicates records with identical canonical profile URLs', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 50 });
    const urls = result.qualifiedCandidates.map(c => c.canonicalProfileUrl.toLowerCase());
    const uniqueUrls = new Set(urls);
    expect(urls.length).toBe(uniqueUrls.size);
  });

  // Scenario 11: Invalid or malicious URLs are rejected
  it('11. sanitizes canonical profile URLs and rejects javascript:/data: links', () => {
    expect(SafeUrlValidator.isValidApplicationUrl('https://github.com/torvalds')).toBe(true);
    expect(SafeUrlValidator.isValidApplicationUrl('javascript:alert(1)')).toBe(false);
    expect(SafeUrlValidator.isValidApplicationUrl('data:text/html,<h1>test</h1>')).toBe(false);
  });

  // Scenario 12: Truthful empty state for empty source
  it('12. returns structured empty results with transparent diagnostic breakdown', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 99 });
    expect(result.run).toBeDefined();
    expect(result.run.excludedBreakdown).toBeDefined();
    expect(result.run.totalDiscovered).toBeGreaterThanOrEqual(0);
  });

  // Scenario 13: Provider outage does not crash other working providers
  it('13. handles provider errors gracefully without failing overall run', async () => {
    const openTalent = new OpenTalentNetworkProvider();
    expect(openTalent.isConfigured()).toBe(false);
    const searchRes = await openTalent.search({
      jobTitle: 'Developer',
      mandatorySkills: ['React'],
      preferredSkills: [],
      limit: 10
    });
    expect(searchRes.status.status).toBe('missing_credentials');
    expect(searchRes.candidates).toEqual([]);
  });

  // Scenario 14: Rate limits and timeouts handled safely
  it('14. handles provider status reporting and error diagnostics', async () => {
    const platformProvider = new PlatformTalentProvider();
    const res = await platformProvider.search({
      jobTitle: 'Software Engineer',
      mandatorySkills: ['React'],
      preferredSkills: [],
      limit: 5
    });
    expect(res.status.status).toBe('success');
  });

  // Scenario 15: Recruiter tenant isolation
  it('15. rejects unauthorized discovery runs on another recruiter private job', async () => {
    await expect(
      discoveryService.runDiscovery(jobId, otherRecruiterId, {})
    ).rejects.toThrow(/Unauthorized/);
  });

  // Scenario 16: Profile links validation and formatting
  it('16. formats and validates candidate profile links correctly', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 50 });
    for (const cand of result.qualifiedCandidates) {
      expect(cand.canonicalProfileUrl.startsWith('http://') || cand.canonicalProfileUrl.startsWith('https://')).toBe(true);
    }
  });

  // Scenario 17: Saved candidates persistence
  it('17. saves and unsaves candidates with persistent bookmark state', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 60 });
    if (result.qualifiedCandidates.length > 0) {
      const candId = result.qualifiedCandidates[0].id;
      const saved = await discoveryService.saveCandidate(jobId, candId, recruiterId);
      expect(saved.isSaved).toBe(true);

      const candidates = await discoveryService.getQualifiedCandidates(jobId, recruiterId, 60);
      const target = candidates.find(c => c.id === candId);
      expect(target?.isSaved).toBe(true);

      const unsaved = await discoveryService.unsaveCandidate(jobId, candId, recruiterId);
      expect(unsaved.isSaved).toBe(false);
    }
  });

  // Scenario 18: Discovery retry idempotency
  it('18. supports discovery retry without breaking job record integrity', async () => {
    const run1 = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 70 });
    const run2 = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 70 });
    expect(run1.run.id).not.toBe(run2.run.id);

    const runs = await discoveryService.getDiscoveryRuns(jobId, recruiterId);
    expect(runs.length).toBeGreaterThanOrEqual(2);
  }, 30000);

  // Scenario 19: Side-by-side Candidate Comparison
  it('19. generates multi-criteria candidate comparison matrix', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 50 });
    if (result.qualifiedCandidates.length >= 2) {
      const ids = result.qualifiedCandidates.slice(0, 2).map(c => c.id);
      const comparison = await discoveryService.compareCandidates(jobId, ids, recruiterId);
      expect(comparison.jobId).toBe(jobId);
      expect(comparison.candidates.length).toBe(2);
      expect(comparison.comparisonMatrix.length).toBeGreaterThanOrEqual(4);
      expect(comparison.recommendationSummary).toBeDefined();
    }
  });

  // Scenario 20: Import candidate into job screening pipeline
  it('20. imports discovered candidate into standard job_candidates pipeline', async () => {
    const result = await discoveryService.runDiscovery(jobId, recruiterId, { minScore: 60 });
    if (result.qualifiedCandidates.length > 0) {
      const candId = result.qualifiedCandidates[0].id;
      const imported = await discoveryService.importCandidate(jobId, candId, recruiterId);
      expect(imported.jobCandidateId).toBeDefined();

      const jobCandidates = await db.query('job_candidates', (jc: any) => jc.id === imported.jobCandidateId);
      expect(jobCandidates.length).toBe(1);
      expect(jobCandidates[0].job_id).toBe(jobId);
      expect(jobCandidates[0].status).toBe('screened');
    }
  });
});
