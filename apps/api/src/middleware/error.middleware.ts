import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  // If headers already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err);
  }

  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or schema constraints violated',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message
        }))
      }
    });
    return;
  }

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    res.status(400).json({
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message || 'File upload error'
      }
    });
    return;
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message: statusCode === 500 && process.env.NODE_ENV === 'production' ? 'An unexpected internal error occurred' : message
    }
  });
};
