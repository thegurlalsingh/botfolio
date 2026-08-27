// Prisma query for a user's most recent completed video interview, including its steps.
import prisma from '../../db/prisma.js';

export const findCompletedVideoAttempt = async (userId) => {
  return prisma.videoInterview.findFirst({
    where: {
      userId,
      completed: true
    },
    include: {
      steps: {
        orderBy: { stepNumber: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
};