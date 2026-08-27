// Prisma query for a user's completed coding attempt.
import prisma from '../../db/prisma.js';

export const findCodingResultForUser = (attemptId, userId) => {
  return prisma.codingAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
      completed: true
    }
  });
};