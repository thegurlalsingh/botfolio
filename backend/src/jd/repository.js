// Prisma queries for job description records: create and lookups.
import prisma from '../db/prisma.js';

export const createJobDescription = (userId, title, content) => {
  return prisma.jobDescription.create({
    data: { userId, title, content }
  });
};

export const findLatestJobDescription = (userId) => {
  return prisma.jobDescription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
};

export const findJobDescriptionForUser = (userId, id) => {
  return prisma.jobDescription.findFirst({
    where: { id, userId }
  });
};