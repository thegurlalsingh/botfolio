// Express routes for uploading and retrieving job descriptions.
import express from 'express';
import { uploadJD, getJD } from './controller.js';
import { verifyToken } from '../auth/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { uploadJobDescriptionSchema } from './validationSchema.js';

const router = express.Router();

router.post('/upload', verifyToken, validate(uploadJobDescriptionSchema), uploadJD);
router.get('/', verifyToken, getJD);

export default router;