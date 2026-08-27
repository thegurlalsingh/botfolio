// Express routes for user auth, profile, and resume upload endpoints.
import express from 'express';
import { login, saveProfile, getMe, refreshToken } from './userController.js';
import { verifyToken } from './authMiddleware.js';
import { uploadResume } from "../resume/resumeController.js";
import { validate } from '../middlewares/validate.js';
import { loginSchema, updateProfileSchema } from './validationSchema.js';

const router = express.Router();

router.post('/login', validate(loginSchema), login);
router.post('/info_resume', verifyToken, uploadResume);
router.get('/me', verifyToken, getMe);
router.post('/save-profile', verifyToken, validate(updateProfileSchema), saveProfile);
router.post('/refresh', refreshToken);

export default router;