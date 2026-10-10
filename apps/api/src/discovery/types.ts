import { DiscoveredJob, JobDiscoveryQuery, ProviderExecutionStatus } from '@avengercoders/shared';

export interface RawJobListing {
  source: string;
  sourceLabel: string;
  externalJobId: string;
  title: string;
  company: string;
  companyLogoUrl?: string | null;
  location: string;
  country?: string | null;
  isRemote?: boolean;
  workplaceType?: 'remote' | 'hybrid' | 'onsite' | 'unspecified';
  employmentType?: 'full-time' | 'part-time' | 'contract' | 'internship' | 'unspecified';
  experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead' | 'unspecified';
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryFormatted?: string | null;
  postedAt?: string | null;
  applicationUrl: string;
  description: string;
  descriptionSnippet?: string;
  extractedSkills?: string[];
}

export interface ProviderSearchResult {
  providerName: string;
  providerLabel: string;
  status: 'success' | 'rate_limited' | 'missing_credentials' | 'timeout' | 'error';
  jobs: RawJobListing[];
  latencyMs: number;
  errorMessage?: string;
}

export interface IJobDiscoveryProvider {
  name: string;
  label: string;
  isEnabled(): boolean;
  search(query: JobDiscoveryQuery): Promise<ProviderSearchResult>;
}
