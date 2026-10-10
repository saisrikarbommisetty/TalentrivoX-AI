import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

export interface DatabaseAdapter {
  isCloudConnected(): boolean;
  getSupabase(): SupabaseClient | null;
  // Local store helpers
  query<T = any>(collection: string, filter?: (item: any) => boolean): Promise<T[]>;
  findById<T = any>(collection: string, id: string): Promise<T | null>;
  insert<T = any>(collection: string, item: T): Promise<T>;
  update<T = any>(collection: string, id: string, updates: Partial<T>): Promise<T | null>;
  delete(collection: string, id: string): Promise<boolean>;
}

class InMemoryPersistentDatabase implements DatabaseAdapter {
  private data: Record<string, any[]> = {
    profiles: [],
    jobs: [],
    job_requirement_versions: [],
    candidates: [],
    job_candidates: [],
    evaluations: [],
    requirement_assessments: [],
    interview_plans: [],
    interview_questions: [],
    interview_sessions: [],
    interview_feedback: [],
    candidate_reviews: [],
    audit_logs: [],
    // Job Seeker Collections
    seeker_resumes: [],
    seeker_saved_jobs: [],
    seeker_analyses: [],
    seeker_improvements: [],
    seeker_interview_plans: [],
    seeker_mock_sessions: [],
    seeker_skill_roadmaps: [],
    seeker_applications: [],
    // Job Discovery Collections
    seeker_search_preferences: [],
    seeker_discovery_sessions: [],
    seeker_discovered_jobs: [],
    // Recruiter Candidate Discovery Collections
    recruiter_candidate_discovery_runs: [],
    recruiter_discovered_candidates: [],
    recruiter_saved_candidates: []
  };

  private storageFile: string;
  private supabase: SupabaseClient | null = null;

