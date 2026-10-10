import { z } from 'zod';
import {
  RequirementCategory,
  RequirementImportance,
  AssessmentStatus,
  QuestionCategory,
  QuestionDifficulty,
  ApplicationStatus,
  RoadmapTaskStatus,
  ExtractionStatus
} from '../constants';
import { ExtractedResumeDataSchema } from './candidate.schema';
import { JobRequirementSchema } from './job.schema';

// 1. Personal Resume Management
export const SeekerResumeSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  fileName: z.string(),
  fileSize: z.number(),
  fileType: z.string(),
  storagePath: z.string(),
  versionLabel: z.string(),
  isActive: z.boolean(),
  extractionStatus: z.nativeEnum(ExtractionStatus),
  extractedText: z.string().optional(),
  parsedData: ExtractedResumeDataSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SeekerResume = z.infer<typeof SeekerResumeSchema>;

// 2. Saved Target Jobs
export const SeekerSavedJobSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  jobUrl: z.string().optional(),
  description: z.string(),
  requirements: z.array(JobRequirementSchema).optional(),
  notes: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SeekerSavedJob = z.infer<typeof SeekerSavedJobSchema>;

// 3. Match & Gap Analysis
export const SeekerSkillMatchItemSchema = z.object({
  requirementId: z.string(),
  requirementText: z.string(),
  category: z.nativeEnum(RequirementCategory),
  importance: z.nativeEnum(RequirementImportance),
  weight: z.number(),
  status: z.nativeEnum(AssessmentStatus),
  evidenceScore: z.number(),
  resumeEvidenceText: z.string(),
  gapExplanation: z.string(),
  recommendation: z.string()
});

export type SeekerSkillMatchItem = z.infer<typeof SeekerSkillMatchItemSchema>;

export const SeekerAnalysisResultSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  resumeId: z.string().uuid(),
  resumeVersionLabel: z.string(),
  targetJobTitle: z.string(),
  targetCompany: z.string().optional(),
  savedJobId: z.string().uuid().optional().nullable(),
  overallScore: z.number().min(0).max(100),
  essentialScore: z.number().min(0).max(100),
  preferredScore: z.number().min(0).max(100),
  coveragePercentage: z.number().min(0).max(100),
  summary: z.string(),
  matches: z.array(SeekerSkillMatchItemSchema),
  strengths: z.array(z.string()),
  criticalGaps: z.array(z.string()),
  missingEvidenceOpportunities: z.array(z.string()),
  actionableRecommendations: z.array(z.string()),
  createdAt: z.string()
});

export type SeekerAnalysisResult = z.infer<typeof SeekerAnalysisResultSchema>;

// 4. Resume Improvement Suggestions
export const ResumeImprovementSuggestionSchema = z.object({
  id: z.string(),
  section: z.enum(['summary', 'experience', 'projects', 'skills', 'education', 'structure']),
  targetRequirementText: z.string().optional(),
  originalSnippet: z.string(),
  suggestedRevision: z.string(),
  improvementReason: z.string(),
  starContextGuide: z.string().optional(),
  isAccepted: z.boolean().default(false)
});

export type ResumeImprovementSuggestion = z.infer<typeof ResumeImprovementSuggestionSchema>;

export const SeekerResumeImprovementPlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  resumeId: z.string().uuid(),
  targetJobTitle: z.string(),
  suggestions: z.array(ResumeImprovementSuggestionSchema),
  structuredEditorContent: z.record(z.any()).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SeekerResumeImprovementPlan = z.infer<typeof SeekerResumeImprovementPlanSchema>;

// 5. ATS Quality Report
export const AtsQualityCheckItemSchema = z.object({
  id: z.string(),
  category: z.enum(['formatting', 'keywords', 'sections', 'readability', 'contact_info']),
  title: z.string(),
  status: z.enum(['passed', 'warning', 'failed']),
  detail: z.string(),
  remediation: z.string()
});

export type AtsQualityCheckItem = z.infer<typeof AtsQualityCheckItemSchema>;

