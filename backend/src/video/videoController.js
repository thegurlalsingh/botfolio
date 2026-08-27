// Express controllers for starting, uploading, transcribing, and submitting video interview answers
import multer from 'multer';
import { startVideoAttempt, submitVideoAttempt, transcibeUploadedAudio, uploadVideoAndExtractAudio } from './service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    console.log('========== MULTER FILE ==========');
    console.log('fieldname:', file.fieldname);
    console.log('originalname:', file.originalname);
    console.log('mimetype:', file.mimetype);
    console.log('=================================');

    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error(`Only video files allowed. Received: ${file.mimetype}`));
    }
  }
}).single('video');

export const startVideoRound = async (req, res) => {
  try {
    const result = await startVideoAttempt(req.user.id);
    return res.json({ success: true, ...result });
  }
  catch (error) {
    console.error('Video start error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadVideo = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video uploaded' });
    }

    try {
      const result = await uploadVideoAndExtractAudio(req.user.id, req.file);
      res.json({
        success: true,
        message: 'Video uploaded and audio extracted successfully',
        ...result
      });
    } catch (error) {
      console.error('Video processing failed:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });
};

export const transcribeVideo = async (req, res) => {
  try {
    const transcription = await transcibeUploadedAudio(req.body.audioUrl);
    res.json({
      success: true,
      message: 'Transcription completed with GCP Speech-to-Text',
      transcription: {
        text: transcription.text,
        language: transcription.language,
        confidence: transcription.confidence,
        wordCount: transcription.text ? transcription.text.split(/\s+/).length : 0,
      }
    });
  }
  catch (error) {
    console.error('GCP Transcription failed:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitVideoAnswer = async (req, res) => {
  try {
    const { attemptId, videoUrl, audioUrl } = req.body;
    const result = await submitVideoAttempt(req.user.id, attemptId, videoUrl, audioUrl);
    return res.json({
      success: true,
      message: result.completed ? 'Video interview completed!' : 'Answer submitted successfully!',
      ...result
    });
  } catch (error) {
    console.error("Video submission failed:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};