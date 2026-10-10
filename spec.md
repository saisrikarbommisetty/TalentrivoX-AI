# AVENGERCODERS — MASTER SPECIFICATION SHEET
## AI Resume Screening & Interview Agent
**Event:** BYTEXL 24-Hour Hackathon  
**Development methodology:** Specification-Driven Development (SDD)  
**Product type:** Full-stack AI-powered recruitment decision-support platform  
**Primary users:** Recruiters, hiring managers, and interviewers

---

## 1. Product Vision

Build a functional, secure, and explainable AI-assisted recruitment platform that evaluates resumes against job descriptions, identifies evidence-backed skill matches and gaps, produces transparent candidate assessments, and generates customized interview plans.

The application must work with real uploaded resumes and real job descriptions. It must not be a static UI, hardcoded dashboard, or simulated AI chatbot.

### Core value proposition

Transform a time-consuming manual resume-screening process into an auditable workflow that helps recruiters understand:

- Which job requirements each candidate demonstrates.
- What evidence supports each skill match.
- Which requirements are partially demonstrated or not evidenced.
- What information needs clarification during an interview.
- Which questions can best validate the candidate's job-related competencies.

### Guiding principles

1. Evidence before conclusions.
2. Job-related criteria only.
3. Transparent scoring instead of unexplained AI rankings.
4. Human review before hiring or rejection decisions.
5. Privacy and secure handling of resumes.
6. Functional workflows before decorative features.
7. No fabricated analysis, qualifications, or test results.

---

## 2. Target Users and Roles

### Recruiter / Hiring Manager
- Create and manage job descriptions.
- Upload multiple resumes for a particular job.
- Review screening results and compare candidates.
- Inspect resume evidence and skill gaps.
- Generate, edit, save, and export interview plans.
- Record interviewer feedback and decisions.

### Administrator
- Manage authorized users and access.
- Configure supported AI providers and operational settings.
- View system health and processing failures.
- Review audit events and manage data-retention policies.

Implement recruiter access first. Add administrator capabilities only where they can be completed securely within the hackathon.

---

## 3. Application Workflow

The complete workflow must be functional from beginning to end.

1. User registers or signs in.
2. User creates a hiring project.
3. User enters a job title, description, responsibilities, and required qualifications.
4. System extracts structured job requirements and allows the recruiter to review and edit them.
5. User uploads one or more PDF/DOCX resumes.
6. Backend validates each file, extracts its text, and creates a candidate record.
7. The analysis engine compares extracted resume evidence with the approved job requirements.
8. The system calculates requirement-level results and a transparent overall match score.
9. The recruiter opens a candidate profile to review evidence, gaps, and uncertainties.
10. The recruiter generates a personalized interview plan.
11. The recruiter edits, saves, exports, or shares an authorized report.
12. The recruiter records a human-reviewed assessment or next action.

Every step must have loading, success, empty, and error states where applicable. Failed operations must not create misleading successful records.

---

## 4. Functional Requirements

### FR-01: Authentication and Authorization

- Implement registration, login, logout, and protected routes.
- Use Supabase Auth or an equivalent properly configured authentication mechanism.
- Associate all jobs, candidates, evaluations, and interview plans with the authenticated owner or authorized workspace.
- Enforce access restrictions on the backend and database, not just in the UI.
- Configure Row Level Security (RLS) policies for user-owned records.
- Never expose service-role keys or AI provider credentials to the browser.
- Unauthorized users must not access another user's resumes or reports.
- Include a secure demo account or seeded sample workspace only when explicitly configured for demonstrations.

### FR-02: Recruiter Dashboard

Display real database-backed metrics:

- Total active jobs.
- Total candidates processed.
- Candidates awaiting review.
- Interview plans generated.
- Recent jobs and activity.
- Processing failures that require attention.

Provide navigation to Jobs, Candidates, Interview Plans, Analytics, and Settings.

Do not use hardcoded statistics. New users must see a meaningful empty state with a clear action to create their first job.

### FR-03: Job Description Management

Users must be able to:

