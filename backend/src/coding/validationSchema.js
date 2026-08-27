// Zod validation schemas for coding run/submit request bodies.
import { z } from 'zod';

const empty = z.object({}).strict();

export const submitCodingSchema = z.object({
  body: z.object({
    attemptId: z.string().trim().min(1, 'attemptId is required'),
    code: z.string().min(1, 'Code is required'),
    language: z.enum(['cpp', 'python', 'javascript']).default('cpp')
  }).strict(),
  params: empty,
  query: empty
});

export const runCodingSchema = z.object({
  body: z.object({
    attemptId: z.string().trim().min(1, 'attemptId is required'),
    code: z.string().min(1, 'Code is required'),
    language: z.enum(['cpp', 'python', 'javascript']).default('cpp')
  }).strict(),
  params: empty,
  query: empty
});