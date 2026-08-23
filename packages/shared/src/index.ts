import { z } from 'zod';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum JobType {
  EMAIL = 'EMAIL',
  WEBHOOK = 'WEBHOOK',
  REPORT = 'REPORT',
}

export enum JobStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  CANCELLED = 'CANCELLED',
  DEAD_LETTER = 'DEAD_LETTER',
}

export enum WorkerStatus {
  HEALTHY = 'HEALTHY',
  UNHEALTHY = 'UNHEALTHY',
  OFFLINE = 'OFFLINE',
}

// Zod Validation Schemas
export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Job Payload Schemas
export const EmailPayloadSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
  simulateFailure: z.boolean().optional(),
});

export const WebhookPayloadSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('POST'),
  headers: z.record(z.string()).optional(),
  body: z.record(z.any()).optional(),
});

export const ReportPayloadSchema = z.object({
  reportName: z.string().optional(),
  format: z.enum(['CSV', 'JSON']).default('JSON'),
  filterStatus: z.nativeEnum(JobStatus).optional(),
});

export const CreateJobSchema = z.object({
  type: z.nativeEnum(JobType),
  payload: z.record(z.any()),
  maxAttempts: z.number().int().min(1).max(10).optional().default(3),
  priority: z.number().int().min(1).max(10).optional().default(1),
});

export const JobQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  status: z.nativeEnum(JobStatus).optional(),
  type: z.nativeEnum(JobType).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'attempts']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateJobInput = z.infer<typeof CreateJobSchema>;
export type JobQueryInput = z.infer<typeof JobQuerySchema>;
export type EmailPayload = z.infer<typeof EmailPayloadSchema>;
export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
export type ReportPayload = z.infer<typeof ReportPayloadSchema>;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date | string;
}

export interface JobDTO {
  id: string;
  userId: string;
  type: JobType;
  status: JobStatus;
  payload: any;
  attempts: number;
  maxAttempts: number;
  priority: number;
  idempotencyKey?: string | null;
  createdAt: Date | string;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  failedAt?: Date | string | null;
  lastError?: string | null;
  nextRetryAt?: Date | string | null;
  updatedAt: Date | string;
}

export interface AnalyticsSummary {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  processingJobs: number;
  pendingJobs: number;
  retryingJobs: number;
  deadLetterJobs: number;
  successRate: number;
  avgProcessingTimeMs: number;
}
