import { z } from 'zod';
import { AssessmentStatus, QuestionCategory, QuestionDifficulty, RequirementCategory, RequirementImportance } from '../constants';

export const AIRequirementExtractionOutputSchema = z.object({
  requirements: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      category: z.nativeEnum(RequirementCategory),
      importance: z.nativeEnum(RequirementImportance),
      weight: z.number().min(1).max(10),
      evidenceExpectations: z.string(),
      assessableFromResume: z.boolean()
    })
  )
});

export type AIRequirementExtractionOutput = z.infer<typeof AIRequirementExtractionOutputSchema>;

export const AIResumeParseOutputSchema = z.object({
  fullName: z.string(),
  email: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      title: z.string(),
      company: z.string(),
      location: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      description: z.string().optional(),
      highlights: z.array(z.string()).optional()
    })
  ),
  education: z.array(
    z.object({
      degree: z.string(),
      institution: z.string(),
      fieldOfStudy: z.string().optional(),
      graduationYear: z.string().optional()
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()).optional()
    })
  ),
  certifications: z.array(z.string()).optional(),
  totalExperienceYears: z.number().optional()
});

export type AIResumeParseOutput = z.infer<typeof AIResumeParseOutputSchema>;

export const AIEvaluationOutputSchema = z.object({
  summary: z.string(),
  requirementAssessments: z.array(
    z.object({
      requirementId: z.string(),
      status: z.nativeEnum(AssessmentStatus),
      evidenceScore: z.number().min(0).max(1),
      evidenceText: z.string(),
      reasoningSummary: z.string(),
      confidence: z.number().min(0).max(1)
    })
  ),
  uncertainties: z.array(z.string()),
  suggestedInterviewTopics: z.array(z.string())
});

export type AIEvaluationOutput = z.infer<typeof AIEvaluationOutputSchema>;

export const AIInterviewQuestionsOutputSchema = z.object({
  questions: z.array(
    z.object({
      requirementId: z.string().optional().nullable(),
      category: z.nativeEnum(QuestionCategory),
      questionText: z.string(),
      relevanceReason: z.string(),
      relatedProject: z.string().optional().nullable(),
      relatedSkills: z.array(z.string()).default([]),
      relatedRequirement: z.string().optional().nullable(),
      resumeEvidence: z.string().optional().nullable(),
      jobDescriptionEvidence: z.string().optional().nullable(),
      expectedAnswerSignals: z.array(z.string()),
      followUpQuestions: z.array(z.string()),
      difficulty: z.nativeEnum(QuestionDifficulty),
      evaluationRubric: z.object({
        poor: z.string(),
        adequate: z.string(),
        strong: z.string()
      })
    })
  )
});

export type AIInterviewQuestionsOutput = z.infer<typeof AIInterviewQuestionsOutputSchema>;
