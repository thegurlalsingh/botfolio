// Express route definitions for the video interview endpoints
import express from 'express';
import { uploadVideo, transcribeVideo, startVideoRound, submitVideoAnswer } from './videoController.js';
import { verifyToken } from '../auth/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { submitVideoSchema, transcribeVideoSchema } from './validationSchema.js';

const router = express.Router();

router.post('/upload', verifyToken, uploadVideo);
router.post('/transcribe', verifyToken, validate(transcribeVideoSchema), transcribeVideo);
router.get('/start', verifyToken, startVideoRound);
router.post('/submit', verifyToken, validate(submitVideoSchema), submitVideoAnswer);

export default router;