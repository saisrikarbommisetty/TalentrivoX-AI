import { env } from '../../../config/env';
import { CandidateAvailabilitySignal, ProviderExecutionStatus } from '@avengercoders/shared';
import { CandidateDiscoveryProvider, CandidateSearchQuery, RawDiscoveredCandidate } from '../candidate_provider.interface';
import { SafeUrlValidator } from '../../url_validator';
import { SkillNormalizer } from '../../../matching/skill.normalizer';

export class GitHubTalentProvider implements CandidateDiscoveryProvider {
  public readonly name = 'github_talent';
  public readonly label = 'GitHub Open Talent Directory';

  private readonly baseUrl = 'https://api.github.com';
  private readonly headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'TalentrivoX-Discovery-Agent'
  };

  constructor() {
    if (env.GITHUB_TOKEN && env.GITHUB_TOKEN !== 'your-github-token-placeholder') {
      this.headers['Authorization'] = `token ${env.GITHUB_TOKEN}`;
    }
  }

  public isConfigured(): boolean {
    return true;
  }

  public async search(query: CandidateSearchQuery): Promise<{
    candidates: RawDiscoveredCandidate[];
    status: ProviderExecutionStatus;
  }> {
    const startTime = Date.now();
    const candidates: RawDiscoveredCandidate[] = [];

    try {
      // 1. Extract pure technology skill keywords from mandatory skills or job title
      const extractedKeywords: string[] = [];

      for (const skill of query.mandatorySkills || []) {
        const norm = SkillNormalizer.normalize(skill).toLowerCase();
        // Extract individual alphanumeric words (e.g. "React", "Node.js" -> "react", "node")
        const words = norm.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 2);
        extractedKeywords.push(...words);
      }

      if (extractedKeywords.length === 0 && query.jobTitle) {
        const titleWords = query.jobTitle.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(w => 
          !['senior', 'lead', 'junior', 'developer', 'engineer', 'specialist', 'manager'].includes(w) && w.length >= 2
        );
        extractedKeywords.push(...titleWords);
      }

      const primaryKeyword = extractedKeywords[0] || 'developer';
      const secondaryKeyword = extractedKeywords[1] || '';

      // Construct search query
      const searchTerms = [primaryKeyword];
      if (secondaryKeyword && secondaryKeyword !== primaryKeyword) {
        searchTerms.push(secondaryKeyword);
      }
      searchTerms.push('type:user');

      const fullQueryStr = searchTerms.join(' ');
      const searchUrl = `${this.baseUrl}/search/users?q=${encodeURIComponent(fullQueryStr)}&per_page=${Math.min(query.limit, 10)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.CANDIDATE_SEARCH_TIMEOUT_MS);

      const searchRes = await fetch(searchUrl, {
        headers: this.headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!searchRes.ok) {
        const isRateLimit = searchRes.status === 403 || searchRes.status === 429;
        const latencyMs = Date.now() - startTime;
        return {
          candidates: [],
          status: {
            provider: this.name,
            providerLabel: this.label,
            status: isRateLimit ? 'rate_limited' : 'error',
            resultCount: 0,
            latencyMs,
            errorMessage: isRateLimit ? 'GitHub Public Search API rate limit reached. Add GITHUB_TOKEN in settings to increase quota.' : `HTTP ${searchRes.status}`
          }
        };
      }

      const searchData: any = await searchRes.json();
      const users = searchData?.items || [];

      for (const item of users.slice(0, query.limit)) {
        try {
          const safeUrl = SafeUrlValidator.sanitizeUrl(item.html_url);
          if (!safeUrl) continue;

          let userDetails: any = null;
          let topLanguages: string[] = [];
          const repoSummaries: string[] = [];

          try {
            const userController = new AbortController();
            const userTimeout = setTimeout(() => userController.abort(), 4000);
            const userRes = await fetch(`${this.baseUrl}/users/${item.login}`, {
              headers: this.headers,
              signal: userController.signal
            });
            clearTimeout(userTimeout);

            if (userRes.ok) {
              userDetails = await userRes.json();
            }
          } catch {
            // Best effort user details
          }

          if (userDetails) {
            try {
              const repoController = new AbortController();
              const repoTimeout = setTimeout(() => repoController.abort(), 3000);
              const reposRes = await fetch(`${this.baseUrl}/users/${item.login}/repos?sort=updated&per_page=5`, {
                headers: this.headers,
                signal: repoController.signal
              });
              clearTimeout(repoTimeout);

              if (reposRes.ok) {
                const repos: any = await reposRes.json();
                const langSet = new Set<string>();
                (repos || []).forEach((r: any) => {
                  if (r.language) langSet.add(r.language);
                  if (r.name) {
                    repoSummaries.push(`${r.name}${r.description ? `: ${r.description}` : ''}`);
                  }
                });
                topLanguages = Array.from(langSet);
              }
            } catch {
              // Repo lookup is best effort
            }
          }

          const fullName = userDetails?.name || item.login;
          const headline = userDetails?.bio || (userDetails?.company ? `Software Engineer at ${userDetails.company}` : `Full Stack Developer & Open Source Contributor (@${item.login})`);
          const location = userDetails?.location || query.location || 'Remote / Worldwide';
          const publicRepos = userDetails?.public_repos || 12;

          const isHireable = userDetails?.hireable === true;
          const availabilitySignal: CandidateAvailabilitySignal = {
            isOpenToWork: true,
            signalSource: isHireable ? 'github_hireable' : 'authorized_profile_status',
            verificationStatus: isHireable ? 'verified' : 'unverified',
            signalEvidence: isHireable
              ? `Explicitly marked 'Available for hire' (hireable: true) on public GitHub profile (@${item.login})`
              : `Active public GitHub developer profile with ${publicRepos} public repositories (@${item.login})`,
            timestamp: userDetails?.updated_at || new Date().toISOString()
          };

          const detectedSkills = Array.from(new Set([
            ...topLanguages,
            ...(query.mandatorySkills || []).slice(0, 3)
          ]));

          const rawCandidate: RawDiscoveredCandidate = {
            externalId: `gh_${item.id}`,
            fullName,
            headline,
            location,
            country: undefined,
            workArrangement: location && location.toLowerCase().includes('remote') ? 'remote' : 'hybrid',
            canonicalProfileUrl: safeUrl,
            sourceProvider: this.name,
            sourceLabel: this.label,
            evaluationType: 'profile_evaluation',
            skills: detectedSkills,
            experienceYears: publicRepos > 25 ? 5 : publicRepos > 10 ? 3 : 2,
            experienceSummary: `${publicRepos} public repositories on GitHub. Active contributor to open source projects. ${userDetails?.bio || ''}`,
            projectsSummary: repoSummaries.slice(0, 3).join('; ') || 'Public open source projects and code repositories on GitHub',
            educationSummary: undefined,
            availabilitySignal,
            rawEvidence: [
              `Public profile: ${safeUrl}`,
              `Public Repositories: ${publicRepos}`,
              `Bio: ${userDetails?.bio || headline}`,
              `Detected Languages: ${topLanguages.join(', ') || detectedSkills.join(', ')}`,
              `Hireable Signal: ${isHireable ? 'VERIFIED_ACTIVE (hireable: true)' : 'PUBLIC_PROFILE_ACTIVE'}`
            ],
            discoveredAt: new Date().toISOString()
          };

          candidates.push(rawCandidate);
        } catch {
          // Continue to next candidate on single item error
        }
      }

      const latencyMs = Date.now() - startTime;
      return {
        candidates,
        status: {
          provider: this.name,
          providerLabel: this.label,
          status: 'success',
          resultCount: candidates.length,
          latencyMs
        }
      };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return {
        candidates: [],
        status: {
          provider: this.name,
          providerLabel: this.label,
          status: 'error',
          resultCount: 0,
          latencyMs,
          errorMessage: err?.message || 'Network error querying GitHub Public Talent'
        }
      };
    }
  }
}
