// Express routes for starting and submitting the MCQ round.
import express from 'express';
import { startMCQ, submitMCQ } from './mcqController.js';
import { verifyToken } from '../auth/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { submitMcqSchema } from './validationSchema.js';

const router = express.Router();

router.get('/start', verifyToken, startMCQ);
router.post('/submit', verifyToken, validate(submitMcqSchema), submitMCQ);

export default router;