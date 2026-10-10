import { Router } from 'express';
import { InterviewController } from '../controllers/interview.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/job-candidates/:jobCandidateId/interview-plans', InterviewController.createPlan);
router.get('/interview-plans/:planId', InterviewController.getPlan);
router.patch('/interview-plans/:planId', InterviewController.updatePlan);
router.post('/interview-plans/:planId/sessions', InterviewController.createSession);

export default router;
