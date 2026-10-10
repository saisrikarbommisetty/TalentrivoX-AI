import { describe, it, expect } from 'vitest';
import { GeminiService } from '../../src/ai/gemini.service.js';
import { JobRequirement, ExtractedResumeData, QuestionCategory } from '@avengercoders/shared';

describe('Balanced 4-Tier Interview Question Generation Blueprint Unit Tests', () => {
  const geminiService = new GeminiService();

  it('generates a balanced 4-tier question distribution (Projects, JD Technical, Fundamentals, HR)', async () => {
    const jobTitle = 'Senior Full-Stack Cloud Engineer';
    const jobDescription = 'Design scalable distributed cloud backends with Node.js and PostgreSQL. Collaborate with cross-functional stakeholders and mentor junior developers.';
    const requirements: JobRequirement[] = [
      { id: 'req-1', text: '5+ years Node.js backend development', importance: 'essential', weight: 40, assessableFromResume: true },
      { id: 'req-2', text: 'PostgreSQL database optimization & caching', importance: 'essential', weight: 30, assessableFromResume: true },
      { id: 'req-3', text: 'Strong communication and cross-functional leadership', importance: 'desirable', weight: 30, assessableFromResume: false },
    ];

    const resumeData: ExtractedResumeData = {
      fullName: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'Redis'],
      experienceYears: 6,
      projects: [
        {
          name: 'Distributed Order Processor',
          role: 'Lead Architect',
          technologies: ['Node.js', 'PostgreSQL', 'Redis', 'BullMQ'],
          description: 'Designed asynchronous task queue processing 5,000 req/sec with PostgreSQL write replication and Redis caching.',
          outcomes: ['Reduced checkout latency by 45%', 'Zero data loss during failovers']
        }
      ],
      rawText: 'Senior Engineer with 6 years experience architecting cloud backend systems using Node.js and PostgreSQL.'
    };

    // Test deterministic generator (ensures fallback and contract compliance)
    const questions = await geminiService.generateInterviewQuestions(
      jobTitle,
      requirements,
      undefined as any,
      'Alex Morgan',
      resumeData,
      resumeData.rawText
    );

    expect(questions.length).toBeGreaterThanOrEqual(16);

    // Verify all 4 categories exist in output
    const projectQuestions = questions.filter(
      (q) => q.category === QuestionCategory.PROJECT_VERIFICATION || q.relatedProject
    );
    const jdTechnicalQuestions = questions.filter(
      (q) => q.category === QuestionCategory.TECHNICAL_KNOWLEDGE ||
             q.category === QuestionCategory.SKILL_GAP_VALIDATION ||
             q.category === QuestionCategory.ROLE_SPECIFIC_SCENARIOS
    );
    const fundamentalsQuestions = questions.filter(
      (q) => q.category === QuestionCategory.ROLE_FUNDAMENTALS ||
             q.category === QuestionCategory.PRACTICAL_PROBLEM_SOLVING
    );
    const hrQuestions = questions.filter(
      (q) => q.category === QuestionCategory.HR_COMMUNICATION ||
             q.category === QuestionCategory.BEHAVIORAL_SITUATIONAL
    );

    expect(projectQuestions.length).toBeGreaterThanOrEqual(5);
    expect(jdTechnicalQuestions.length).toBeGreaterThanOrEqual(3);
    expect(fundamentalsQuestions.length).toBeGreaterThanOrEqual(3);
    expect(hrQuestions.length).toBeGreaterThanOrEqual(4);

    // Verify grounding fields are populated on project questions
    const firstProjectQ = projectQuestions.find(q => q.relatedProject);
    expect(firstProjectQ).toBeDefined();
    expect(firstProjectQ?.relatedProject).toBe('Distributed Order Processor');
    expect(firstProjectQ?.resumeEvidence).toBeDefined();

    // Verify rubrics, expected signals, and follow-ups exist across all questions
    for (const q of questions) {
      expect(q.questionText).toBeTruthy();
      expect(q.difficulty).toBeDefined();
      expect(q.expectedAnswerSignals.length).toBeGreaterThan(0);
      expect(q.followUpQuestions.length).toBeGreaterThan(0);
      expect(q.evaluationRubric).toBeDefined();
      expect(q.evaluationRubric.strong).toBeTruthy();
      expect(q.evaluationRubric.adequate).toBeTruthy();
      expect(q.evaluationRubric.poor).toBeTruthy();
    }
  });

  it('adapts questions when candidate has different resume projects', async () => {
    const jobTitle = 'Full-Stack Developer';
    const requirements: JobRequirement[] = [
      { id: 'req-1', text: 'React frontend experience', importance: 'essential', weight: 50, assessableFromResume: true }
    ];

    const resumeDataMobile: ExtractedResumeData = {
      fullName: 'David Chen',
      skills: ['React Native', 'GraphQL', 'Mobile Security'],
      experienceYears: 4,
      projects: [
        {
          name: 'Fintech Mobile Wallet',
          role: 'Mobile Lead',
          technologies: ['React Native', 'GraphQL'],
          description: 'Built biometrically secured mobile payments app.'
        }
      ]
    };

    const questions = await geminiService.generateInterviewQuestions(
      jobTitle,
      requirements,
      undefined as any,
      'David Chen',
      resumeDataMobile
    );

    const projectQ = questions.find(q => q.relatedProject === 'Fintech Mobile Wallet');
    expect(projectQ).toBeDefined();
    expect(projectQ?.questionText).toContain('Fintech Mobile Wallet');
  });
});
