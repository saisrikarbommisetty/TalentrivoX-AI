import { Router } from 'express';
import { SeekerController } from '../controllers/seeker.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Protect all Job Seeker routes with authMiddleware
router.use(authMiddleware);

// Dashboard Summary
router.get('/dashboard', SeekerController.getDashboardSummary);

// Resume Vault
router.get('/resumes', SeekerController.getResumes);
router.post('/resumes', uploadMiddleware.single('file'), SeekerController.uploadResume);
router.get('/resumes/:id', SeekerController.getResumeById);
router.patch('/resumes/:id', SeekerController.updateResume);
router.delete('/resumes/:id', SeekerController.deleteResume);

// Saved Target Jobs
router.get('/saved-jobs', SeekerController.getSavedJobs);
router.post('/saved-jobs', SeekerController.createSavedJob);
router.get('/saved-jobs/:id', SeekerController.getSavedJobById);
router.delete('/saved-jobs/:id', SeekerController.deleteSavedJob);

// Personal Resume Analysis Engine
router.post('/analyze', SeekerController.analyzeResume);
router.get('/analyses', SeekerController.getAnalyses);
router.get('/analyses/:id', SeekerController.getAnalysisById);

// ATS Quality Checker
router.post('/ats-check', SeekerController.checkAtsQuality);

// Resume Improvement Studio
router.post('/improve-suggestions', SeekerController.getImprovementSuggestions);
router.get('/improvements/:resumeId', SeekerController.getImprovementState);
router.post('/improvements', SeekerController.saveImprovementState);
router.put('/improvements/:resumeId', SeekerController.saveImprovementState);

// Interview Preparation & Mock Sessions
router.post('/interview-prep/generate', SeekerController.generateInterviewPrep);
router.post('/mock-interviews/start', SeekerController.startMockSession);
router.post('/mock-interviews/:sessionId/submit-answer', SeekerController.submitMockAnswer);
router.get('/mock-interviews/:sessionId', SeekerController.getMockSession);
router.get('/mock-interviews', SeekerController.listMockSessions);

// Skill Development Roadmap
router.get('/roadmap', SeekerController.getSkillRoadmap);
router.post('/roadmap/generate', SeekerController.generateSkillRoadmap);
router.post('/roadmap/tasks', SeekerController.createRoadmapTask);
router.patch('/roadmap/tasks/:taskId', SeekerController.updateRoadmapTask);
router.delete('/roadmap/tasks/:taskId', SeekerController.deleteRoadmapTask);

// Job Application Tracker
router.get('/applications', SeekerController.getApplications);
router.post('/applications', SeekerController.createApplication);
router.patch('/applications/:id', SeekerController.updateApplication);
router.delete('/applications/:id', SeekerController.deleteApplication);

// AI Job Discovery & Application Assistant
router.get('/jobs/preferences', SeekerController.getSearchPreferences);
router.put('/jobs/preferences', SeekerController.updateSearchPreferences);
router.post('/jobs/discover', SeekerController.discoverJobs);
router.get('/jobs/recommended', SeekerController.getRecommendedJobs);
router.post('/jobs/save', SeekerController.saveDiscoveredJob);
router.post('/jobs/apply', SeekerController.trackDiscoveredApplication);
router.post('/jobs/dismiss', SeekerController.dismissDiscoveredJob);
router.get('/jobs/platforms/links', SeekerController.getPlatformLinks);

export default router;
