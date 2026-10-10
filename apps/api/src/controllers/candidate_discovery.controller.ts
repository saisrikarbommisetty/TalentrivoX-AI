import { Request, Response } from 'express';
import { RecruiterCandidateDiscoveryQuerySchema } from '@avengercoders/shared';
import { candidateDiscoveryService } from '../discovery/candidates/candidate_discovery.service';
import { db } from '../db/client';

export class CandidateDiscoveryController {
  /**
   * POST /api/v1/jobs/:jobId/discovery/run
   * Executes the 7-stage Agentic Candidate Discovery Pipeline for a specific job
   */
  public static async runDiscovery(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId } = req.params;

      const job = await db.findById('jobs', jobId);
      if (!job || (job.owner_id !== userId && job.recruiter_id !== userId)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
        return;
      }

      const parsedQuery = RecruiterCandidateDiscoveryQuerySchema.partial().safeParse(req.body);
      const query = parsedQuery.success ? parsedQuery.data : {};

      const result = await candidateDiscoveryService.runDiscovery(jobId, userId, query);

      res.status(200).json({
        run: result.run,
        qualifiedCandidates: result.qualifiedCandidates
      });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'DISCOVERY_ERROR',
          message: err.message || 'Failed to execute candidate discovery run'
        }
      });
    }
  }

  /**
   * GET /api/v1/jobs/:jobId/discovery/runs
   * Returns list of past discovery runs for the job
   */
  public static async listRuns(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId } = req.params;

      const job = await db.findById('jobs', jobId);
      if (!job || (job.owner_id !== userId && job.recruiter_id !== userId)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
        return;
      }

      const runs = await candidateDiscoveryService.getDiscoveryRuns(jobId, userId);
      res.status(200).json({ runs });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'FETCH_ERROR',
          message: err.message || 'Failed to list discovery runs'
        }
      });
    }
  }

  /**
   * GET /api/v1/jobs/:jobId/discovery/candidates
   * Returns all qualified discovered candidates for the job with filters
   */
  public static async listCandidates(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId } = req.params;
      const minScore = req.query.minScore !== undefined ? parseInt(req.query.minScore as string, 10) : 0;

      const job = await db.findById('jobs', jobId);
      if (!job || (job.owner_id !== userId && job.recruiter_id !== userId)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
        return;
      }

      const candidates = await candidateDiscoveryService.getQualifiedCandidates(jobId, userId, minScore);
      res.status(200).json({ candidates });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'FETCH_ERROR',
          message: err.message || 'Failed to list qualified candidates'
        }
      });
    }
  }

  /**
   * POST /api/v1/jobs/:jobId/discovery/candidates/:id/save
   * Saves/Bookmarks candidate
   */
  public static async saveCandidate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId, id } = req.params;

      const job = await db.findById('jobs', jobId);
      if (!job || (job.owner_id !== userId && job.recruiter_id !== userId)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
        return;
      }

      const updated = await candidateDiscoveryService.saveCandidate(jobId, id, userId);
      res.status(200).json({ candidate: updated });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'SAVE_ERROR',
          message: err.message || 'Failed to save candidate'
        }
      });
    }
  }

  /**
   * DELETE /api/v1/jobs/:jobId/discovery/candidates/:id/save
   * Unsaves candidate
   */
  public static async unsaveCandidate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId, id } = req.params;

      const job = await db.findById('jobs', jobId);
      if (!job || (job.owner_id !== userId && job.recruiter_id !== userId)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
        return;
      }

      const updated = await candidateDiscoveryService.unsaveCandidate(jobId, id, userId);
      res.status(200).json({ candidate: updated });
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'UNSAVE_ERROR',
          message: err.message || 'Failed to unsave candidate'
        }
      });
    }
  }

  /**
   * POST /api/v1/jobs/:jobId/discovery/candidates/:id/import
   * Imports candidate into the regular job pipeline (job_candidates)
   */
  public static async importCandidate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId, id } = req.params;

      const job = await db.findById('jobs', jobId);
      if (!job || (job.owner_id !== userId && job.recruiter_id !== userId)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
        return;
      }

      const result = await candidateDiscoveryService.importCandidate(jobId, id, userId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'IMPORT_ERROR',
          message: err.message || 'Failed to import candidate'
        }
      });
    }
  }

  /**
   * POST /api/v1/jobs/:jobId/discovery/compare
   * Generates comparison matrix for multiple selected candidates
   */
  public static async compareCandidates(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { jobId } = req.params;
      const { candidateIds } = req.body;

      if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
        res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'candidateIds array is required' } });
        return;
      }

      const job = await db.findById('jobs', jobId);
      if (!job || (job.owner_id !== userId && job.recruiter_id !== userId)) {
        res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
        return;
      }

      const result = await candidateDiscoveryService.compareCandidates(jobId, candidateIds, userId);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(500).json({
        error: {
          code: 'COMPARE_ERROR',
          message: err.message || 'Failed to compare candidates'
        }
      });
    }
  }
}
