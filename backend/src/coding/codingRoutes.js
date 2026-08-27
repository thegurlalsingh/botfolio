// Express routes for the coding round: start, run, and submit endpoints.
import { startCodingRound } from "./codingController.js";
import { verifyToken } from '../auth/authMiddleware.js';
import { submitCodingSolution, runCodingSolution } from "./codingController.js";
import express from 'express';
import { validate } from '../middlewares/validate.js';
import { runCodingSchema, submitCodingSchema } from './validationSchema.js';

const router = express.Router();

router.get('/start', verifyToken, startCodingRound);
router.post('/submit', verifyToken, validate(submitCodingSchema), submitCodingSolution);
router.post('/run', verifyToken, validate(runCodingSchema), runCodingSolution);

export default router;