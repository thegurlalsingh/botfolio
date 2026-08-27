// Prisma queries for user records: lookups, profile updates, and refresh-token management.
import prisma from '../db/prisma.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  location: true,
  resumeUrl: true,
  currentStep: true,
  skills: true,
  designation: true,
  experienceYear: true,
  createdAt: true,
  experienceTimeline: true,
  educationTimeLine: true,
};

export const findUserByEmail = (email) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findPublicUserById = (id) => {
  return prisma.user.findUnique({ where: { id }, select: publicUserSelect });
};

export const updateProfileWithTimelines = async (userId, data) => {
  const { experienceTimeline, degree, experience, ...profileData } = data;
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) {
      return null;
    }
    if (experienceTimeline !== undefined) {
      await tx.experienceTimeline.deleteMany({ where: { userId } });
      if (experienceTimeline.length > 0) {
        await tx.experienceTimeline.createMany({
          data: experienceTimeline.map((item) => ({
            userId,
            title: item.title,
            company: item.company,
            duration: item.duration
          }))
        });
      }
    }
    if (degree !== undefined) {
      await tx.educationTimeLine.deleteMany({ where: { userId } });
      if (degree.length > 0) {
        await tx.educationTimeLine.createMany({
          data: degree.map((item) => ({
            userId,
            college: item.college,
            degree_name: item.degree_name,
            from_to: item.from_to
          }))
        });
      }
    }
    const jd = await tx.jobDescription.findFirst({ where: { userId } });
    const nextStep = jd ? 'mcq' : 'info';
    return tx.user.update({
      where: { id: userId },
      data: {
        ...profileData,
        ...(experience !== undefined ? { experienceYear: experience } : {}),
        currentStep: nextStep,
      },
      select: publicUserSelect
    });
  });
};

export const updateRefreshToken = (userId, refreshToken, refreshTokenExpires) => {
  return prisma.user.update({
    where: { id: userId },
    data: { refreshToken, refreshTokenExpires }
  });
};

export const findUserByRefreshToken = (refreshToken) => {
  return prisma.user.findFirst({
    where: {
      refreshToken,
      refreshTokenExpires: { gt: new Date() }
    }
  });
};