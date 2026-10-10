import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createServer } from '../../src/server.js';

const app = createServer();
let seekerToken: string;
let otherSeekerToken: string;

describe('Agentic AI Job Discovery & Application Assistant Integration Suite', () => {
  beforeAll(async () => {
    // 1. Authenticate Seeker A
    const resA = await request(app)
      .post('/api/v1/auth/demo')
      .send({ role: 'job_seeker' });
    expect(resA.status).toBe(200);
    seekerToken = resA.body.token;

    // 2. Authenticate Seeker B for isolation testing
    const resB = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: `discovery-candidate-${Date.now()}@example.com`,
        password: 'securePassword123',
        fullName: 'Discovery Candidate',
        role: 'job_seeker'
      });
    expect(resB.status).toBe(201);
    otherSeekerToken = resB.body.token;
  });

  it('GET /api/v1/seeker/jobs/preferences returns default search preferences', async () => {
    const res = await request(app)
      .get('/api/v1/seeker/jobs/preferences')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.preferences).toBeDefined();
    expect(Array.isArray(res.body.preferences.targetJobTitles)).toBe(true);
    expect(Array.isArray(res.body.preferences.primarySkills)).toBe(true);
  });

  it('PUT /api/v1/seeker/jobs/preferences updates target job search preferences', async () => {
    const updatePayload = {
      targetJobTitles: ['Principal Full Stack Architect', 'Lead Frontend Engineer'],
      primarySkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'GraphQL'],
      preferredLocations: ['Remote', 'Bangalore'],
      isRemoteOnly: true,
      experienceLevel: 'senior'
    };

    const res = await request(app)
      .put('/api/v1/seeker/jobs/preferences')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.preferences.isRemoteOnly).toBe(true);
    expect(res.body.preferences.targetJobTitles).toContain('Principal Full Stack Architect');
  });

  it('POST /api/v1/seeker/jobs/discover executes multi-provider search & evaluates relevance', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/jobs/discover')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        role: 'Full Stack Engineer',
        query: 'React Node.js',
        location: 'Remote',
        workplaceType: 'remote',
        sortBy: 'match_score',
        page: 1,
        limit: 10
      });

    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBeDefined();
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(Array.isArray(res.body.providerStatuses)).toBe(true);
    expect(Array.isArray(res.body.platformFallbackLinks)).toBe(true);
    expect(res.body.platformFallbackLinks.length).toBeGreaterThanOrEqual(4);

    if (res.body.jobs.length > 0) {
      const firstJob = res.body.jobs[0];
      expect(firstJob.title).toBeTruthy();
      expect(firstJob.company).toBeTruthy();
      expect(firstJob.applicationUrl).toBeTruthy();
      expect(firstJob.applicationUrl.startsWith('http')).toBe(true);
      expect(firstJob.matchScore).toBeGreaterThanOrEqual(0);
      expect(firstJob.matchScore).toBeLessThanOrEqual(100);
      expect(firstJob.matchExplanation).toBeDefined();
    }
  }, 15000);

  it('GET /api/v1/seeker/jobs/recommended returns AI recommended jobs based on resume', async () => {
    const res = await request(app)
      .get('/api/v1/seeker/jobs/recommended')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
  }, 15000);

  it('POST /api/v1/seeker/jobs/save bookmarks a discovered job opportunity', async () => {
    const uniqueUrl = `https://careers.acme.com/jobs/cloud-eng-${Date.now()}`;
    const res = await request(app)
      .post('/api/v1/seeker/jobs/save')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        job: {
          title: 'Senior Cloud Platform Engineer',
          company: 'Acme Cloud Labs',
          location: 'Remote',
          applicationUrl: uniqueUrl,
          description: 'Build high-performance cloud services with Go and TypeScript.',
          extractedSkills: ['TypeScript', 'Go', 'Docker'],
          matchScore: 88,
          sourceLabel: 'Global Tech Job Network'
        },
        notes: 'Priority target application for Q4.'
      });

    expect([200, 201]).toContain(res.status);
    expect(res.body.savedJob.id).toBeDefined();
    expect(res.body.savedJob.title).toBe('Senior Cloud Platform Engineer');
  });

  it('POST /api/v1/seeker/jobs/apply logs application initiation in pipeline tracker', async () => {
    const res = await request(app)
      .post('/api/v1/seeker/jobs/apply')
      .set('Authorization', `Bearer ${seekerToken}`)
      .send({
        job: {
          title: 'Senior Cloud Platform Engineer',
          company: 'Acme Cloud Labs',
          location: 'Remote',
          applicationUrl: 'https://careers.acme.com/jobs/cloud-eng',
          matchScore: 88,
          sourceLabel: 'Global Tech Job Network'
        },
        status: 'applied',
        notes: 'Submitted resume via career portal.'
      });

    expect(res.status).toBe(201);
    expect(res.body.application.status).toBe('applied');
    expect(res.body.application.company).toBe('Acme Cloud Labs');
    expect(res.body.application.matchScore).toBe(88);
  });

  it('GET /api/v1/seeker/jobs/platforms/links returns safe platform search shortcuts', async () => {
    const res = await request(app)
      .get('/api/v1/seeker/jobs/platforms/links?role=React%20Developer&location=Bangalore')
      .set('Authorization', `Bearer ${seekerToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.links)).toBe(true);
    expect(res.body.links.some((l: any) => l.platform === 'naukri')).toBe(true);
    expect(res.body.links.some((l: any) => l.platform === 'indeed')).toBe(true);
    expect(res.body.links.some((l: any) => l.platform === 'linkedin')).toBe(true);
  });
});