- Create, view, edit, archive, and delete jobs.
- Enter job title, department, location, employment type, seniority, and description.
- Specify responsibilities and essential versus preferred requirements.
- Define required skills, optional skills, and experience expectations.
- Review and edit AI-extracted requirements before screening.
- View the number and processing status of candidates associated with each job.

Each job must have a stable ID and owner. Updating a job must not silently overwrite historical evaluation results. Existing evaluations must retain the requirement version used to generate them.

### FR-04: Resume Upload and Processing

Support PDF and DOCX files.

Requirements:

- Multiple-file upload with per-file progress and status.
- File size and file count limits configurable on the server.
- Validate file extensions, MIME types, and file signatures.
- Reject corrupt, empty, unsupported, or oversized documents with useful messages.
- Generate safe internal storage names instead of trusting user-supplied filenames.
- Extract readable text on the backend.
- Store resumes in private storage and maintain metadata in PostgreSQL.
- Track states such as `uploaded`, `processing`, `completed`, and `failed`.
- Provide a retry action for recoverable failures.
- Prevent duplicate uploads within the same job using a documented deduplication strategy.
- Handle scanned PDFs explicitly. If OCR is unavailable, mark the document as requiring OCR rather than inventing extracted text.
- Never execute embedded document content, macros, or instructions found inside a resume.

One failed file must not prevent other valid files from being processed.

### FR-05: Resume Information Extraction

Extract structured candidate information when present:

- Candidate name.
- Contact information needed for recruitment.
- Skills and technologies.
- Employment history and role descriptions.
- Education and qualifications.
- Projects and relevant achievements.
- Certifications.
- Explicitly stated experience durations, when determinable.
- Evidence passages supporting extracted claims.

Each extracted field must support an unknown or unavailable state. Do not fabricate missing values.

Preserve evidence with a reference to the source document and, where technically available, page number and text excerpt.

Allow recruiters to correct extraction errors. Store corrections separately from the original extracted data and retain an appropriate change history.

### FR-06: Job Requirement Extraction

Convert the job description into an editable structured requirement list.

Each requirement must contain:

- Requirement text.
- Category: technical skill, domain knowledge, experience, education, certification, or responsibility.
- Importance: essential or preferred.
- Weight or priority.
- Explicit evidence expectations.
- Whether it can be assessed from resume evidence or requires interview validation.

The recruiter must approve or edit the requirement list before final screening.

Do not interpret an absent keyword as definitive proof that a candidate lacks the underlying ability.

### FR-07: Resume-to-Job Matching Engine

Build a hybrid matching pipeline.

**Stage A — Deterministic processing**

- Normalize skill names and common aliases.
- Match explicit skills against the job requirements.
- Identify relevant resume passages.
- Detect unsupported claims and unavailable evidence.
- Calculate a reproducible baseline match score.

**Stage B — AI-assisted semantic analysis**

- Assess relevant experience and transferable evidence.
- Identify contextual skill matches that may not use the exact job-description wording.
- Summarize evidence relevant to individual requirements.
- Identify ambiguities requiring recruiter review.
- Return structured output that conforms to a validated schema.

The model must not invent qualifications, employers, dates, projects, or achievements.

### Requirement-level statuses

- `demonstrated`: clear supporting evidence exists.
- `partial`: some relevant evidence exists, but the requirement is not fully established.
- `not_evidenced`: the resume does not provide sufficient evidence.
- `needs_review`: the evidence is ambiguous, contradictory, or could not be assessed reliably.

Use the phrase **not evidenced**, not an unsupported assertion that the candidate does not possess a skill.

### Explainable score

Calculate the score from approved job requirements and their weights.

For requirements with reliable evidence:

`requirement contribution = requirement weight × evidence score`

Normalize the total against the weights of assessable requirements to produce a score between 0 and 100.

Use documented evidence-score values for demonstrated and partial matches. Exclude genuinely unassessable requirements from the denominator and show coverage separately. A requirement marked `not_evidenced` must remain visible and must not be silently treated as confirmed competence.

Display:

