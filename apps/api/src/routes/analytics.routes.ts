import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard/stats', AnalyticsController.getDashboardStats);
router.get('/jobs/:jobId/analytics', AnalyticsController.getJobAnalytics);
router.get('/jobs/:jobId/export/csv', AnalyticsController.exportCsv);
router.get('/job-candidates/:jobCandidateId/report', AnalyticsController.getCandidateReport);

export default router;
