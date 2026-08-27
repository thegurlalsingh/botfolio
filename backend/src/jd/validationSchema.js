// Zod validation schema for job description upload requests.
import { z } from 'zod';

const empty = z.object({}).strict();

export const uploadJobDescriptionSchema = z.object({
  body: z.object({
    title: z.string().trim().optional(),
    content: z.string().trim().min(20, 'Job description is too short').max(30000, 'Job description is too long')
  }).strict(),
  params: empty,
  query: empty
});