import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../../src/server';
import jwt from 'jsonwebtoken';
import { env } from '../../src/config/env';

const app = createServer();

describe('Security & Multi-Tenant Isolation Tests (FR-01, FR-04, FR-15)', () => {
  const user1Token = jwt.sign(
    { id: 'user-1111-1111-1111-1111', email: 'recruiter1@company.com', displayName: 'Recruiter One', role: 'recruiter' },
    env.JWT_SECRET
  );

  const user2Token = jwt.sign(
    { id: 'user-2222-2222-2222-2222', email: 'recruiter2@company.com', displayName: 'Recruiter Two', role: 'recruiter' },
    env.JWT_SECRET
  );

  let user1JobId: string;
  let user1CandidateId: string;

  it('Rejects unauthenticated requests with 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/jobs');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('Rejects malformed tokens with 401 INVALID_TOKEN', async () => {
    const res = await request(app)
      .get('/api/v1/jobs')
      .set('Authorization', 'Bearer invalid.token.payload');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('Allows User 1 to create a private job opening', async () => {
    const res = await request(app)
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        title: 'Confidential Executive Role',
        department: 'Executive',
        location: 'New York',
        employmentType: 'full-time',
        seniority: 'executive',
        description: 'Highly confidential leadership opening.',
        requirements: [
          {
            id: 'req-exec-1',
            text: '10+ years executive leadership',
            category: 'experience',
            importance: 'essential',
            weight: 10,
            assessableFromResume: true
          }
        ]
      });

    expect(res.status).toBe(201);
    user1JobId = res.body.job.id;
  });

  it('Prevents User 2 from viewing or accessing User 1 private job', async () => {
    const res = await request(app)
      .get(`/api/v1/jobs/${user1JobId}`)
      .set('Authorization', `Bearer ${user2Token}`);

    expect(res.status).toBe(404);
  });

  it('Prevents User 2 from modifying User 1 job', async () => {
    const res = await request(app)
      .patch(`/api/v1/jobs/${user1JobId}`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ title: 'Hacked Title' });

    expect(res.status).toBe(404);
  });

  it('Rejects uploads with fake extensions and invalid magic bytes', async () => {
    // A file named resume.pdf but containing plain text without %PDF or zip header
    const badBuffer = Buffer.from('Just executable code pretending to be pdf', 'utf-8');

    const res = await request(app)
      .post(`/api/v1/jobs/${user1JobId}/resumes`)
      .set('Authorization', `Bearer ${user1Token}`)
      .attach('files', badBuffer, 'malicious.pdf');

    expect(res.status).toBe(201);
    expect(res.body.results[0].status).toBe('error');
    expect(res.body.results[0].error).toContain('invalid PDF header');
  });

  it('Sanitizes CSV formula injection characters (=, +, -, @)', async () => {
    // Upload resume with formula in candidate name
    const formulaPayload = `%PDF-1.4
=cmd|' /C calc'!A0
Email: formula@exploit.com
Summary: Senior Engineer with =1+1 experience.
Skills: TypeScript, React
%%EOF`;

    await request(app)
      .post(`/api/v1/jobs/${user1JobId}/resumes`)
      .set('Authorization', `Bearer ${user1Token}`)
      .attach('files', Buffer.from(formulaPayload, 'utf-8'), 'Formula_Resume.pdf');

    const exportRes = await request(app)
      .get(`/api/v1/jobs/${user1JobId}/export/csv`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(exportRes.status).toBe(200);
    // Any leading formula symbol should be escaped with a single quote
    expect(exportRes.text).not.toContain('"=cmd');
  });
});
