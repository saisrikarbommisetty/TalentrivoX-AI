import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  UpdateInterviewPlanSchema,
  CreateInterviewSessionSchema
} from '@avengercoders/shared';
import { db } from '../db/client';
import { geminiService } from '../ai/gemini.service';

export class InterviewController {
  public static async createPlan(req: Request, res: Response): Promise<void> {
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
    const latestEvaluation = evaluations[0];

    const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === jc.job_id);
    reqVersions.sort((a, b) => b.version_number - a.version_number);
    const latestVersion = reqVersions[0];

    const assessments = latestEvaluation
      ? await db.query('requirement_assessments', (ra) => ra.evaluation_id === latestEvaluation.id)
      : [];

    const evalPayload = latestEvaluation
      ? { ...latestEvaluation, assessments }
      : { assessments: [], uncertainties: [] };

    // Build structured resume context from candidate profile & extracted text
    const resumeData = {
      fullName: candidate ? candidate.full_name : 'Candidate',
      email: candidate?.email || '',
      phone: candidate?.phone || '',
      summary: candidate?.summary || '',
      skills: candidate?.skills || [],
      experience: candidate?.experience || [],
      education: candidate?.education || [],
      projects: candidate?.projects || [],
      certifications: candidate?.certifications || [],
      rawText: jc.extracted_text || ''
    };

    // Generate personalized, resume-driven questions
    const generatedQuestions = await geminiService.generateInterviewQuestions(
      job.title,
      latestVersion ? latestVersion.requirements_json : [],
      evalPayload as any,
      candidate ? candidate.full_name : 'Candidate',
      resumeData,
      jc.extracted_text || ''
    );

    const planId = uuidv4();
    const plan = await db.insert('interview_plans', {
      id: planId,
      job_candidate_id: jobCandidateId,
      evaluation_id: latestEvaluation ? latestEvaluation.id : null,
      title: `Interview Guide: ${candidate ? candidate.full_name : 'Candidate'} - ${job.title}`,
      status: 'approved',
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const savedQuestions: any[] = [];
    for (const q of generatedQuestions) {
      const qId = uuidv4();
      const savedQ = await db.insert('interview_questions', {
        id: qId,
        interview_plan_id: planId,
        requirement_id: q.requirementId || null,
        category: q.category,
        question_text: q.questionText,
        relevance_reason: q.relevanceReason,
        related_project: q.relatedProject || null,
        related_skills: q.relatedSkills || [],
        related_requirement: q.relatedRequirement || null,
        resume_evidence: q.resumeEvidence || null,
        job_description_evidence: q.jobDescriptionEvidence || null,
        expected_answer_signals: q.expectedAnswerSignals,
        follow_up_questions: q.followUpQuestions,
        difficulty: q.difficulty,
        evaluation_rubric: q.evaluationRubric,
        sort_order: q.sortOrder
      });
      savedQuestions.push(savedQ);
    }

    // Update candidate workflow status to interview_planned if still awaiting review
    if (jc.workflow_status === 'awaiting_review' || jc.workflow_status === 'reviewed' || jc.workflow_status === 'shortlisted') {
      await db.update('job_candidates', jobCandidateId, {
        workflow_status: 'interview_planned'
      });
    }

    res.status(201).json({
      plan,
      questions: savedQuestions
    });
  }

  public static async getPlan(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { planId } = req.params;

    const plan = await db.findById('interview_plans', planId);
    if (!plan) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Interview plan not found' } });
      return;
    }

    const jc = await db.findById('job_candidates', plan.job_candidate_id);
    const job = jc ? await db.findById('jobs', jc.job_id) : null;
    if (!job || job.owner_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const candidate = jc ? await db.findById('candidates', jc.candidate_id) : null;
    const questions = await db.query('interview_questions', (q) => q.interview_plan_id === planId);
    questions.sort((a, b) => a.sort_order - b.sort_order);

    const sessions = await db.query('interview_sessions', (s) => s.interview_plan_id === planId);
    const feedback = await db.query('interview_feedback', (f) =>
      sessions.some((s) => s.id === f.interview_session_id)
    );

    res.json({
      plan,
      job,
      candidate,
      jobCandidate: jc,
      questions,
      sessions,
      feedback
    });
  }

  public static async updatePlan(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { planId } = req.params;
    const validated = UpdateInterviewPlanSchema.parse(req.body);

    const plan = await db.findById('interview_plans', planId);
    if (!plan) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Interview plan not found' } });
      return;
    }

    const jc = await db.findById('job_candidates', plan.job_candidate_id);
    const job = jc ? await db.findById('jobs', jc.job_id) : null;
    if (!job || job.owner_id !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Access denied' } });
      return;
    }

    const updatedPlan = await db.update('interview_plans', planId, {
      title: validated.title || plan.title,
      status: validated.status || plan.status,
      updated_at: new Date().toISOString()
    });

    if (validated.questions) {
      // Remove existing questions and insert updated set
      const existingQuestions = await db.query('interview_questions', (q) => q.interview_plan_id === planId);
      for (const eq of existingQuestions) {
        await db.delete('interview_questions', eq.id);
      }

      for (let i = 0; i < validated.questions.length; i++) {
        const q = validated.questions[i];
        await db.insert('interview_questions', {
          id: q.id || uuidv4(),
          interview_plan_id: planId,
          requirement_id: q.requirementId || null,
          category: q.category,
          question_text: q.questionText,
          relevance_reason: q.relevanceReason || '',
          expected_answer_signals: q.expectedAnswerSignals || [],
          follow_up_questions: q.followUpQuestions || [],
          difficulty: q.difficulty || 'mid',
          evaluation_rubric: q.evaluationRubric,
          sort_order: i
        });
      }
    }

    const questions = await db.query('interview_questions', (q) => q.interview_plan_id === planId);
    questions.sort((a, b) => a.sort_order - b.sort_order);

    res.json({
      plan: updatedPlan,
      questions
    });
  }

  public static async createSession(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { planId } = req.params;
    const validated = CreateInterviewSessionSchema.parse(req.body);

    const plan = await db.findById('interview_plans', planId);
    if (!plan) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Interview plan not found' } });
      return;
    }

    const sessionId = uuidv4();
    const session = await db.insert('interview_sessions', {
      id: sessionId,
      interview_plan_id: planId,
      interviewer_id: userId,
      scheduled_at: validated.scheduledAt || new Date().toISOString(),
      status: 'completed',
      interviewer_notes: validated.interviewerNotes || '',
      created_at: new Date().toISOString()
    });

    for (const fb of validated.feedback) {
      await db.insert('interview_feedback', {
        id: uuidv4(),
        interview_session_id: sessionId,
        interview_question_id: fb.questionId,
        rating: fb.rating,
        notes: fb.notes || '',
        reviewer_id: userId,
        created_at: new Date().toISOString()
      });
    }

    // Update job candidate status to interview_completed
    await db.update('job_candidates', plan.job_candidate_id, {
      workflow_status: 'interview_completed'
    });

    res.status(201).json({ session });
  }
}
