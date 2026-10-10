import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { UpdateCandidateReviewSchema } from '@avengercoders/shared';
import { db } from '../db/client';
import { storageService } from '../storage/storage.service';
import { documentParser } from '../parser/document.parser';
import { geminiService } from '../ai/gemini.service';

export class CandidateController {
  public static async listJobCandidates(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;
    const { search, status, minScore, maxScore, sortBy = 'score_desc' } = req.query;

    const job = await db.findById('jobs', jobId);
    if (!job || job.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
      return;
    }

    const jobCandidates = await db.query('job_candidates', (jc) => jc.job_id === jobId);

    const enriched = await Promise.all(
      jobCandidates.map(async (jc) => {
        const candidate = await db.findById('candidates', jc.candidate_id);
        const evaluations = await db.query('evaluations', (e) => e.job_candidate_id === jc.id);
        evaluations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        const latestEvaluation = evaluations[0] || null;

        const interviewPlans = await db.query('interview_plans', (ip) => ip.job_candidate_id === jc.id);

        return {
          id: jc.id,
          jobId: jc.job_id,
          candidateId: jc.candidate_id,
          fullName: candidate ? candidate.full_name : 'Unknown Candidate',
          email: candidate?.email || '',
          phone: candidate?.phone || '',
          skills: candidate?.skills || [],
          originalFilename: jc.original_filename,
          extractionStatus: jc.extraction_status,
          workflowStatus: jc.workflow_status,
          processingError: jc.processing_error,
          score: latestEvaluation ? latestEvaluation.overall_score : null,
          coveragePercentage: latestEvaluation ? latestEvaluation.coverage_percentage : null,
          essentialCoveragePercentage: latestEvaluation ? latestEvaluation.essential_coverage_percentage : null,
          matchingMethod: latestEvaluation ? latestEvaluation.matching_method : null,
          hasInterviewPlan: interviewPlans.length > 0,
          createdAt: jc.created_at
        };
      })
    );

    // Filter
    let filtered = enriched;
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.skills.some((s: string) => s.toLowerCase().includes(q))
      );
    }

    if (status && typeof status === 'string') {
      filtered = filtered.filter((c) => c.workflowStatus === status);
    }

    if (minScore !== undefined && !isNaN(Number(minScore))) {
      filtered = filtered.filter((c) => c.score !== null && c.score >= Number(minScore));
    }

    if (maxScore !== undefined && !isNaN(Number(maxScore))) {
      filtered = filtered.filter((c) => c.score !== null && c.score <= Number(maxScore));
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'score_desc') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'score_asc') return (a.score || 0) - (b.score || 0);
      if (sortBy === 'name_asc') return a.fullName.localeCompare(b.fullName);
      if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });

    res.json({ candidates: filtered, total: filtered.length });
  }

  public static async uploadResumes(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: { code: 'NO_FILES', message: 'No resume files provided for upload' } });
      return;
    }

    const job = await db.findById('jobs', jobId);
    if (!job || job.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
      return;
    }

    const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === jobId);
    reqVersions.sort((a, b) => b.version_number - a.version_number);
    const latestVersion = reqVersions[0];

    if (!latestVersion) {
      res.status(400).json({ error: { code: 'NO_REQUIREMENTS', message: 'Job has no requirement version established' } });
      return;
    }

    const results: any[] = [];

    for (const file of files) {
      try {
        // 1. Validate signature & save file securely
        const stored = await storageService.storeResume(file.buffer, file.originalname);

        // 2. Extract text & detect scanned docs
        const { text, pageCount, isScannedOrEmpty } = await documentParser.extractText(file.buffer, file.originalname);

        const extractionStatus = isScannedOrEmpty ? 'needs_ocr' : 'completed';
        const extractedData = documentParser.extractDeterministicData(text, file.originalname);

        // 3. Create or find Candidate
        let candidateId = uuidv4();
        const existingCandidate = (await db.query('candidates', (c) => c.owner_id === userId && (c.email === extractedData.email || c.full_name === extractedData.fullName)))[0];

        if (existingCandidate) {
          candidateId = existingCandidate.id;
          await db.update('candidates', candidateId, {
            summary: extractedData.summary || existingCandidate.summary,
            skills: Array.from(new Set([...existingCandidate.skills, ...extractedData.skills])),
            experience: extractedData.experience.length ? extractedData.experience : existingCandidate.experience,
            education: extractedData.education.length ? extractedData.education : existingCandidate.education,
            projects: extractedData.projects.length ? extractedData.projects : existingCandidate.projects,
            certifications: Array.from(new Set([...existingCandidate.certifications, ...extractedData.certifications]))
          });
        } else {
          await db.insert('candidates', {
            id: candidateId,
            owner_id: userId,
            full_name: extractedData.fullName,
            email: extractedData.email,
            phone: extractedData.phone,
            summary: extractedData.summary,
            skills: extractedData.skills,
            experience: extractedData.experience,
            education: extractedData.education,
            projects: extractedData.projects,
            certifications: extractedData.certifications,
            total_experience_years: extractedData.totalExperienceYears || null
          });
        }

        // 4. Create Job Candidate submission
        const jobCandidateId = uuidv4();
        const jobCandidate = await db.insert('job_candidates', {
          id: jobCandidateId,
          job_id: jobId,
          candidate_id: candidateId,
          resume_file_path: stored.storagePath,
          original_filename: file.originalname,
          file_hash: stored.fileHash,
          extracted_text: text,
          extraction_status: extractionStatus,
          workflow_status: 'awaiting_review',
          processing_error: isScannedOrEmpty ? 'Document contains insufficient extractable text (requires OCR or readable PDF).' : null
        });

        // 5. Evaluate Candidate against Requirements
        let evaluationResult: any = null;
        if (!isScannedOrEmpty && latestVersion.requirements_json.length > 0) {
          evaluationResult = await geminiService.evaluateResume(
            jobCandidateId,
            latestVersion.id,
            latestVersion.requirements_json,
            extractedData
          );

          const evaluationId = uuidv4();
          await db.insert('evaluations', {
            id: evaluationId,
            job_candidate_id: jobCandidateId,
            requirement_version_id: latestVersion.id,
            overall_score: evaluationResult.overallScore,
            coverage_percentage: evaluationResult.coveragePercentage,
            essential_coverage_percentage: evaluationResult.essentialCoveragePercentage,
            evaluation_status: 'completed',
            matching_method: evaluationResult.matchingMethod,
            calculation_explanation: evaluationResult.calculationExplanation,
            summary: evaluationResult.summary,
            uncertainties: evaluationResult.uncertainties,
            suggested_interview_topics: evaluationResult.suggestedInterviewTopics,
            model_metadata: evaluationResult.modelMetadata
          });

          // Insert individual requirement assessments
          for (const assessment of evaluationResult.assessments) {
            await db.insert('requirement_assessments', {
              id: uuidv4(),
              evaluation_id: evaluationId,
              requirement_id: assessment.requirementId,
              status: assessment.status,
              evidence_score: assessment.evidenceScore,
              evidence_text: assessment.evidenceText,
              source_page: assessment.sourcePage || null,
              reasoning_summary: assessment.reasoningSummary,
              confidence: assessment.confidence,
              review_status: 'pending_review'
            });
          }
        }

        results.push({
          status: 'success',
          jobCandidateId,
          filename: file.originalname,
          fullName: extractedData.fullName,
          score: evaluationResult ? evaluationResult.overallScore : null,
          extractionStatus
        });
      } catch (err: any) {
        results.push({
          status: 'error',
          filename: file.originalname,
          error: err.message || 'Processing failed'
        });
      }
    }

    res.status(201).json({
      message: `Processed ${results.length} resume(s)`,
      results
    });
  }

  public static async getJobCandidate(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobCandidateId } = req.params;

    const jc = await db.findById('job_candidates', jobCandidateId);
    if (!jc) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job candidate record not found' } });
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
    const latestEvaluation = evaluations[0] || null;

    let assessments: any[] = [];
    let requirementVersion: any = null;

    if (latestEvaluation) {
      assessments = await db.query('requirement_assessments', (ra) => ra.evaluation_id === latestEvaluation.id);
      requirementVersion = await db.findById('job_requirement_versions', latestEvaluation.requirement_version_id);
    }

    const interviewPlans = await db.query('interview_plans', (ip) => ip.job_candidate_id === jobCandidateId);
    const reviews = await db.query('candidate_reviews', (cr) => cr.job_candidate_id === jobCandidateId);

    res.json({
      jobCandidate: jc,
      job,
      candidate,
      evaluation: latestEvaluation,
      requirementVersion,
      assessments,
      interviewPlans,
      reviews
    });
  }

  public static async downloadResume(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobCandidateId } = req.params;

    const jc = await db.findById('job_candidates', jobCandidateId);
    if (!jc) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job candidate not found' } });
      return;
    }

    const job = await db.findById('jobs', jc.job_id);
    if (!job || job.owner_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const buffer = await storageService.getResumeBuffer(jc.resume_file_path);
    const ext = path.extname(jc.original_filename).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(jc.original_filename)}"`);
    res.send(buffer);
  }

  public static async updateReview(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobCandidateId } = req.params;
    const validated = UpdateCandidateReviewSchema.parse(req.body);

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

    await db.update('job_candidates', jobCandidateId, {
      workflow_status: validated.status
    });

    if (validated.notes) {
      await db.insert('candidate_reviews', {
        id: uuidv4(),
        job_candidate_id: jobCandidateId,
        reviewer_id: userId,
        status: validated.status,
        notes: validated.notes
      });
    }

    res.json({ success: true, status: validated.status });
  }

  public static async evaluate(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobCandidateId } = req.params;

    const jc = await db.findById('job_candidates', jobCandidateId);
    if (!jc) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job candidate not found' } });
      return;
    }

    const job = await db.findById('jobs', jc.job_id);
    if (!job || job.owner_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === jc.job_id);
    reqVersions.sort((a, b) => b.version_number - a.version_number);
    const latestVersion = reqVersions[0];

    const candidate = await db.findById('candidates', jc.candidate_id);

    const extractedData = {
      fullName: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone,
      summary: candidate.summary || '',
      skills: candidate.skills || [],
      experience: candidate.experience || [],
      education: candidate.education || [],
      projects: candidate.projects || [],
      certifications: candidate.certifications || [],
      rawText: jc.extracted_text
    };

    const evaluationResult = await geminiService.evaluateResume(
      jobCandidateId,
      latestVersion.id,
      latestVersion.requirements_json,
      extractedData
    );

    const evaluationId = uuidv4();
    await db.insert('evaluations', {
      id: evaluationId,
      job_candidate_id: jobCandidateId,
      requirement_version_id: latestVersion.id,
      overall_score: evaluationResult.overallScore,
      coverage_percentage: evaluationResult.coveragePercentage,
      essential_coverage_percentage: evaluationResult.essentialCoveragePercentage,
      evaluation_status: 'completed',
      matching_method: evaluationResult.matchingMethod,
      calculation_explanation: evaluationResult.calculationExplanation,
      summary: evaluationResult.summary,
      uncertainties: evaluationResult.uncertainties,
      suggested_interview_topics: evaluationResult.suggestedInterviewTopics,
      model_metadata: evaluationResult.modelMetadata
    });

    for (const assessment of evaluationResult.assessments) {
      await db.insert('requirement_assessments', {
        id: uuidv4(),
        evaluation_id: evaluationId,
        requirement_id: assessment.requirementId,
        status: assessment.status,
        evidence_score: assessment.evidenceScore,
        evidence_text: assessment.evidenceText,
        source_page: assessment.sourcePage || null,
        reasoning_summary: assessment.reasoningSummary,
        confidence: assessment.confidence,
        review_status: 'pending_review'
      });
    }

    res.json({
      evaluation: {
        id: evaluationId,
        ...evaluationResult
      }
    });
  }
}
