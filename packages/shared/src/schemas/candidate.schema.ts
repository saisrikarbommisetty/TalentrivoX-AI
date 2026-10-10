import { z } from 'zod';
import { ExtractionStatus, CandidateWorkflowStatus } from '../constants';

export const CandidateExperienceItemSchema = z.object({
  title: z.string(),
  company: z.string(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional().default([])
});

export const CandidateEducationItemSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  fieldOfStudy: z.string().optional(),
  graduationYear: z.string().optional()
});

export const CandidateProjectItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()).optional().default([])
});

export const ExtractedResumeDataSchema = z.object({
  fullName: z.string().default('Candidate'),
  email: z.string().email().optional().or(z.literal('')).or(z.null()),
  phone: z.string().optional().or(z.null()),
  summary: z.string().optional().default(''),
  skills: z.array(z.string()).default([]),
  experience: z.array(CandidateExperienceItemSchema).default([]),
  education: z.array(CandidateEducationItemSchema).default([]),
  projects: z.array(CandidateProjectItemSchema).default([]),
  certifications: z.array(z.string()).default([]),
  rawText: z.string().default(''),
  totalExperienceYears: z.number().optional()
});

export type ExtractedResumeData = z.infer<typeof ExtractedResumeDataSchema>;
export type CandidateExperienceItem = z.infer<typeof CandidateExperienceItemSchema>;
export type CandidateEducationItem = z.infer<typeof CandidateEducationItemSchema>;
export type CandidateProjectItem = z.infer<typeof CandidateProjectItemSchema>;

export const UpdateCandidateReviewSchema = z.object({
  status: z.nativeEnum(CandidateWorkflowStatus),
  notes: z.string().optional().default('')
});

export type UpdateCandidateReviewInput = z.infer<typeof UpdateCandidateReviewSchema>;