- Overall match score.
- Requirement coverage percentage.
- Essential requirement coverage.
- Matched requirements.
- Partial matches.
- Requirements not evidenced.
- Requirements needing review.
- Supporting evidence for each assessment.
- A short explanation of the calculation.

Never present the score as a probability of hiring success.

Candidate sorting must be configurable. The interface must explain the basis of the default ordering. The score is a review aid, not an automatic rejection rule.

### FR-08: Candidate Profile

Each candidate profile must show:

- Candidate details extracted from the resume.
- Job applied against.
- Original resume download for authorized users.
- Processing and evaluation status.
- Overall score and evidence coverage.
- Skill match and gap breakdown.
- Relevant experience and projects.
- Requirement-level evidence excerpts.
- Missing or ambiguous information.
- AI-generated summary with links to supporting evidence.
- Interview plan and recruiter notes.
- Human-review status and decision history.

Include a side-by-side view of job requirements and resume evidence.

### FR-09: Candidate Comparison

Allow recruiters to select candidates associated with the same job and compare:

- Overall match scores.
- Essential requirement coverage.
- Technical skills.
- Relevant experience evidence.
- Partial matches and evidence gaps.
- Requirements requiring interview validation.

Use a comparison table with drill-down into evidence.

Do not compare unrelated candidates using incomparable job-specific scores. Do not recommend a winner based on protected or irrelevant personal attributes.

### FR-10: Interview Question Generation

Generate a personalized interview plan for a candidate and job.

Question categories:

1. Technical knowledge.
2. Practical problem-solving.
3. Behavioral and situational questions.
4. Project and experience verification.
5. Skill-gap validation.
6. Role-specific scenarios.

Each question must include:

- The question itself.
- Question category.
- Related job requirement.
- Why the question is relevant.
- Evidence from the resume or job description that motivates it.
- Expected answer signals or evaluation criteria.
- Suggested follow-up questions.
- Difficulty level.
- A structured interviewer rating rubric.

Questions must be specific to the candidate's documented experience and the role. Do not generate generic questions exclusively by repeating job-description keywords.

For gaps, frame questions neutrally to establish competence. Example: "Could you describe your experience with database indexing or a similar performance optimization technique?" Do not assert that the candidate has no such experience.

The recruiter must be able to regenerate, edit, reorder, delete, and save questions.

### FR-11: Interview Workspace

- Present the interview plan in a usable interviewer view.
- Allow interviewers to record notes and ratings.
- Provide a consistent rating rubric for each competency.
- Store feedback against the candidate, job, interviewer, and interview session.
- Distinguish interviewer observations from AI-generated suggestions.
- Permit authorized users to export the final interview guide.

Do not make the interview plan a disguised personality test or infer protected characteristics.

### FR-12: Search, Filtering, and Status Management

Provide search and filters for:

- Job.
- Candidate name.
- Skill.
- Match-score range.
- Requirement coverage.
- Processing status.
- Human-review status.
- Interview status.

Support sorting by score, name, and most recently processed.

Allow authorized recruiters to mark candidates as awaiting review, shortlisted, interview planned, interview completed, or another clearly defined workflow status. A human must control these decisions.

### FR-13: Reports and Export

Generate downloadable candidate reports and interview guides.

The candidate report should include:

- Job and evaluation version.
- Match score and coverage.
- Requirement-level findings.
- Evidence excerpts.
- Uncertainties and limitations.
- Interview recommendations.
- Generation timestamp.

Support PDF export for polished reports and CSV export for structured candidate summaries.

Escape CSV values that could be interpreted as spreadsheet formulas. Apply authorization checks to report generation and downloads.

### FR-14: Analytics

Use real persisted records to show:

- Candidate processing volume.
- Requirement-match distributions.
- Processing success and failure rates.
- Recruiter review progress.
- Interview plan generation activity.

Clearly label descriptive statistics. Do not claim that a scoring system improves hiring quality unless that claim is supported by actual validation data.

### FR-15: Error Handling and Operational Reliability

