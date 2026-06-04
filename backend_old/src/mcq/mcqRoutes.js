import express from 'express';
import { startMCQ, submitMCQ } from './mcqController.js';
import { verifyToken } from '../login/authMiddleware.js';

const router = express.Router();

router.get('/start', verifyToken, startMCQ);
router.post('/submit', verifyToken, submitMCQ);

export default router;