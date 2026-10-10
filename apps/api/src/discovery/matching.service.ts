import { ExtractedResumeData, DiscoveredJob } from '@avengercoders/shared';
import { RawJobListing } from './types';
import { SkillNormalizer } from '../matching/skill.normalizer';

export class JobRelevanceMatchingEngine {
  /**
   * Matches a raw job listing against candidate resume profile and produces
   * an explainable, evidence-grounded DiscoveredJob record.
   */
  public static evaluateJob(
    raw: RawJobListing,
    candidateData?: ExtractedResumeData | null,
    targetRole?: string,
    targetLocation?: string
  ): DiscoveredJob {
    const candidateSkills = (candidateData?.skills || [])
      .map((s) => SkillNormalizer.normalize(s))
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
    const resumeText = (candidateData?.rawText || '').toLowerCase();
    const rawSkillsArr = Array.isArray(raw.extractedSkills)
      ? raw.extractedSkills.map((s) => (typeof s === 'string' ? s : typeof s === 'object' && s ? (s as any).name || (s as any).skill || '' : String(s))).filter(Boolean)
      : [];
    const jobText = `${raw.title || ''} ${raw.description || ''} ${rawSkillsArr.join(' ')}`.toLowerCase();

    // 1. Skill Match Evaluation
    const matchedSkills: string[] = [];
    const unmatchedSkills: string[] = [];
    const transferableSkills: string[] = [];
    const resumeEvidence: string[] = [];

    // Extract potential tech skills from job
    const jobKeywords = SkillNormalizer.extractRequirementKeywords(jobText);
    const candidateSkillSet = new Set(candidateSkills.map((s) => s.toLowerCase()));

    for (const skill of candidateSkills) {
      const skillLower = skill.toLowerCase();
      if (jobText.includes(skillLower) || jobKeywords.includes(skillLower)) {
        matchedSkills.push(skill);
      }
    }

    const allJobSkills = Array.from(new Set([...jobKeywords, ...rawSkillsArr]));

    for (const kw of allJobSkills.slice(0, 15)) {
      if (!kw) continue;
      const normalizedKw = SkillNormalizer.normalize(kw);
      if (!normalizedKw || typeof normalizedKw !== 'string') continue;
      const kwLower = typeof kw === 'string' ? kw.toLowerCase() : String(normalizedKw).toLowerCase();
      const normLower = String(normalizedKw).toLowerCase();
      if (!candidateSkillSet.has(kwLower) && !candidateSkillSet.has(normLower)) {
        if (!unmatchedSkills.includes(normalizedKw)) {
          unmatchedSkills.push(normalizedKw);
        }
      }
    }

    // Check Transferable Skills
    const unmatchedSet = new Set(unmatchedSkills.map((s) => s.toLowerCase()));
    if ((unmatchedSet.has('react') || jobText.includes('react')) && (candidateSkillSet.has('vue') || candidateSkillSet.has('angular'))) {
      transferableSkills.push('Component-driven frontend foundation transfers directly to React architecture');
    }
    if ((unmatchedSet.has('postgresql') || jobText.includes('postgresql')) && (candidateSkillSet.has('mysql') || candidateSkillSet.has('sql'))) {
      transferableSkills.push('Strong SQL and relational modeling transfers seamlessly to PostgreSQL');
    }
    if ((unmatchedSet.has('kubernetes') || jobText.includes('kubernetes')) && (candidateSkillSet.has('docker') || candidateSkillSet.has('containers'))) {
      transferableSkills.push('Docker containerization background accelerates Kubernetes orchestration adoption');
    }

    // Identify Resume Project Evidence
    if (candidateData?.projects && candidateData.projects.length > 0) {
      for (const proj of candidateData.projects.slice(0, 2)) {
        if (proj.name && proj.description) {
          resumeEvidence.push(`Project "${proj.name}": ${proj.description.slice(0, 120)}...`);
        }
      }
    } else if (candidateSkills.length > 0) {
      resumeEvidence.push(`Demonstrated proficiency in: ${candidateSkills.slice(0, 5).join(', ')}`);
    }

    // 2. Score Calculation (0 - 100)
    // - Title / Role Alignment: 30%
    // - Skill Match Coverage: 40%
    // - Experience Fit: 15%
    // - Location / Remote Compatibility: 15%
    let titleScore = 20;
    const roleLower = (targetRole || '').toLowerCase();
    const jobTitleLower = raw.title.toLowerCase();
    if (roleLower && jobTitleLower.includes(roleLower)) {
      titleScore = 30;
    } else if (roleLower.split(' ').some((w) => w.length > 3 && jobTitleLower.includes(w))) {
      titleScore = 25;
    }

    let skillScore = 25;
    if (matchedSkills.length >= 4) {
      skillScore = 40;
    } else if (matchedSkills.length >= 2) {
      skillScore = 32;
    } else if (matchedSkills.length === 1) {
      skillScore = 25;
    } else {
      skillScore = 15;
    }

    let expScore = 12;
    const candidateYears = candidateData?.totalExperienceYears || (candidateData as any)?.experienceYears || 3;
    if (raw.experienceLevel === 'senior' && candidateYears >= 5) expScore = 15;
    else if (raw.experienceLevel === 'mid' && candidateYears >= 2) expScore = 15;
    else if (raw.experienceLevel === 'entry' && candidateYears <= 2) expScore = 15;

    let locScore = 12;
    if (raw.isRemote) locScore = 15;
    else if (targetLocation && raw.location.toLowerCase().includes(targetLocation.toLowerCase())) locScore = 15;

    const rawTotal = titleScore + skillScore + expScore + locScore;
    const matchScore = Math.min(Math.max(Math.round(rawTotal), 45), 98);

    let matchRating: 'exceptional' | 'strong' | 'moderate' | 'exploratory' = 'moderate';
    if (matchScore >= 85) matchRating = 'exceptional';
    else if (matchScore >= 70) matchRating = 'strong';
    else if (matchScore >= 55) matchRating = 'moderate';
    else matchRating = 'exploratory';

    // 3. Explanation Synthesis
    let matchExplanation = '';
    if (matchedSkills.length > 0) {
      matchExplanation = `Strong alignment with ${matchedSkills.slice(0, 3).join(', ')} and ${raw.workplaceType === 'remote' ? 'remote flexibility' : 'target location'}.`;
    } else {
      matchExplanation = `Transferable domain engineering role matching your core background in ${candidateSkills.slice(0, 2).join(', ') || 'modern software development'}.`;
    }

    // 4. Preparation Recommendation
    let preparationTip = '';
    if (unmatchedSkills.length > 0) {
      preparationTip = `Highlight relevant experience with ${unmatchedSkills.slice(0, 2).join(' & ')} or emphasize adjacent tools in your project portfolio.`;
    } else {
      preparationTip = `Emphasize your hands-on achievements in ${matchedSkills.slice(0, 2).join(' & ')} when applying.`;
    }

    return {
      id: `job-${raw.source}-${raw.externalJobId}`,
      source: raw.source,
      sourceLabel: raw.sourceLabel,
      externalJobId: raw.externalJobId,
      title: raw.title,
      company: raw.company,
      companyLogoUrl: raw.companyLogoUrl || null,
      location: raw.location,
      country: raw.country || null,
      isRemote: Boolean(raw.isRemote),
      workplaceType: raw.workplaceType || (raw.isRemote ? 'remote' : 'hybrid'),
      employmentType: raw.employmentType || 'full-time',
      experienceLevel: raw.experienceLevel || 'mid',
      salaryMin: raw.salaryMin || null,
      salaryMax: raw.salaryMax || null,
      salaryCurrency: raw.salaryCurrency || null,
      salaryFormatted: raw.salaryFormatted || null,
      postedAt: raw.postedAt || new Date().toISOString(),
      applicationUrl: raw.applicationUrl,
      description: raw.description,
      descriptionSnippet: raw.descriptionSnippet || raw.description.slice(0, 300) + '...',
      extractedSkills: raw.extractedSkills || [],
      matchScore,
      matchRating,
      matchedSkills,
      unmatchedSkills: unmatchedSkills.slice(0, 5),
      transferableSkills,
      resumeEvidence: resumeEvidence.slice(0, 3),
      matchExplanation,
      preparationTip,
      isSaved: false,
      isApplied: false,
      applicationStatus: null,
      isDismissed: false
    };
  }
}
