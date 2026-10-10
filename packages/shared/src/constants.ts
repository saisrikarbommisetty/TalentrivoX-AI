export const RequirementCategory = {
  TECHNICAL_SKILL: 'technical_skill',
  DOMAIN_KNOWLEDGE: 'domain_knowledge',
  EXPERIENCE: 'experience',
  EDUCATION: 'education',
  CERTIFICATION: 'certification',
  RESPONSIBILITY: 'responsibility'
} as const;

export type RequirementCategoryType = typeof RequirementCategory[keyof typeof RequirementCategory];

export const RequirementImportance = {
  ESSENTIAL: 'essential',
  PREFERRED: 'preferred'
} as const;

export type RequirementImportanceType = typeof RequirementImportance[keyof typeof RequirementImportance];

export const AssessmentStatus = {
  DEMONSTRATED: 'demonstrated',
  PARTIAL: 'partial',
  NOT_EVIDENCED: 'not_evidenced',
  NEEDS_REVIEW: 'needs_review'
} as const;

export type AssessmentStatusType = typeof AssessmentStatus[keyof typeof AssessmentStatus];

export const ExtractionStatus = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  NEEDS_OCR: 'needs_ocr'
} as const;

export type ExtractionStatusType = typeof ExtractionStatus[keyof typeof ExtractionStatus];

export const EvaluationStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed'
} as const;

export type EvaluationStatusType = typeof EvaluationStatus[keyof typeof EvaluationStatus];

export const CandidateWorkflowStatus = {
  AWAITING_REVIEW: 'awaiting_review',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_PLANNED: 'interview_planned',
  INTERVIEW_COMPLETED: 'interview_completed',
  OFFER_EXTENDED: 'offer_extended',
  REJECTED: 'rejected'
} as const;

export type CandidateWorkflowStatusType = typeof CandidateWorkflowStatus[keyof typeof CandidateWorkflowStatus];

export const QuestionCategory = {
  TECHNICAL_KNOWLEDGE: 'technical_knowledge',
  PRACTICAL_PROBLEM_SOLVING: 'practical_problem_solving',
  BEHAVIORAL_SITUATIONAL: 'behavioral_situational',
  PROJECT_VERIFICATION: 'project_verification',
  SKILL_GAP_VALIDATION: 'skill_gap_validation',
  ROLE_SPECIFIC_SCENARIOS: 'role_specific_scenarios',
  HR_COMMUNICATION: 'hr_communication',
  ROLE_FUNDAMENTALS: 'role_fundamentals'
} as const;

export type QuestionCategoryType = typeof QuestionCategory[keyof typeof QuestionCategory];

export const QuestionDifficulty = {
  JUNIOR: 'junior',
  MID: 'mid',
  SENIOR: 'senior',
  LEAD: 'lead'
} as const;

export type QuestionDifficultyType = typeof QuestionDifficulty[keyof typeof QuestionDifficulty];

// User Roles
export const UserRole = {
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  JOB_SEEKER: 'job_seeker',
  ADMIN: 'admin'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

// Job Seeker Application Pipeline Statuses
export const ApplicationStatus = {
  DISCOVERED: 'discovered',
  SAVED: 'saved',
  INTERESTED: 'interested',
  PREPARING: 'preparing',
  APPLIED: 'applied',
  ASSESSMENT: 'assessment',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
} as const;

export type ApplicationStatusType = typeof ApplicationStatus[keyof typeof ApplicationStatus];

// Skill Roadmap Task Statuses
export const RoadmapTaskStatus = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed'
} as const;

export type RoadmapTaskStatusType = typeof RoadmapTaskStatus[keyof typeof RoadmapTaskStatus];

// Deterministic Evidence Scores
export const EVIDENCE_SCORES: Record<AssessmentStatusType, number> = {
  demonstrated: 1.0,
  partial: 0.5,
  not_evidenced: 0.0,
  needs_review: 0.25
};
