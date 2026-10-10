-- TalentrivoX AI - Two-Sided Career Intelligence Platform
-- Migration 00002: Job Seeker Role, Personal Resume Vault, Career Intelligence & RLS

-- 1. Update Profiles Role Check constraint to support 'job_seeker'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('recruiter', 'hiring_manager', 'admin', 'interviewer', 'job_seeker'));

-- 2. Seeker Resumes Table (Personal multi-version resume vault)
CREATE TABLE IF NOT EXISTS seeker_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    version_label TEXT NOT NULL DEFAULT 'v1.0',
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    extraction_status TEXT NOT NULL DEFAULT 'uploaded' CHECK (extraction_status IN ('uploaded', 'processing', 'completed', 'failed', 'needs_ocr')),
    extracted_text TEXT,
    parsed_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_resumes_user_id ON seeker_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_seeker_resumes_active ON seeker_resumes(user_id, is_active);

-- 3. Seeker Saved Jobs (Target roles & job descriptions)
CREATE TABLE IF NOT EXISTS seeker_saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT,
    job_url TEXT,
    description TEXT NOT NULL,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_saved_jobs_user_id ON seeker_saved_jobs(user_id);

-- 4. Seeker Resume Analyses (Deterministic evidence-based match & gap audits)
CREATE TABLE IF NOT EXISTS seeker_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES seeker_resumes(id) ON DELETE CASCADE,
    resume_version_label TEXT NOT NULL,
    target_job_title TEXT NOT NULL,
    target_company TEXT,
    saved_job_id UUID REFERENCES seeker_saved_jobs(id) ON DELETE SET NULL,
    overall_score NUMERIC(5, 2) NOT NULL,
    essential_score NUMERIC(5, 2) NOT NULL,
    preferred_score NUMERIC(5, 2) NOT NULL,
    coverage_percentage NUMERIC(5, 2) NOT NULL,
    summary TEXT NOT NULL,
    matches JSONB NOT NULL DEFAULT '[]'::jsonb,
    strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
    critical_gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_evidence_opportunities JSONB NOT NULL DEFAULT '[]'::jsonb,
    actionable_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_analyses_user_id ON seeker_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_seeker_analyses_resume_id ON seeker_analyses(resume_id);

-- 5. Seeker Resume Improvement Plans (Studio revisions & STAR suggestions)
CREATE TABLE IF NOT EXISTS seeker_improvements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    resume_id UUID NOT NULL REFERENCES seeker_resumes(id) ON DELETE CASCADE,
    target_job_title TEXT NOT NULL,
    suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    structured_editor_content JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_improvements_user_id ON seeker_improvements(user_id);

-- 6. Seeker Mock Interview Sessions & Practice
CREATE TABLE IF NOT EXISTS seeker_mock_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_job_title TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    current_question_index INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    overall_score NUMERIC(3, 2),
    overall_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_mock_sessions_user_id ON seeker_mock_sessions(user_id);

-- 7. Seeker Skill Roadmaps (Career development & learning tasks)
CREATE TABLE IF NOT EXISTS seeker_skill_roadmaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_job_title TEXT NOT NULL,
    tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_roadmaps_user_id ON seeker_skill_roadmaps(user_id);

-- 8. Seeker Job Application Pipeline Tracker
CREATE TABLE IF NOT EXISTS seeker_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    company TEXT NOT NULL,
    job_title TEXT NOT NULL,
    location TEXT,
    job_url TEXT,
    salary_range TEXT,
    status TEXT NOT NULL DEFAULT 'interested' CHECK (status IN ('interested', 'preparing', 'applied', 'assessment', 'interview', 'offer', 'rejected', 'withdrawn')),
    applied_date DATE,
    resume_id UUID REFERENCES seeker_resumes(id) ON DELETE SET NULL,
    resume_version_label TEXT,
    analysis_id UUID REFERENCES seeker_analyses(id) ON DELETE SET NULL,
    match_score NUMERIC(5, 2),
    next_step TEXT,
    follow_up_date DATE,
    notes TEXT,
    activity_log JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_applications_user_id ON seeker_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seeker_applications_status ON seeker_applications(user_id, status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Job seekers only see their personal resources.
-- Recruiters cannot see personal seeker records; Seeker cannot see recruiter records.
-- ==============================================================================

ALTER TABLE seeker_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_improvements ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_mock_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_skill_roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_applications ENABLE ROW LEVEL SECURITY;

-- 1. Seeker Resumes RLS
CREATE POLICY "Users can manage their own personal resumes"
    ON seeker_resumes
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 2. Seeker Saved Jobs RLS
CREATE POLICY "Users can manage their own saved jobs"
    ON seeker_saved_jobs
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 3. Seeker Analyses RLS
CREATE POLICY "Users can manage their own resume analyses"
    ON seeker_analyses
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. Seeker Improvements RLS
CREATE POLICY "Users can manage their own resume improvements"
    ON seeker_improvements
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Seeker Mock Sessions RLS
CREATE POLICY "Users can manage their own mock interview sessions"
    ON seeker_mock_sessions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. Seeker Roadmaps RLS
CREATE POLICY "Users can manage their own skill development roadmaps"
    ON seeker_skill_roadmaps
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 7. Seeker Applications RLS
CREATE POLICY "Users can manage their own job applications"
    ON seeker_applications
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
