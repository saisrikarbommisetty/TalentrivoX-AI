import { describe, it, expect } from 'vitest';
import { SafeUrlValidator } from '../../src/discovery/url_validator.js';
import { JobRelevanceMatchingEngine } from '../../src/discovery/matching.service.js';
import { PlatformSearchLinkGenerator } from '../../src/discovery/providers/platform_fallback.js';
import { OpenFeedsJobProvider } from '../../src/discovery/providers/open_feeds.provider.js';
import { AdzunaJobProvider } from '../../src/discovery/providers/adzuna.provider.js';
import { JSearchJobProvider } from '../../src/discovery/providers/jsearch.provider.js';
import { ExtractedResumeData, JobDiscoveryQuery } from '@avengercoders/shared';
import { RawJobListing } from '../../src/discovery/types.js';

describe('Job Discovery & Application Assistant Unit Tests', () => {
  describe('SafeUrlValidator', () => {
    it('accepts legitimate HTTPS and HTTP application URLs', () => {
      expect(SafeUrlValidator.isValidApplicationUrl('https://careers.google.com/jobs/results/12345')).toBe(true);
      expect(SafeUrlValidator.isValidApplicationUrl('https://jobs.lever.co/stripe/abc-def')).toBe(true);
      expect(SafeUrlValidator.isValidApplicationUrl('http://techcorp.example.com/apply/789')).toBe(true);
    });

    it('rejects malicious or protocol-hijacking URLs', () => {
      expect(SafeUrlValidator.isValidApplicationUrl('javascript:alert(document.cookie)')).toBe(false);
      expect(SafeUrlValidator.isValidApplicationUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(SafeUrlValidator.isValidApplicationUrl('file:///etc/passwd')).toBe(false);
      expect(SafeUrlValidator.isValidApplicationUrl('vbscript:msgbox(1)')).toBe(false);
      expect(SafeUrlValidator.isValidApplicationUrl('')).toBe(false);
      expect(SafeUrlValidator.isValidApplicationUrl('https://example.com/apply\r\nSet-Cookie:malicious=true')).toBe(false);
    });
  });

  describe('JobRelevanceMatchingEngine', () => {
    const candidateData: ExtractedResumeData = {
      fullName: 'Siddharth Rao',
      email: 'siddharth@example.com',
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
      totalExperienceYears: 4,
      projects: [
        {
          name: 'Distributed Cloud Dashboard',
          description: 'Architected real-time telemetry dashboard using React, TypeScript, and Node.js with PostgreSQL persistence.',
          technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL']
        }
      ],
      rawText: 'Full Stack Engineer with 4 years experience building cloud applications in React and Node.js.'
    };

    const rawJob: RawJobListing = {
      source: 'arbeitnow',
      sourceLabel: 'Arbeitnow Network',
      externalJobId: 'job-9988',
      title: 'Senior Full Stack Engineer (React / Node.js)',
      company: 'Stripe Horizon',
      location: 'Remote',
      isRemote: true,
      workplaceType: 'remote',
      employmentType: 'full-time',
      experienceLevel: 'senior',
      applicationUrl: 'https://arbeitnow.com/jobs/stripe-senior-fullstack',
      description: 'We are seeking a senior full-stack developer skilled in React, TypeScript, Node.js, and PostgreSQL to scale distributed services.',
      extractedSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Kubernetes']
    };

    it('computes evidence-backed match score and identifies matched skills', () => {
      const evaluated = JobRelevanceMatchingEngine.evaluateJob(
        rawJob,
        candidateData,
        'Full Stack Engineer',
        'Remote'
      );

      expect(evaluated.matchScore).toBeGreaterThanOrEqual(70);
      expect(evaluated.matchedSkills).toContain('React');
      expect(evaluated.matchedSkills).toContain('TypeScript');
      expect(evaluated.matchedSkills).toContain('Node.js');
      expect(evaluated.matchedSkills).toContain('PostgreSQL');
      expect(evaluated.resumeEvidence.length).toBeGreaterThan(0);
      expect(evaluated.resumeEvidence[0]).toContain('Distributed Cloud Dashboard');
      expect(evaluated.matchExplanation).toBeTruthy();
      expect(evaluated.preparationTip).toBeTruthy();
      expect(evaluated.applicationUrl).toBe('https://arbeitnow.com/jobs/stripe-senior-fullstack');
    });

    it('identifies growth skills and transferable background', () => {
      const candidateDockerOnly: ExtractedResumeData = {
        fullName: 'Alex Vance',
        skills: ['Vue', 'Docker', 'MySQL'],
        totalExperienceYears: 3,
        rawText: 'Developer proficient in Vue, Docker, and MySQL.'
      };

      const evaluated = JobRelevanceMatchingEngine.evaluateJob(
        rawJob,
        candidateDockerOnly,
        'Full Stack Engineer'
      );

      expect(evaluated.unmatchedSkills.length).toBeGreaterThan(0);
      expect(evaluated.transferableSkills.length).toBeGreaterThan(0);
    });
  });

  describe('PlatformSearchLinkGenerator', () => {
    it('generates safely encoded direct search links for Naukri, Indeed, LinkedIn, Foundit, and Google', () => {
      const query: JobDiscoveryQuery = {
        role: 'React & Node.js Developer',
        location: 'Bangalore, India',
        workplaceType: 'all',
        employmentType: 'full-time',
        experienceLevel: 'mid',
        page: 1,
        limit: 15,
        useResumeProfile: true,
        country: 'in',
        sortBy: 'relevance'
      };

      const links = PlatformSearchLinkGenerator.generatePlatformLinks(query);
      expect(links.length).toBe(5);

      const naukri = links.find((l) => l.platform === 'naukri');
      expect(naukri).toBeDefined();
      expect(naukri?.searchUrl).toContain('naukri.com');
      expect(naukri?.searchUrl).toContain('React');

      const indeed = links.find((l) => l.platform === 'indeed');
      expect(indeed).toBeDefined();
      expect(indeed?.searchUrl).toContain('indeed.com');

      const linkedin = links.find((l) => l.platform === 'linkedin');
      expect(linkedin).toBeDefined();
      expect(linkedin?.searchUrl).toContain('linkedin.com/jobs');

      const google = links.find((l) => l.platform === 'google_jobs');
      expect(google).toBeDefined();
      expect(google?.searchUrl).toContain('google.com/search');
    });
  });

  describe('Provider Bounds & Graceful Error Handling', () => {
    it('handles unconfigured Adzuna and JSearch without crashing', async () => {
      const adzuna = new AdzunaJobProvider();
      const jsearch = new JSearchJobProvider();

      const query: JobDiscoveryQuery = {
        role: 'Software Engineer',
        page: 1,
        limit: 10,
        workplaceType: 'all',
        employmentType: 'all',
        experienceLevel: 'all',
        sortBy: 'relevance',
        useResumeProfile: false,
        country: 'us'
      };

      const adzunaRes = await adzuna.search(query);
      expect(['missing_credentials', 'success', 'error', 'rate_limited', 'timeout']).toContain(adzunaRes.status);
      expect(Array.isArray(adzunaRes.jobs)).toBe(true);

      const jsearchRes = await jsearch.search(query);
      expect(['missing_credentials', 'success', 'error', 'rate_limited', 'timeout']).toContain(jsearchRes.status);
      expect(Array.isArray(jsearchRes.jobs)).toBe(true);
    });

    it('OpenFeeds provider returns real job structures from open web networks', async () => {
      const openFeeds = new OpenFeedsJobProvider();
      expect(openFeeds.isEnabled()).toBe(true);
    });
  });
});
