// Zod validation schema for MCQ submission requests.
import { z } from 'zod';

const empty = z.object({}).strict();

export const submitMcqSchema = z.object({
  body: z.object({
    attemptId: z.string().trim().min(1, 'attemptId is required'),
    answers: z.array(z.enum(['A', 'B', 'C', 'D']).nullable())
  }).strict(),
  params: empty,
  query: empty
});