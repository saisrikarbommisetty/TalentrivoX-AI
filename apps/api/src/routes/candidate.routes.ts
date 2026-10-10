import { Router } from 'express';
import { CandidateController } from '../controllers/candidate.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

router.use(authMiddleware);

// Job candidate routes
router.get('/jobs/:jobId/candidates', CandidateController.listJobCandidates);
router.post('/jobs/:jobId/resumes', uploadMiddleware.array('files'), CandidateController.uploadResumes);
router.get('/job-candidates/:jobCandidateId', CandidateController.getJobCandidate);
router.get('/job-candidates/:jobCandidateId/resume/download', CandidateController.downloadResume);
router.patch('/job-candidates/:jobCandidateId/review', CandidateController.updateReview);
router.post('/job-candidates/:jobCandidateId/evaluate', CandidateController.evaluate);

export default router;
