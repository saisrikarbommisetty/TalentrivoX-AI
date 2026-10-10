import { env } from '../../../config/env';
import { CandidateAvailabilitySignal, ProviderExecutionStatus } from '@avengercoders/shared';
import { CandidateDiscoveryProvider, CandidateSearchQuery, RawDiscoveredCandidate } from '../candidate_provider.interface';
import { SafeUrlValidator } from '../../url_validator';

export class OpenTalentNetworkProvider implements CandidateDiscoveryProvider {
  public readonly name = 'open_talent_network';
  public readonly label = 'Authorized Open Talent Network';

  public isConfigured(): boolean {
    return Boolean(
      env.OPEN_TALENT_API_URL &&
      env.OPEN_TALENT_API_KEY &&
      !env.OPEN_TALENT_API_URL.includes('example.com') &&
      !env.OPEN_TALENT_API_KEY.includes('placeholder')
    );
  }

  public async search(query: CandidateSearchQuery): Promise<{
    candidates: RawDiscoveredCandidate[];
    status: ProviderExecutionStatus;
  }> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      return {
        candidates: [],
        status: {
          provider: this.name,
          providerLabel: this.label,
          status: 'missing_credentials',
          resultCount: 0,
          latencyMs: 0,
          errorMessage: 'OPEN_TALENT_API_KEY is not configured in server environment.'
        }
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), env.CANDIDATE_SEARCH_TIMEOUT_MS);

      const response = await fetch(`${env.OPEN_TALENT_API_URL}/api/v1/candidates/search`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPEN_TALENT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobTitle: query.jobTitle,
          skills: [...(query.mandatorySkills || []), ...(query.preferredSkills || [])],
          location: query.location,
          workplaceType: query.workplaceType,
          minExperienceYears: query.minExperienceYears,
          limit: query.limit,
          onlyOpenToWork: true
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          candidates: [],
          status: {
            provider: this.name,
            providerLabel: this.label,
            status: 'error',
            resultCount: 0,
            latencyMs: Date.now() - startTime,
            errorMessage: `Open Talent API returned status ${response.status}`
          }
        };
      }

      const resData: any = await response.json();
      const items = resData?.candidates || [];
      const candidates: RawDiscoveredCandidate[] = [];

      for (const item of items) {
        const safeUrl = SafeUrlValidator.sanitizeUrl(item.profileUrl || item.portfolioUrl);
        if (!safeUrl) continue;

        const availabilitySignal: CandidateAvailabilitySignal = {
          isOpenToWork: Boolean(item.isOpenToWork),
          signalSource: 'verified_open_network',
          verificationStatus: item.isOpenToWork ? 'verified' : 'unverified',
          signalEvidence: item.availabilityNote || 'Verified active status in authorized talent pool',
          timestamp: item.updatedAt || new Date().toISOString()
        };

        candidates.push({
          externalId: `otn_${item.id || item.email || Math.random().toString(36).substring(7)}`,
          fullName: item.name || 'Anonymous Candidate',
          headline: item.headline || item.title || '',
          location: item.location || 'Remote',
          country: item.country,
          workArrangement: item.workplaceType || 'unspecified',
          canonicalProfileUrl: safeUrl,
          sourceProvider: this.name,
          sourceLabel: this.label,
          evaluationType: item.resumeText ? 'full_resume_evaluation' : 'profile_evaluation',
          skills: item.skills || [],
          experienceYears: item.experienceYears,
          experienceSummary: item.experienceSummary || item.bio || '',
          projectsSummary: item.projectsSummary || '',
          educationSummary: item.educationSummary,
          availabilitySignal,
          rawEvidence: item.evidenceList || [`Verified candidate from ${this.label}`],
          discoveredAt: new Date().toISOString()
        });
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
          errorMessage: err?.message || 'Failed to query Open Talent Network'
        }
      };
    }
  }
}
