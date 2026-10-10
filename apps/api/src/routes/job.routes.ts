import { Router } from 'express';
import { JobController } from '../controllers/job.controller';
import { CandidateDiscoveryController } from '../controllers/candidate_discovery.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', JobController.listJobs);
router.post('/', JobController.createJob);
router.get('/:jobId', JobController.getJob);
router.patch('/:jobId', JobController.updateJob);
router.delete('/:jobId', JobController.deleteJob);
router.post('/:jobId/requirements/extract', JobController.extractRequirements);
router.put('/:jobId/requirements', JobController.updateRequirements);

// Recruiter Candidate Discovery Endpoints
router.post('/:jobId/discovery/run', CandidateDiscoveryController.runDiscovery);
router.get('/:jobId/discovery/runs', CandidateDiscoveryController.listRuns);
router.get('/:jobId/discovery/candidates', CandidateDiscoveryController.listCandidates);
router.post('/:jobId/discovery/candidates/:id/save', CandidateDiscoveryController.saveCandidate);
router.delete('/:jobId/discovery/candidates/:id/save', CandidateDiscoveryController.unsaveCandidate);
router.post('/:jobId/discovery/candidates/:id/import', CandidateDiscoveryController.importCandidate);
router.post('/:jobId/discovery/compare', CandidateDiscoveryController.compareCandidates);

export default router;

