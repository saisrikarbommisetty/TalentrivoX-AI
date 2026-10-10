import { describe, it, expect } from 'vitest';
import { DeterministicMatchingEngine } from '../../src/matching/deterministic.engine.js';
import { SkillNormalizer } from '../../src/matching/skill.normalizer.js';
import { calculateEvaluationScore, JobRequirement, ExtractedResumeData } from '@avengercoders/shared';

describe('Deterministic Scoring & Matching Engine Unit Tests', () => {
  const engine = new DeterministicMatchingEngine();

  it('normalizes skill aliases and extracts requirement keywords correctly', () => {
    expect(SkillNormalizer.normalize('React.js')).toBe('React');
    expect(SkillNormalizer.normalize('k8s')).toBe('Kubernetes');
    expect(SkillNormalizer.normalize('golang')).toBe('Go');
    expect(SkillNormalizer.normalize('psql')).toBe('PostgreSQL');

    const keywords = SkillNormalizer.extractRequirementKeywords('5+ years of production experience in React and PostgreSQL');
    expect(keywords).toContain('react');
    expect(keywords).toContain('postgresql');
  });

  it('evaluates candidate resume evidence against essential and non-essential criteria', () => {
    const requirements: JobRequirement[] = [
      {
        id: 'req-1',
        text: '5+ years experience building React frontend applications',
        importance: 'essential',
        weight: 60,
        assessableFromResume: true
      },
      {
        id: 'req-2',
        text: 'Experience with Kubernetes deployment and container orchestration',
        importance: 'desirable',
        weight: 40,
        assessableFromResume: true
      }
    ];

    const resumeData: ExtractedResumeData = {
      fullName: 'Sarah Jenkins',
      email: 'sarah@example.com',
      skills: ['react', 'typescript', 'javascript', 'html', 'css'],
      experienceYears: 6,
      rawText: 'Senior Software Engineer with 6 years building production React and TypeScript applications. Managed UI state and optimized performance.'
    };

    const evaluation = engine.evaluate('candidate-1', 'req-ver-1', requirements, resumeData);

    expect(evaluation.overallScore).toBeGreaterThanOrEqual(50);
    expect(evaluation.assessments.length).toBe(2);

    const reactAssessment = evaluation.assessments.find((a) => a.requirementId === 'req-1');
    expect(reactAssessment?.status).toBe('demonstrated');
    expect(reactAssessment?.evidenceText).toContain('React');

    const k8sAssessment = evaluation.assessments.find((a) => a.requirementId === 'req-2');
    expect(k8sAssessment?.status).toBe('not_evidenced');
  });

  it('calculates weighted composite evaluation score deterministically', () => {
    const requirements: JobRequirement[] = [
      { id: '1', text: 'Node.js', importance: 'essential', weight: 70, assessableFromResume: true },
      { id: '2', text: 'Redis caching', importance: 'desirable', weight: 30, assessableFromResume: true }
    ];

    const assessments = [
      {
        requirementId: '1',
        status: 'demonstrated' as const,
        evidenceScore: 1.0,
        evidenceText: 'Expert Node.js developer',
        reasoningSummary: 'Demonstrated in resume',
        confidence: 1.0,
        reviewStatus: 'verified' as const
      },
      {
        requirementId: '2',
        status: 'partial' as const,
        evidenceScore: 0.5,
        evidenceText: 'Used caching solutions',
        reasoningSummary: 'Partial evidence found',
        confidence: 0.8,
        reviewStatus: 'pending_review' as const
      }
    ];

    const result = calculateEvaluationScore(requirements, assessments);
    // 1.0 * 70 + 0.5 * 30 = 70 + 15 = 85 out of 100
    expect(result.overallScore).toBe(85);
    expect(result.demonstratedCount).toBe(1);
    expect(result.partialCount).toBe(1);
    expect(result.coveragePercentage).toBe(100);
  });
});
