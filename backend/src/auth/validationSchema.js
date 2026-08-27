// Zod validation schemas for login and profile-update request bodies.
import { email, z } from 'zod';

const empty = z.object({}).strict();

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
  }).strict(),
  params: empty,
  query: empty
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).optional(),
    phone: z.string().trim().optional(),
    location: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    experience: z.string().trim().optional(),
    skills: z.array(z.string().trim()).optional(),
    experienceTimeline: z.array(z.object({
      title: z.string().trim().optional(),
      company: z.string().trim().optional(),
      duration: z.string().trim().optional(),
    })).optional(),
    degree: z.array(z.object({
      college: z.string().trim().optional(),
      degree_name: z.string().trim().optional(),
      from_to: z.string().trim().optional(),
    })).optional(),
  }).strict(),
  params: empty,
  query: empty,
});