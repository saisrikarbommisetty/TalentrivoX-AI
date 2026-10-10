import { JobRequirement } from './schemas/job.schema';
import { RequirementAssessment } from './schemas/evaluation.schema';
import { EVIDENCE_SCORES, AssessmentStatusType } from './constants';

export interface ScoreCalculationResult {
  overallScore: number;
  coveragePercentage: number;
  essentialCoveragePercentage: number;
  totalAssessableWeight: number;
  earnedWeight: number;
  calculationExplanation: string;
  demonstratedCount: number;
  partialCount: number;
  notEvidencedCount: number;
  needsReviewCount: number;
}

/**
 * Calculates deterministic, explainable match score & coverage according to FR-07 spec.
 *
 * Formula:
 * For assessable requirements:
 *   contribution = weight * evidence_score
 * Overall Score = (sum(contribution) / sum(assessable_weights)) * 100
 */
export function calculateEvaluationScore(
  requirements: JobRequirement[],
  assessments: RequirementAssessment[]
): ScoreCalculationResult {
  if (!requirements || requirements.length === 0) {
    return {
      overallScore: 0,
      coveragePercentage: 0,
      essentialCoveragePercentage: 0,
      totalAssessableWeight: 0,
      earnedWeight: 0,
      calculationExplanation: 'No job requirements defined to score against.',
      demonstratedCount: 0,
      partialCount: 0,
      notEvidencedCount: 0,
      needsReviewCount: 0
    };
  }

  const assessmentMap = new Map<string, RequirementAssessment>();
  for (const a of assessments) {
    assessmentMap.set(a.requirementId, a);
  }

  let totalAssessableWeight = 0;
  let earnedWeight = 0;

  let totalAssessableCount = 0;
  let coveredCount = 0;

  let essentialAssessableCount = 0;
  let essentialCoveredCount = 0;

  let demonstratedCount = 0;
  let partialCount = 0;
  let notEvidencedCount = 0;
  let needsReviewCount = 0;

  for (const req of requirements) {
    const assessment = assessmentMap.get(req.id);
    const status: AssessmentStatusType = assessment ? assessment.status : 'not_evidenced';
    const evidenceScore: number = assessment !== undefined ? assessment.evidenceScore : (EVIDENCE_SCORES[status] ?? 0);

    // Track status counts
    if (status === 'demonstrated') demonstratedCount++;
    else if (status === 'partial') partialCount++;
    else if (status === 'needs_review') needsReviewCount++;
    else notEvidencedCount++;

    // Only assessable requirements participate in the scoring denominator
    if (req.assessableFromResume !== false) {
      const weight = Math.max(1, req.weight || 5);
      totalAssessableWeight += weight;
      earnedWeight += weight * evidenceScore;

      totalAssessableCount++;
      if (status === 'demonstrated' || status === 'partial') {
        coveredCount++;
      }

      if (req.importance === 'essential') {
        essentialAssessableCount++;
        if (status === 'demonstrated' || status === 'partial') {
          essentialCoveredCount++;
        }
      }
    }
  }

  const overallScore = totalAssessableWeight > 0
    ? Math.min(100, Math.max(0, Math.round((earnedWeight / totalAssessableWeight) * 1000) / 10))
    : 0;

  const coveragePercentage = totalAssessableCount > 0
    ? Math.min(100, Math.max(0, Math.round((coveredCount / totalAssessableCount) * 1000) / 10))
    : 0;

  const essentialCoveragePercentage = essentialAssessableCount > 0
    ? Math.min(100, Math.max(0, Math.round((essentialCoveredCount / essentialAssessableCount) * 1000) / 10))
    : 100;

  const calculationExplanation = `Score calculated as (Earned Weight: ${earnedWeight.toFixed(1)} / Total Assessable Weight: ${totalAssessableWeight}) × 100 = ${overallScore}%. ` +
    `Covered ${coveredCount} of ${totalAssessableCount} assessable requirements (${coveragePercentage}%). ` +
    `Essential coverage is ${essentialCoveragePercentage}% (${essentialCoveredCount}/${essentialAssessableCount} essential criteria).`;

  return {
    overallScore,
    coveragePercentage,
    essentialCoveragePercentage,
    totalAssessableWeight,
    earnedWeight,
    calculationExplanation,
    demonstratedCount,
    partialCount,
    notEvidencedCount,
    needsReviewCount
  };
}
