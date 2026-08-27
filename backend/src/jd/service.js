// Job description service: upload/validate content and advance the candidate's step when eligible.
import { createJobDescription, findLatestJobDescription } from './repository.js';
import prisma from '../db/prisma.js';

export const uploadJobDescription = async (userId, title, content) => {
  if (!content?.trim()) {
    throw new Error('Job description cannot be empty');
  }

  const jd = await createJobDescription(userId, title?.trim() || null, content.trim());

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user && user.resumeUrl) {
    await prisma.user.update({
      where: { id: userId },
      data: { currentStep: 'mcq' }
    });
  }

  return jd;
};

export const getLatestJobDescription = async (userId) => {
  const jobDescription = await findLatestJobDescription(userId);
  if (!jobDescription) {
    throw new Error('Job description not found');
  }
  return jobDescription;
};