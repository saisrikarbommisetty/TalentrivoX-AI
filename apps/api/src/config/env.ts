import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  APP_URL: z.string().default('http://localhost:5173'),
  API_URL: z.string().default('http://localhost:4000'),
  JWT_SECRET: z.string().default('avengercoders-default-super-secret-key-for-jwt-signing'),
  
  // Supabase (Optional for local test/dev mode)
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default('resumes'),
  
  // AI Provider (Gemini)
  AI_PROVIDER: z.string().default('gemini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-1.5-flash'),
  AI_REQUEST_TIMEOUT_MS: z.string().default('20000').transform((v) => parseInt(v, 10)),
  AI_MAX_RETRIES: z.string().default('3').transform((v) => parseInt(v, 10)),
  
  // Upload limits
  MAX_UPLOAD_SIZE_MB: z.string().default('10').transform((v) => parseInt(v, 10)),
  MAX_FILES_PER_BATCH: z.string().default('10').transform((v) => parseInt(v, 10)),

  // Job Discovery Providers (Adzuna & JSearch / RapidAPI)
  ADZUNA_APP_ID: z.string().optional(),
  ADZUNA_API_KEY: z.string().optional(),
  ADZUNA_COUNTRY: z.string().default('us'),
  RAPIDAPI_KEY: z.string().optional(),
  JSEARCH_API_HOST: z.string().default('jsearch.p.rapidapi.com'),
  JOB_SEARCH_TIMEOUT_MS: z.string().default('10000').transform((v) => parseInt(v, 10)),

  // Candidate Discovery Providers (GitHub Public Talent, Open Talent Network)
  GITHUB_TOKEN: z.string().optional(),
  OPEN_TALENT_API_URL: z.string().optional(),
  OPEN_TALENT_API_KEY: z.string().optional(),
  CANDIDATE_SEARCH_TIMEOUT_MS: z.string().default('10000').transform((v) => parseInt(v, 10))
});

export const env = EnvSchema.parse(process.env);
