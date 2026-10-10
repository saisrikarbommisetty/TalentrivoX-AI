import { z } from 'zod';
import { QuestionCategory, QuestionDifficulty } from '../constants';

export const InterviewQuestionSchema = z.object({
  id: z.string().optional(),
  interviewPlanId: z.string().optional(),
  requirementId: z.string().optional().nullable(),
  category: z.nativeEnum(QuestionCategory),
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  relevanceReason: z.string().default(''),
  relatedProject: z.string().optional().nullable(),
  relatedSkills: z.array(z.string()).default([]),
  relatedRequirement: z.string().optional().nullable(),
  resumeEvidence: z.string().optional().nullable(),
  jobDescriptionEvidence: z.string().optional().nullable(),
  expectedAnswerSignals: z.array(z.string()).default([]),
  followUpQuestions: z.array(z.string()).default([]),
  difficulty: z.nativeEnum(QuestionDifficulty).default('mid'),
  evaluationRubric: z.object({
    poor: z.string().default('No clear understanding or relevant examples provided'),
    adequate: z.string().default('Demonstrates basic knowledge with standard examples'),
    strong: z.string().default('Demonstrates deep mastery, nuance, and proactive problem solving')
  }).default({
    poor: 'No clear understanding or relevant examples provided',
    adequate: 'Demonstrates basic knowledge with standard examples',
    strong: 'Demonstrates deep mastery, nuance, and proactive problem solving'
  }),
  sortOrder: z.number().default(0)
});

export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;

export const InterviewPlanSchema = z.object({
  id: z.string().optional(),
  jobCandidateId: z.string(),
  evaluationId: z.string().optional().nullable(),
  title: z.string().min(2),
  status: z.enum(['draft', 'approved', 'in_progress', 'completed']).default('draft'),
  questions: z.array(InterviewQuestionSchema),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional()
});

export type InterviewPlan = z.infer<typeof InterviewPlanSchema>;

export const UpdateInterviewPlanSchema = z.object({
  title: z.string().optional(),
  status: z.enum(['draft', 'approved', 'in_progress', 'completed']).optional(),
  questions: z.array(InterviewQuestionSchema).optional()
});

export type UpdateInterviewPlanInput = z.infer<typeof UpdateInterviewPlanSchema>;

export const InterviewFeedbackSchema = z.object({
  questionId: z.string(),
  rating: z.number().min(1).max(5),
  notes: z.string().default('')
});

export const CreateInterviewSessionSchema = z.object({
  scheduledAt: z.string().optional(),
  interviewerNotes: z.string().optional().default(''),
  feedback: z.array(InterviewFeedbackSchema).default([])
});

export type CreateInterviewSessionInput = z.infer<typeof CreateInterviewSessionSchema>;
