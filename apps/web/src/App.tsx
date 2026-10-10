import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SeekerNavbar } from './components/SeekerNavbar';
import { SeekerSidebar } from './components/SeekerSidebar';
import { LoadingSkeleton } from './components/LoadingSkeleton';

// Recruiter Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { JobsListPage } from './pages/JobsListPage';
import { JobDetailPage } from './pages/JobDetailPage';
import { CandidateListPage } from './pages/CandidateListPage';
import { CandidateProfilePage } from './pages/CandidateProfilePage';
import { CandidateComparisonPage } from './pages/CandidateComparisonPage';
import { InterviewPlanBuilderPage } from './pages/InterviewPlanBuilderPage';
import { InterviewWorkspacePage } from './pages/InterviewWorkspacePage';
import { AnalyticsReportsPage } from './pages/AnalyticsReportsPage';
import { SettingsPage } from './pages/SettingsPage';

// Job Seeker Pages
import { JobSeekerDashboardPage } from './pages/seeker/JobSeekerDashboardPage';
import { SeekerJobDiscoveryPage } from './pages/seeker/SeekerJobDiscoveryPage';
import { SeekerResumesPage } from './pages/seeker/SeekerResumesPage';
import { SeekerAnalysisPage } from './pages/seeker/SeekerAnalysisPage';
import { SeekerResumeStudioPage } from './pages/seeker/SeekerResumeStudioPage';
import { SeekerAtsCheckerPage } from './pages/seeker/SeekerAtsCheckerPage';
import { SeekerInterviewPrepPage } from './pages/seeker/SeekerInterviewPrepPage';
import { SeekerSkillRoadmapPage } from './pages/seeker/SeekerSkillRoadmapPage';
import { SeekerApplicationTrackerPage } from './pages/seeker/SeekerApplicationTrackerPage';
import { SeekerSavedJobsPage } from './pages/seeker/SeekerSavedJobsPage';

const RecruiterProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory dark:bg-ivory-dark flex items-center justify-center p-6">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role guard: Job seekers accessing recruiter workspace redirected to their workspace
  if (user.role === 'job_seeker') {
    return <Navigate to="/app/seeker" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory dark:bg-ivory-dark text-ink dark:text-ink-dark selection:bg-forest selection:text-surface">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

const SeekerProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ivory dark:bg-ivory-dark flex items-center justify-center p-6 text-ink dark:text-ink-dark">
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Role guard: Recruiters accessing seeker workspace redirected to recruiter workspace
  if (user.role === 'recruiter') {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-ivory dark:bg-ivory-dark text-ink dark:text-ink-dark selection:bg-forest selection:text-surface">
      <SeekerNavbar />
      <div className="flex flex-1 overflow-hidden">
        <SeekerSidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<LoginPage />} />

            {/* Recruiter Authenticated Routes under /app */}
            <Route
              path="/app"
              element={
                <RecruiterProtectedLayout>
                  <DashboardPage />
                </RecruiterProtectedLayout>
              }
            />
            <Route path="/app/dashboard" element={<Navigate to="/app" replace />} />

            <Route
              path="/app/jobs"
              element={
                <RecruiterProtectedLayout>
                  <JobsListPage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/jobs/:jobId"
              element={
                <RecruiterProtectedLayout>
                  <JobDetailPage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/candidates"
              element={
                <RecruiterProtectedLayout>
                  <CandidateListPage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/candidates/:candidateId"
              element={
                <RecruiterProtectedLayout>
                  <CandidateProfilePage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/comparison"
              element={
                <RecruiterProtectedLayout>
                  <CandidateComparisonPage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/interview-plans/:planId"
              element={
                <RecruiterProtectedLayout>
                  <InterviewPlanBuilderPage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/interview-plans/:planId/workspace"
              element={
                <RecruiterProtectedLayout>
                  <InterviewWorkspacePage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/analytics"
              element={
                <RecruiterProtectedLayout>
                  <AnalyticsReportsPage />
                </RecruiterProtectedLayout>
              }
            />

            <Route
              path="/app/settings"
              element={
                <RecruiterProtectedLayout>
                  <SettingsPage />
                </RecruiterProtectedLayout>
              }
            />

            {/* Job Seeker Authenticated Routes under /app/seeker/* */}
            <Route
              path="/app/seeker"
              element={
                <SeekerProtectedLayout>
                  <JobSeekerDashboardPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/jobs"
              element={
                <SeekerProtectedLayout>
                  <SeekerJobDiscoveryPage />
                </SeekerProtectedLayout>
              }
            />
            <Route path="/app/seeker/discovery" element={<Navigate to="/app/seeker/jobs" replace />} />

            <Route
              path="/app/seeker/resumes"
              element={
                <SeekerProtectedLayout>
                  <SeekerResumesPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/analysis"
              element={
                <SeekerProtectedLayout>
                  <SeekerAnalysisPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/studio"
              element={
                <SeekerProtectedLayout>
                  <SeekerResumeStudioPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/ats-check"
              element={
                <SeekerProtectedLayout>
                  <SeekerAtsCheckerPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/interview-prep"
              element={
                <SeekerProtectedLayout>
                  <SeekerInterviewPrepPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/roadmap"
              element={
                <SeekerProtectedLayout>
                  <SeekerSkillRoadmapPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/applications"
              element={
                <SeekerProtectedLayout>
                  <SeekerApplicationTrackerPage />
                </SeekerProtectedLayout>
              }
            />

            <Route
              path="/app/seeker/saved-jobs"
              element={
                <SeekerProtectedLayout>
                  <SeekerSavedJobsPage />
                </SeekerProtectedLayout>
              }
            />

            {/* Backward Compatibility Direct Routes */}
            <Route path="/dashboard" element={<Navigate to="/app" replace />} />
            <Route
              path="/jobs"
              element={
                <RecruiterProtectedLayout>
                  <JobsListPage />
                </RecruiterProtectedLayout>
              }
            />
            <Route
              path="/candidates"
              element={
                <RecruiterProtectedLayout>
                  <CandidateListPage />
                </RecruiterProtectedLayout>
              }
            />
            <Route
              path="/comparison"
              element={
                <RecruiterProtectedLayout>
                  <CandidateComparisonPage />
                </RecruiterProtectedLayout>
              }
            />
            <Route
              path="/analytics"
              element={
                <RecruiterProtectedLayout>
                  <AnalyticsReportsPage />
                </RecruiterProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <RecruiterProtectedLayout>
                  <SettingsPage />
                </RecruiterProtectedLayout>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
