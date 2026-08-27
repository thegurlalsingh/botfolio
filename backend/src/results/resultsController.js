// Route handler for fetching a candidate's combined interview results.
import { getCombinedResults } from './resultsService.js';

export const getCombinedResultsController = async (req, res) => {
  try {
    const results = await getCombinedResults(req.user.id);
    return res.json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Combined results error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve results'
    });
  }
};