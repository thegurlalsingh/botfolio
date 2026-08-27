// Builds the MCQ round result view: per-question breakdown, score, topic performance, and strengths/weaknesses.
import { findCompletedAttemptForUser } from './repository.js';

export const getMCQResult = async (userId, attemptId) => {
  const attempt = await findCompletedAttemptForUser(attemptId, userId);

  if (!attempt) {
    throw new Error('Completed MCQ attempt not found');
  }

  const questions = attempt.questions.map((question) => ({
    id: question.id,
    question: question.question,
    options: question.options,
    yourAnswer: question.candidateAnswer,
    correctAnswer: question.correct,
    isCorrect: question.isCorrect,
    explanation: question.explanation,
    topic: question.topic || 'General',
    difficulty: question.difficulty,
    competency: question.competency
  }));

  const totalQuestions = questions.length;

  const correctAnswers = questions.filter(question => question.isCorrect === true).length;

  const score = attempt.score != null
    ? Number(attempt.score)
    : totalQuestions > 0
      ? Number(((correctAnswers / totalQuestions) * 100).toFixed(2))
      : 0;

  const topicStats = {};

  for (const question of questions) {
    const topic = question.topic || 'General';

    if (!topicStats[topic]) {
      topicStats[topic] = {
        topic,
        total: 0,
        correct: 0
      };
    }

    topicStats[topic].total++;

    if (question.isCorrect === true) {
      topicStats[topic].correct++;
    }
  }

  const topicPerformance = Object.values(topicStats)
    .map((item) => {
      const percentage = item.total > 0
        ? Math.round((item.correct / item.total) * 100)
        : 0;

      return {
        topic: item.topic,
        total: item.total,
        correct: item.correct,
        percentage
      };
    })
    .sort((a, b) => a.percentage - b.percentage);

  const strengths = topicPerformance.filter(topic => topic.percentage >= 80);
  const weaknesses = topicPerformance.filter(topic => topic.percentage < 60);

  return {
    attemptId: attempt.id,
    score,
    totalQuestions,
    correctAnswers,
    questions,
    topicPerformance,
    strengths,
    weaknesses
  };
};