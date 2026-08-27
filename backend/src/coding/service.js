// Coding-round service: starts, runs, and submits coding attempts, including scoring and AI assessment.
import { generateCodingProblem } from './generate_questions.js';
import { executeCode } from './jDoodle.js';
import { assessSolution } from './assessAnswer.js';
import { completeCodingAttempt, createCodingAttempt, findCodingActiveAttempt, findCodingAttemptForUser } from './repository.js';
import prisma from '../db/prisma.js';

const parsedProblem = (question) => {
  try {
    return JSON.parse(question);
  } catch {
    throw new Error('Stored coding question is invalid.');
  }
};

const publicProblem = (problem, testCases) => ({
  ...problem,
  testCases: testCases.filter((testCase) => !testCase.hidden)
});

export const startCodingAttempt = async (userId) => {
  const activeAttempt = await findCodingActiveAttempt(userId);

  if (activeAttempt) {
    const problem = parsedProblem(activeAttempt.question);
    return {
      attemptId: activeAttempt.id,
      problem: publicProblem(problem, activeAttempt.testCases)
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('User not found');
  }

  const problem = await generateCodingProblem(user);

  if (!Array.isArray(problem.testCases) || !problem.testCases.length) {
    throw new Error('Generated problem has no test cases');
  }

  const storedQuestion = JSON.stringify({
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    starterCode: problem.starterCode
  });

  const attempt = await createCodingAttempt(userId, storedQuestion, problem.testCases);

  return {
    attemptId: attempt.id,
    problem: publicProblem(problem, problem.testCases),
  };
};

export const runCodingAttempt = async (userId, attemptId, code, language) => {
  const attempt = await findCodingAttemptForUser(attemptId, userId);

  if (!attempt) {
    throw new Error('Coding attempt not found');
  }

  if (attempt.completed) {
    throw new Error('Cannot run code for a completed attempt');
  }

  const visibleTestCases = attempt.testCases.filter((testCase) => !testCase.hidden);
  return executeCode(code, visibleTestCases, language);
};

export const submitCodingAttempt = async (userId, attemptId, code, language) => {
  const attempt = await findCodingAttemptForUser(attemptId, userId);

  if (!attempt) {
    throw new Error('Coding attempt not found');
  }

  if (attempt.completed) {
    throw new Error('Coding attempt has already been submitted');
  }

  if (!code?.trim()) {
    throw new Error('Code cannot be empty');
  }

  if (!language) {
    throw new Error('Programming language is required');
  }

  const problem = parsedProblem(attempt.question);

  console.log('========================================');
  console.log('        CODING SUBMISSION START         ');
  console.log('========================================');

  console.log('Attempt:', attemptId);
  console.log('Language:', language);
  console.log('Code length:', code.length);

  let execution;

  try {
    execution = await executeCode(code, attempt.testCases, language);

    console.log('Execution result:', {
      passed: execution.passed,
      total: execution.total
    });
  } catch (error) {
    console.error('Code execution failed:', error.message);
    throw error;
  }

  if (
    typeof execution.passed !== 'number' ||
    typeof execution.total !== 'number' ||
    execution.total <= 0
  ) {
    throw new Error('Invalid code execution result');
  }

  const score = Number(((execution.passed / execution.total) * 100).toFixed(2));

  let assessment;

  try {
    assessment = await assessSolution(problem, code, execution);
  } catch (error) {
    console.error('Code assessment failed:', error.message);
    throw error;
  }

  if (!assessment || typeof assessment.feedback !== 'string') {
    throw new Error('Invalid coding assessment response');
  }

  try {
    await completeCodingAttempt(userId, attemptId, code, language, score, assessment.feedback);
  } catch (error) {
    console.error('Failed to finalize coding attempt:', error.message);
    throw error;
  }

  console.log('========================================');
  console.log('       CODING SUBMISSION SUCCESS        ');
  console.log('========================================');

  return {
    completed: true,
    score,
    testCasesPassed: `${execution.passed} / ${execution.total}`,
    feedback: assessment.feedback,
    results: execution.results
  };
};