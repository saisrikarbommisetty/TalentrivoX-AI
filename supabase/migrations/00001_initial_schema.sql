-- AvengerCoders - AI Resume Screening & Interview Agent
-- Schema Migration 00001: Core Architecture & RLS

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'recruiter' CHECK (role IN ('recruiter', 'hiring_manager', 'admin', 'interviewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Jobs Table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    employment_type TEXT NOT NULL DEFAULT 'full-time',
    seniority TEXT NOT NULL DEFAULT 'mid',
    description TEXT NOT NULL,
    responsibilities JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_owner_id ON jobs(owner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);

-- 3. Job Requirement Versions Table (Preserves version history of requirements for deterministic audits)
CREATE TABLE IF NOT EXISTS job_requirement_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL DEFAULT 1,
    requirements_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_job_requirement_version UNIQUE (job_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_job_req_job_id ON job_requirement_versions(job_id);

-- 4. Candidates Table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    summary TEXT,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    experience JSONB NOT NULL DEFAULT '[]'::jsonb,
    education JSONB NOT NULL DEFAULT '[]'::jsonb,
    projects JSONB NOT NULL DEFAULT '[]'::jsonb,
    certifications JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_experience_years NUMERIC,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_owner_id ON candidates(owner_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);

-- 5. Job Candidates Table (Associates a candidate with a specific job application & resume)
CREATE TABLE IF NOT EXISTS job_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    resume_file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    extracted_text TEXT NOT NULL DEFAULT '',
    extraction_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (extraction_status IN ('uploaded', 'processing', 'completed', 'failed', 'needs_ocr')),
    workflow_status TEXT NOT NULL DEFAULT 'awaiting_review' CHECK (workflow_status IN ('awaiting_review', 'reviewed', 'shortlisted', 'interview_planned', 'interview_completed', 'offer_extended', 'rejected')),
    processing_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_job_candidate_submission UNIQUE (job_id, candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_job_candidates_job_id ON job_candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_job_candidates_candidate_id ON job_candidates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_job_candidates_extraction_status ON job_candidates(extraction_status);
CREATE INDEX IF NOT EXISTS idx_job_candidates_workflow_status ON job_candidates(workflow_status);

-- 6. Evaluations Table
CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_candidate_id UUID NOT NULL REFERENCES job_candidates(id) ON DELETE CASCADE,
    requirement_version_id UUID NOT NULL REFERENCES job_requirement_versions(id) ON DELETE RESTRICT,
    overall_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (overall_score >= 0 AND overall_score <= 100),
    coverage_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
    essential_coverage_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (essential_coverage_percentage >= 0 AND essential_coverage_percentage <= 100),
    evaluation_status TEXT NOT NULL DEFAULT 'completed' CHECK (evaluation_status IN ('pending', 'processing', 'completed', 'failed')),
    matching_method TEXT NOT NULL DEFAULT 'deterministic' CHECK (matching_method IN ('deterministic', 'hybrid_ai', 'ai_enhanced')),
    calculation_explanation TEXT,
    summary TEXT,
    uncertainties JSONB NOT NULL DEFAULT '[]'::jsonb,
    suggested_interview_topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    model_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_job_candidate ON evaluations(job_candidate_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_score ON evaluations(overall_score);

-- 7. Requirement Assessments Table (Granular evidence-backed findings per requirement)
CREATE TABLE IF NOT EXISTS requirement_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    requirement_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('demonstrated', 'partial', 'not_evidenced', 'needs_review')),
    evidence_score NUMERIC(3,2) NOT NULL CHECK (evidence_score >= 0 AND evidence_score <= 1),
    evidence_text TEXT NOT NULL DEFAULT '',
    source_page INTEGER,
    reasoning_summary TEXT NOT NULL DEFAULT '',
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.80,
    review_status TEXT NOT NULL DEFAULT 'pending_review' CHECK (review_status IN ('pending_review', 'verified', 'disputed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_req_assessments_evaluation ON requirement_assessments(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_req_assessments_status ON requirement_assessments(status);

-- 8. Interview Plans Table
CREATE TABLE IF NOT EXISTS interview_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_candidate_id UUID NOT NULL REFERENCES job_candidates(id) ON DELETE CASCADE,
    evaluation_id UUID REFERENCES evaluations(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_progress', 'completed')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_plans_candidate ON interview_plans(job_candidate_id);

-- 9. Interview Questions Table
CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_plan_id UUID NOT NULL REFERENCES interview_plans(id) ON DELETE CASCADE,
    requirement_id TEXT,
    category TEXT NOT NULL CHECK (category IN ('technical_knowledge', 'practical_problem_solving', 'behavioral_situational', 'project_verification', 'skill_gap_validation', 'role_specific_scenarios')),
    question_text TEXT NOT NULL,
    relevance_reason TEXT NOT NULL DEFAULT '',
    expected_answer_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    follow_up_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    difficulty TEXT NOT NULL DEFAULT 'mid' CHECK (difficulty IN ('junior', 'mid', 'senior', 'lead')),
    evaluation_rubric JSONB NOT NULL DEFAULT '{"poor": "No understanding", "adequate": "Basic match", "strong": "Deep mastery"}'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_questions_plan ON interview_questions(interview_plan_id);

-- 10. Interview Sessions Table
CREATE TABLE IF NOT EXISTS interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_plan_id UUID NOT NULL REFERENCES interview_plans(id) ON DELETE CASCADE,
    interviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    interviewer_notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_plan ON interview_sessions(interview_plan_id);

-- 11. Interview Feedback Table
CREATE TABLE IF NOT EXISTS interview_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    interview_session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    interview_question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    notes TEXT NOT NULL DEFAULT '',
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_session ON interview_feedback(interview_session_id);

-- 12. Candidate Reviews Table
CREATE TABLE IF NOT EXISTS candidate_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_candidate_id UUID NOT NULL REFERENCES job_candidates(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_requirement_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all recruiters in workspace, edit only their own
CREATE POLICY profiles_select_all ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs: Recruiters can view & manage their own jobs
CREATE POLICY jobs_owner_policy ON jobs FOR ALL USING (auth.uid() = owner_id);

-- Job Requirement Versions: Follow job ownership
CREATE POLICY job_req_versions_policy ON job_requirement_versions FOR ALL
USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_requirement_versions.job_id AND jobs.owner_id = auth.uid()));

-- Candidates: Follow owner_id
CREATE POLICY candidates_owner_policy ON candidates FOR ALL USING (auth.uid() = owner_id);

-- Job Candidates: Follow job ownership
CREATE POLICY job_candidates_policy ON job_candidates FOR ALL
USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_candidates.job_id AND jobs.owner_id = auth.uid()));

-- Evaluations: Follow job candidate ownership
CREATE POLICY evaluations_policy ON evaluations FOR ALL
USING (EXISTS (
    SELECT 1 FROM job_candidates
    JOIN jobs ON jobs.id = job_candidates.job_id
    WHERE job_candidates.id = evaluations.job_candidate_id AND jobs.owner_id = auth.uid()
));

-- Requirement Assessments: Follow evaluation ownership
CREATE POLICY req_assessments_policy ON requirement_assessments FOR ALL
USING (EXISTS (
    SELECT 1 FROM evaluations
    JOIN job_candidates ON job_candidates.id = evaluations.job_candidate_id
    JOIN jobs ON jobs.id = job_candidates.job_id
    WHERE evaluations.id = requirement_assessments.evaluation_id AND jobs.owner_id = auth.uid()
));

-- Interview Plans: Follow job candidate ownership
CREATE POLICY interview_plans_policy ON interview_plans FOR ALL
USING (EXISTS (
    SELECT 1 FROM job_candidates
    JOIN jobs ON jobs.id = job_candidates.job_id
    WHERE job_candidates.id = interview_plans.job_candidate_id AND jobs.owner_id = auth.uid()
));

-- Interview Questions: Follow interview plan ownership
CREATE POLICY interview_questions_policy ON interview_questions FOR ALL
USING (EXISTS (
    SELECT 1 FROM interview_plans
    JOIN job_candidates ON job_candidates.id = interview_plans.job_candidate_id
    JOIN jobs ON jobs.id = job_candidates.job_id
    WHERE interview_plans.id = interview_questions.interview_plan_id AND jobs.owner_id = auth.uid()
));

-- Interview Sessions & Feedback: Follow interview plan ownership
CREATE POLICY interview_sessions_policy ON interview_sessions FOR ALL
USING (EXISTS (
    SELECT 1 FROM interview_plans
    JOIN job_candidates ON job_candidates.id = interview_plans.job_candidate_id
    JOIN jobs ON jobs.id = job_candidates.job_id
    WHERE interview_plans.id = interview_sessions.interview_plan_id AND jobs.owner_id = auth.uid()
));

CREATE POLICY interview_feedback_policy ON interview_feedback FOR ALL
USING (EXISTS (
    SELECT 1 FROM interview_sessions
    JOIN interview_plans ON interview_plans.id = interview_sessions.interview_plan_id
    JOIN job_candidates ON job_candidates.id = interview_plans.job_candidate_id
    JOIN jobs ON jobs.id = job_candidates.job_id
    WHERE interview_sessions.id = interview_feedback.interview_session_id AND jobs.owner_id = auth.uid()
));

-- Candidate Reviews: Follow job candidate ownership
CREATE POLICY candidate_reviews_policy ON candidate_reviews FOR ALL
USING (EXISTS (
    SELECT 1 FROM job_candidates
    JOIN jobs ON jobs.id = job_candidates.job_id
    WHERE job_candidates.id = candidate_reviews.job_candidate_id AND jobs.owner_id = auth.uid()
));

-- Audit Logs: Viewable by actor
CREATE POLICY audit_logs_policy ON audit_logs FOR ALL USING (auth.uid() = actor_id);
