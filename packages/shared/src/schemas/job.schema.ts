import { z } from 'zod';
import { RequirementCategory, RequirementImportance } from '../constants';

export const JobRequirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(2, 'Requirement description is required'),
  category: z.nativeEnum(RequirementCategory).default('technical_skill'),
  importance: z.nativeEnum(RequirementImportance).default('essential'),
  weight: z.number().min(1).max(10).default(5),
  evidenceExpectations: z.string().optional().default(''),
  assessableFromResume: z.boolean().default(true)
});

export type JobRequirement = z.infer<typeof JobRequirementSchema>;

export const CreateJobSchema = z.object({
  title: z.string().min(2, 'Job title is required'),
  department: z.string().min(1, 'Department is required'),
  location: z.string().min(1, 'Location is required'),
  employmentType: z.enum(['full-time', 'part-time', 'contract', 'remote', 'hybrid', 'internship']).default('full-time'),
  seniority: z.enum(['entry', 'mid', 'senior', 'lead', 'executive']).default('mid'),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(JobRequirementSchema).default([])
});

export type CreateJobInput = z.infer<typeof CreateJobSchema>;

export const UpdateJobSchema = CreateJobSchema.partial().extend({
  status: z.enum(['active', 'archived', 'closed']).optional()
});

export type UpdateJobInput = z.infer<typeof UpdateJobSchema>;

export const UpdateJobRequirementsSchema = z.object({
  requirements: z.array(JobRequirementSchema).min(1, 'At least one requirement is required')
});

export type UpdateJobRequirementsInput = z.infer<typeof UpdateJobRequirementsSchema>;
