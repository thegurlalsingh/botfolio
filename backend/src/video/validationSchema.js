// Zod request-validation schemas for the video interview transcribe and submit endpoints
import { z } from 'zod';

const empty = z.object({}).strict();

export const transcribeVideoSchema = z.object({
    body: z.object({
        audioUrl: z.string().url('audioUrl is required'),
    }).strict(),
    params: empty,
    query: empty
});

export const submitVideoSchema = z.object({
    body: z.object({
        attemptId: z.string().trim().min(1, 'attemptId is required'),
        audioUrl: z.string().url('audioUrl is required'),
        videoUrl: z.string().url('videoUrl is required'),
    }).strict(),
    params: empty,
    query: empty
});