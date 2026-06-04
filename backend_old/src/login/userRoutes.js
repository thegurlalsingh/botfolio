import express from 'express';
import { login, saveProfile } from './userController.js';
import { verifyToken } from './authMiddleware.js';
import { uploadResume } from "../resume/resumeController.js"
// import { isHR } from '../middlewares/authMiddleware.js';
import User from './User.js';

const router = express.Router();

router.post('/login', login);
// router.get('/admin', protectRoute(['hr']), adminOnlyRoute);
// router.post('/basic-info', verifyToken, saveBasicInfo);

router.post('/info_resume', verifyToken, uploadResume);
// Add this line with your other routes
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/save-profile', verifyToken, saveProfile);

export default router;
