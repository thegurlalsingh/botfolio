// Route handlers for starting and submitting an MCQ attempt.
import { startMCQAttempt, submitMcqAttempt } from './services.js';

export const startMCQ = async (req, res) => {
  try {
    let result = await startMCQAttempt(req.user.id);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('MCQ start error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const submitMCQ = async (req, res) => {
  try {
    const { attemptId, answers } = req.body;
    const result = await submitMcqAttempt(req.user.id, attemptId, answers);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('MCQ submit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};