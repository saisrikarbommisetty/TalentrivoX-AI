import { Request, Response } from 'express';
import { db } from '../db/client';
import { geminiService } from '../ai/gemini.service';

export class AnalyticsController {
  public static async getDashboardStats(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    const jobs = await db.query('jobs', (j) => j.owner_id === userId);
    const jobIds = jobs.map((j) => j.id);

    const jobCandidates = await db.query('job_candidates', (jc) => jobIds.includes(jc.job_id));
    const evaluations = await db.query('evaluations', (e) =>
      jobCandidates.some((jc) => jc.id === e.job_candidate_id)
    );
    const interviewPlans = await db.query('interview_plans', (ip) =>
      jobCandidates.some((jc) => jc.id === ip.job_candidate_id)
    );

    const activeJobs = jobs.filter((j) => j.status === 'active').length;
    const totalCandidates = jobCandidates.length;
    const awaitingReview = jobCandidates.filter((jc) => jc.workflow_status === 'awaiting_review').length;
    const shortlisted = jobCandidates.filter((jc) => jc.workflow_status === 'shortlisted').length;
    const interviewCount = interviewPlans.length;

    // Average score calculation
    const scores = evaluations.map((e) => e.overall_score).filter((s) => s !== null && !isNaN(s));
    const avgScore = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;

    // AI Provider Status
    const aiStatus = geminiService.getStatus();

    res.json({
      stats: {
        activeJobs,
        totalJobs: jobs.length,
        totalCandidates,
        awaitingReview,
        shortlisted,
        interviewPlansCount: interviewCount,
        averageMatchScore: avgScore
      },
      aiStatus,
      recentJobs: jobs.slice(0, 5)
    });
  }

  public static async getJobAnalytics(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;

    const job = await db.findById('jobs', jobId);
    if (!job || job.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
      return;
    }

    const jobCandidates = await db.query('job_candidates', (jc) => jc.job_id === jobId);
    const jcIds = jobCandidates.map((jc) => jc.id);

    const evaluations = await db.query('evaluations', (e) => jcIds.includes(e.job_candidate_id));
    const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === jobId);
    reqVersions.sort((a, b) => b.version_number - a.version_number);
    const latestVersion = reqVersions[0];

    const requirements = latestVersion ? latestVersion.requirements_json : [];

    // Score distribution buckets: 80-100, 60-79, 40-59, 0-39
    const scoreBuckets = {
      excellent: 0, // 80-100
      strong: 0,    // 60-79
      moderate: 0,  // 40-59
      low: 0        // 0-39
    };

    for (const ev of evaluations) {
      const s = ev.overall_score;
      if (s >= 80) scoreBuckets.excellent++;
      else if (s >= 60) scoreBuckets.strong++;
      else if (s >= 40) scoreBuckets.moderate++;
      else scoreBuckets.low++;
    }

    // Status Funnel
    const funnel = {
      uploaded: jobCandidates.length,
      awaiting_review: jobCandidates.filter((jc) => jc.workflow_status === 'awaiting_review').length,
      shortlisted: jobCandidates.filter((jc) => jc.workflow_status === 'shortlisted').length,
      interview_planned: jobCandidates.filter((jc) => jc.workflow_status === 'interview_planned').length,
      interview_completed: jobCandidates.filter((jc) => jc.workflow_status === 'interview_completed').length,
      rejected: jobCandidates.filter((jc) => jc.workflow_status === 'rejected').length
    };

    // Requirement pass rate breakdown
    const reqBreakdown = await Promise.all(
      requirements.map(async (req: any) => {
        let demonstrated = 0;
        let partial = 0;
        let notEvidenced = 0;

        for (const ev of evaluations) {
          const assessments = await db.query('requirement_assessments', (ra) => ra.evaluation_id === ev.id && ra.requirement_id === req.id);
          const assessment = assessments[0];
          if (assessment?.status === 'demonstrated') demonstrated++;
          else if (assessment?.status === 'partial') partial++;
          else notEvidenced++;
        }

        return {
          requirementId: req.id,
          text: req.text,
          importance: req.importance,
          demonstrated,
          partial,
          notEvidenced,
          totalEvaluated: evaluations.length
        };
      })
    );

