import express from 'express';
import { verifyToken } from '../login/authMiddleware.js';
import User from '../login/User.js';
import MCQAttempt from '../mcq/mcq.js';
import VideoAttempt from '../video/video.js';
import CodingAttempt from '../coding/coding.js';

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const mcqAttempt = await MCQAttempt.findOne({ 
      userId, 
      completed: true 
    }).sort({ createdAt: -1 });

    const videoAttempt = await VideoAttempt.findOne({ 
      userId, 
      completed: true 
    }).sort({ createdAt: -1 });

    const codingAttempt = await CodingAttempt.findOne({ 
      userId, 
      completed: true 
    }).sort({ createdAt: -1 });

    const user = await User.findById(userId);

    const results = {
      name: user?.name || 'Candidate',
      mcq: {
        score: mcqAttempt?.score || 0,
        total: mcqAttempt?.questions?.length || 8
      },
      video: {
        score: videoAttempt?.score || 0,
        feedback: videoAttempt?.feedback || 'Not completed',
        transcript: videoAttempt?.transcript ? 'Available' : 'Not available'
      },
      coding: {
        passed: codingAttempt?.passedTests || 0,
        total: codingAttempt?.totalTests || 8,
        feedback: codingAttempt?.feedback || 'Not completed'
      }
    };

    // Overall calculation
    const totalScore = results.mcq.score + results.video.score + (results.coding.passed / results.coding.total * 100 || 0);
    results.overall = {
      score: Math.round(totalScore),
      percentage: Math.round(totalScore / 3) // average of 3 rounds
    };

    res.json({ success: true, results });
  } catch (error) {
    console.error("Results fetch failed:", error);
    res.status(500).json({ success: false, message: "Failed to load results" });
  }
});

export default router;