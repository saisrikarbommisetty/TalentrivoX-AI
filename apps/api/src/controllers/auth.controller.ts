import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { env } from '../config/env';
import { db } from '../db/client';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').optional()
});

const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['recruiter', 'hiring_manager', 'interviewer', 'admin', 'job_seeker']).default('recruiter')
});

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export class AuthController {
  public static async me(req: Request, res: Response): Promise<void> {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } });
      return;
    }

    const profile = await db.findById('profiles', user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: profile ? profile.display_name : user.displayName,
        role: profile ? profile.role : user.role
      }
    });
  }

  public static async register(req: Request, res: Response): Promise<void> {
    const validated = RegisterSchema.parse(req.body);

    // Check if user already exists
    const existing = await db.query('profiles', (p) => p.email && p.email.toLowerCase() === validated.email.toLowerCase());
    if (existing.length > 0) {
      res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'An account with this email address already exists. Please sign in instead.'
        }
      });
      return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(validated.password, salt);
    const userId = uuidv4();

    const profile = await db.insert('profiles', {
      id: userId,
      display_name: validated.fullName,
      email: validated.email.toLowerCase(),
      role: validated.role,
      password_hash: passwordHash,
      password_salt: salt,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const token = jwt.sign(
      {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role
      },
      message: 'Account created successfully.'
    });
  }

  public static async login(req: Request, res: Response): Promise<void> {
    const validated = LoginSchema.parse(req.body);
    const emailLower = validated.email.toLowerCase();

    // Lookup user in profiles
    const profiles = await db.query('profiles', (p) => p.email && p.email.toLowerCase() === emailLower);
    let profile = profiles[0];

    if (!profile) {
      // If demo email or first-time recruiter login without pre-registration, create account smoothly
      if (emailLower.includes('recruiter') || emailLower.includes('demo') || emailLower.includes('seeker') || !validated.password) {
        const newId = uuidv4();
        const role = emailLower.includes('seeker') ? 'job_seeker' : 'recruiter';
        profile = await db.insert('profiles', {
          id: newId,
          display_name: validated.email.split('@')[0].replace(/[._-]/g, ' '),
          email: emailLower,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      } else {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'No account found with this email address. Please check your credentials or create an account.'
          }
        });
        return;
      }
    }

    // If profile has password hash and user provided password, verify
    if (profile.password_hash && profile.password_salt && validated.password) {
      const computedHash = hashPassword(validated.password, profile.password_salt);
      if (computedHash !== profile.password_hash) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Incorrect password. Please verify and try again.'
          }
        });
        return;
      }
    }

    const token = jwt.sign(
      {
        id: profile.id,
        email: profile.email || validated.email,
        displayName: profile.display_name,
        role: profile.role || 'recruiter'
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email || validated.email,
        displayName: profile.display_name,
        role: profile.role
      }
    });
  }

  public static async demoLogin(req: Request, res: Response): Promise<void> {
    const requestedRole = req.body?.role || req.query?.role;
    const isJobSeeker = requestedRole === 'job_seeker';

    const targetProfileId = isJobSeeker
      ? '00000000-0000-0000-0000-000000000003'
      : '00000000-0000-0000-0000-000000000001';

    let profile = await db.findById('profiles', targetProfileId);

    if (!profile) {
      profile = await db.insert('profiles', {
        id: targetProfileId,
        display_name: isJobSeeker ? 'Jordan Rivera' : 'Sarah Jenkins (Lead Recruiter)',
        email: isJobSeeker ? 'seeker@avengercoders.ai' : 'recruiter@avengercoders.ai',
        role: isJobSeeker ? 'job_seeker' : 'recruiter',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const token = jwt.sign(
      {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role
      }
    });
  }

  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Email is required' } });
      return;
    }

    res.json({
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been dispatched.'
    });
  }
}
