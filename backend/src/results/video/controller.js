// Route handler for fetching a candidate's completed video interview result.
import { getVideoResult } from './service.js';

export const getVideoInterviewResult = async (req, res) => {
  try {
    const result = await getVideoResult(req.user.id);
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Video result error:', error);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};