  constructor() {
    const dataDir = path.resolve(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.storageFile = path.join(dataDir, 'local_db.json');
    this.loadFromDisk();
    this.seedInitialDataIfEmpty();

    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && !env.SUPABASE_URL.includes('your-project')) {
      try {
        this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { persistSession: false }
        });
        console.log('[Database] Connected to Supabase Cloud Instance.');
      } catch (err) {
        console.warn('[Database] Supabase connection failed, falling back to local store.', err);
      }
    } else {
      console.log('[Database] Using local persistent JSON data store.');
    }
  }

  public isCloudConnected(): boolean {
    return this.supabase !== null;
  }

  public getSupabase(): SupabaseClient | null {
    return this.supabase;
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...this.data, ...parsed };
      }
    } catch (e) {
      console.error('[Database] Failed to read storage file, initializing empty', e);
    }
  }

  private saveToDisk() {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Database] Failed to write storage file', e);
    }
  }

  private seedInitialDataIfEmpty() {
    let mutated = false;
    const existingIds = new Set((this.data.profiles || []).map(p => p.id));
    const demoSeekerId = '00000000-0000-0000-0000-000000000003';
    
    if (!existingIds.has('00000000-0000-0000-0000-000000000001')) {
      this.data.profiles.push({
        id: '00000000-0000-0000-0000-000000000001',
        display_name: 'Sarah Jenkins (Lead Recruiter)',
        email: 'recruiter@avengercoders.ai',
        role: 'recruiter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      mutated = true;
    }

    if (!existingIds.has('00000000-0000-0000-0000-000000000002')) {
      this.data.profiles.push({
        id: '00000000-0000-0000-0000-000000000002',
        display_name: 'Alex Mercer (Engineering Manager)',
        email: 'manager@avengercoders.ai',
        role: 'hiring_manager',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      mutated = true;
    }

    if (!existingIds.has(demoSeekerId)) {
      this.data.profiles.push({
        id: demoSeekerId,
        display_name: 'Jordan Rivera',
        email: 'seeker@avengercoders.ai',
        role: 'job_seeker',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      mutated = true;
    }

    // Seed Initial Job Seeker Demo Data
    if (!this.data.seeker_resumes || this.data.seeker_resumes.length === 0) {
      const demoResumeId = '33333333-3333-3333-3333-333333333331';
      this.data.seeker_resumes = [{
        id: demoResumeId,
        userId: demoSeekerId,
        fileName: 'Jordan_Rivera_FullStack_Resume_v2.pdf',
        fileSize: 142800,
        fileType: 'application/pdf',
        storagePath: 'resumes/seeker/Jordan_Rivera_FullStack_Resume_v2.pdf',
        versionLabel: 'v2.4 - Full-Stack & React Focus',
        isActive: true,
        extractionStatus: 'completed',
        extractedText: `Jordan Rivera
Full-Stack Software Engineer
Email: jordan.rivera@example.com | GitHub: github.com/jrivera | Portfolio: jordanrivera.dev

PROFESSIONAL SUMMARY
Versatile Full-Stack Engineer with 4+ years of hands-on experience developing web applications using TypeScript, React, Next.js, and Node.js. Proven record of delivering resilient microservices, improving UI load performance by 35%, and writing robust unit and integration test suites.

TECHNICAL SKILLS
- Frontend: TypeScript, JavaScript (ES6+), React 18, Next.js, TailwindCSS, HTML5/CSS3, Redux Toolkit, React Query
- Backend: Node.js, Express, REST APIs, GraphQL, PostgreSQL, Redis, Prisma ORM
- Cloud & Tools: Docker, Git, CI/CD (GitHub Actions), Jest, Vitest, AWS (S3, EC2)

EXPERIENCE
Software Engineer | Nexus Digital Solutions (2022 - Present)
- Engineered responsive web dashboards in React and TypeScript serving 40,000+ daily active users.
- Built Node.js microservices with PostgreSQL for multi-tenant subscription billing and webhook notifications.
- Integrated automated Vitest test suites achieving 88% branch coverage across platform core services.
- Spearheaded client-side bundle optimizations that decreased Largest Contentful Paint (LCP) from 3.2s to 1.8s.

Junior Web Developer | CloudScale Apps (2020 - 2022)
- Developed RESTful API endpoints in Express.js and maintained PostgreSQL relational database migrations.
- Implemented responsive frontend views and component libraries with TypeScript and TailwindCSS.
- Collaborated in Agile sprint planning, daily standups, and rigorous peer code reviews.

EDUCATION & CERTIFICATIONS
- B.S. in Computer Science, State University (2016 - 2020)
- AWS Certified Cloud Practitioner (2023)

PROJECTS
- DevPulse Analytics: Open-source developer productivity dashboard built with Next.js, Node.js, and PostgreSQL.
- TaskFlow Pro: Real-time collaborative kanban workspace featuring WebSockets and Redis pub/sub.`,
        parsedData: {
          fullName: 'Jordan Rivera',
          email: 'jordan.rivera@example.com',
          phone: '+1 555-019-2834',
          summary: 'Versatile Full-Stack Engineer with 4+ years of hands-on experience developing web applications using TypeScript, React, Next.js, and Node.js.',
          skills: ['TypeScript', 'JavaScript', 'React', 'Next.js', 'TailwindCSS', 'Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker', 'Git', 'Jest', 'Vitest', 'AWS'],
          experience: [
            {
              title: 'Software Engineer',
              company: 'Nexus Digital Solutions',
              startDate: '2022',
              endDate: 'Present',
              description: 'Engineered responsive web dashboards and resilient Node.js microservices.'
            },
            {
              title: 'Junior Web Developer',
              company: 'CloudScale Apps',
              startDate: '2020',
              endDate: '2022',
              description: 'Developed RESTful API endpoints and maintained database migrations.'
            }
          ],
          education: [{ degree: 'B.S. in Computer Science', institution: 'State University', graduationYear: '2020' }],
          projects: [
            { name: 'DevPulse Analytics', description: 'Open-source developer productivity dashboard built with Next.js and PostgreSQL.' },
            { name: 'TaskFlow Pro', description: 'Real-time collaborative kanban workspace featuring WebSockets.' }
          ],
          certifications: ['AWS Certified Cloud Practitioner'],
          totalExperienceYears: 4
        },
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 5).toISOString()
      }];
      mutated = true;
    }

    // Seed Initial Saved Jobs
    if (!this.data.seeker_saved_jobs || this.data.seeker_saved_jobs.length === 0) {
      this.data.seeker_saved_jobs = [
        {
          id: '44444444-4444-4444-4444-444444444441',
          userId: demoSeekerId,
          title: 'Senior Full-Stack TypeScript Engineer',
          company: 'TalentrivoX Labs',
          location: 'San Francisco, CA (Hybrid / Remote)',
          jobUrl: 'https://careers.talentrivox.ai/jobs/senior-fullstack',
          description: 'We are seeking a seasoned Senior Full-Stack Engineer with deep experience in TypeScript, React, Node.js, and PostgreSQL. You will architect high-scale APIs, build responsive web applications, mentor engineers, and drive technical excellence.',
          notes: 'Top target role. High alignment with current TypeScript & React background.',
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 4).toISOString()
        },
        {
          id: '44444444-4444-4444-4444-444444444442',
          userId: demoSeekerId,
          title: 'Lead Frontend Platform Engineer',
          company: 'Vanguard Systems',
          location: 'Remote (US)',
          jobUrl: 'https://vanguardsystems.io/careers/lead-frontend',
          description: 'Looking for a Lead Frontend Engineer to head design systems architecture, micro-frontends, and web performance optimization in React 18, Next.js, and GraphQL.',
          notes: 'High compensation, requires deepening architecture & mentoring leadership evidence.',
          createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        }
      ];
      mutated = true;
    }

    // Seed Initial Skill Roadmap
    if (!this.data.seeker_skill_roadmaps || this.data.seeker_skill_roadmaps.length === 0) {
      this.data.seeker_skill_roadmaps = [{
        id: '55555555-5555-5555-5555-555555555551',
        userId: demoSeekerId,
        targetJobTitle: 'Senior Full-Stack TypeScript Engineer',
        tasks: [
          {
            id: 'task-roadmap-1',
            skillName: 'PostgreSQL Query Optimization & Indexing',
            category: 'Backend & Data Architecture',
            priority: 'high',
            gapType: 'deepening',
            whyItMatters: 'Senior roles evaluate knowledge of EXPLAIN ANALYZE, partial indexes, and connection pool sizing.',
            recommendedActivity: 'Deep dive into PostgreSQL execution plans, B-tree vs GIN indexing, and locking mechanisms.',
            practicalProjectIdea: 'Benchmark 10M record table queries before and after compound indexing.',
            interviewValidationTask: 'Prepare a STAR story about fixing an N+1 query and optimizing a sluggish database transaction.',
            status: 'in_progress',
            targetDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            userNotes: 'Reviewed EXPLAIN ANALYZE buffers output and index scans.'
          },
          {
            id: 'task-roadmap-2',
            skillName: 'System Design & High-Concurrency Microservices',
            category: 'System Architecture',
            priority: 'high',
            gapType: 'development_need',
            whyItMatters: 'Essential for passing the senior technical architecture interview round.',
            recommendedActivity: 'Study distributed rate limiting (Token Bucket/Leaky Bucket), Redis caching strategies, and event-driven architectures.',
            practicalProjectIdea: 'Build a distributed URL shortener or webhook dispatcher with idempotency keys.',
            interviewValidationTask: 'Practice designing a real-time notification service on a whiteboard / diagram.',
            status: 'not_started',
            targetDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
          },
          {
            id: 'task-roadmap-3',
            skillName: 'Engineering Leadership & Mentorship Evidence',
            category: 'Leadership & Culture',
            priority: 'medium',
            gapType: 'missing_evidence',
            whyItMatters: 'Resume demonstrates strong individual contributions but needs explicit leadership bullets.',
            recommendedActivity: 'Update resume with bullet points detailing code reviews, architecture RFCs, and mentoring junior devs.',
            practicalProjectIdea: 'Document an architectural decision record (ADR) template in GitHub portfolio.',
            interviewValidationTask: 'Structure an answer on how you resolved a technical disagreement in a pull request.',
            status: 'completed',
            targetDate: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
            completedAt: new Date(Date.now() - 86400000 * 1).toISOString()
          }
        ],
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }];
      mutated = true;
    }

    // Seed Initial Job Applications
    if (!this.data.seeker_applications || this.data.seeker_applications.length === 0) {
      this.data.seeker_applications = [
        {
          id: '66666666-6666-6666-6666-666666666661',
          userId: demoSeekerId,
          company: 'TalentrivoX Labs',
          jobTitle: 'Senior Full-Stack TypeScript Engineer',
          location: 'San Francisco, CA',
          jobUrl: 'https://careers.talentrivox.ai/jobs/senior-fullstack',
          salaryRange: '$165,000 - $190,000',
          status: 'interview',
          appliedDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
          resumeId: '33333333-3333-3333-3333-333333333331',
          resumeVersionLabel: 'v2.4 - Full-Stack & React Focus',
          matchScore: 88,
          nextStep: 'Technical architecture round scheduled for Thursday 2 PM',
          followUpDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          notes: 'Recruiter screen went great. Interviewer emphasized TypeScript generics and PostgreSQL scaling.',
          activityLog: [
            { timestamp: new Date(Date.now() - 86400000 * 4).toISOString(), status: 'applied', note: 'Application submitted with customized v2.4 resume.' },
            { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), status: 'interview', note: 'Passed initial recruiter screening. Technical round scheduled.' }
          ],
          createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
          id: '66666666-6666-6666-6666-666666666662',
          userId: demoSeekerId,
          company: 'Vanguard Systems',
          jobTitle: 'Lead Frontend Platform Engineer',
          location: 'Remote',
          jobUrl: 'https://vanguardsystems.io/careers/lead-frontend',
          salaryRange: '$170,000 - $195,000',
          status: 'preparing',
          appliedDate: undefined,
          resumeId: '33333333-3333-3333-3333-333333333331',
          resumeVersionLabel: 'v2.4 - Full-Stack & React Focus',
          matchScore: 78,
          nextStep: 'Complete resume tailoring in Resume Studio before applying',
          followUpDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          notes: 'Tailoring bullet points to emphasize design system tokens and Core Web Vitals.',
          activityLog: [
            { timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), status: 'interested', note: 'Saved role and analyzed requirements against resume.' }
          ],
          createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          updatedAt: new Date(Date.now() - 86400000 * 1).toISOString()
        }
      ];
      mutated = true;
    }

    if (this.data.jobs.length === 0) {
      const defaultJobId = '11111111-1111-1111-1111-111111111111';
      const defaultVersionId = '22222222-2222-2222-2222-222222222221';

      this.data.jobs.push({
        id: defaultJobId,
        owner_id: '00000000-0000-0000-0000-000000000001',
        title: 'Senior Full-Stack TypeScript Engineer',
        department: 'Core Platform Engineering',
        location: 'San Francisco, CA (Hybrid)',
        employment_type: 'full-time',
        seniority: 'senior',
        description: 'We are seeking a seasoned Senior Full-Stack Engineer with deep experience in TypeScript, React, Node.js, and PostgreSQL. You will architect high-scale APIs, build responsive web applications, mentor mid-level engineers, and drive technical excellence.',
        responsibilities: [
          'Architect scalable REST and GraphQL APIs using Node.js/TypeScript',
          'Build fast, accessible web interfaces using React and modern CSS',
          'Design relational database schemas and optimize PostgreSQL queries',
          'Collaborate closely with product designers and engineering leadership'
        ],
        status: 'active',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
      });

      this.data.job_requirement_versions.push({
        id: defaultVersionId,
        job_id: defaultJobId,
        version_number: 1,
        requirements_json: [
          {
            id: 'req-ts-1',
            text: '5+ years professional experience with TypeScript and modern React',
            category: 'technical_skill',
            importance: 'essential',
            weight: 9,
            evidenceExpectations: 'React hooks, state management, TypeScript generics, performance optimization',
            assessableFromResume: true
          },
          {
            id: 'req-node-2',
            text: 'Strong backend expertise with Node.js, Express/Fastify, and RESTful API architecture',
            category: 'technical_skill',
            importance: 'essential',
            weight: 8,
            evidenceExpectations: 'API design, asynchronous workflows, error handling, auth mechanisms',
            assessableFromResume: true
          },
          {
            id: 'req-sql-3',
            text: 'Hands-on PostgreSQL experience with indexing, migrations, and query tuning',
            category: 'domain_knowledge',
            importance: 'essential',
            weight: 7,
            evidenceExpectations: 'Relational data modeling, SQL queries, indexing, ORMs',
            assessableFromResume: true
          },
          {
            id: 'req-devops-4',
            text: 'Experience with Docker, CI/CD pipelines, and cloud deployment (AWS/GCP)',
            category: 'technical_skill',
            importance: 'preferred',
            weight: 5,
            evidenceExpectations: 'Containerization, automated deployment pipelines, cloud services',
            assessableFromResume: true
          },
          {
            id: 'req-lead-5',
            text: 'Demonstrated technical leadership, code reviews, and mentoring of junior engineers',
            category: 'responsibility',
            importance: 'preferred',
            weight: 6,
            evidenceExpectations: 'Lead engineer or senior engineer roles with mentoring responsibilities',
            assessableFromResume: true
          }
        ],
        created_by: '00000000-0000-0000-0000-000000000001',
        created_at: new Date(Date.now() - 86400000 * 3).toISOString()
      });

      mutated = true;
    }

    if (mutated) {
      this.saveToDisk();
    }
  }

  public async query<T = any>(collection: string, filter?: (item: any) => boolean): Promise<T[]> {
    const list = this.data[collection] || [];
    if (!filter) return [...list] as T[];
    return list.filter(filter) as T[];
  }

  public async findById<T = any>(collection: string, id: string): Promise<T | null> {
    const list = this.data[collection] || [];
    const item = list.find((i: any) => i.id === id);
    return item ? ({ ...item } as T) : null;
  }

  public async insert<T = any>(collection: string, item: T): Promise<T> {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const record = {
      ...(item as any),
      created_at: (item as any).created_at || new Date().toISOString(),
      updated_at: (item as any).updated_at || new Date().toISOString()
    };
    this.data[collection].push(record);
    this.saveToDisk();
    return { ...record } as T;
  }

  public async update<T = any>(collection: string, id: string, updates: Partial<T>): Promise<T | null> {
    const list = this.data[collection] || [];
    const index = list.findIndex((i: any) => i.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    list[index] = updated;
    this.saveToDisk();
    return { ...updated } as T;
  }

  public async delete(collection: string, id: string): Promise<boolean> {
    const list = this.data[collection] || [];
    const index = list.findIndex((i: any) => i.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    this.saveToDisk();
    return true;
  }
}

export const db: DatabaseAdapter = new InMemoryPersistentDatabase();
