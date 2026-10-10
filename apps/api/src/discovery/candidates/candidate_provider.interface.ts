import { CandidateAvailabilitySignal, ProviderExecutionStatus } from '@avengercoders/shared';

export interface CandidateSearchQuery {
  jobTitle: string;
  mandatorySkills: string[];
  preferredSkills: string[];
  location?: string;
  country?: string;
  workplaceType?: string;
  experienceLevel?: string;
  minExperienceYears?: number;
  limit: number;
}

export interface RawDiscoveredCandidate {
  externalId: string;
  fullName: string;
  headline: string;
  location: string;
  country?: string;
  workArrangement: 'remote' | 'hybrid' | 'onsite' | 'unspecified';
  canonicalProfileUrl: string;
  sourceProvider: string;
  sourceLabel: string;
  evaluationType: 'profile_evaluation' | 'full_resume_evaluation';
  skills: string[];
  experienceYears?: number;
  experienceSummary: string;
  projectsSummary: string;
  educationSummary?: string;
  availabilitySignal: CandidateAvailabilitySignal;
  rawEvidence: string[];
  discoveredAt: string;
}

export interface CandidateDiscoveryProvider {
  name: string;
  label: string;
  isConfigured(): boolean;
  search(query: CandidateSearchQuery): Promise<{
    candidates: RawDiscoveredCandidate[];
    status: ProviderExecutionStatus;
  }>;
}
