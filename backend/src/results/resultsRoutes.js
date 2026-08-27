// Express routes for fetching individual round results and the combined results summary.
import express from 'express';
import { verifyToken } from '../auth/authMiddleware.js';
import { getMCQResultController } from './mcq/controller.js';
import { getVideoInterviewResult } from './video/controller.js';
import { getCodingResultController } from './coding/controller.js';
import { getCombinedResultsController } from './resultsController.js';

const router = express.Router();

router.get('/mcq/:attemptId', verifyToken, getMCQResultController);
router.get('/video/:attemptId', verifyToken, getVideoInterviewResult);
router.get('/coding/:attemptId', verifyToken, getCodingResultController);
router.get('/', verifyToken, getCombinedResultsController);

export default router;