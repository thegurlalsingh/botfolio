// Prisma queries for coding attempts: lookup, creation, and completion/finalization.
import prisma from '../db/prisma.js';

export const findCodingActiveAttempt = (userId) => {
  return prisma.codingAttempt.findFirst({
    where: { userId, completed: false },
    orderBy: { createdAt: 'desc' }
  });
};

export const findCodingAttemptForUser = (attemptId, userId) => {
  return prisma.codingAttempt.findFirst({
    where: { id: attemptId, userId }
  });
};

export const createCodingAttempt = (userId, question, testCases) => {
  return prisma.codingAttempt.create({
    data: { userId, question, testCases }
  });
};

export const completeCodingAttempt = async (userId, attemptId, code, language, score, feedback) => {
  return prisma.$transaction(async (tx) => {
    const result = await tx.codingAttempt.updateMany({
      where: { id: attemptId },
      data: { code, language, score, feedback, completed: true }
    });

    if (result.count !== 1) {
      throw new Error('Coding attempt is invalid or already completed');
    }

    await tx.user.update({
      where: { id: userId },
      data: {
        codingScore: score,
        currentStep: 'completed'
      }
    });
  });
};