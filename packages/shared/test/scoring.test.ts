import { describe, it, expect } from 'vitest';
import { calculateEvaluationScore } from '../src/scoring';
import { JobRequirement } from '../src/schemas/job.schema';
import { RequirementAssessment } from '../src/schemas/evaluation.schema';

describe('Scoring Engine (FR-07)', () => {
  const sampleRequirements: JobRequirement[] = [
    {
      id: 'req-1',
      text: '5+ years experience with React and TypeScript',
      category: 'technical_skill',
      importance: 'essential',
      weight: 10,
      evidenceExpectations: 'React, Redux or Context, TypeScript',
      assessableFromResume: true
    },
    {
      id: 'req-2',
      text: 'Experience with Node.js and REST APIs',
      category: 'technical_skill',
      importance: 'essential',
      weight: 8,
      evidenceExpectations: 'Express, Fastify or NestJS',
      assessableFromResume: true
    },
    {
      id: 'req-3',
      text: 'Experience with Docker and CI/CD',
      category: 'technical_skill',
      importance: 'preferred',
      weight: 4,
      evidenceExpectations: 'Docker, GitHub Actions',
      assessableFromResume: true
    },
    {
      id: 'req-4',
      text: 'Excellent verbal communication and team leadership',
      category: 'responsibility',
      importance: 'preferred',
      weight: 5,
      evidenceExpectations: 'Validate in interview',
      assessableFromResume: false
    }
  ];

  it('calculates 100% when all assessable requirements are demonstrated', () => {
    const assessments: RequirementAssessment[] = [
      { requirementId: 'req-1', status: 'demonstrated', evidenceScore: 1.0, evidenceText: '8 years React/TS at Tech Corp', reasoningSummary: 'Extensive proven track record', confidence: 0.95, reviewStatus: 'verified' },
      { requirementId: 'req-2', status: 'demonstrated', evidenceScore: 1.0, evidenceText: 'Built Node.js microservices', reasoningSummary: 'Strong backend evidence', confidence: 0.9, reviewStatus: 'verified' },
      { requirementId: 'req-3', status: 'demonstrated', evidenceScore: 1.0, evidenceText: 'Docker and GitHub Actions in daily workflow', reasoningSummary: 'Clear DevOps experience', confidence: 0.85, reviewStatus: 'verified' }
    ];

    const result = calculateEvaluationScore(sampleRequirements, assessments);
    expect(result.overallScore).toBe(100);
    expect(result.coveragePercentage).toBe(100);
    expect(result.essentialCoveragePercentage).toBe(100);
    expect(result.totalAssessableWeight).toBe(22); // 10 + 8 + 4 (req-4 excluded because assessableFromResume = false)
    expect(result.earnedWeight).toBe(22);
    expect(result.demonstratedCount).toBe(3);
  });

  it('correctly weights partial and missing matches', () => {
    const assessments: RequirementAssessment[] = [
      { requirementId: 'req-1', status: 'demonstrated', evidenceScore: 1.0, evidenceText: 'Senior React Engineer', reasoningSummary: 'Full match', confidence: 0.9, reviewStatus: 'verified' },
      { requirementId: 'req-2', status: 'partial', evidenceScore: 0.5, evidenceText: 'Built small Node script', reasoningSummary: 'Partial experience only', confidence: 0.7, reviewStatus: 'pending_review' },
      { requirementId: 'req-3', status: 'not_evidenced', evidenceScore: 0.0, evidenceText: '', reasoningSummary: 'No mention of Docker', confidence: 0.9, reviewStatus: 'pending_review' }
    ];

    const result = calculateEvaluationScore(sampleRequirements, assessments);
    // Earned: (10 * 1.0) + (8 * 0.5) + (4 * 0.0) = 10 + 4 = 14
    // Total assessable weight = 22
    // Score = (14 / 22) * 100 = 63.636... -> 63.6
    expect(result.overallScore).toBe(63.6);
    // Covered assessable count = 2 (req-1 demonstrated, req-2 partial) out of 3 assessable = 66.7%
    expect(result.coveragePercentage).toBe(66.7);
    // Essential: 2 essential criteria (req-1 and req-2). Both are covered (demonstrated or partial) = 100%
    expect(result.essentialCoveragePercentage).toBe(100);
    expect(result.demonstratedCount).toBe(1);
    expect(result.partialCount).toBe(1);
    expect(result.notEvidencedCount).toBe(2); // req-3 and req-4
  });

  it('bounds score cleanly between 0 and 100 on edge cases', () => {
    const zeroResult = calculateEvaluationScore(sampleRequirements, []);
    expect(zeroResult.overallScore).toBe(0);
    expect(zeroResult.coveragePercentage).toBe(0);

    const emptyResult = calculateEvaluationScore([], []);
    expect(emptyResult.overallScore).toBe(0);
    expect(emptyResult.coveragePercentage).toBe(0);
  });
});
