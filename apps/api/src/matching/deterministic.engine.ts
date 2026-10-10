import {
  JobRequirement,
  ExtractedResumeData,
  RequirementAssessment,
  EvaluationResult,
  AssessmentStatusType,
  calculateEvaluationScore,
  EVIDENCE_SCORES
} from '@avengercoders/shared';
import { SkillNormalizer } from './skill.normalizer';

export class DeterministicMatchingEngine {
  /**
   * Matches candidate resume evidence against structured job requirements deterministically.
   */
  public evaluate(
    jobCandidateId: string,
    requirementVersionId: string,
    requirements: JobRequirement[],
    resumeData: ExtractedResumeData
  ): EvaluationResult {
    const rawText = resumeData.rawText || '';
    const sentences = rawText
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10);

    const assessments: RequirementAssessment[] = requirements.map((req) => {
      // If marked not assessable from resume (e.g. live communication or problem solving interview task)
      if (req.assessableFromResume === false) {
        return {
          requirementId: req.id,
          status: 'needs_review' as AssessmentStatusType,
          evidenceScore: EVIDENCE_SCORES.needs_review,
          evidenceText: 'Designated as an interview-assessed criterion.',
          reasoningSummary: 'This requirement is marked for live interview validation rather than resume screening.',
          confidence: 1.0,
          reviewStatus: 'pending_review'
        };
      }

      const keywords = SkillNormalizer.extractRequirementKeywords(req.text);
      const expectationKeywords = req.evidenceExpectations
        ? SkillNormalizer.extractRequirementKeywords(req.evidenceExpectations)
        : [];
      const allTargetTokens = Array.from(new Set([...keywords, ...expectationKeywords]));

      // Search for matching sentences in resume
      const matchingSentences: { sentence: string; matches: number }[] = [];

      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        let matchCount = 0;
        for (const token of allTargetTokens) {
          if (sentenceLower.includes(token)) {
            matchCount++;
          }
        }
        if (matchCount > 0) {
          matchingSentences.push({ sentence, matches: matchCount });
        }
      }

      // Check candidate explicit skills list
      let skillListMatchCount = 0;
      for (const skill of resumeData.skills) {
        const normalized = SkillNormalizer.normalize(skill).toLowerCase();
        for (const token of allTargetTokens) {
          if (normalized.includes(token)) {
            skillListMatchCount++;
          }
        }
      }

      // Sort sentences by most matching keywords
      matchingSentences.sort((a, b) => b.matches - a.matches);
      const topEvidence = matchingSentences.slice(0, 3).map((m) => m.sentence).join(' ... ');

      let status: AssessmentStatusType = 'not_evidenced';
      let evidenceScore = 0;
      let reasoningSummary = '';
      let confidence = 0.85;

      const totalMatches = matchingSentences.reduce((acc, curr) => acc + curr.matches, 0) + skillListMatchCount;

      if (totalMatches >= 3 || (matchingSentences.length >= 2 && matchingSentences[0].matches >= 2)) {
        status = 'demonstrated';
        evidenceScore = EVIDENCE_SCORES.demonstrated;
        reasoningSummary = `Clear evidence found across ${matchingSentences.length} passage(s) matching ${allTargetTokens.slice(0, 4).join(', ')}.`;
        confidence = 0.9;
      } else if (totalMatches >= 1 || matchingSentences.length >= 1 || skillListMatchCount >= 1) {
        status = 'partial';
        evidenceScore = EVIDENCE_SCORES.partial;
        reasoningSummary = `Partial evidence found with related keywords (${allTargetTokens.slice(0, 3).join(', ')}), but depth requires verification.`;
        confidence = 0.75;
      } else {
        status = 'not_evidenced';
        evidenceScore = EVIDENCE_SCORES.not_evidenced;
        reasoningSummary = `No direct textual evidence or matching keywords found in the provided resume.`;
        confidence = 0.85;
      }

      return {
        requirementId: req.id,
        status,
        evidenceScore,
        evidenceText: topEvidence || 'No direct evidence passage identified in resume text.',
        reasoningSummary,
        confidence,
        reviewStatus: 'pending_review'
      };
    });

    const scoreResult = calculateEvaluationScore(requirements, assessments);

    const uncertainties: string[] = assessments
      .filter((a) => a.status === 'partial' || a.status === 'needs_review')
      .map((a) => {
        const req = requirements.find((r) => r.id === a.requirementId);
        return `Verification needed for '${req?.text || a.requirementId}': ${a.reasoningSummary}`;
      });

    const suggestedInterviewTopics = requirements
      .filter((r) => {
        const a = assessments.find((ass) => ass.requirementId === r.id);
        return a?.status === 'not_evidenced' || a?.status === 'partial' || r.assessableFromResume === false;
      })
      .map((r) => `Probe depth on ${r.text}`);

    return {
      jobCandidateId,
      requirementVersionId,
      overallScore: scoreResult.overallScore,
      coveragePercentage: scoreResult.coveragePercentage,
      essentialCoveragePercentage: scoreResult.essentialCoveragePercentage,
      matchingMethod: 'deterministic',
      evaluationStatus: 'completed',
      assessments,
      calculationExplanation: scoreResult.calculationExplanation,
      summary: `Deterministic screening completed. ${scoreResult.demonstratedCount} requirement(s) demonstrated, ${scoreResult.partialCount} partial match(es), and ${scoreResult.notEvidencedCount} not evidenced.`,
      uncertainties,
      suggestedInterviewTopics,
      modelMetadata: {
        engine: 'DeterministicPatternMatcher_v1',
        evaluatedAt: new Date().toISOString()
      }
    };
  }
}

export const deterministicEngine = new DeterministicMatchingEngine();
