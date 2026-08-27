// MCQ service: starts an attempt (reusing an active one or generating new questions) and scores submissions.
import prisma from '../db/prisma.js';
import { generateMCQs } from './generate_questions.js';
import { completeAttempt, createAttempt, findActiveAttempt, findAttemptForUser } from './repository.js';

const publicQuestions = (questions) => {
  return questions.map((question) => ({
    id: question.id,
    question: question.question,
    options: question.options,
    topic: question.topic,
    difficulty: question.difficulty,
    competency: question.competency
  }));
};

export const startMCQAttempt = async (userId) => {
  const activeAttempt = await findActiveAttempt(userId);

  if (activeAttempt) {
    return {
      attemptId: activeAttempt.id,
      questions: publicQuestions(activeAttempt.questions)
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      jobDescriptions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const jd = user.jobDescriptions[0]?.content || "";

  const questions = await generateMCQs({
    skills: user.skills,
    experienceYears: user.experienceYear,
    appliedFor: user.designation,
    jd
  });

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Failed to generate MCQs');
  }

  const attempt = await createAttempt(userId, questions);

  return {
    attemptId: attempt.id,
    questions: publicQuestions(attempt.questions)
  };
};

export const submitMcqAttempt = async (userId, attemptId, answers) => {
  const attempt = await findAttemptForUser(attemptId, userId);
  if (!attempt) {
    throw new Error('Attempt not found');
  }
  if (attempt.completed) {
    throw new Error('This MCQ Attempt has already been submitted');
  }
  const questions = attempt.questions;
  if (!Array.isArray(questions) || answers.length !== questions.length) {
    throw new Error('Answer count does not match question count');
  }
  const evaluatedQuestions = questions.map((question, index) => {
    const candidateAnswer = answers[index];
    const isCorrect = candidateAnswer === question.correct;
    return { id: question.id, candidateAnswer, isCorrect };
  });

  const correctCount = evaluatedQuestions.filter(question => question.isCorrect).length;
  const percentage = Math.round((correctCount / questions.length) * 100);
  await completeAttempt(userId, attemptId, evaluatedQuestions, percentage);

  return {
    attemptId,
    score: percentage,
    total: questions.length,
    correct: correctCount,
    completed: true
  };
};