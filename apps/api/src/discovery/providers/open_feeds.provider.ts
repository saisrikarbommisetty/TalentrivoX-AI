import { IJobDiscoveryProvider, ProviderSearchResult, RawJobListing } from '../types';
import { JobDiscoveryQuery } from '@avengercoders/shared';
import { env } from '../../config/env';
import { SafeUrlValidator } from '../url_validator';

export class OpenFeedsJobProvider implements IJobDiscoveryProvider {
  public readonly name = 'open_feeds';
  public readonly label = 'Global Tech Job Network';

  public isEnabled(): boolean {
    return true; // Always enabled as a legitimate open feed source
  }

  public async search(query: JobDiscoveryQuery): Promise<ProviderSearchResult> {
    const startTime = Date.now();
    const allJobs: RawJobListing[] = [];
    const errors: string[] = [];

    const searchKeywords = [
      query.role,
      query.query,
      query.location,
      ...(query.skills || []).slice(0, 3)
    ]
      .filter(Boolean)
      .map((k) => String(k).toLowerCase().trim());

    const isRemoteRequested =
      query.workplaceType === 'remote' ||
      query.location?.toLowerCase().includes('remote');

    // 1. Query Arbeitnow Public Job Feed
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.JOB_SEARCH_TIMEOUT_MS || 8000);

      const arbeitnowUrl = 'https://www.arbeitnow.com/api/job-board-api';
      const res = await fetch(arbeitnowUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items = data.data || [];

        for (const item of items) {
          const safeUrl = SafeUrlValidator.sanitizeUrl(item.url);
          if (!safeUrl) continue;

          const isRemote = Boolean(item.remote);
          const location = item.location || (isRemote ? 'Remote' : 'Hybrid');

          // Filter by keywords / role if provided
          const itemText = `${item.title} ${item.description} ${location} ${(item.tags || []).join(' ')}`.toLowerCase();
          
          let matchesQuery = true;
          if (query.role || query.query) {
            const roleTerms = (query.role || query.query || '').toLowerCase().split(' ').filter((t) => t.length > 2);
            matchesQuery = roleTerms.length === 0 || roleTerms.some((t) => itemText.includes(t));
          }

          if (query.location && !isRemoteRequested) {
            const locTerms = query.location.toLowerCase().split(/[ ,]+/).filter((t) => t.length > 2);
            const matchesLoc = locTerms.some((t) => itemText.includes(t) || location.toLowerCase().includes(t));
            if (!matchesLoc && !isRemote) {
              matchesQuery = false;
            }
          }

          if (!matchesQuery) continue;

          allJobs.push({
            source: 'arbeitnow',
            sourceLabel: 'Arbeitnow Network',
            externalJobId: String(item.slug || Math.random().toString(36).substring(7)),
            title: item.title || 'Software Engineer',
            company: item.company_name || 'Tech Company',
            location,
            country: isRemote ? 'Global' : 'DE/EU',
            isRemote,
            workplaceType: isRemote ? 'remote' : 'hybrid',
            employmentType: (item.job_types || []).includes('part_time') ? 'part-time' : 'full-time',
            experienceLevel: item.title?.toLowerCase().includes('senior') ? 'senior' : item.title?.toLowerCase().includes('lead') ? 'lead' : 'mid',
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: 'EUR',
            salaryFormatted: null,
            postedAt: item.created_at ? new Date(item.created_at * 1000).toISOString() : new Date().toISOString(),
            applicationUrl: safeUrl,
            description: item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '',
            descriptionSnippet: (item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '').slice(0, 300) + '...',
            extractedSkills: (item.tags || []).slice(0, 6)
          });
        }
      }
    } catch (err: any) {
      errors.push(`Arbeitnow: ${err.message}`);
    }

    // 2. Query Remotive Public Remote Jobs Feed
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.JOB_SEARCH_TIMEOUT_MS || 8000);

      const searchRole = query.role || query.query || '';
      const remotiveQuery = searchRole ? `?search=${encodeURIComponent(searchRole)}&limit=30` : '?limit=30';
      const remotiveUrl = `https://remotive.com/api/remote-jobs${remotiveQuery}`;

      const res = await fetch(remotiveUrl, {
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const items = data.jobs || [];

        for (const item of items) {
          const safeUrl = SafeUrlValidator.sanitizeUrl(item.url);
          if (!safeUrl) continue;

          const location = item.candidate_required_location || 'Remote (Worldwide)';

          // If specific non-remote location is requested, check if compatible with candidate location
          if (query.location && !isRemoteRequested) {
            const locLower = query.location.toLowerCase();
            const candLocLower = location.toLowerCase();
            const matchesLocation =
              candLocLower.includes('worldwide') ||
              candLocLower.includes('global') ||
              candLocLower.includes(locLower) ||
              (locLower.includes('india') && candLocLower.includes('apac')) ||
              (locLower.includes('us') && candLocLower.includes('usa'));
            if (!matchesLocation && query.workplaceType === 'onsite') {
              continue;
            }
          }

          allJobs.push({
            source: 'remotive',
            sourceLabel: 'Remotive Global',
            externalJobId: String(item.id || item.slug || Math.random().toString(36).substring(7)),
            title: item.title || 'Remote Engineer',
            company: item.company_name || 'Remote Org',
            companyLogoUrl: item.company_logo || null,
            location,
            country: 'Global',
            isRemote: true,
            workplaceType: 'remote',
            employmentType: item.job_type === 'full_time' ? 'full-time' : 'contract',
            experienceLevel: item.title?.toLowerCase().includes('senior') ? 'senior' : 'mid',
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: 'USD',
            salaryFormatted: item.salary || null,
            postedAt: item.publication_date || new Date().toISOString(),
            applicationUrl: safeUrl,
            description: item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '',
            descriptionSnippet: (item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '').slice(0, 300) + '...',
            extractedSkills: (item.tags || []).slice(0, 6)
          });
        }
      }
    } catch (err: any) {
      errors.push(`Remotive: ${err.message}`);
    }

    return {
      providerName: this.name,
      providerLabel: this.label,
      status: allJobs.length > 0 ? 'success' : errors.length > 0 ? 'error' : 'success',
      jobs: allJobs,
      latencyMs: Date.now() - startTime,
      errorMessage: errors.length > 0 ? errors.join('; ') : undefined
    };
  }
}
