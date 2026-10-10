import { IJobDiscoveryProvider, ProviderSearchResult, RawJobListing } from '../types';
import { JobDiscoveryQuery } from '@avengercoders/shared';
import { env } from '../../config/env';
import { SafeUrlValidator } from '../url_validator';

export class AdzunaJobProvider implements IJobDiscoveryProvider {
  public readonly name = 'adzuna';
  public readonly label = 'Adzuna Job API';

  public isEnabled(): boolean {
    return Boolean(
      env.ADZUNA_APP_ID &&
      env.ADZUNA_API_KEY &&
      !env.ADZUNA_APP_ID.includes('placeholder') &&
      !env.ADZUNA_API_KEY.includes('placeholder')
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
        errorMessage: 'Adzuna API credentials (ADZUNA_APP_ID / ADZUNA_API_KEY) are not configured.'
      };
    }

    try {
      const country = (query.country || env.ADZUNA_COUNTRY || 'us').toLowerCase();
      const page = query.page || 1;
      const limit = Math.min(query.limit || 15, 20);

      const searchTerms: string[] = [];
      if (query.role) searchTerms.push(query.role);
      if (query.query && !searchTerms.includes(query.query)) searchTerms.push(query.query);
      if (query.skills && query.skills.length > 0) {
        searchTerms.push(query.skills.slice(0, 3).join(' '));
      }
      const whatQuery = encodeURIComponent(searchTerms.join(' ').trim() || 'Software Engineer');
      const whereQuery = query.location ? `&where=${encodeURIComponent(query.location)}` : '';

      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${env.ADZUNA_APP_ID}&app_key=${env.ADZUNA_API_KEY}&what=${whatQuery}${whereQuery}&results_per_page=${limit}&content-type=application/json`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.JOB_SEARCH_TIMEOUT_MS || 8000);

      const response = await fetch(url, {
        method: 'GET',
        headers: { Accept: 'application/json' },
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
            errorMessage: 'Adzuna API rate limit exceeded.'
          };
        }
        return {
          providerName: this.name,
          providerLabel: this.label,
          status: 'error',
          jobs: [],
          latencyMs: Date.now() - startTime,
          errorMessage: `Adzuna API returned status ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      const rawResults = data.results || [];

      const jobs: RawJobListing[] = [];
      for (const item of rawResults) {
        const safeUrl = SafeUrlValidator.sanitizeUrl(item.redirect_url);
        if (!safeUrl) continue;

        const isRemote =
          item.title?.toLowerCase().includes('remote') ||
          item.description?.toLowerCase().includes('remote') ||
          query.workplaceType === 'remote';

        jobs.push({
          source: this.name,
          sourceLabel: this.label,
          externalJobId: String(item.id || item.__id || Math.random().toString(36).substring(7)),
          title: item.title?.replace(/<\/?[^>]+(>|$)/g, '') || 'Open Position',
          company: item.company?.display_name || 'Hiring Company',
          location: item.location?.display_name || (isRemote ? 'Remote' : 'Various Locations'),
          country: country.toUpperCase(),
          isRemote,
          workplaceType: isRemote ? 'remote' : 'hybrid',
          employmentType: item.contract_time === 'part_time' ? 'part-time' : 'full-time',
          experienceLevel: 'mid',
          salaryMin: item.salary_min || null,
          salaryMax: item.salary_max || null,
          salaryCurrency: country === 'us' ? 'USD' : country === 'in' ? 'INR' : 'GBP',
          salaryFormatted:
            item.salary_min && item.salary_max
              ? `$${Math.round(item.salary_min).toLocaleString()} - $${Math.round(item.salary_max).toLocaleString()}`
              : null,
          postedAt: item.created || new Date().toISOString(),
          applicationUrl: safeUrl,
          description: item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '',
          descriptionSnippet: (item.description?.replace(/<\/?[^>]+(>|$)/g, '') || '').slice(0, 300) + '...',
          extractedSkills: (query.skills || []).slice(0, 5)
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
        errorMessage: isTimeout ? 'Adzuna API request timed out' : err.message
      };
    }
  }
}
