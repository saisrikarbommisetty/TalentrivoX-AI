-- AvengerCoders - Seed Data
-- Fictional sample jobs, requirements, candidates, and assessments for demonstration

INSERT INTO profiles (id, display_name, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Sarah Jenkins (Lead Recruiter)', 'recruiter'),
  ('00000000-0000-0000-0000-000000000002', 'Alex Mercer (Engineering Manager)', 'hiring_manager')
ON CONFLICT (id) DO NOTHING;

-- Sample Job 1: Senior Full-Stack Engineer
INSERT INTO jobs (id, owner_id, title, department, location, employment_type, seniority, description, responsibilities, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'Senior Full-Stack TypeScript Engineer',
  'Core Platform Engineering',
  'San Francisco, CA (Hybrid)',
  'full-time',
  'senior',
  'We are seeking a seasoned Senior Full-Stack Engineer with deep experience in TypeScript, React, Node.js, and PostgreSQL. You will architect high-scale APIs, build responsive web applications, mentor mid-level engineers, and drive technical excellence.',
  '["Architect scalable REST and GraphQL APIs using Node.js/TypeScript", "Build fast, accessible web interfaces using React and modern CSS", "Design relational database schemas and optimize PostgreSQL queries", "Collaborate closely with product designers and engineering leadership"]'::jsonb,
  'active'
) ON CONFLICT (id) DO NOTHING;

-- Requirements Version 1 for Job 1
INSERT INTO job_requirement_versions (id, job_id, version_number, requirements_json, created_by)
VALUES (
  '22222222-2222-2222-2222-222222222221',
  '11111111-1111-1111-1111-111111111111',
  1,
  '[
    {
      "id": "req-ts-1",
      "text": "5+ years professional experience with TypeScript and modern React",
      "category": "technical_skill",
      "importance": "essential",
      "weight": 9,
      "evidenceExpectations": "React hooks, state management, TypeScript generics, performance optimization",
      "assessableFromResume": true
    },
    {
      "id": "req-node-2",
      "text": "Strong backend expertise with Node.js, Express/Fastify, and RESTful API architecture",
      "category": "technical_skill",
      "importance": "essential",
      "weight": 8,
      "evidenceExpectations": "API design, asynchronous workflows, error handling, auth mechanisms",
      "assessableFromResume": true
    },
    {
      "id": "req-sql-3",
      "text": "Hands-on PostgreSQL experience with indexing, migrations, and query tuning",
      "category": "domain_knowledge",
      "importance": "essential",
      "weight": 7,
      "evidenceExpectations": "Relational data modeling, SQL queries, indexing, ORMs",
      "assessableFromResume": true
    },
    {
      "id": "req-devops-4",
      "text": "Experience with Docker, CI/CD pipelines, and cloud deployment (AWS/GCP)",
      "category": "technical_skill",
      "importance": "preferred",
      "weight": 5,
      "evidenceExpectations": "Containerization, automated deployment pipelines, cloud services",
      "assessableFromResume": true
    },
    {
      "id": "req-lead-5",
      "text": "Demonstrated technical leadership, code reviews, and mentoring of junior engineers",
      "category": "responsibility",
      "importance": "preferred",
      "weight": 6,
      "evidenceExpectations": "Lead engineer or senior engineer roles with mentoring responsibilities",
      "assessableFromResume": true
    }
  ]'::jsonb,
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;
