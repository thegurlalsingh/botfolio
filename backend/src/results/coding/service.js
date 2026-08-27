// Builds the coding round result view: problem, submission, assessment, and test-case summary.
import { findCodingResultForUser } from './repository.js';

const parseProblem = (question) => {
  try {
    return JSON.parse(question);
  } catch {
    throw new Error('Stored coding question is invalid.');
  }
};

export const getCodingResult = async (userId, attemptId) => {
  const attempt = await findCodingResultForUser(attemptId, userId);

  if (!attempt) {
    throw new Error('Completed coding attempt not found');
  }

  const problem = parseProblem(attempt.question);

  const visibleTestCases = Array.isArray(attempt.testCases) ? attempt.testCases.filter(testCase => !testCase.hidden) : [];

  return {
    attemptId: attempt.id,
    question: {
      title: problem.title,
      description: problem.description,
      difficulty: problem.difficulty,
      starterCode: problem.starterCode
    },
    submission: {
      language: attempt.language,
      code: attempt.code
    },
    assessment: {
      score: attempt.score,
      feedback: attempt.feedback
    },
    testCases: {
      total: attempt.testCases?.length || 0,
      visible: visibleTestCases.length
    }
  };
};