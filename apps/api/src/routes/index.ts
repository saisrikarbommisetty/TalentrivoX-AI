import { Router } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './job.routes';
import candidateRoutes from './candidate.routes';
import interviewRoutes from './interview.routes';
import analyticsRoutes from './analytics.routes';
import seekerRoutes from './seeker.routes';
import { geminiService } from '../ai/gemini.service';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiProvider: geminiService.getStatus(),
    uptime: process.uptime()
  });
});

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/', candidateRoutes);
router.use('/', interviewRoutes);
router.use('/', analyticsRoutes);
router.use('/seeker', seekerRoutes);

export default router;