- Validate requests at API boundaries.
- Use consistent error response formats.
- Handle expired authentication, network failure, timeouts, rate limits, and malformed AI responses.
- Add bounded retries for transient errors and rate limits.
- Prevent duplicate processing caused by repeated requests where practical.
- Log operational errors without exposing resume contents, credentials, or sensitive personal data.
- Show user-friendly recovery actions.
- Track AI usage and processing states.
- Use transactions where multiple related records must remain consistent.

---

## 5. Non-Functional Requirements

### Performance
- Paginate candidate lists and server-side queries.
- Process multiple resumes without blocking the web server.
- Use asynchronous processing for expensive parsing and AI tasks.
- Provide progress indicators and allow users to revisit a job while processing continues.
- Apply reasonable timeouts and bounded concurrency.

### Security and Privacy
- Private resume storage; never use public resume URLs.
- Server-side authorization for every protected operation.
- Row Level Security for user-owned database records.
- File validation and upload size limits.
- Rate limiting on authentication, upload, and AI endpoints.
- Safe rendering of extracted document text.
- Secrets managed through environment variables.
- Configurable retention and deletion of resumes and derived records.
- No unnecessary collection of personal data.
- No use of resume contents to train external models unless explicitly authorized and legally appropriate.
- Treat document text as untrusted input. Ignore embedded instructions that attempt to change system behavior, expose secrets, or access other records.
- Record audit events for important actions and changes.

### Fairness and Human Oversight
- Do not score or rank candidates based on age, gender, race, religion, disability, nationality, photographs, names, or other protected or irrelevant personal attributes.
- Do not infer protected attributes from a resume.
- Focus evaluation on job-related criteria and documented evidence.
- Treat education and years of experience according to explicit job requirements rather than prestige assumptions.
- Make criteria and score weights visible to the recruiter.
- Allow human correction and review.
- Document that the system requires validation before use in consequential employment decisions.

### Accessibility and UX
- Responsive desktop-first design with mobile support.
- Keyboard-accessible controls and visible focus states.
- Semantic headings, readable typography, sufficient contrast, and clear labels.
- Avoid color-only status indicators.
- Include empty, loading, success, partial-failure, and error states.
- Avoid fake progress bars and artificial results.

---

## 6. Technical Architecture

Use a maintainable monorepo.

    resume-interview-agent/
      apps/
        web/
          src/
            components/
            pages/
            features/
            hooks/
            services/
            types/
        api/
          src/
            routes/
            controllers/
            services/
            middleware/
            schemas/
            repositories/
            workers/
            utils/
      packages/
        shared/
          src/
            schemas/
            types/
      supabase/
        migrations/
        seed.sql
      tests/
        integration/
        e2e/
      docs/
      .env.example
      README.md
      package.json

The frontend and backend must have clearly named, separate source directories. The frontend must never directly access privileged database credentials or the AI provider.

### Recommended implementation stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, and an accessible component library.
- Routing and data fetching: React Router and TanStack Query.
- Backend: Node.js, Express, and TypeScript.
- Validation: Zod.
- Database: Supabase PostgreSQL with version-controlled SQL migrations.
- Authentication: Supabase Auth.
- File storage: private Supabase Storage bucket.
- AI: configurable server-side Gemini integration with structured output validation.
- Document parsing: suitable PDF and DOCX extraction libraries.
- Testing: Vitest, Supertest, and Playwright.
- Deployment: Vercel for the frontend and a suitable Node.js host for the backend, with Supabase for persistence and storage.

Pin compatible package versions and use the lockfile. Confirm that the supported Node.js version is compatible with all selected libraries.

### Data flow

Browser → Authenticated API → Authorization and validation → Database / private file storage → Resume parser → Matching engine → AI analysis when configured → Schema validation → Persisted evaluation → Recruiter dashboard.

The deterministic matching pipeline must remain usable when the AI provider is unavailable.

---

## 7. Database Schema

Implement relational tables with UUID primary keys, timestamps, appropriate foreign keys, indexes, constraints, and migrations.

### `profiles`
- `id`: UUID referencing the authenticated user.
- `display_name`
- `role`
- `created_at`
- `updated_at`

### `jobs`
- `id`
- `owner_id`
- `title`
- `department`
- `location`
- `employment_type`
- `seniority`
- `description`
- `status`
- `created_at`
- `updated_at`

