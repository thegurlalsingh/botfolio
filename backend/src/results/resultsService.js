// Aggregates MCQ, video, and coding round results into a single weighted overall score.
import { getMCQResult } from './mcq/service.js';
import { getVideoResult } from './video/service.js';
import { getCodingResult } from './coding/service.js';
import prisma from '../db/prisma.js';

export const getCombinedResults = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const [mcqAttempt, videoAttempt, codingAttempt] = await Promise.all([
    prisma.mcqAttempt.findFirst({
      where: { userId, completed: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.videoInterview.findFirst({
      where: { userId, completed: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.codingAttempt.findFirst({
      where: { userId, completed: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const mcq = mcqAttempt ? await getMCQResult(userId, mcqAttempt.id) : null;
  const video = videoAttempt ? await getVideoResult(userId) : null;
  const coding = codingAttempt ? await getCodingResult(userId, codingAttempt.id) : null;

  const mcqScore = Number(mcq?.score || 0);
  const videoScore = Number(video?.score || 0);
  const codingScore = Number(coding?.assessment?.score || 0);

  const overallPercentage = Math.round(
    ((mcqScore / 100) * 30) +
    ((videoScore / 100) * 30) +
    ((codingScore / 100) * 40)
  );

  return {
    name: user.name,
    mcq,
    video,
    coding,
    overall: {
      percentage: overallPercentage,
      weights: {
        mcq: 30,
        video: 30,
        coding: 40
      }
    }
  };
};