// Route handlers for uploading and fetching a candidate's job description.
import { uploadJobDescription, getLatestJobDescription } from './service.js';

export const uploadJD = async (req, res) => {
  try {
    const { title, content } = req.body;
    const result = await uploadJobDescription(req.user.id, title, content);
    return res.status(201).json({
      success: true,
      message: 'Job description uploaded successfully',
      jobDescription: result
    });
  } catch (error) {
    console.error('Job description upload error:', error);
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const getJD = async (req, res) => {
  try {
    const result = await getLatestJobDescription(req.user.id);
    return res.json({ success: true, jobDescription: result });
  } catch (error) {
    console.error('Job description fetch error:', error);
    return res.status(404).json({
      success: false,
      message: error.message
    });
  }
};