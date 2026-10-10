-- TalentrivoX AI - Agentic AI Job Discovery & Application Assistant
-- Migration 00003: Job Search Preferences, Discovery Sessions, Real-World Discovered Jobs & RLS

-- 1. Seeker Job Search Preferences
CREATE TABLE IF NOT EXISTS seeker_search_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    target_job_titles JSONB NOT NULL DEFAULT '[]'::jsonb,
    primary_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    preferred_locations JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_remote_only BOOLEAN NOT NULL DEFAULT FALSE,
    workplace_types JSONB NOT NULL DEFAULT '["remote", "hybrid", "onsite"]'::jsonb,
    employment_types JSONB NOT NULL DEFAULT '["full-time"]'::jsonb,
    min_salary NUMERIC(12, 2),
    max_salary NUMERIC(12, 2),
    salary_currency TEXT NOT NULL DEFAULT 'USD',
    experience_level TEXT NOT NULL DEFAULT 'all',
    target_industries JSONB NOT NULL DEFAULT '[]'::jsonb,
    auto_discover BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_search_prefs_user_id ON seeker_search_preferences(user_id);

-- 2. Seeker Job Discovery Sessions
CREATE TABLE IF NOT EXISTS seeker_discovery_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES seeker_resumes(id) ON DELETE SET NULL,
    search_query JSONB NOT NULL DEFAULT '{}'::jsonb,
    total_found INTEGER NOT NULL DEFAULT 0,
    provider_statuses JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_discovery_sessions_user_id ON seeker_discovery_sessions(user_id);

-- 3. Seeker Discovered Jobs (Normalized multi-source cache & match evaluation)
CREATE TABLE IF NOT EXISTS seeker_discovered_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES seeker_discovery_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    source_label TEXT NOT NULL,
    external_job_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo_url TEXT,
    location TEXT NOT NULL,
    country TEXT,
    is_remote BOOLEAN NOT NULL DEFAULT FALSE,
    workplace_type TEXT NOT NULL DEFAULT 'unspecified',
    employment_type TEXT NOT NULL DEFAULT 'unspecified',
    experience_level TEXT NOT NULL DEFAULT 'unspecified',
    salary_min NUMERIC(12, 2),
    salary_max NUMERIC(12, 2),
    salary_currency TEXT,
    salary_formatted TEXT,
    posted_at TIMESTAMPTZ,
    application_url TEXT NOT NULL,
    description TEXT NOT NULL,
    description_snippet TEXT NOT NULL,
    extracted_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    match_score NUMERIC(5, 2) NOT NULL DEFAULT 70.00,
    match_rating TEXT NOT NULL DEFAULT 'moderate',
    matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    unmatched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    transferable_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    resume_evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    match_explanation TEXT,
    preparation_tip TEXT,
    is_saved BOOLEAN NOT NULL DEFAULT FALSE,
    is_applied BOOLEAN NOT NULL DEFAULT FALSE,
    application_status TEXT,
    is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seeker_discovered_jobs_user_id ON seeker_discovered_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_seeker_discovered_jobs_session_id ON seeker_discovered_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_seeker_discovered_jobs_source_ext ON seeker_discovered_jobs(source, external_job_id);
CREATE INDEX IF NOT EXISTS idx_seeker_discovered_jobs_match ON seeker_discovered_jobs(user_id, match_score DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE seeker_search_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_discovery_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seeker_discovered_jobs ENABLE ROW LEVEL SECURITY;

-- Preferences Policy
CREATE POLICY "Users can manage their own job search preferences"
    ON seeker_search_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Sessions Policy
CREATE POLICY "Users can manage their own discovery sessions"
    ON seeker_discovery_sessions FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Discovered Jobs Policy
CREATE POLICY "Users can manage their own discovered jobs"
    ON seeker_discovered_jobs FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
