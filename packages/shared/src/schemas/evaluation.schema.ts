import { z } from 'zod';
import { AssessmentStatus, EvaluationStatus } from '../constants';

export const RequirementAssessmentSchema = z.object({
  requirementId: z.string(),
  status: z.nativeEnum(AssessmentStatus),
  evidenceScore: z.number().min(0).max(1),
  evidenceText: z.string().default(''),
  sourcePage: z.number().optional().nullable(),
  reasoningSummary: z.string().default(''),
  confidence: z.number().min(0).max(1).default(0.8),
  reviewStatus: z.enum(['pending_review', 'verified', 'disputed']).default('pending_review')
});

export type RequirementAssessment = z.infer<typeof RequirementAssessmentSchema>;

export const EvaluationResultSchema = z.object({
  id: z.string().optional(),
  jobCandidateId: z.string(),
  requirementVersionId: z.string(),
  overallScore: z.number().min(0).max(100),
  coveragePercentage: z.number().min(0).max(100),
  essentialCoveragePercentage: z.number().min(0).max(100),
  matchingMethod: z.enum(['deterministic', 'hybrid_ai', 'ai_enhanced']),
  evaluationStatus: z.nativeEnum(EvaluationStatus).default('completed'),
  assessments: z.array(RequirementAssessmentSchema),
  calculationExplanation: z.string().optional(),
  summary: z.string().optional().default(''),
  uncertainties: z.array(z.string()).optional().default([]),
  suggestedInterviewTopics: z.array(z.string()).optional().default([]),
  modelMetadata: z.record(z.any()).optional().default({})
});

export type EvaluationResult = z.infer<typeof EvaluationResultSchema>;