    res.json({
      job,
      totalCandidates: jobCandidates.length,
      evaluationsCount: evaluations.length,
      scoreBuckets,
      funnel,
      requirementBreakdown: reqBreakdown
    });
  }

  public static async exportCsv(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;

    const job = await db.findById('jobs', jobId);
    if (!job || job.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found' } });
      return;
    }

    const jobCandidates = await db.query('job_candidates', (jc) => jc.job_id === jobId);

    // Escape CSV to prevent formula injection
    const sanitizeCsv = (str: string | number | null | undefined): string => {
      if (str === null || str === undefined) return '""';
      let s = String(str).replace(/"/g, '""');
      if (/^[=+\-@\t\r]/.test(s)) {
        s = `'${s}`;
      }
      return `"${s}"`;
    };

    const headers = [
      'Candidate Name',
      'Email',
      'Phone',
      'Match Score (%)',
      'Coverage (%)',
      'Essential Coverage (%)',
      'Workflow Status',
      'Extraction Status',
      'Original Filename',
      'Application Date'
    ];

    const rows: string[] = [headers.join(',')];

    for (const jc of jobCandidates) {
      const candidate = await db.findById('candidates', jc.candidate_id);
      const evaluations = await db.query('evaluations', (e) => e.job_candidate_id === jc.id);
      evaluations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const ev = evaluations[0];

      rows.push([
        sanitizeCsv(candidate?.full_name || 'Unknown'),
        sanitizeCsv(candidate?.email || ''),
        sanitizeCsv(candidate?.phone || ''),
        sanitizeCsv(ev ? ev.overall_score : 'N/A'),
        sanitizeCsv(ev ? ev.coverage_percentage : 'N/A'),
        sanitizeCsv(ev ? ev.essential_coverage_percentage : 'N/A'),
        sanitizeCsv(jc.workflow_status),
        sanitizeCsv(jc.extraction_status),
        sanitizeCsv(jc.original_filename),
        sanitizeCsv(new Date(jc.created_at).toLocaleDateString())
      ].join(','));
    }

    const csvContent = rows.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="candidates_${job.title.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`);
    res.send(csvContent);
  }

  public static async getCandidateReport(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobCandidateId } = req.params;

    const jc = await db.findById('job_candidates', jobCandidateId);
    if (!jc) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Candidate not found' } });
      return;
    }

    const job = await db.findById('jobs', jc.job_id);
    if (!job || job.owner_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const candidate = await db.findById('candidates', jc.candidate_id);
    const evaluations = await db.query('evaluations', (e) => e.job_candidate_id === jobCandidateId);
    evaluations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    const ev = evaluations[0];

    const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === jc.job_id);
    reqVersions.sort((a, b) => b.version_number - a.version_number);
    const reqVersion = ev ? await db.findById('job_requirement_versions', ev.requirement_version_id) : reqVersions[0];

    const assessments = ev ? await db.query('requirement_assessments', (ra) => ra.evaluation_id === ev.id) : [];

    const interviewPlans = await db.query('interview_plans', (ip) => ip.job_candidate_id === jobCandidateId);
    let questions: any[] = [];
    if (interviewPlans.length > 0) {
      questions = await db.query('interview_questions', (q) => q.interview_plan_id === interviewPlans[0].id);
    }

    res.json({
      reportTitle: `Recruitment Decision Assessment Report - ${candidate?.full_name || 'Candidate'}`,
      generatedAt: new Date().toISOString(),
      job: {
        id: job.id,
        title: job.title,
        department: job.department,
        location: job.location,
        seniority: job.seniority
      },
      candidate: {
        id: candidate?.id,
        fullName: candidate?.full_name,
        email: candidate?.email,
        phone: candidate?.phone,
        summary: candidate?.summary,
        skills: candidate?.skills || [],
        experience: candidate?.experience || [],
        education: candidate?.education || []
      },
      evaluation: ev ? {
        overallScore: ev.overall_score,
        coveragePercentage: ev.coverage_percentage,
        essentialCoveragePercentage: ev.essential_coverage_percentage,
        matchingMethod: ev.matching_method,
        calculationExplanation: ev.calculation_explanation,
        summary: ev.summary,
        uncertainties: ev.uncertainties,
        suggestedInterviewTopics: ev.suggested_interview_topics
      } : null,
      requirements: reqVersion ? reqVersion.requirements_json : [],
      assessments,
      interviewQuestions: questions,
      disclaimer: 'This evaluation score and evidence breakdown is a structured decision-support aid. Human recruiter review is required before consequential hiring decisions.'
    });
  }
}
