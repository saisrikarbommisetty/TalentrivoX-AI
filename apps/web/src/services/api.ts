const API_BASE = ((import.meta as any).env?.VITE_API_URL ? `${(import.meta as any).env.VITE_API_URL.replace(/\/+$/, '')}/api/v1` : '/api/v1');

export class ApiError extends Error {
  public code: string;
  public details?: any;

  constructor(message: string, code = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('talentrivox_token') || localStorage.getItem('avengercoders_token');
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorData: any = {};
    try {
      errorData = await res.json();
    } catch {
      errorData = { message: await res.text() };
    }
    throw new ApiError(
      errorData.error?.message || errorData.message || `Request failed with status ${res.status}`,
      errorData.error?.code || `HTTP_${res.status}`,
      errorData.error?.details
    );
  }

  // Handle file downloads or JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json() as Promise<T>;
  }

  return res as any;
}

export const api = {
  // Auth
  getMe: () => request<{ user: any }>('/auth/me'),
  login: (email: string, password?: string) => request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  signup: (fullName: string, email: string, password?: string, role = 'recruiter') => request<{ token: string; user: any; message?: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, role })
  }),
  demoLogin: () => request<{ token: string; user: any }>('/auth/demo', {
    method: 'POST'
  }),
  forgotPassword: (email: string) => request<{ success: boolean; message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  // Health
  getHealth: () => request<{ status: string; aiProvider: any }>('/health'),

  // Jobs
  getJobs: () => request<{ jobs: any[] }>('/jobs'),
  getJob: (jobId: string) => request<{ job: any; requirements: any[]; requirementVersion: any; candidateCount: number }>(`/jobs/${jobId}`),
  createJob: (data: any) => request<{ job: any; requirements: any[]; requirementVersion: any }>('/jobs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateJob: (jobId: string, data: any) => request<{ job: any }>(`/jobs/${jobId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteJob: (jobId: string) => request<{ success: boolean }>(`/jobs/${jobId}`, {
    method: 'DELETE'
  }),
  extractRequirements: (jobId: string) => request<{ requirements: any[] }>(`/jobs/${jobId}/requirements/extract`, {
    method: 'POST'
  }),
  updateRequirements: (jobId: string, requirements: any[]) => request<{ requirements: any[]; requirementVersion: any; message: string }>(`/jobs/${jobId}/requirements`, {
    method: 'PUT',
    body: JSON.stringify({ requirements })
  }),

  // Candidates & Resumes
  getJobCandidates: (jobId: string, params?: { search?: string; status?: string; minScore?: number; maxScore?: number; sortBy?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.minScore !== undefined) query.set('minScore', String(params.minScore));
    if (params?.maxScore !== undefined) query.set('maxScore', String(params.maxScore));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    return request<{ candidates: any[]; total: number }>(`/jobs/${jobId}/candidates?${query.toString()}`);
  },
  uploadResumes: (jobId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return request<{ message: string; results: any[] }>(`/jobs/${jobId}/resumes`, {
      method: 'POST',
      body: formData
    });
  },
  getJobCandidate: (jobCandidateId: string) => request<{
    jobCandidate: any;
    job: any;
    candidate: any;
    evaluation: any;
    requirementVersion: any;
    assessments: any[];
    interviewPlans: any[];
    reviews: any[];
  }>(`/job-candidates/${jobCandidateId}`),
  updateCandidateReview: (jobCandidateId: string, data: { status: string; notes?: string }) => request<{ success: boolean; status: string }>(`/job-candidates/${jobCandidateId}/review`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  evaluateCandidate: (jobCandidateId: string) => request<{ evaluation: any }>(`/job-candidates/${jobCandidateId}/evaluate`, {
    method: 'POST'
  }),
  getResumeDownloadUrl: (jobCandidateId: string) => `/api/v1/job-candidates/${jobCandidateId}/resume/download`,

  // Interview Plans
  createInterviewPlan: (jobCandidateId: string) => request<{ plan: any; questions: any[] }>(`/job-candidates/${jobCandidateId}/interview-plans`, {
    method: 'POST'
  }),
  getInterviewPlan: (planId: string) => request<{
    plan: any;
    job: any;
    candidate: any;
    jobCandidate: any;
    questions: any[];
    sessions: any[];
    feedback: any[];
  }>(`/interview-plans/${planId}`),
  updateInterviewPlan: (planId: string, data: any) => request<{ plan: any; questions: any[] }>(`/interview-plans/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  createInterviewSession: (planId: string, data: { interviewerNotes?: string; feedback: { questionId: string; rating: number; notes: string }[] }) => request<{ session: any }>(`/interview-plans/${planId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Analytics & Reports
  getDashboardStats: () => request<{ stats: any; aiStatus: any; recentJobs: any[] }>('/dashboard/stats'),
  getJobAnalytics: (jobId: string) => request<{
    job: any;
    totalCandidates: number;
    evaluationsCount: number;
    scoreBuckets: any;
    funnel: any;
    requirementBreakdown: any[];
  }>(`/jobs/${jobId}/analytics`),
  getCandidateReport: (jobCandidateId: string) => request<any>(`/job-candidates/${jobCandidateId}/report`),
  getExportCsvUrl: (jobId: string) => `/api/v1/jobs/${jobId}/export/csv`,

  // ============================================================================
  // RECRUITER CANDIDATE DISCOVERY API METHODS
  // ============================================================================
  runCandidateDiscovery: (jobId: string, params: any = {}) => request<{
    run: any;
    qualifiedCandidates: any[];
  }>(`/jobs/${jobId}/discovery/run`, {
    method: 'POST',
    body: JSON.stringify(params)
  }),

  getCandidateDiscoveryRuns: (jobId: string) => request<{
    runs: any[];
  }>(`/jobs/${jobId}/discovery/runs`),

  getDiscoveredCandidates: (jobId: string, minScore?: number) => request<{
    candidates: any[];
  }>(`/jobs/${jobId}/discovery/candidates${minScore !== undefined ? `?minScore=${minScore}` : ''}`),

  saveDiscoveredCandidate: (jobId: string, candidateId: string) => request<{
    candidate: any;
  }>(`/jobs/${jobId}/discovery/candidates/${candidateId}/save`, {
    method: 'POST'
  }),

  unsaveDiscoveredCandidate: (jobId: string, candidateId: string) => request<{
    candidate: any;
  }>(`/jobs/${jobId}/discovery/candidates/${candidateId}/save`, {
    method: 'DELETE'
  }),

  importDiscoveredCandidate: (jobId: string, candidateId: string) => request<{
    jobCandidateId: string;
  }>(`/jobs/${jobId}/discovery/candidates/${candidateId}/import`, {
    method: 'POST'
  }),

  compareDiscoveredCandidates: (jobId: string, candidateIds: string[]) => request<{
    jobId: string;
    jobTitle: string;
    candidates: any[];
    comparisonMatrix: any[];
    recommendationSummary: string;
  }>(`/jobs/${jobId}/discovery/compare`, {
    method: 'POST',
    body: JSON.stringify({ candidateIds })
  }),


  // ============================================================================
  // JOB SEEKER API METHODS
  // ============================================================================
  demoLoginRole: (role: 'recruiter' | 'job_seeker' = 'recruiter') => request<{ token: string; user: any }>('/auth/demo', {
    method: 'POST',
    body: JSON.stringify({ role })
  }),

  getSeekerDashboard: () => request<{
    activeResume: any;
    totalResumesCount: number;
    totalAnalysesCount: number;
    recentAnalyses: any[];
    savedJobsCount: number;
    applicationsCount: number;
    applications: any[];
    roadmapProgress: { totalTasks: number; completedTasks: number; inProgressTasks: number };
    completedMocksCount: number;
    careerReadinessScore: number;
  }>('/seeker/dashboard'),

  // Resume Vault
  getSeekerResumes: () => request<{ resumes: any[] }>('/seeker/resumes'),
  uploadSeekerResume: (file: File, versionLabel?: string, isActive?: boolean) => {
    const formData = new FormData();
    formData.append('file', file);
    if (versionLabel) formData.append('versionLabel', versionLabel);
    if (isActive !== undefined) formData.append('isActive', String(isActive));
    return request<{ resume: any; message: string }>('/seeker/resumes', {
      method: 'POST',
      body: formData
    });
  },
  getSeekerResume: (id: string) => request<{ resume: any }>(`/seeker/resumes/${id}`),
  updateSeekerResume: (id: string, data: { versionLabel?: string; isActive?: boolean }) => request<{ resume: any }>(`/seeker/resumes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteSeekerResume: (id: string) => request<{ success: boolean; message: string }>(`/seeker/resumes/${id}`, {
    method: 'DELETE'
  }),

  // Saved Target Jobs
  getSeekerSavedJobs: () => request<{ savedJobs: any[] }>('/seeker/saved-jobs'),
  createSeekerSavedJob: (data: { title: string; company?: string; location?: string; jobUrl?: string; description: string; notes?: string }) => request<{ savedJob: any }>('/seeker/saved-jobs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getSeekerSavedJob: (id: string) => request<{ savedJob: any }>(`/seeker/saved-jobs/${id}`),
  deleteSeekerSavedJob: (id: string) => request<{ success: boolean }>(`/seeker/saved-jobs/${id}`, {
    method: 'DELETE'
  }),

  // Resume Analysis
  analyzeSeekerResume: (data: { resumeId: string; jobTitle?: string; jobDescription?: string; savedJobId?: string }) => request<{ analysis: any }>('/seeker/analyze', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getSeekerAnalyses: () => request<{ analyses: any[] }>('/seeker/analyses'),
  getSeekerAnalysis: (id: string) => request<{ analysis: any }>(`/seeker/analyses/${id}`),

  // ATS Checker
  checkSeekerAtsQuality: (data: { resumeId?: string; jobTitle?: string; jobDescription?: string }) => request<{ report: any; resumeVersionLabel: string }>('/seeker/ats-check', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Resume Improvement Studio
  getSeekerImprovementSuggestions: (data: { resumeId: string; targetJobTitle?: string; targetJobDescription?: string }) => request<{ suggestions: any[]; targetJobTitle: string }>('/seeker/improve-suggestions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getSeekerImprovementState: (resumeId: string) => request<{ improvementPlan: any }>(`/seeker/improvements/${resumeId}`),
  saveSeekerImprovementState: (data: { resumeId: string; targetJobTitle?: string; suggestions?: any[]; structuredEditorContent?: any }) => request<{ improvementPlan: any }>('/seeker/improvements', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Interview Prep & Mock Interview Agent
  generateSeekerInterviewPrep: (data: { targetJobTitle: string; targetJobDescription?: string; resumeId?: string }) => request<{ targetJobTitle: string; questions: any[] }>('/seeker/interview-prep/generate', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  startSeekerMockSession: (data: { targetJobTitle: string; questions: any[] }) => request<{ session: any }>('/seeker/mock-interviews/start', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  submitSeekerMockAnswer: (sessionId: string, data: { questionId: string; userAnswer: string; timeSpentSeconds?: number }) => request<{ evaluation: any; session: any }>(`/seeker/mock-interviews/${sessionId}/submit-answer`, {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getSeekerMockSession: (sessionId: string) => request<{ session: any }>(`/seeker/mock-interviews/${sessionId}`),
  listSeekerMockSessions: () => request<{ sessions: any[] }>('/seeker/mock-interviews'),

  // Skill Development Roadmap
  getSeekerRoadmap: () => request<{ roadmap: any }>('/seeker/roadmap'),
  generateSeekerRoadmap: (data: { targetJobTitle?: string; gaps?: any[] }) => request<{ roadmap: any }>('/seeker/roadmap/generate', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createSeekerRoadmapTask: (data: any) => request<{ task: any; roadmap: any }>('/seeker/roadmap/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSeekerRoadmapTask: (taskId: string, data: any) => request<{ task: any; roadmap: any }>(`/seeker/roadmap/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteSeekerRoadmapTask: (taskId: string) => request<{ success: boolean; roadmap: any }>(`/seeker/roadmap/tasks/${taskId}`, {
    method: 'DELETE'
  }),

  // Job Application Tracker
  getSeekerApplications: (params?: { status?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.search) query.set('search', params.search);
    return request<{ applications: any[] }>(`/seeker/applications?${query.toString()}`);
  },
  createSeekerApplication: (data: any) => request<{ application: any }>('/seeker/applications', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateSeekerApplication: (id: string, data: any) => request<{ application: any }>(`/seeker/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),
  deleteSeekerApplication: (id: string) => request<{ success: boolean; message: string }>(`/seeker/applications/${id}`, {
    method: 'DELETE'
  }),

  // AI Job Discovery & Application Assistant
  getSearchPreferences: () => request<{ preferences: any }>('/seeker/jobs/preferences'),
  updateSearchPreferences: (data: any) => request<{ preferences: any }>('/seeker/jobs/preferences', {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  discoverJobs: (data: any) => request<any>('/seeker/jobs/discover', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getRecommendedJobs: () => request<any>('/seeker/jobs/recommended'),
  saveDiscoveredJob: (data: { job: any; notes?: string }) => request<{ savedJob: any }>('/seeker/jobs/save', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  trackDiscoveredApplication: (data: { job: any; status?: string; resumeId?: string; notes?: string }) => request<{ application: any }>('/seeker/jobs/apply', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  dismissDiscoveredJob: (data: { jobId?: string; externalJobId?: string }) => request<{ success: boolean }>('/seeker/jobs/dismiss', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getPlatformLinks: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return request<{ links: any[] }>(`/seeker/jobs/platforms/links${q ? `?${q}` : ''}`);
  }
};

export const seekerApi = {
  getOverview: async () => {
    return api.getSeekerDashboard();
  },
  getResumes: async () => {
    const res = await api.getSeekerResumes();
    return res.resumes;
  },
  uploadResume: async (file: File, versionLabel?: string) => {
    const res = await api.uploadSeekerResume(file, versionLabel);
    return res.resume;
  },
  updateResume: async (id: string, data: { versionLabel?: string; isActive?: boolean }) => {
    const res = await api.updateSeekerResume(id, data);
    return res.resume;
  },
  deleteResume: async (id: string) => {
    return api.deleteSeekerResume(id);
  },
  getSavedJobs: async () => {
    const res = await api.getSeekerSavedJobs();
    return res.savedJobs;
  },
  createSavedJob: async (data: { title: string; company?: string; location?: string; jobUrl?: string; description: string; notes?: string }) => {
    const res = await api.createSeekerSavedJob(data);
    return res.savedJob;
  },
  updateSavedJob: async (id: string, data: any) => {
    const res = await request<{ savedJob: any }>(`/seeker/saved-jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.savedJob;
  },
  deleteSavedJob: async (id: string) => {
    return api.deleteSeekerSavedJob(id);
  },
  getApplications: async (params?: { status?: string; search?: string }) => {
    const res = await api.getSeekerApplications(params);
    return res.applications;
  },
  createApplication: async (data: any) => {
    const res = await api.createSeekerApplication(data);
    return res.application;
  },
  updateApplication: async (id: string, data: any) => {
    const res = await api.updateSeekerApplication(id, data);
    return res.application;
  },
  deleteApplication: async (id: string) => {
    return api.deleteSeekerApplication(id);
  }
};

