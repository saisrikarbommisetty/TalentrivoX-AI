import { IJobDiscoveryProvider, ProviderSearchResult, RawJobListing } from '../types';
import { JobDiscoveryQuery } from '@avengercoders/shared';
import { env } from '../../config/env';
import { SafeUrlValidator } from '../url_validator';

export class JSearchJobProvider implements IJobDiscoveryProvider {
  public readonly name = 'jsearch';
  public readonly label = 'JSearch (RapidAPI)';

  public isEnabled(): boolean {
    return Boolean(
      env.RAPIDAPI_KEY &&
      !env.RAPIDAPI_KEY.includes('placeholder')
    );
  }

  public async search(query: JobDiscoveryQuery): Promise<ProviderSearchResult> {
    const startTime = Date.now();

    if (!this.isEnabled()) {
      return {
        providerName: this.name,
        providerLabel: this.label,
        status: 'missing_credentials',
        jobs: [],
        latencyMs: Date.now() - startTime,
        errorMessage: 'JSearch credentials (RAPIDAPI_KEY) are not configured.'
      };
    }

    try {
      const searchTerms: string[] = [];
      if (query.role) searchTerms.push(query.role);
      if (query.query && !searchTerms.includes(query.query)) searchTerms.push(query.query);
      if (query.location) searchTerms.push(`in ${query.location}`);
      if (query.workplaceType === 'remote') searchTerms.push('remote');

      const fullQuery = encodeURIComponent(searchTerms.join(' ').trim() || 'Software Engineer');
      const url = `https://${env.JSEARCH_API_HOST}/search?query=${fullQuery}&page=${query.page || 1}&num_pages=1`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.JOB_SEARCH_TIMEOUT_MS || 8000);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': env.RAPIDAPI_KEY!,
          'x-rapidapi-host': env.JSEARCH_API_HOST
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          return {
            providerName: this.name,
            providerLabel: this.label,
            status: 'rate_limited',
            jobs: [],
            latencyMs: Date.now() - startTime,
            errorMessage: 'JSearch API rate limit exceeded.'
          };
        }
        return {
          providerName: this.name,
          providerLabel: this.label,
          status: 'error',
          jobs: [],
          latencyMs: Date.now() - startTime,
          errorMessage: `JSearch API returned status ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      const rawResults = data.data || [];

      const jobs: RawJobListing[] = [];
      for (const item of rawResults) {
        const applyLink = item.job_apply_link || item.job_google_link;
        const safeUrl = SafeUrlValidator.sanitizeUrl(applyLink);
        if (!safeUrl) continue;

        const isRemote = Boolean(item.job_is_remote);
        const city = item.job_city || '';
        const state = item.job_state || '';
        const country = item.job_country || '';
        const locationStr = [city, state, country].filter(Boolean).join(', ') || (isRemote ? 'Remote' : 'Location Unspecified');

        jobs.push({
          source: this.name,
          sourceLabel: this.label,
          externalJobId: String(item.job_id || Math.random().toString(36).substring(7)),
          title: item.job_title || 'Software Engineer',
          company: item.employer_name || 'Hiring Organization',
          companyLogoUrl: item.employer_logo || null,
          location: locationStr,
          country: country || null,
          isRemote,
          workplaceType: isRemote ? 'remote' : 'hybrid',
          employmentType: (item.job_employment_type || 'full-time').toLowerCase().includes('contract') ? 'contract' : 'full-time',
          experienceLevel: item.job_required_experience?.required_experience_in_months ? (item.job_required_experience.required_experience_in_months > 48 ? 'senior' : 'mid') : 'mid',
          salaryMin: item.job_min_salary || null,
          salaryMax: item.job_max_salary || null,
          salaryCurrency: item.job_salary_currency || 'USD',
          salaryFormatted: item.job_min_salary && item.job_max_salary ? `$${item.job_min_salary.toLocaleString()} - $${item.job_max_salary.toLocaleString()} ${item.job_salary_currency || 'USD'}` : null,
          postedAt: item.job_posted_at_datetime_utc || new Date().toISOString(),
          applicationUrl: safeUrl,
          description: item.job_description || '',
          descriptionSnippet: (item.job_description || '').slice(0, 300) + '...',
          extractedSkills: (item.job_required_skills || []).slice(0, 8)
        });
      }

      return {
        providerName: this.name,
        providerLabel: this.label,
        status: 'success',
        jobs,
        latencyMs: Date.now() - startTime
      };
    } catch (err: any) {
      const isTimeout = err.name === 'AbortError';
      return {
        providerName: this.name,
        providerLabel: this.label,
        status: isTimeout ? 'timeout' : 'error',
        jobs: [],
        latencyMs: Date.now() - startTime,
        errorMessage: isTimeout ? 'JSearch API request timed out' : err.message
      };
    }
  }
}
