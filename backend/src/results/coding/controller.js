// Route handler for fetching a candidate's completed coding round result.
import { getCodingResult } from './service.js';

export const getCodingResultController = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const result = await getCodingResult(req.user.id, attemptId);
    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Coding result error:', error);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};