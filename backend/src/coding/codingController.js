// Route handlers for starting, running, and submitting coding-round attempts.
import { runCodingAttempt, startCodingAttempt, submitCodingAttempt } from './service.js';

export const startCodingRound = async (req, res) => {
  try {
    const result = await startCodingAttempt(req.user.id);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Console start error: ', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitCodingSolution = async (req, res) => {
  try {
    const result = await submitCodingAttempt(req.user.id, req.body.attemptId, req.body.code, req.body.language);
    res.json({
      success: true,
      message: 'Code submitted successfully!!',
      ...result
    });
  } catch (error) {
    console.error('Console submission error: ', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const runCodingSolution = async (req, res) => {
  try {
    const attempt = await runCodingAttempt(req.user.id, req.body.attemptId, req.body.code, req.body.language);
    res.json({
      success: true,
      message: 'Code ran successfully!!',
      ...attempt
    });
  } catch (error) {
    console.error('Console running error: ', error);
    res.status(500).json({ success: false, message: error.message });
  }
};