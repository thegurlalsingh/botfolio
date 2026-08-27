// Handles resume upload: stores the PDF, extracts and parses its text via LLM, and saves the profile.
import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { extractTextFromPDF } from './extractText.js';
import { parseResumeText } from './parseResume.js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { persistParsedResume } from './service.js';

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE
});
const bucket = storage.bucket(process.env.GCP_BUCKET);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files allowed'));
    }
  }
}).single('resume');

export const uploadResume = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.user.id;
    const file = req.file;
    const tempPath = path.join(process.cwd(), `temp_resume_${userId}_${Date.now()}.pdf`);

    try {
      fs.writeFileSync(tempPath, file.buffer);

      const blob = bucket.file(`resumes/${userId}_${Date.now()}.pdf`);
      await blob.save(file.buffer);
      const resumeUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${blob.name}`;

      const text = await extractTextFromPDF(tempPath);

      const parsed = await parseResumeText(text);

      const user = await persistParsedResume(userId, parsed, resumeUrl);

      return res.status(200).json({
        success: true,
        message: 'Resume parsed and profile saved successfully!!',
        parsedData: {
          ...parsed, resumeUrl
        },
        user: {
          ...user,
          experience: user.experienceYear,
          degree: user.educationTimeLine,
          experienceYear: undefined,
          educationTimeLine: undefined
        },
      });
    } catch (error) {
      console.error("Resume processing error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to process resume'
      });
    } finally {
      if (fs.existsSync(tempPath)) {
        fs.unlinkSync(tempPath);
      }
    }
  });
};