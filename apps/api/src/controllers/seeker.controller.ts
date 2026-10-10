import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/client';
import { DocumentParser } from '../parser/document.parser';
import { geminiService } from '../ai/gemini.service';
import { deterministicEngine } from '../matching/deterministic.engine';
import { jobDiscoveryService } from '../discovery/discovery.service';
import { PlatformSearchLinkGenerator } from '../discovery/providers/platform_fallback';
import { SafeUrlValidator } from '../discovery/url_validator';
import { JobSearchPreferencesSchema, JobDiscoveryQuerySchema } from '@avengercoders/shared';

const documentParser = new DocumentParser();

export class SeekerController {
  /**
   * GET /api/v1/seeker/dashboard
   */
  public static async getDashboardSummary(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    const resumes = await db.query('seeker_resumes', (r) => r.userId === userId);
    const activeResume = resumes.find((r) => r.isActive) || resumes[0] || null;

    const analyses = await db.query('seeker_analyses', (a) => a.userId === userId);
    const recentAnalyses = [...analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

    const savedJobs = await db.query('seeker_saved_jobs', (j) => j.userId === userId);
    const applications = await db.query('seeker_applications', (app) => app.userId === userId);

    const roadmaps = await db.query('seeker_skill_roadmaps', (rm) => rm.userId === userId);
    const allTasks = roadmaps.flatMap((rm) => rm.tasks || []);
    const completedTasksCount = allTasks.filter((t) => t.status === 'completed').length;

    const mockSessions = await db.query('seeker_mock_sessions', (s) => s.userId === userId);
    const completedMocksCount = mockSessions.filter((s) => s.isCompleted).length;

    // Calculate career readiness average
    const latestScore = recentAnalyses.length > 0 ? recentAnalyses[0].overallScore : (activeResume ? 75 : 0);

    res.json({
      activeResume,
      totalResumesCount: resumes.length,
      totalAnalysesCount: analyses.length,
      recentAnalyses,
      savedJobsCount: savedJobs.length,
      applicationsCount: applications.length,
      applications,
      roadmapProgress: {
        totalTasks: allTasks.length,
        completedTasks: completedTasksCount,
        inProgressTasks: allTasks.filter((t) => t.status === 'in_progress').length
      },
      completedMocksCount,
      careerReadinessScore: Math.round(latestScore)
    });
  }

  // ============================================================================
  // RESUME VAULT
  // ============================================================================

  public static async getResumes(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const resumes = await db.query('seeker_resumes', (r) => r.userId === userId);
    const sorted = [...resumes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ resumes: sorted });
  }

