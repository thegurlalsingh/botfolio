// Prisma query for a user's completed MCQ attempt, including its questions.
import prisma from '../../db/prisma.js';

export const findCompletedAttemptForUser = (attemptId, userId) => {
  return prisma.mcqAttempt.findFirst({
    where: {
      id: attemptId, userId, completed: true
    },
    include: {
      questions: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });
};