// Builds the video interview result view: per-question answers plus averaged relevance/clarity/confidence scores.
import { findCompletedVideoAttempt } from './repository.js';

export const getVideoResult = async (userId) => {
  const attempt = await findCompletedVideoAttempt(userId);

  if (!attempt) {
    throw new Error('Completed video interview not found');
  }

  const completedSteps = attempt.steps.filter(step => step.completed);

  if (completedSteps.length === 0) {
    throw new Error('No completed video interview answers found');
  }

  const average = (field) => {
    const values = completedSteps.map(step => step[field]).filter(value => typeof value === 'number');

    if (values.length === 0) {
      return 0;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return Number((total / values.length).toFixed(2));
  };

  const questions = completedSteps.map(step => ({
    stepNumber: step.stepNumber,
    question: step.question,
    answer: step.transcript,
    score: step.score,
    relevance: step.relevance,
    clarity: step.clarity,
    confidence: step.confidence,
    feedback: step.feedback,
    videoUrl: step.videoUrl,
    audioUrl: step.audioUrl
  }));

  return {
    attemptId: attempt.id,
    score: attempt.finalScore,
    totalQuestions: attempt.totalSteps,
    answeredQuestions: completedSteps.length,
    summary: {
      relevance: average('relevance'),
      clarity: average('clarity'),
      confidence: average('confidence')
    },
    questions
  };
};