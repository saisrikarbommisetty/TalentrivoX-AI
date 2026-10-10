import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { CreateJobSchema, UpdateJobSchema, UpdateJobRequirementsSchema } from '@avengercoders/shared';
import { db } from '../db/client';
import { geminiService } from '../ai/gemini.service';

export class JobController {
  public static async listJobs(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const jobs = await db.query('jobs', (j) => j.owner_id === userId);

    // Attach candidate counts and latest requirement version info
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const jobCandidates = await db.query('job_candidates', (jc) => jc.job_id === job.id);
        const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === job.id);
        reqVersions.sort((a, b) => b.version_number - a.version_number);

        const latestVersion = reqVersions[0];
        const requirementCount = latestVersion ? latestVersion.requirements_json.length : 0;

        return {
          ...job,
          candidateCount: jobCandidates.length,
          requirementCount,
          latestVersionNumber: latestVersion ? latestVersion.version_number : 1
        };
      })
    );

    res.json({ jobs: enrichedJobs });
  }

  public static async getJob(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;

    const job = await db.findById('jobs', jobId);
    if (!job || job.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
      return;
    }

    const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === jobId);
    reqVersions.sort((a, b) => b.version_number - a.version_number);
    const latestVersion = reqVersions[0] || null;

    const jobCandidates = await db.query('job_candidates', (jc) => jc.job_id === jobId);

    res.json({
      job,
      requirements: latestVersion ? latestVersion.requirements_json : [],
      requirementVersion: latestVersion,
      candidateCount: jobCandidates.length
    });
  }

  public static async createJob(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const validated = CreateJobSchema.parse(req.body);

    const jobId = uuidv4();
    const newJob = await db.insert('jobs', {
      id: jobId,
      owner_id: userId,
      title: validated.title,
      department: validated.department,
      location: validated.location,
      employment_type: validated.employmentType,
      seniority: validated.seniority,
      description: validated.description,
      responsibilities: validated.responsibilities,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    let requirements = validated.requirements;
    if (!requirements || requirements.length === 0) {
      // Auto-extract requirements from job title and description
      requirements = await geminiService.extractRequirements(validated.title, validated.description);
    }

    const versionId = uuidv4();
    const reqVersion = await db.insert('job_requirement_versions', {
      id: versionId,
      job_id: jobId,
      version_number: 1,
      requirements_json: requirements,
      created_by: userId,
      created_at: new Date().toISOString()
    });

    res.status(201).json({
      job: newJob,
      requirements,
      requirementVersion: reqVersion
    });
  }

  public static async updateJob(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;
    const validated = UpdateJobSchema.parse(req.body);

    const existing = await db.findById('jobs', jobId);
    if (!existing || existing.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
      return;
    }

    const updated = await db.update('jobs', jobId, {
      ...validated,
      updated_at: new Date().toISOString()
    });

    res.json({ job: updated });
  }

  public static async deleteJob(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;

    const existing = await db.findById('jobs', jobId);
    if (!existing || existing.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
      return;
    }

    await db.delete('jobs', jobId);
    res.json({ success: true, message: 'Job deleted successfully' });
  }

  public static async extractRequirements(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;

    const job = await db.findById('jobs', jobId);
    if (!job || job.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
      return;
    }

    const requirements = await geminiService.extractRequirements(job.title, job.description);
    res.json({ requirements });
  }

  public static async updateRequirements(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { jobId } = req.params;
    const validated = UpdateJobRequirementsSchema.parse(req.body);

    const job = await db.findById('jobs', jobId);
    if (!job || job.owner_id !== userId) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Job not found or access denied' } });
      return;
    }

    const reqVersions = await db.query('job_requirement_versions', (v) => v.job_id === jobId);
    reqVersions.sort((a, b) => b.version_number - a.version_number);
    const nextVersionNumber = reqVersions.length > 0 ? reqVersions[0].version_number + 1 : 1;

    const versionId = uuidv4();
    const newVersion = await db.insert('job_requirement_versions', {
      id: versionId,
      job_id: jobId,
      version_number: nextVersionNumber,
      requirements_json: validated.requirements,
      created_by: userId,
      created_at: new Date().toISOString()
    });

    res.json({
      requirements: validated.requirements,
      requirementVersion: newVersion,
      message: `Requirement version ${nextVersionNumber} saved. Historical evaluations remain linked to their original version.`
    });
  }
}
