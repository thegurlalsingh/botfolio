// Prisma queries for MCQ attempts: lookup, creation, and completion/scoring.
import prisma from '../db/prisma.js';

export const findActiveAttempt = (userId) => {
  return prisma.mcqAttempt.findFirst({
    where: { userId, completed: false },
    include: {
      questions: { orderBy: { createdAt: 'asc' } }
    },
    orderBy: { createdAt: 'desc' }
  });
};

export const findAttemptForUser = (attemptId, userId) => {
  return prisma.mcqAttempt.findFirst({
    where: { id: attemptId, userId },
    include: {
      questions: { orderBy: { createdAt: 'asc' } }
    }
  });
};

export const createAttempt = (userId, questions) => {
  return prisma.mcqAttempt.create({
    data: {
      userId,
      questions: {
        create: questions.map((question) => ({
          question: question.question,
          options: question.options,
          correct: question.correct,
          explanation: question.explanation,
          topic: question.topic,
          difficulty: question.difficulty,
          competency: question.competency
        }))
      }
    },
    include: {
      questions: { orderBy: { createdAt: 'asc' } }
    }
  });
};

export const completeAttempt = (userId, attemptId, evaluatedQuestions, score) => {
  return prisma.$transaction(async (tx) => {
    for (const question of evaluatedQuestions) {
      await tx.mcqQuestion.update({
        where: { id: question.id },
        data: {
          candidateAnswer: question.candidateAnswer,
          isCorrect: question.isCorrect
        }
      });
    }

    const attempt = await tx.mcqAttempt.update({
      where: { id: attemptId },
      data: { score, completed: true }
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        mcqScore: score,
        currentStep: 'video'
      }
    });

    return attempt;
  });
};