### `job_requirement_versions`
- `id`
- `job_id`
- `version_number`
- `requirements_json`
- `created_by`
- `created_at`

### `candidates`
- `id`
- `owner_id`
- `full_name`
- `email`
- `phone`
- `created_at`
- `updated_at`

### `job_candidates`
- `id`
- `job_id`
- `candidate_id`
- `resume_file_path`
- `original_filename`
- `file_hash`
- `extracted_text`
- `extraction_status`
- `processing_error`
- `created_at`
- `updated_at`

Enforce a documented uniqueness rule to prevent duplicate candidate-job submissions where appropriate.

### `evaluations`
- `id`
- `job_candidate_id`
- `requirement_version_id`
- `overall_score`
- `coverage_percentage`
- `essential_coverage_percentage`
- `evaluation_status`
- `matching_method`
- `model_metadata`
- `created_at`

### `requirement_assessments`
- `id`
- `evaluation_id`
- `requirement_id`
- `status`
- `evidence_score`
- `evidence_text`
- `source_page`
- `reasoning_summary`
- `confidence`
- `review_status`

### `interview_plans`
- `id`
- `job_candidate_id`
- `evaluation_id`
- `title`
- `status`
- `created_by`
- `created_at`
- `updated_at`

### `interview_questions`
- `id`
- `interview_plan_id`
- `requirement_id`
- `category`
- `question_text`
- `relevance_reason`
- `expected_answer_signals`
- `follow_up_questions`
- `difficulty`
- `evaluation_rubric`
- `sort_order`

### `interview_sessions`
- `id`
- `interview_plan_id`
- `interviewer_id`
- `scheduled_at`
- `status`
- `created_at`

### `interview_feedback`
- `id`
- `interview_session_id`
- `interview_question_id`
- `rating`
- `notes`
- `reviewer_id`
- `created_at`

### `candidate_reviews`
- `id`
- `job_candidate_id`
- `reviewer_id`
- `status`
- `notes`
- `created_at`
- `updated_at`

### `audit_logs`
- `id`
- `actor_id`
- `action`
- `resource_type`
- `resource_id`
- `metadata_json`
- `created_at`

Use additional tables for asynchronous jobs, retention events, and provider usage only when needed.

Store sensitive resume text and contact details with appropriate access controls. Avoid duplicating personal data unnecessarily. Define cascades and retention behavior explicitly. Do not allow a candidate's evaluation to become disconnected from the job and requirement version that produced it.

---

## 8. REST API Contract

Use a versioned API under `/api/v1`.

### Authentication and profile
- `GET /api/v1/me`
- Authentication should be handled through the selected authentication provider.

### Jobs
- `GET /api/v1/jobs`
- `POST /api/v1/jobs`
- `GET /api/v1/jobs/:jobId`
- `PATCH /api/v1/jobs/:jobId`
- `DELETE /api/v1/jobs/:jobId`
- `POST /api/v1/jobs/:jobId/requirements/extract`
- `PUT /api/v1/jobs/:jobId/requirements`

### Candidates and resumes
- `GET /api/v1/jobs/:jobId/candidates`
- `POST /api/v1/jobs/:jobId/resumes`
- `GET /api/v1/candidates/:candidateId`
- `GET /api/v1/job-candidates/:jobCandidateId`
- `POST /api/v1/job-candidates/:jobCandidateId/reprocess`
- `POST /api/v1/job-candidates/:jobCandidateId/evaluate`

### Evaluations
- `GET /api/v1/job-candidates/:jobCandidateId/evaluations`
- `GET /api/v1/evaluations/:evaluationId`
- `POST /api/v1/evaluations/:evaluationId/review`

### Interview preparation
- `POST /api/v1/job-candidates/:jobCandidateId/interview-plans`
- `GET /api/v1/interview-plans/:planId`
- `PATCH /api/v1/interview-plans/:planId`
- `POST /api/v1/interview-plans/:planId/regenerate`
- `POST /api/v1/interview-plans/:planId/sessions`
- `POST /api/v1/interview-sessions/:sessionId/feedback`

