import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { db } from '../db/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required.'
        }
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // 1. Check Demo / Standard JWT
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded && decoded.id) {
        req.user = {
          id: decoded.id,
          email: decoded.email || 'user@avengercoders.ai',
          displayName: decoded.displayName || 'Recruiter',
          role: decoded.role || 'recruiter'
        };
        return next();
      }
    } catch (e) {
      // If verification with JWT_SECRET fails, try Supabase auth if configured
    }

    const supabase = db.getSupabase();
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = {
          id: user.id,
          email: user.email || '',
          displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Recruiter',
          role: user.user_metadata?.role || 'recruiter'
        };
        return next();
      }
    }

    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'The provided authentication token is invalid or expired.'
      }
    });
  } catch (err: any) {
    res.status(500).json({
      error: {
        code: 'AUTH_ERROR',
        message: 'An error occurred while verifying credentials.'
      }
    });
  }
};
