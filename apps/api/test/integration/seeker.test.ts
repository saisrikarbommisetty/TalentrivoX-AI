import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../src/server';

const app = createServer();
let seekerToken: string;
let otherSeekerToken: string;
let recruiterToken: string;

let createdResumeId: string;
let createdSavedJobId: string;
let createdAnalysisId: string;
let createdAppId: string;
let createdTaskId: string;
let createdMockSessionId: string;

describe('Job Seeker Platform Integration & Security Suite', () => {
  beforeAll(async () => {
    // 1. Authenticate Seeker A
    const resA = await request(app)
      .post('/api/v1/auth/demo')
      .send({ role: 'job_seeker' });
    expect(resA.status).toBe(200);
    expect(resA.body.user.role).toBe('job_seeker');
    seekerToken = resA.body.token;

    // 2. Register Seeker B for isolation testing
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `candidate-${Date.now()}@example.com`,
        password: 'securePassword123',
        fullName: 'Jane Candidate',
        role: 'job_seeker'
      });
    expect(resB.status).toBe(201);
    otherSeekerToken = resB.body.token;

    // 3. Authenticate Recruiter
    const resRecruiter = await request(app)
      .post('/api/v1/auth/demo')
      .send({ role: 'recruiter' });
    expect(resRecruiter.status).toBe(200);
    expect(resRecruiter.body.user.role).toBe('recruiter');
    recruiterToken = resRecruiter.body.token;
  });

  it('GET /api/v1/seeker/dashboard returns personalized career intelligence overview', async () => {
    const res = await request(app)
      .get('/api/v1/seeker/dashboard')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.activeResume).toBeDefined();
    expect(res.body.totalAnalysesCount).toBeGreaterThanOrEqual(0);
    expect(res.body.roadmapProgress).toBeDefined();
  });

  it('GET /api/v1/seeker/resumes retrieves multi-version personal resume vault', async () => {
    const res = await request(app)
      .get('/api/v1/seeker/resumes')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.resumes)).toBe(true);
    expect(res.body.resumes.length).toBeGreaterThan(0);
    createdResumeId = res.body.resumes[0].id;
  });

  it('PATCH /api/v1/seeker/resumes/:id updates resume version metadata and active flag', async () => {
    const res = await request(app)
      .patch(`/api/v1/seeker/resumes/${createdResumeId}`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        versionLabel: 'Updated Production Resume v2',
        isActive: true
      });

    expect(res.status).toBe(200);
    expect(res.body.resume.versionLabel).toBe('Updated Production Resume v2');
    expect(res.body.resume.isActive).toBe(true);
  });

  it('POST /api/v1/seeker/saved-jobs creates a new target role profile', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/saved-jobs')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        company: 'Stripe',
        title: 'Staff Full-Stack TypeScript Engineer',
        location: 'Remote, US',
        jobUrl: 'https://stripe.com/jobs/staff-ts',
        description: 'Lead architecture for payments workflows using TypeScript, Node.js, React, and PostgreSQL.',
        notes: 'Great culture, highly competitive compensation.'
      });

    expect(res.status).toBe(201);
    expect(res.body.savedJob.id).toBeDefined();
    expect(res.body.savedJob.title).toBe('Staff Full-Stack TypeScript Engineer');
    createdSavedJobId = res.body.savedJob.id;
  });

  it('POST /api/v1/seeker/analyze runs deterministic resume-to-job match analysis', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/analyze')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        resumeId: createdResumeId,
        savedJobId: createdSavedJobId
      });

    expect(res.status).toBe(201);
    expect(res.body.analysis).toBeDefined();
    expect(res.body.analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(res.body.analysis.overallScore).toBeLessThanOrEqual(100);
    expect(res.body.analysis.matches).toBeDefined();
    expect(Array.isArray(res.body.analysis.matches)).toBe(true);
    expect(res.body.analysis.actionableRecommendations).toBeDefined();
    createdAnalysisId = res.body.analysis.id;
  });

  it('POST /api/v1/seeker/ats-check audits resume for parser readability and keyword signals', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/ats-check')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        resumeId: createdResumeId,
        jobTitle: 'Senior TypeScript Engineer',
        jobDescription: 'Seeking expert in TypeScript, React, Node.js, GraphQL, PostgreSQL, and AWS.'
      });

    expect(res.status).toBe(200);
    expect(res.body.report).toBeDefined();
    expect(res.body.report.score).toBeGreaterThanOrEqual(0);
    expect(res.body.report.checks).toBeDefined();
    expect(res.body.report.checks.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/seeker/improve-suggestions generates STAR-method resume bullet rewrites', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/improve-suggestions')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        resumeId: createdResumeId,
        targetJobTitle: 'Senior Full-Stack Engineer',
        targetJobDescription: 'Requires strong React, Node.js, database optimization, and high availability systems.'
      });

    expect(res.status).toBe(200);
    expect(res.body.suggestions).toBeDefined();
    expect(Array.isArray(res.body.suggestions)).toBe(true);
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/seeker/interview-prep/generate builds tailored rubrics from resume and JD', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/interview-prep/generate')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        resumeId: createdResumeId,
        targetJobTitle: 'Senior Full-Stack Engineer',
        targetJobDescription: 'Architecture, microservices, PostgreSQL query performance, team leadership.'
      });

    expect(res.status).toBe(200);
    expect(res.body.questions).toBeDefined();
    expect(res.body.questions.length).toBeGreaterThan(0);
    
    // Validate resume-grounded fields
    const firstQ = res.body.questions[0];
    expect(firstQ.questionText).toBeDefined();
    expect(firstQ.expectedSignals).toBeDefined();
    expect(firstQ.expectedSignals.length).toBeGreaterThan(0);
    expect(firstQ.followUpQuestions).toBeDefined();
    expect(firstQ.followUpQuestions.length).toBeGreaterThan(0);
    expect(firstQ.selfRubric).toBeDefined();
    expect(firstQ.selfRubric.poor).toBeDefined();
    expect(firstQ.selfRubric.strong).toBeDefined();

    // Confirm that project verification questions exist
    const hasProjectOrTechnical = res.body.questions.some(
      (q: any) => q.category === 'project_verification' || q.category === 'practical_problem_solving' || q.relatedProject
    );
    expect(hasProjectOrTechnical).toBe(true);
  });

  it('POST /api/v1/seeker/mock-interviews/start initializes live interactive mock interview', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/mock-interviews/start')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        targetJobTitle: 'Senior Full-Stack Engineer',
        questions: [
          {
            id: 'q1',
            category: 'technical_skill',
            difficulty: 'hard',
            questionText: 'How would you scale a real-time event pipeline handling 50,000 events/sec?',
            competencyAssessed: 'System Design & Scalability',
            relevanceReason: 'Core infrastructure requirement',
            expectedSignals: ['Partitioning', 'Backpressure', 'Idempotency'],
            suggestedAnswerStructure: 'STAR or Architecture walkthrough',
            selfRubric: { poor: 'No queuing', adequate: 'Uses Kafka', strong: 'Discusses partitioning, consumer groups, dead letters' }
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.session.id).toBeDefined();
    createdMockSessionId = res.body.session.id;
  });

  it('POST /api/v1/seeker/mock-interviews/:id/submit-answer scores answer and provides feedback', async () => {
    const res = await request(app)
      .post(`/api/v1/seeker/mock-interviews/${createdMockSessionId}/submit-answer`)
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        questionId: 'q1',
        userAnswer: 'I would use Apache Kafka partitioned by customer ID, with consumer groups running in Kubernetes auto-scaled via KEDA. We implement idempotency keys in PostgreSQL to prevent duplicate processing.',
        timeSpentSeconds: 65
      });

    expect(res.status).toBe(200);
    expect(res.body.evaluation).toBeDefined();
    expect(res.body.evaluation.score).toBeGreaterThanOrEqual(1);
    expect(res.body.session.answers.length).toBe(1);
  });

  it('POST /api/v1/seeker/roadmap/tasks adds a skill development milestone', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/roadmap/tasks')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        skillName: 'Distributed Tracing with OpenTelemetry',
        category: 'Observability',
        priority: 'high',
        gapType: 'development_need',
        whyItMatters: 'Essential for microservice performance debugging',
        recommendedActivity: 'Instrument an Express & React service with Jaeger',
        practicalProjectIdea: 'Build end-to-end tracing across 3 demo microservices',
        interviewValidationTask: 'Explain trace context propagation headers'
      });

    expect(res.status).toBe(201);
    expect(res.body.task.id).toBeDefined();
    expect(res.body.task.skillName).toBe('Distributed Tracing with OpenTelemetry');
    createdTaskId = res.body.task.id;
  });

  it('POST /api/v1/seeker/applications creates a tracked job application', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/applications')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        company: 'Vercel',
        jobTitle: 'Senior Frontend Infrastructure Engineer',
        location: 'Remote',
        salaryRange: '$170k - $210k',
        status: 'applied',
        nextStep: 'Screening with Engineering Manager on Tuesday',
        resumeId: createdResumeId,
        analysisId: createdAnalysisId,
        notes: 'Referred by alumni connection.'
      });

    expect(res.status).toBe(201);
    expect(res.body.application.id).toBeDefined();
    expect(res.body.application.company).toBe('Vercel');
    createdAppId = res.body.application.id;
  });

  /* ------------------- SECURITY & DATA ISOLATION TESTS ------------------- */

  it('SECURITY: Seeker B cannot view or modify Seeker A resumes', async () => {
    const res = await request(app)
      .get(`/api/v1/seeker/resumes/${createdResumeId}`)
      .set('Authorization', `Bearer ${otherSeekerToken}`);

    // Must return 404 or 403 (resource not found for this tenant)
    expect([403, 404]).toContain(res.status);
  });

  it('SECURITY: Seeker B cannot view or modify Seeker A job applications', async () => {
    const res = await request(app)
      .patch(`/api/v1/seeker/applications/${createdAppId}`)
      .set('Authorization', `Bearer ${otherSeekerToken}`)
      .send({ status: 'rejected' });

    expect([403, 404]).toContain(res.status);
  });

  it('SECURITY: Unauthenticated requests to /seeker/* are rejected with 401', async () => {
    const res = await request(app).get('/api/v1/seeker/dashboard');
    expect(res.status).toBe(401);
  });
});
