import multer from 'multer';
import { env } from '../config/env';

// Store files in memory buffer so we can compute SHA-256 hash and magic-bytes check before saving
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: (env.MAX_UPLOAD_SIZE_MB || 10) * 1024 * 1024,
    files: env.MAX_FILES_PER_BATCH || 10
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.docx', '.doc'];
    const lowerName = file.originalname.toLowerCase();
    const isAllowed = allowedExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isAllowed) {
      return cb(new Error('Invalid file type. Only PDF and DOCX documents are supported.'));
    }
    cb(null, true);
  }
});