### Reporting and analytics
- `GET /api/v1/jobs/:jobId/analytics`
- `GET /api/v1/job-candidates/:jobCandidateId/report`
- `GET /api/v1/interview-plans/:planId/export`

All endpoints must validate input, authenticate the caller, enforce resource ownership, and return consistent status codes and error objects.

Use `202 Accepted` for genuinely asynchronous processing, return a task or resource ID, and provide a way to poll for status. Do not return success before the underlying operation has completed or been durably queued.

---

## 9. AI Integration Contract

Create an AI provider service abstraction. Business logic must not depend directly on a particular model SDK.

### Structured resume evaluation output

The AI service must return validated structured data containing:

- `summary`
- `requirementAssessments`
- `supportingEvidence`
- `uncertainties`
- `suggestedInterviewTopics`

Every assessment must reference a known requirement ID. Evidence must refer to text actually present in the extracted resume. Invalid, unsupported, or malformed outputs must be rejected or sent for review.

### Interview generation output

Return structured questions with:

- `questionText`
- `category`
- `requirementId`
- `relevanceReason`
- `expectedAnswerSignals`
- `followUpQuestions`
- `difficulty`
- `evaluationRubric`

Validate every response against the shared schema before storing it.

### Resilience and fallback

1. If the API key is absent, use the deterministic matching engine and clearly label AI-only capabilities as unavailable.
2. If the provider returns a rate limit or temporary error, apply bounded backoff and retry where appropriate.
3. If retries fail, preserve the resume and job records and expose a recoverable status.
4. If an AI response is malformed, validate, retry selectively, or mark the task as requiring review.
5. Never silently substitute hardcoded candidate scores, fabricated summaries, or fake AI interview questions.
6. A clearly labeled sample workspace may contain fictional data, but sample records must never be confused with real uploaded candidates.

---

## 10. UI/UX Requirements

Create a polished, distinctive recruitment SaaS interface with a restrained neutral palette, a warm accent color, excellent spacing, and readable typography. Avoid a generic AI landing-page aesthetic.

### Required screens

1. Login and registration.
2. Dashboard.
3. Jobs listing.
4. Create/edit job.
5. Job details and requirements editor.
6. Resume upload and processing monitor.
7. Candidate list with search, filtering, and sorting.
8. Candidate detail and evidence analysis.
9. Candidate comparison.
10. Interview plan builder.
11. Interview workspace and feedback.
12. Analytics and reports.
13. Settings and account management.
14. Useful empty, loading, error, and partial-failure states.

### UX standards

- Use realistic navigation and contextual actions.
- Ensure every visible button performs its advertised action.
- Use dialogs for destructive actions.
- Confirm successful saves and exports only after they succeed.
- Display scores alongside evidence and coverage.
- Clearly distinguish AI suggestions from recruiter-entered information.
- Never use fabricated metrics in the real workspace.
- Avoid excessive animation, unnecessary gradients, generic chatbot screens, and decorative charts without analytical value.

---

## 11. Testing and Acceptance Criteria

The application is not complete merely because the frontend compiles.

### Functional acceptance tests

**A. Authentication**
- A user can register, sign in, and sign out.
- Protected routes and APIs reject unauthenticated requests.
- One user cannot read or modify another user's resources.

**B. Job management**
- A recruiter can create a job and edit requirements.
- Changes persist after refresh.
- Requirement versions remain linked to historical evaluations.

**C. Resume processing**
- Valid PDF and DOCX resumes are accepted.
- Invalid, corrupt, and oversized files are rejected safely.
- Extracted text is persisted.
- Unreadable or scanned documents are flagged correctly.
- Multiple files process independently.
- Processing failures are visible and recoverable.

**D. Matching**
- Results use actual uploaded resume content and the selected job requirements.
- The same inputs and scoring configuration produce reproducible deterministic scores.
- Scores are bounded between 0 and 100.
- Coverage and requirement-level results are consistent with the documented formula.
- Every demonstrated match has traceable supporting evidence.
- Missing information is not fabricated.
- Updating a job does not silently alter a historical evaluation.

