import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../config/env';
import { db } from '../db/client';

export interface StoredFileMetadata {
  storagePath: string;
  originalFilename: string;
  fileHash: string;
  mimeType: string;
  sizeBytes: number;
}

export class StorageService {
  private localDir: string;

  constructor() {
    this.localDir = path.resolve(process.cwd(), 'data', 'resumes');
    if (!fs.existsSync(this.localDir)) {
      fs.mkdirSync(this.localDir, { recursive: true });
    }
  }

  /**
   * Calculates SHA-256 hash of a buffer for deduplication and integrity check.
   */
  public calculateHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Validates file signature (magic bytes) to prevent extension spoofing.
   */
  public validateMagicBytes(buffer: Buffer, originalFilename: string): { valid: boolean; detectedType?: string; error?: string } {
    if (buffer.length < 4) {
      return { valid: false, error: 'File buffer is too small to validate' };
    }

    // PDF Magic Bytes: %PDF (0x25, 0x50, 0x44, 0x46)
    const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    // DOCX Magic Bytes (ZIP archive format): PK (0x50, 0x4B, 0x03, 0x04)
    const isDocx = buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04;

    const ext = path.extname(originalFilename).toLowerCase();

    if (ext === '.pdf') {
      if (!isPdf) return { valid: false, error: 'File has .pdf extension but invalid PDF header signature' };
      return { valid: true, detectedType: 'application/pdf' };
    }

    if (ext === '.docx' || ext === '.doc') {
      if (!isDocx) return { valid: false, error: 'File has DOCX extension but invalid ZIP container signature' };
      return { valid: true, detectedType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' };
    }

    return { valid: false, error: 'Unsupported file extension. Only PDF and DOCX files are allowed.' };
  }

  /**
   * Stores a file privately and securely.
   */
  public async storeResume(buffer: Buffer, originalFilename: string): Promise<StoredFileMetadata> {
    const validation = this.validateMagicBytes(buffer, originalFilename);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid file format');
    }

    const fileHash = this.calculateHash(buffer);
    const safeExt = path.extname(originalFilename).toLowerCase();
    const safeFilename = `${uuidv4()}${safeExt}`;
    const storagePath = `resumes/${safeFilename}`;

    // Cloud storage if Supabase is active
    const supabase = db.getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.storage
          .from(env.SUPABASE_STORAGE_BUCKET)
          .upload(storagePath, buffer, {
            contentType: validation.detectedType,
            upsert: false
          });

        if (error) {
          console.warn('[Storage] Supabase upload failed, falling back to local private storage', error);
        } else {
          return {
            storagePath,
            originalFilename,
            fileHash,
            mimeType: validation.detectedType || 'application/octet-stream',
            sizeBytes: buffer.length
          };
        }
      } catch (err) {
        console.warn('[Storage] Supabase upload exception, saving locally', err);
      }
    }

    // Local Private File Storage
    const localFilePath = path.join(this.localDir, safeFilename);
    fs.writeFileSync(localFilePath, buffer);

    return {
      storagePath: localFilePath,
      originalFilename,
      fileHash,
      mimeType: validation.detectedType || 'application/octet-stream',
      sizeBytes: buffer.length
    };
  }

  /**
   * Retrieves private file buffer for authorized downloads.
   */
  public async getResumeBuffer(storagePath: string): Promise<Buffer> {
    const supabase = db.getSupabase();
    if (supabase && storagePath.startsWith('resumes/')) {
      const { data, error } = await supabase.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .download(storagePath);

      if (!error && data) {
        const arrayBuffer = await data.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
    }

    // Local private storage path
    if (fs.existsSync(storagePath)) {
      return fs.readFileSync(storagePath);
    }

    // Check fallback in local directory by filename
    const filename = path.basename(storagePath);
    const localPath = path.join(this.localDir, filename);
    if (fs.existsSync(localPath)) {
      return fs.readFileSync(localPath);
    }

    throw new Error('Resume file could not be found in storage');
  }
}

export const storageService = new StorageService();
