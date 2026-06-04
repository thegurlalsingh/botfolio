import { startCodingRound } from "./codingController.js";
import { verifyToken } from '../login/authMiddleware.js';
import { submitCodingSolution, runCodingSolution } from "./codingController.js";
import express from 'express';


const router = express.Router();

router.get('/start', verifyToken, startCodingRound);
router.post('/submit', verifyToken, submitCodingSolution);
router.post('/run', verifyToken, runCodingSolution);

export default router;