export const AtsQualityReportSchema = z.object({
  score: z.number().min(0).max(100),
  rating: z.enum(['excellent', 'good', 'needs_improvement', 'poor']),
  keywordMatchRate: z.number().min(0).max(100),
  extractedKeywordCount: z.number(),
  missingTargetKeywords: z.array(z.string()),
  checks: z.array(AtsQualityCheckItemSchema),
  summaryAdvice: z.string()
});

export type AtsQualityReport = z.infer<typeof AtsQualityReportSchema>;

// 6. Interview Preparation & Mock Sessions
export const SeekerPracticeQuestionSchema = z.object({
  id: z.string(),
  category: z.nativeEnum(QuestionCategory),
  difficulty: z.nativeEnum(QuestionDifficulty),
  questionText: z.string(),
  competencyAssessed: z.string(),
  relevanceReason: z.string(),
  relatedProject: z.string().optional().nullable(),
  relatedSkills: z.array(z.string()).default([]),
  relatedRequirement: z.string().optional().nullable(),
  resumeEvidence: z.string().optional().nullable(),
  jobDescriptionEvidence: z.string().optional().nullable(),
  expectedSignals: z.array(z.string()),
  followUpQuestions: z.array(z.string()).optional(),
  suggestedAnswerStructure: z.string(),
  selfRubric: z.object({
    poor: z.string(),
    adequate: z.string(),
    strong: z.string()
  }),
  userNotes: z.string().optional()
});

export type SeekerPracticeQuestion = z.infer<typeof SeekerPracticeQuestionSchema>;

export const SeekerMockSessionAnswerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  userAnswer: z.string(),
  score: z.number().min(1).max(5),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  modelAnswerGuidance: z.string(),
  timeSpentSeconds: z.number().optional()
});

export type SeekerMockSessionAnswer = z.infer<typeof SeekerMockSessionAnswerSchema>;

export const SeekerMockSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  targetJobTitle: z.string(),
  questions: z.array(SeekerPracticeQuestionSchema),
  answers: z.array(SeekerMockSessionAnswerSchema),
  currentQuestionIndex: z.number().default(0),
  isCompleted: z.boolean().default(false),
  overallScore: z.number().optional(),
  overallFeedback: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SeekerMockSession = z.infer<typeof SeekerMockSessionSchema>;

// 7. Skill Development Roadmap
export const SeekerRoadmapTaskSchema = z.object({
  id: z.string().uuid(),
  skillName: z.string(),
  category: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  gapType: z.enum(['missing_evidence', 'development_need', 'deepening']),
  whyItMatters: z.string(),
  recommendedActivity: z.string(),
  practicalProjectIdea: z.string(),
  interviewValidationTask: z.string(),
  status: z.nativeEnum(RoadmapTaskStatus),
  targetDate: z.string().optional(),
  userNotes: z.string().optional(),
  completedAt: z.string().optional()
});

export type SeekerRoadmapTask = z.infer<typeof SeekerRoadmapTaskSchema>;

export const SeekerSkillRoadmapSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  targetJobTitle: z.string(),
  tasks: z.array(SeekerRoadmapTaskSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SeekerSkillRoadmap = z.infer<typeof SeekerSkillRoadmapSchema>;

// 8. Job Application Tracker
export const SeekerJobApplicationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  company: z.string(),
  jobTitle: z.string(),
  location: z.string().optional(),
  jobUrl: z.string().optional(),
  salaryRange: z.string().optional(),
  status: z.nativeEnum(ApplicationStatus),
  appliedDate: z.string().optional(),
  resumeId: z.string().uuid().optional().nullable(),
  resumeVersionLabel: z.string().optional(),
  analysisId: z.string().uuid().optional().nullable(),
  matchScore: z.number().optional(),
  nextStep: z.string().optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  activityLog: z.array(
    z.object({
      timestamp: z.string(),
      status: z.nativeEnum(ApplicationStatus),
      note: z.string()
    })
  ).default([]),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SeekerJobApplication = z.infer<typeof SeekerJobApplicationSchema>;
