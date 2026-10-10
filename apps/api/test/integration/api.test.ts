import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../src/server';

const app = createServer();
let authToken: string;
let createdJobId: string;
let createdJobCandidateId: string;
let createdPlanId: string;

describe('API Integration Test Suite (AvengerCoders Recruitment Engine)', () => {
  it('GET /api/v1/health returns healthy status and AI metadata', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.aiProvider).toBeDefined();
  });

  it('POST /api/v1/auth/demo logs in and provides valid JWT', async () => {
    const res = await request(app).post('/api/v1/auth/demo');
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('recruiter');
    authToken = res.body.token;
  });

  it('GET /api/v1/auth/me returns authenticated recruiter profile', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('recruiter@avengercoders.ai');
  });

  it('POST /api/v1/jobs creates a new hiring job and establishes requirement version 1', async () => {
    const newJobPayload = {
      title: 'Full-Stack React & Node Engineer',
      department: 'Product Development',
      location: 'Remote',
      employmentType: 'full-time',
      seniority: 'senior',
      description: 'Looking for an experienced engineer skilled in TypeScript, React, Express, and PostgreSQL.',
      responsibilities: ['Build features', 'Maintain tests'],
      requirements: [
        {
          id: 'req-ts',
          text: 'Proficiency in TypeScript and React',
          category: 'technical_skill',
          importance: 'essential',
          weight: 9,
          evidenceExpectations: 'React, TypeScript, Redux',
          assessableFromResume: true
        },
        {
          id: 'req-db',
          text: 'Experience with PostgreSQL and SQL schema design',
          category: 'technical_skill',
          importance: 'essential',
          weight: 7,
          evidenceExpectations: 'PostgreSQL, Relational modeling',
          assessableFromResume: true
        }
      ]
    };

    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newJobPayload);

    expect(res.status).toBe(201);
    expect(res.body.job.id).toBeDefined();
    expect(res.body.requirements.length).toBe(2);
    expect(res.body.requirementVersion.version_number).toBe(1);
    createdJobId = res.body.job.id;
  });

  it('GET /api/v1/jobs retrieves owner jobs', async () => {
    const res = await request(app)
      .get('/api/v1/jobs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.some((j: any) => j.id === createdJobId)).toBe(true);
  });

  it('POST /api/v1/jobs/:jobId/resumes uploads resume, extracts text, and evaluates candidate', async () => {
    // Create a mock text-based docx/pdf-like test buffer with valid %PDF header
    const mockPdfContent = `%PDF-1.4
%âãÏÓ
Alex Johnson
Email: alex.johnson@example.com
Phone: (555) 123-4567

Summary:
Senior Software Engineer with 6+ years of experience building modern web applications with React, TypeScript, and Node.js.

Technical Skills:
TypeScript, React, Redux, Node.js, Express, PostgreSQL, Docker, Git.

Experience:
Senior Frontend Developer - Acme Tech (2020 - Present)
- Architected high-performance web applications using React and TypeScript.
- Designed database schemas in PostgreSQL with complex migrations.
%%EOF`;

    const res = await request(app)
      .post(`/api/v1/jobs/${createdJobId}/resumes`)
      .set('Authorization', `Bearer ${authToken}`)
      .attach('files', Buffer.from(mockPdfContent, 'utf-8'), 'Alex_Johnson_Resume.pdf');

    expect(res.status).toBe(201);
    expect(res.body.results.length).toBe(1);
    expect(res.body.results[0].status).toBe('success');
    expect(res.body.results[0].jobCandidateId).toBeDefined();
    createdJobCandidateId = res.body.results[0].jobCandidateId;
  });

  it('GET /api/v1/job-candidates/:id returns candidate evidence and transparent match score', async () => {
    const res = await request(app)
      .get(`/api/v1/job-candidates/${createdJobCandidateId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.candidate).toBeDefined();
    expect(res.body.evaluation).toBeDefined();
    expect(res.body.evaluation.overall_score).toBeGreaterThanOrEqual(0);
    expect(res.body.evaluation.overall_score).toBeLessThanOrEqual(100);
    expect(res.body.assessments.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/v1/job-candidates/:id/interview-plans generates tailored interview plan', async () => {
    const res = await request(app)
      .post(`/api/v1/job-candidates/${createdJobCandidateId}/interview-plans`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(201);
    expect(res.body.plan.id).toBeDefined();
    expect(res.body.questions.length).toBeGreaterThanOrEqual(1);
    createdPlanId = res.body.plan.id;
  });

  it('POST /api/v1/interview-plans/:planId/sessions records live interview session and feedback', async () => {
    const planRes = await request(app)
      .get(`/api/v1/interview-plans/${createdPlanId}`)
      .set('Authorization', `Bearer ${authToken}`);

    const questions = planRes.body.questions;
    const firstQId = questions[0].id;

    const res = await request(app)
      .post(`/api/v1/interview-plans/${createdPlanId}/sessions`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        interviewerNotes: 'Candidate demonstrated great depth in TypeScript architecture.',
        feedback: [
          {
            questionId: firstQId,
            rating: 5,
            notes: 'Clear understanding of state machines and generic types.'
          }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.session.id).toBeDefined();
  });

  it('GET /api/v1/jobs/:jobId/analytics returns real metrics & distributions', async () => {
    const res = await request(app)
      .get(`/api/v1/jobs/${createdJobId}/analytics`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.totalCandidates).toBeGreaterThanOrEqual(1);
    expect(res.body.scoreBuckets).toBeDefined();
    expect(res.body.funnel).toBeDefined();
  });

  it('GET /api/v1/jobs/:jobId/export/csv exports sanitized candidate CSV', async () => {
    const res = await request(app)
      .get(`/api/v1/jobs/${createdJobId}/export/csv`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Candidate Name');
    expect(res.text).toContain('Alex');
  });
});
