// Route handler for fetching a candidate's completed MCQ round result.
import { getMCQResult } from './service.js';

export const getMCQResultController = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const result = await getMCQResult(req.user.id, attemptId);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('MCQ result error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};