**E. Interview generation**
- Questions relate to the actual job requirements.
- Candidate-specific questions reference evidence or explicitly identified gaps.
- Questions can be edited and saved.
- AI failures do not destroy the candidate record or existing interview plan.

**F. Persistence and exports**
- Jobs, candidates, assessments, questions, and feedback survive refresh and a new login.
- Exports contain the correct candidate and job data.
- Unauthorized exports are blocked.

**G. Resilience**
- The application handles missing API keys, provider errors, rate limits, invalid responses, and database failures without crashing.
- No failed operation is reported as successful.
- The deterministic matching workflow remains available when AI is unavailable.

**H. UI and integration**
- All required screens are connected to actual APIs.
- No visible action is a dead button.
- Loading, empty, error, and success states work.
- Core flows pass browser-based end-to-end tests.

### Required automated tests

- Unit tests for scoring, normalization, coverage, and validation.
- Integration tests for authorization, uploads, persistence, and APIs.
- AI contract tests using deterministic mocked provider responses.
- End-to-end tests for login, job creation, resume upload, evaluation, interview generation, and export.
- Security tests for cross-user access and invalid uploads.

Report actual test results. Never claim tests passed if they were not executed.

---

## 12. Deployment and Configuration

Create `.env.example` with placeholders only.

Expected variables include:

- `NODE_ENV`
- `PORT`
- `APP_URL`
- `API_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `GEMINI_API_KEY`
- `AI_PROVIDER`
- `MAX_UPLOAD_SIZE_MB`
- `MAX_FILES_PER_BATCH`
- `AI_REQUEST_TIMEOUT_MS`
- `AI_MAX_RETRIES`

Use the correct authentication and database connection strategy for the selected libraries. Do not expose privileged variables to Vite's client-side environment.

Provide:

- SQL migrations and documented RLS policies.
- Storage bucket setup and access policies.
- Seed data containing clearly labeled fictional examples.
- Local development commands.
- Build and test commands.
- Deployment instructions for frontend and backend.
- Health-check endpoint.
- Troubleshooting guide.
- API documentation.
- Privacy, limitations, and data-deletion documentation.

A successful deployment requires actual environment configuration, applied migrations, correct storage permissions, and a live smoke test. Never claim deployment is complete just because a build succeeds.

---

## 13. 24-Hour Implementation Priorities

### Phase 1 — Foundation
Repository structure, dependency installation, environment validation, database migrations, authentication, and protected application shell.

### Phase 2 — Real Core Workflow
Job creation, requirements editing, PDF/DOCX upload, document parsing, persistence, and candidate processing statuses.

### Phase 3 — Matching and Explainability
Requirement-level matching, evidence extraction, score calculation, coverage, candidate profiles, and comparison.

### Phase 4 — Interview Intelligence
AI provider integration, personalized interview plans, question editing, and interviewer rubrics.

### Phase 5 — Product Polish
Dashboard, filters, reports, responsive UI, and realistic sample workspace.

### Phase 6 — Verification and Deployment
Run unit, integration, and end-to-end tests; fix failures; validate permissions; test AI fallback; document deployment; and perform a smoke test.

Prioritize a complete working vertical slice over implementing every optional feature. If time is limited, defer advanced analytics or scheduling rather than compromising authentication, evidence integrity, or core screening functionality.

---

## 14. Definition of Done

The product is ready for hackathon demonstration when a recruiter can:

1. Sign in securely.
2. Create a real job description.
3. Approve structured job requirements.
4. Upload actual PDF/DOCX resumes.
5. See successfully extracted candidate information.
6. Generate explainable, reproducible screening results.
7. Inspect evidence for each matched or missing requirement.
8. Compare candidates for the same job.
9. Generate and edit a personalized interview plan.
10. Save and export the resulting report.
11. Refresh the application and find all saved records intact.
12. Complete the core workflow when the AI provider is unavailable, with AI-only features clearly identified.
13. Verify that another user cannot access those records.

**Final rule:** Do not mark the project complete until the core workflow has been executed successfully against the actual running application and every critical failure has either been fixed or explicitly documented.