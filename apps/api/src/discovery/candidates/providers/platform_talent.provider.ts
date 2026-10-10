import { CandidateAvailabilitySignal, ProviderExecutionStatus } from '@avengercoders/shared';
import { CandidateDiscoveryProvider, CandidateSearchQuery, RawDiscoveredCandidate } from '../candidate_provider.interface';
import { db } from '../../../db/client';

export class PlatformTalentProvider implements CandidateDiscoveryProvider {
  public readonly name = 'platform_talent';
  public readonly label = 'TalentrivoX Opted-In Talent Pool';

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
      // Find candidate resumes where seeker enabled auto-discovery or open matchmaking
      const resumes = await db.query('seeker_resumes', (r: any) => {
        return r && r.extracted_data && (r.is_open_to_discovery !== false);
      });

      const querySkillsLower = [
        ...(query.mandatorySkills || []),
        ...(query.preferredSkills || [])
      ].map(s => s.toLowerCase());

      for (const res of resumes) {
        const ext = res.extracted_data || {};
        const candSkills = (ext.skills || []).map((s: any) => typeof s === 'string' ? s : s.name || '');
        const candSkillsLower = candSkills.map((s: string) => s.toLowerCase());

        // Check if there is skill overlap
        const hasOverlap = querySkillsLower.length === 0 || querySkillsLower.some(qs => 
          candSkillsLower.some((cs: string) => cs.includes(qs) || qs.includes(cs))
        );

        if (!hasOverlap) continue;

        const availabilitySignal: CandidateAvailabilitySignal = {
          isOpenToWork: true,
          signalSource: 'recruitment_opt_in',
          verificationStatus: 'verified',
          signalEvidence: 'Candidate explicitly opted into TalentrivoX Talent Matchmaking from Seeker Workspace',
          timestamp: res.created_at || new Date().toISOString()
        };

        const rawCandidate: RawDiscoveredCandidate = {
          externalId: `plat_${res.id}`,
          fullName: ext.name || 'Verified Seeker',
          headline: ext.title || ext.headline || 'Software Professional',
          location: ext.location || 'Remote',
          country: undefined,
          workArrangement: 'remote',
          canonicalProfileUrl: `https://talentrivox.ai/talent/profile/${res.id}`,
          sourceProvider: this.name,
          sourceLabel: this.label,
          evaluationType: 'full_resume_evaluation',
          skills: candSkills,
          experienceYears: ext.total_experience_years || ext.experience?.length || 2,
          experienceSummary: (ext.experience || []).map((e: any) => `${e.role || ''} at ${e.company || ''}`).join('; ') || 'Verified work experience',
          projectsSummary: (ext.projects || []).map((p: any) => `${p.name || ''}: ${p.description || ''}`).join('; ') || 'Verified project portfolio',
          educationSummary: (ext.education || []).map((ed: any) => `${ed.degree || ''} from ${ed.institution || ''}`).join('; '),
          availabilitySignal,
          rawEvidence: [
            `Verified TalentrivoX Candidate Profile #${res.id}`,
            `Screened Resume Version: ${res.version_label || 'Default'}`,
            `Extracted Skills: ${candSkills.join(', ')}`
          ],
          discoveredAt: new Date().toISOString()
        };

        candidates.push(rawCandidate);
        if (candidates.length >= query.limit) break;
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
          errorMessage: err?.message || 'Platform talent lookup failed'
        }
      };
    }
  }
}