  public static async uploadResume(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const file = req.file;

    if (!file) {
      res.status(400).json({ error: { code: 'NO_FILE', message: 'Please provide a PDF or DOCX resume file.' } });
      return;
    }

    try {
      const { text, isScannedOrEmpty } = await documentParser.extractText(file.buffer, file.originalname);
      const sanitizedText = documentParser.sanitizeText(text);
      const parsedData = documentParser.extractDeterministicData(sanitizedText, file.originalname);

      const existingResumes = await db.query('seeker_resumes', (r) => r.userId === userId);
      const isFirst = existingResumes.length === 0;

      const resumeId = uuidv4();
      const versionLabel = req.body.versionLabel || `v${existingResumes.length + 1}.0 - ${parsedData.fullName || 'Resume'}`;

      // If marked active, deactivate others
      if (isFirst || req.body.isActive === 'true' || req.body.isActive === true) {
        for (const r of existingResumes) {
          await db.update('seeker_resumes', r.id, { isActive: false });
        }
      }

      const newResume = await db.insert('seeker_resumes', {
        id: resumeId,
        userId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        storagePath: `resumes/seeker/${resumeId}-${file.originalname}`,
        versionLabel,
        isActive: isFirst || req.body.isActive === 'true' || req.body.isActive === true,
        extractionStatus: isScannedOrEmpty ? 'needs_ocr' : 'completed',
        extractedText: sanitizedText,
        parsedData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.status(201).json({
        resume: newResume,
        message: isScannedOrEmpty
          ? 'Resume uploaded, but contains minimal extractable text (may be scanned/image-based).'
          : 'Personal resume uploaded and parsed successfully.'
      });
    } catch (err: any) {
      res.status(422).json({
        error: { code: 'PARSE_FAILED', message: err.message || 'Failed to extract text from resume file' }
      });
    }
  }

  public static async getResumeById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const resume = await db.findById('seeker_resumes', id);
    if (!resume || resume.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resume not found' } });
      return;
    }

    res.json({ resume });
  }

  public static async updateResume(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { versionLabel, isActive } = req.body;

    const resume = await db.findById('seeker_resumes', id);
    if (!resume || resume.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resume not found' } });
      return;
    }

    if (isActive) {
      const all = await db.query('seeker_resumes', (r) => r.userId === userId);
      for (const r of all) {
        if (r.id !== id && r.isActive) {
          await db.update('seeker_resumes', r.id, { isActive: false });
        }
      }
    }

    const updated = await db.update('seeker_resumes', id, {
      versionLabel: versionLabel !== undefined ? versionLabel : resume.versionLabel,
      isActive: isActive !== undefined ? isActive : resume.isActive
    });

    res.json({ resume: updated });
  }

  public static async deleteResume(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const resume = await db.findById('seeker_resumes', id);
    if (!resume || resume.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resume not found' } });
      return;
    }

    await db.delete('seeker_resumes', id);
    // Also clean up derived analyses
    const analyses = await db.query('seeker_analyses', (a) => a.resumeId === id);
    for (const a of analyses) {
      await db.delete('seeker_analyses', a.id);
    }

    res.json({ success: true, message: 'Resume and associated analyses deleted.' });
  }

  // ============================================================================
  // SAVED TARGET JOBS
  // ============================================================================

  public static async getSavedJobs(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const jobs = await db.query('seeker_saved_jobs', (j) => j.userId === userId);
    const sorted = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ savedJobs: sorted });
  }

  public static async createSavedJob(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { title, company, location, jobUrl, description, notes } = req.body;

    if (!title || !description) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Job title and description are required.' } });
      return;
    }

    // Extract structured requirements
    const requirements = await geminiService.extractRequirements(title, description);

    const newJob = await db.insert('seeker_saved_jobs', {
      id: uuidv4(),
      userId,
      title,
      company: company || 'Target Company',
      location: location || '',
      jobUrl: jobUrl || '',
      description,
      requirements,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ savedJob: newJob });
  }

  public static async getSavedJobById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const job = await db.findById('seeker_saved_jobs', id);
    if (!job || job.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Target job not found' } });
      return;
    }

    res.json({ savedJob: job });
  }

  public static async deleteSavedJob(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const job = await db.findById('seeker_saved_jobs', id);
    if (!job || job.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Target job not found' } });
      return;
    }

    await db.delete('seeker_saved_jobs', id);
    res.json({ success: true, message: 'Target job deleted successfully.' });
  }

  // ============================================================================
  // PERSONAL RESUME ANALYSIS ENGINE
  // ============================================================================

  public static async analyzeResume(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { resumeId, jobTitle, jobDescription, savedJobId } = req.body;

    if (!resumeId) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Please select a resume version.' } });
      return;
    }

    const resume = await db.findById('seeker_resumes', resumeId);
    if (!resume || resume.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resume not found' } });
      return;
    }

    let targetTitle = jobTitle;
    let targetDesc = jobDescription;
    let targetCompany = 'Target Role';
    let requirements: any[] = [];

    if (savedJobId) {
      const savedJob = await db.findById('seeker_saved_jobs', savedJobId);
      if (savedJob && savedJob.userId === userId) {
        targetTitle = savedJob.title;
        targetDesc = savedJob.description;
        targetCompany = savedJob.company;
        requirements = savedJob.requirements || [];
      }
    }

    if (!targetDesc || !targetTitle) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Job title and description are required.' } });
      return;
    }

    if (requirements.length === 0) {
      requirements = await geminiService.extractRequirements(targetTitle, targetDesc);
    }

    // Evaluate match using Deterministic Matching Engine
    const evalResult = await geminiService.evaluateResume(
      resume.id,
      savedJobId || 'default-version',
      requirements,
      resume.parsedData || { fullName: 'Candidate', skills: [], experience: [], education: [], projects: [], rawText: resume.extractedText || '' }
    );

    // Build skill match items
    const matches: any[] = [];
    const strengths: string[] = [];
    const criticalGaps: string[] = [];
    const missingEvidenceOpportunities: string[] = [];

    requirements.forEach((reqItem: any) => {
      const assessment = evalResult.assessments.find((a: any) => a.requirementId === reqItem.id) || {
        status: 'not_evidenced',
        evidenceScore: 0,
        evidenceText: '',
        reasoningSummary: 'No explicit keyword or project evidence identified in resume text.'
      };

      const matchItem = {
        requirementId: reqItem.id,
        requirementText: reqItem.text,
        category: reqItem.category,
        importance: reqItem.importance,
        weight: reqItem.weight,
        status: assessment.status,
        evidenceScore: assessment.evidenceScore,
        resumeEvidenceText: assessment.evidenceText,
        gapExplanation: assessment.status === 'demonstrated'
          ? 'Strong direct evidence verified in work experience or projects.'
          : assessment.status === 'partial'
          ? 'Partial alignment: adjacent tools or conceptual familiarity mentioned.'
          : 'Missing explicit evidence in current resume version.',
        recommendation: assessment.status === 'demonstrated'
          ? 'Highlight this achievement during initial interview rounds.'
          : assessment.status === 'partial'
          ? 'Deepen bullet points with specific STAR metrics and project context.'
          : `Add concrete project or coursework demonstrating ${reqItem.text}.`
      };

      matches.push(matchItem);

      if (assessment.status === 'demonstrated') {
        strengths.push(`Demonstrated: ${reqItem.text}`);
      } else if (reqItem.importance === 'essential') {
        criticalGaps.push(`Essential Gap: ${reqItem.text}`);
      } else {
        missingEvidenceOpportunities.push(`Preferred Opportunity: ${reqItem.text}`);
      }
    });

    const actionableRecommendations = [
      ...criticalGaps.map(g => `Priority 1: Address ${g} by adding verified project contributions or STAR bullet points.`),
      ...missingEvidenceOpportunities.map(o => `Priority 2: Add context for ${o} in your skills and project summaries.`),
      `Practice technical interview questions tailored for ${targetTitle}.`
    ];

    const newAnalysis = await db.insert('seeker_analyses', {
      id: uuidv4(),
      userId,
      resumeId,
      resumeVersionLabel: resume.versionLabel,
      targetJobTitle: targetTitle,
      targetCompany,
      savedJobId: savedJobId || null,
      overallScore: evalResult.overallScore,
      essentialScore: evalResult.essentialCoveragePercentage,
      preferredScore: Math.round(evalResult.coveragePercentage),
      coveragePercentage: evalResult.coveragePercentage,
      summary: evalResult.summary,
      matches,
      strengths,
      criticalGaps,
      missingEvidenceOpportunities,
      actionableRecommendations,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ analysis: newAnalysis });
  }

  public static async getAnalyses(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const analyses = await db.query('seeker_analyses', (a) => a.userId === userId);
    const sorted = [...analyses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ analyses: sorted });
  }

  public static async getAnalysisById(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const analysis = await db.findById('seeker_analyses', id);
    if (!analysis || analysis.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Analysis not found' } });
      return;
    }

    res.json({ analysis });
  }

  // ============================================================================
  // ATS QUALITY CHECKER
  // ============================================================================

  public static async checkAtsQuality(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { resumeId, jobTitle, jobDescription } = req.body;

    let resume = null;
    if (resumeId) {
      resume = await db.findById('seeker_resumes', resumeId);
    } else {
      const userResumes = await db.query('seeker_resumes', (r) => r.userId === userId);
      resume = userResumes.find((r) => r.isActive) || userResumes[0];
    }

    if (!resume || resume.userId !== userId) {
      res.status(400).json({ error: { code: 'NO_RESUME', message: 'Please upload a resume first.' } });
      return;
    }

    let requirements: any[] = [];
    if (jobTitle && jobDescription) {
      requirements = await geminiService.extractRequirements(jobTitle, jobDescription);
    }

    const report = geminiService.analyzeAtsQuality(
      resume.extractedText || '',
      resume.parsedData || { fullName: 'Candidate', skills: [], experience: [], education: [], projects: [], rawText: resume.extractedText || '' },
      requirements
    );

    res.json({ report, resumeVersionLabel: resume.versionLabel });
  }

  // ============================================================================
  // RESUME IMPROVEMENT STUDIO
  // ============================================================================

  public static async getImprovementSuggestions(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { resumeId, targetJobTitle, targetJobDescription } = req.body;

    const resume = await db.findById('seeker_resumes', resumeId);
    if (!resume || resume.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Resume not found' } });
      return;
    }

    const title = targetJobTitle || 'Software Engineer';
    const requirements = await geminiService.extractRequirements(title, targetJobDescription || 'Full Stack Engineer with TypeScript and React');

    const suggestions = await geminiService.generateResumeImprovements(
      resume.extractedText || '',
      resume.parsedData || { fullName: 'Candidate', skills: [], experience: [], education: [], projects: [], rawText: resume.extractedText || '' },
      title,
      requirements
    );

    res.json({ suggestions, targetJobTitle: title });
  }

  public static async getImprovementState(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { resumeId } = req.params;

    const improvements = await db.query('seeker_improvements', (imp) => imp.userId === userId && imp.resumeId === resumeId);
    res.json({ improvementPlan: improvements[0] || null });
  }

  public static async saveImprovementState(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { resumeId, targetJobTitle, suggestions, structuredEditorContent } = req.body;

    const existing = await db.query('seeker_improvements', (imp) => imp.userId === userId && imp.resumeId === resumeId);

    if (existing.length > 0) {
      const updated = await db.update('seeker_improvements', existing[0].id, {
        targetJobTitle,
        suggestions: suggestions || existing[0].suggestions,
        structuredEditorContent: structuredEditorContent || existing[0].structuredEditorContent
      });
      res.json({ improvementPlan: updated });
    } else {
      const created = await db.insert('seeker_improvements', {
        id: uuidv4(),
        userId,
        resumeId,
        targetJobTitle: targetJobTitle || 'Target Role',
        suggestions: suggestions || [],
        structuredEditorContent: structuredEditorContent || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      res.status(201).json({ improvementPlan: created });
    }
  }

  // ============================================================================
  // INTERVIEW PREPARATION & MOCK INTERVIEW AGENT
  // ============================================================================

  public static async generateInterviewPrep(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { targetJobTitle, targetJobDescription, resumeId } = req.body;

    let resume = null;
    if (resumeId) {
      resume = await db.findById('seeker_resumes', resumeId);
    } else {
      const userResumes = await db.query('seeker_resumes', (r) => r.userId === userId);
      resume = userResumes.find((r) => r.isActive) || userResumes[0];
    }

    const title = targetJobTitle || 'Senior Software Engineer';
    const requirements = await geminiService.extractRequirements(
      title,
      targetJobDescription || 'Full Stack Engineer with TypeScript, React, Node.js, and PostgreSQL'
    );

    const resumeData = resume?.parsedData || { fullName: 'Candidate', skills: [], experience: [], education: [], projects: [], rawText: resume?.extractedText || '' };
    const evaluation = await geminiService.evaluateResume(resume?.id || 'default-id', 'default-version', requirements, resumeData);

    const questions = await geminiService.generateInterviewQuestions(
      title,
      requirements,
      evaluation,
      resumeData.fullName || 'Candidate',
      resumeData,
      resume?.extractedText || ''
    );

    // Map to practice question schema with grounding context
    const practiceQuestions = questions.map((q: any) => ({
      id: q.id || uuidv4(),
      category: q.category,
      difficulty: q.difficulty,
      questionText: q.questionText,
      competencyAssessed: q.relevanceReason?.replace('Focuses on: ', '') || 'Technical Competence',
      relevanceReason: q.relevanceReason,
      relatedProject: q.relatedProject || null,
      relatedSkills: q.relatedSkills || [],
      relatedRequirement: q.relatedRequirement || null,
      resumeEvidence: q.resumeEvidence || null,
      jobDescriptionEvidence: q.jobDescriptionEvidence || null,
      expectedSignals: q.expectedAnswerSignals || [],
      followUpQuestions: q.followUpQuestions || [],
      suggestedAnswerStructure: '1. State your high-level approach\n2. Detail implementation with concrete tools\n3. Quantify performance or trade-offs',
      selfRubric: q.evaluationRubric || {
        poor: 'Unable to explain core concepts or trade-offs',
        adequate: 'Explains standard pattern and basic syntax',
        strong: 'Demonstrates deep architectural mastery and edge-case awareness'
      }
    }));

    res.json({
      targetJobTitle: title,
      questions: practiceQuestions
    });
  }

  public static async startMockSession(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { targetJobTitle, questions } = req.body;

    if (!questions || questions.length === 0) {
      res.status(400).json({ error: { code: 'NO_QUESTIONS', message: 'Please provide interview questions for this mock session.' } });
      return;
    }

    const newSession = await db.insert('seeker_mock_sessions', {
      id: uuidv4(),
      userId,
      targetJobTitle: targetJobTitle || 'Practice Interview Session',
      questions,
      answers: [],
      currentQuestionIndex: 0,
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ session: newSession });
  }

  public static async submitMockAnswer(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { sessionId } = req.params;
    const { questionId, userAnswer, timeSpentSeconds } = req.body;

    const session = await db.findById('seeker_mock_sessions', sessionId);
    if (!session || session.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mock interview session not found' } });
      return;
    }

    const currentQuestion = session.questions.find((q: any) => q.id === questionId) || session.questions[session.currentQuestionIndex];
    if (!currentQuestion) {
      res.status(400).json({ error: { code: 'INVALID_QUESTION', message: 'Question not found in session' } });
      return;
    }

    // Evaluate answer with AI / Deterministic Evaluation
    const evaluation = await geminiService.evaluateMockInterviewAnswer(
      currentQuestion.questionText,
      userAnswer,
      currentQuestion.selfRubric,
      currentQuestion.expectedSignals
    );

    const answerRecord = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.questionText,
      userAnswer,
      score: evaluation.score,
      strengths: evaluation.strengths,
      weaknesses: evaluation.weaknesses,
      modelAnswerGuidance: evaluation.modelAnswerGuidance,
      timeSpentSeconds: timeSpentSeconds || 60
    };

    const updatedAnswers = [...session.answers.filter((a: any) => a.questionId !== currentQuestion.id), answerRecord];
    const nextIndex = session.currentQuestionIndex + 1;
    const isCompleted = nextIndex >= session.questions.length;

    let overallScore = undefined;
    let overallFeedback = undefined;
    if (isCompleted) {
      const avg = updatedAnswers.reduce((sum: number, a: any) => sum + a.score, 0) / updatedAnswers.length;
      overallScore = Math.round(avg * 10) / 10;
      overallFeedback = overallScore >= 4
        ? 'Outstanding performance across technical depth, structured delivery, and concrete outcomes.'
        : overallScore >= 3
        ? 'Solid interview session. Strengthen answers with more specific STAR metrics and trade-off considerations.'
        : 'Good effort. Focus on practicing detailed examples and technical terminology.';
    }

    const updatedSession = await db.update('seeker_mock_sessions', sessionId, {
      answers: updatedAnswers,
      currentQuestionIndex: isCompleted ? session.questions.length - 1 : nextIndex,
      isCompleted,
      overallScore,
      overallFeedback
    });

    res.json({
      evaluation,
      session: updatedSession
    });
  }

  public static async getMockSession(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { sessionId } = req.params;

    const session = await db.findById('seeker_mock_sessions', sessionId);
    if (!session || session.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Mock interview session not found' } });
      return;
    }

    res.json({ session });
  }

  public static async listMockSessions(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const sessions = await db.query('seeker_mock_sessions', (s) => s.userId === userId);
    const sorted = [...sessions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ sessions: sorted });
  }

  // ============================================================================
  // SKILL DEVELOPMENT ROADMAP
  // ============================================================================

  public static async getSkillRoadmap(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const roadmaps = await db.query('seeker_skill_roadmaps', (rm) => rm.userId === userId);
    const activeRoadmap = roadmaps[0] || null;
    res.json({ roadmap: activeRoadmap });
  }

  public static async generateSkillRoadmap(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { targetJobTitle, gaps } = req.body;

    const tasks = geminiService.generateSkillRoadmap(gaps || [], targetJobTitle || 'Senior Software Engineer');

    const existing = await db.query('seeker_skill_roadmaps', (rm) => rm.userId === userId);
    if (existing.length > 0) {
      const updated = await db.update('seeker_skill_roadmaps', existing[0].id, {
        targetJobTitle: targetJobTitle || existing[0].targetJobTitle,
        tasks
      });
      res.json({ roadmap: updated });
    } else {
      const created = await db.insert('seeker_skill_roadmaps', {
        id: uuidv4(),
        userId,
        targetJobTitle: targetJobTitle || 'Career Development Roadmap',
        tasks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      res.status(201).json({ roadmap: created });
    }
  }

  public static async createRoadmapTask(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { skillName, category, priority, whyItMatters, recommendedActivity, practicalProjectIdea, interviewValidationTask, targetDate } = req.body;

    const newTask = {
      id: `task-${uuidv4().slice(0, 8)}`,
      skillName: skillName || 'New Skill Objective',
      category: category || 'Technical Skill',
      priority: priority || 'medium',
      gapType: 'deepening',
      whyItMatters: whyItMatters || 'Target career milestone',
      recommendedActivity: recommendedActivity || 'Review relevant documentation and build test modules.',
      practicalProjectIdea: practicalProjectIdea || 'Create working GitHub proof-of-concept.',
      interviewValidationTask: interviewValidationTask || 'Prepare STAR interview response.',
      status: 'not_started',
      targetDate: targetDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
    };

    const existing = await db.query('seeker_skill_roadmaps', (rm) => rm.userId === userId);
    if (existing.length > 0) {
      const updatedTasks = [...existing[0].tasks, newTask];
      const updated = await db.update('seeker_skill_roadmaps', existing[0].id, { tasks: updatedTasks });
      res.status(201).json({ task: newTask, roadmap: updated });
    } else {
      const created = await db.insert('seeker_skill_roadmaps', {
        id: uuidv4(),
        userId,
        targetJobTitle: 'Career Development Roadmap',
        tasks: [newTask],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      res.status(201).json({ task: newTask, roadmap: created });
    }
  }

  public static async updateRoadmapTask(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { taskId } = req.params;
    const { status, targetDate, userNotes } = req.body;

    const roadmaps = await db.query('seeker_skill_roadmaps', (rm) => rm.userId === userId);
    if (roadmaps.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Roadmap not found' } });
      return;
    }

    const roadmap = roadmaps[0];
    const taskIndex = (roadmap.tasks || []).findIndex((t: any) => t.id === taskId);
    if (taskIndex === -1) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Task not found' } });
      return;
    }

    const updatedTask = {
      ...roadmap.tasks[taskIndex],
      status: status !== undefined ? status : roadmap.tasks[taskIndex].status,
      targetDate: targetDate !== undefined ? targetDate : roadmap.tasks[taskIndex].targetDate,
      userNotes: userNotes !== undefined ? userNotes : roadmap.tasks[taskIndex].userNotes,
      completedAt: status === 'completed' ? new Date().toISOString() : roadmap.tasks[taskIndex].completedAt
    };

    const updatedTasks = [...roadmap.tasks];
    updatedTasks[taskIndex] = updatedTask;

    const updatedRoadmap = await db.update('seeker_skill_roadmaps', roadmap.id, { tasks: updatedTasks });
    res.json({ task: updatedTask, roadmap: updatedRoadmap });
  }

  public static async deleteRoadmapTask(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { taskId } = req.params;

    const roadmaps = await db.query('seeker_skill_roadmaps', (rm) => rm.userId === userId);
    if (roadmaps.length === 0) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Roadmap not found' } });
      return;
    }

    const roadmap = roadmaps[0];
    const updatedTasks = (roadmap.tasks || []).filter((t: any) => t.id !== taskId);
    const updatedRoadmap = await db.update('seeker_skill_roadmaps', roadmap.id, { tasks: updatedTasks });

    res.json({ success: true, roadmap: updatedRoadmap });
  }

  // ============================================================================
  // JOB APPLICATION TRACKER
  // ============================================================================

  public static async getApplications(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { status, search } = req.query;

    let apps = await db.query('seeker_applications', (a) => a.userId === userId);

    if (status) {
      apps = apps.filter((a) => a.status === status);
    }

    if (search) {
      const q = String(search).toLowerCase();
      apps = apps.filter((a) => a.company.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q));
    }

    const sorted = [...apps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ applications: sorted });
  }

  public static async createApplication(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { company, jobTitle, location, jobUrl, salaryRange, status, appliedDate, resumeId, resumeVersionLabel, analysisId, matchScore, nextStep, followUpDate, notes } = req.body;

    if (!company || !jobTitle) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Company and Job Title are required.' } });
      return;
    }

    const appStatus = status || 'interested';
    const newApp = await db.insert('seeker_applications', {
      id: uuidv4(),
      userId,
      company,
      jobTitle,
      location: location || '',
      jobUrl: jobUrl || '',
      salaryRange: salaryRange || '',
      status: appStatus,
      appliedDate: appliedDate || (appStatus === 'applied' ? new Date().toISOString().split('T')[0] : undefined),
      resumeId: resumeId || null,
      resumeVersionLabel: resumeVersionLabel || '',
      analysisId: analysisId || null,
      matchScore: matchScore || undefined,
      nextStep: nextStep || '',
      followUpDate: followUpDate || '',
      notes: notes || '',
      activityLog: [
        {
          timestamp: new Date().toISOString(),
          status: appStatus,
          note: `Application record created with status '${appStatus}'.`
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({ application: newApp });
  }

  public static async updateApplication(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;
    const { status, nextStep, followUpDate, notes, salaryRange, location, jobUrl } = req.body;

    const app = await db.findById('seeker_applications', id);
    if (!app || app.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    const newActivityLog = [...(app.activityLog || [])];
    if (status && status !== app.status) {
      newActivityLog.push({
        timestamp: new Date().toISOString(),
        status,
        note: `Status updated from '${app.status}' to '${status}'.`
      });
    }

    const updated = await db.update('seeker_applications', id, {
      status: status !== undefined ? status : app.status,
      nextStep: nextStep !== undefined ? nextStep : app.nextStep,
      followUpDate: followUpDate !== undefined ? followUpDate : app.followUpDate,
      notes: notes !== undefined ? notes : app.notes,
      salaryRange: salaryRange !== undefined ? salaryRange : app.salaryRange,
      location: location !== undefined ? location : app.location,
      jobUrl: jobUrl !== undefined ? jobUrl : app.jobUrl,
      activityLog: newActivityLog
    });

    res.json({ application: updated });
  }

  public static async deleteApplication(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { id } = req.params;

    const app = await db.findById('seeker_applications', id);
    if (!app || app.userId !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Application not found' } });
      return;
    }

    await db.delete('seeker_applications', id);
    res.json({ success: true, message: 'Application record deleted.' });
  }

  // ============================================================================
  // AGENTIC AI JOB DISCOVERY & APPLICATION ASSISTANT
  // ============================================================================

  /**
   * GET /api/v1/seeker/jobs/preferences
   * Retrieves user's search preferences or infers initial preferences from active resume.
   */
  public static async getSearchPreferences(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const existing = await db.query('seeker_search_preferences', (p) => p.user_id === userId);

    if (existing.length > 0) {
      res.json({ preferences: existing[0] });
      return;
    }

    // Infer defaults from active resume
    const resumes = await db.query('seeker_resumes', (r) => r.userId === userId);
    const activeResume = resumes.find((r) => r.isActive) || resumes[0];
    const skills = activeResume?.parsedData?.skills || ['TypeScript', 'React', 'Node.js'];
    const inferredTitles = ['Full Stack Engineer', 'Software Engineer', 'Frontend Developer'];

    const defaultPrefs = {
      id: uuidv4(),
      userId,
      user_id: userId,
      targetJobTitles: inferredTitles,
      primarySkills: skills.slice(0, 8),
      preferredLocations: ['Remote', 'Bangalore', 'San Francisco', 'New York'],
      isRemoteOnly: false,
      workplaceTypes: ['remote', 'hybrid', 'onsite'],
      employmentTypes: ['full-time'],
      minSalary: null,
      maxSalary: null,
      salaryCurrency: 'USD',
      experienceLevel: 'all',
      targetIndustries: ['Technology', 'Fintech', 'SaaS'],
      autoDiscover: true,
      updatedAt: new Date().toISOString()
    };

    await db.insert('seeker_search_preferences', defaultPrefs);
    res.json({ preferences: defaultPrefs });
  }

  /**
   * PUT /api/v1/seeker/jobs/preferences
   * Updates user's search preferences.
   */
  public static async updateSearchPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const validated = JobSearchPreferencesSchema.partial().parse(req.body);

      const existing = await db.query('seeker_search_preferences', (p) => p.user_id === userId);

      let result;
      if (existing.length > 0) {
        result = await db.update('seeker_search_preferences', existing[0].id, {
          ...validated,
          updatedAt: new Date().toISOString()
        });
      } else {
        result = await db.insert('seeker_search_preferences', {
          id: uuidv4(),
          userId,
          user_id: userId,
          targetJobTitles: validated.targetJobTitles || ['Software Engineer'],
          primarySkills: validated.primarySkills || [],
          preferredLocations: validated.preferredLocations || ['Remote'],
          isRemoteOnly: validated.isRemoteOnly || false,
          workplaceTypes: validated.workplaceTypes || ['remote', 'hybrid', 'onsite'],
          employmentTypes: validated.employmentTypes || ['full-time'],
          minSalary: validated.minSalary || null,
          maxSalary: validated.maxSalary || null,
          salaryCurrency: validated.salaryCurrency || 'USD',
          experienceLevel: validated.experienceLevel || 'all',
          targetIndustries: validated.targetIndustries || [],
          autoDiscover: validated.autoDiscover ?? true,
          updatedAt: new Date().toISOString()
        });
      }

      res.json({ preferences: result });
    } catch (err: any) {
      console.error('Error updating search preferences:', err);
      res.status(400).json({ error: { code: 'UPDATE_PREFERENCES_ERROR', message: err.message || 'Failed to update preferences' } });
    }
  }

  /**
   * POST /api/v1/seeker/jobs/discover
   * Starts an agentic job discovery session across authorized multi-provider sources.
   */
  public static async discoverJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const query = JobDiscoveryQuerySchema.parse(req.body);

      // Retrieve active or selected resume
      const resumes = await db.query('seeker_resumes', (r) => r.userId === userId);
      const selectedResume = query.resumeId
        ? resumes.find((r) => r.id === query.resumeId)
        : resumes.find((r) => r.isActive) || resumes[0];

      const result = await jobDiscoveryService.discoverJobs(
        userId,
        query,
        selectedResume?.parsedData,
        selectedResume?.id,
        selectedResume?.versionLabel
      );

      res.json(result);
    } catch (err: any) {
      console.error('Error in discoverJobs:', err);
      res.status(400).json({ error: { code: 'DISCOVERY_ERROR', message: err.message || 'Failed to discover jobs' } });
    }
  }

  /**
   * GET /api/v1/seeker/jobs/recommended
   * Retrieves personalized AI job recommendations for the active resume profile.
   */
  public static async getRecommendedJobs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const resumes = await db.query('seeker_resumes', (r) => r.userId === userId);
      const activeResume = resumes.find((r) => r.isActive) || resumes[0];

      const prefsList = await db.query('seeker_search_preferences', (p) => p.user_id === userId);
      const prefs = prefsList[0];

      const targetRole =
        prefs?.targetJobTitles?.[0] ||
        (activeResume?.parsedData?.skills?.[0] ? `${activeResume.parsedData.skills[0]} Developer` : 'Software Engineer');

      const location = prefs?.preferredLocations?.[0] || (prefs?.isRemoteOnly ? 'Remote' : '');

      const query = {
        query: targetRole,
        role: targetRole,
        skills: activeResume?.parsedData?.skills || prefs?.primarySkills || [],
        location,
        workplaceType: prefs?.isRemoteOnly ? ('remote' as const) : ('all' as const),
        employmentType: 'all' as const,
        experienceLevel: 'all' as const,
        page: 1,
        limit: 20,
        sortBy: 'match_score' as const,
        useResumeProfile: true
      };

      const result = await jobDiscoveryService.discoverJobs(
        userId,
        query as any,
        activeResume?.parsedData,
        activeResume?.id,
        activeResume?.versionLabel
      );

      res.json(result);
    } catch (err: any) {
      console.error('Error in getRecommendedJobs:', err);
      res.status(400).json({ error: { code: 'RECOMMENDED_JOBS_ERROR', message: err.message || 'Failed to fetch recommendations' } });
    }
  }

  /**
   * POST /api/v1/seeker/jobs/save
   * Saves a discovered job opportunity to Saved Target Jobs.
   */
  public static async saveDiscoveredJob(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { job, notes } = req.body;

      if (!job || !job.title || !job.company) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Job payload is missing title or company.' } });
        return;
      }

      const safeUrl = SafeUrlValidator.sanitizeUrl(job.applicationUrl) || '';

      // Check if already saved
      const existing = await db.query('seeker_saved_jobs', (j) => j.user_id === userId && j.job_url === safeUrl);

      if (existing.length > 0) {
        res.json({ savedJob: existing[0], alreadySaved: true });
        return;
      }

      const savedRecord = await db.insert('seeker_saved_jobs', {
        id: uuidv4(),
        userId,
        user_id: userId,
        title: job.title,
        company: job.company,
        location: job.location || '',
        jobUrl: safeUrl,
        job_url: safeUrl,
        description: job.description || job.descriptionSnippet || '',
        requirements: (job.extractedSkills || []).map((skill: string, idx: number) => ({
          id: `req-${idx}`,
          text: `Proficiency in ${skill}`,
          category: 'technical_skill',
          importance: 'essential',
          weight: 5,
          assessableFromResume: true
        })),
        notes: notes || `Discovered from ${job.sourceLabel || 'Job Discovery Assistant'}. Match score: ${job.matchScore || 75}%`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      res.status(201).json({ savedJob: savedRecord });
    } catch (err: any) {
      console.error('Error saving discovered job:', err);
      res.status(400).json({ error: { code: 'SAVE_JOB_ERROR', message: err.message || 'Failed to save job' } });
    }
  }

  /**
   * POST /api/v1/seeker/jobs/apply
   * Safely adds or updates the application status in the Application Tracker pipeline.
   */
  public static async trackDiscoveredApplication(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { job, status, resumeId, notes } = req.body;

      if (!job || !job.title || !job.company) {
        res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Job details are required.' } });
        return;
      }

      const safeUrl = SafeUrlValidator.sanitizeUrl(job.applicationUrl) || '';
      const appStatus = status || 'applied';

      // Check existing application for this job URL
      const existingApps = await db.query('seeker_applications', (a) => a.userId === userId && a.jobUrl === safeUrl);

      let applicationRecord;
      if (existingApps.length > 0) {
        const existing = existingApps[0];
        const activityLog = [...(existing.activityLog || [])];
        activityLog.push({
          timestamp: new Date().toISOString(),
          status: appStatus,
          note: `Status updated via Job Discovery Assistant to '${appStatus}'.`
        });

        applicationRecord = await db.update('seeker_applications', existing.id, {
          status: appStatus,
          appliedDate: appStatus === 'applied' ? new Date().toISOString().split('T')[0] : existing.appliedDate,
          matchScore: job.matchScore || existing.matchScore,
          notes: notes || existing.notes,
          activityLog,
          updatedAt: new Date().toISOString()
        });
      } else {
        applicationRecord = await db.insert('seeker_applications', {
          id: uuidv4(),
          userId,
          user_id: userId,
          company: job.company,
          jobTitle: job.title,
          location: job.location || '',
          jobUrl: safeUrl,
          salaryRange: job.salaryFormatted || '',
          status: appStatus,
          appliedDate: appStatus === 'applied' ? new Date().toISOString().split('T')[0] : undefined,
          resumeId: resumeId || null,
          resumeVersionLabel: 'Active Resume',
          matchScore: job.matchScore || 75,
          nextStep: appStatus === 'applied' ? 'Awaiting response from recruiter' : 'Review requirements',
          notes: notes || `Direct application via ${job.sourceLabel || 'Job Discovery'}.`,
          activityLog: [
            {
              timestamp: new Date().toISOString(),
              status: appStatus,
              note: `Application record initiated with status '${appStatus}'.`
            }
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      res.status(201).json({ application: applicationRecord });
    } catch (err: any) {
      console.error('Error tracking application:', err);
      res.status(400).json({ error: { code: 'TRACK_APPLICATION_ERROR', message: err.message || 'Failed to track application' } });
    }
  }

  /**
   * POST /api/v1/seeker/jobs/dismiss
   * Dismisses a job recommendation for the user.
   */
  public static async dismissDiscoveredJob(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId, externalJobId } = req.body;

      const discoveredJobs = await db.query('seeker_discovered_jobs', (j) => j.user_id === userId && (j.id === jobId || j.external_job_id === externalJobId));

      for (const dJob of discoveredJobs) {
        await db.update('seeker_discovered_jobs', dJob.id, { is_dismissed: true });
      }

      res.json({ success: true, message: 'Job recommendation dismissed.' });
    } catch (err: any) {
      console.error('Error dismissing job:', err);
      res.status(400).json({ error: { code: 'DISMISS_JOB_ERROR', message: err.message || 'Failed to dismiss job' } });
    }
  }

  /**
   * GET /api/v1/seeker/jobs/platforms/links
   * Generates legitimate platform search shortcuts.
   */
  public static async getPlatformLinks(req: Request, res: Response): Promise<void> {
    try {
      const { role, location, workplaceType, query } = req.query;

      const links = PlatformSearchLinkGenerator.generatePlatformLinks({
        role: role ? String(role) : undefined,
        location: location ? String(location) : undefined,
        workplaceType: (workplaceType as any) || 'all',
        query: query ? String(query) : undefined
      } as any);

      res.json({ links });
    } catch (err: any) {
      console.error('Error generating platform links:', err);
      res.status(400).json({ error: { code: 'PLATFORM_LINKS_ERROR', message: err.message || 'Failed to generate platform links' } });
    }
  }
}

