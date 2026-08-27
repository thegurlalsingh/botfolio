// Prisma data-access functions for video interview attempts and their steps
import prisma from '../db/prisma.js';

export const findActiveVideoAttempt = (userId) => {
    return prisma.videoInterview.findFirst({
        where: { userId, completed: false },
        include: {
            steps: { orderBy: { stepNumber: 'asc' } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

export const findVideoAttemptForUser = (attemptId, userId) => {
    return prisma.videoInterview.findFirst({
        where: { id: attemptId, userId },
        include: {
            steps: { orderBy: { stepNumber: 'asc' } }
        }
    });
};

export const createVideoAttempt = (userId, question) => {
    return prisma.videoInterview.create({
        data: {
            userId,
            totalSteps: 5,
            currentStep: 1,
            steps: {
                create: { stepNumber: 1, question }
            }
        },
        include: { steps: true }
    });
};

export const completeInterviewStep = async (interviewId, stepNumber, data) => {
    return prisma.videoInterviewStep.update({
        where: {
            interviewId_stepNumber: { interviewId, stepNumber }
        },
        data
    });
};

export const createNextInterviewStep = async (interviewId, stepNumber, question) => {
    return prisma.videoInterviewStep.create({
        data: { interviewId, stepNumber, question }
    });
};

export const moveToNextStep = async (interviewId, nextStep) => {
    return prisma.videoInterview.update({
        where: { id: interviewId },
        data: { currentStep: nextStep }
    });
};

export const completeVideoAttempt = async (userId, attemptId, finalScore) => {
    return prisma.$transaction(async (tx) => {
        const result = await tx.videoInterview.update({
            where: { id: attemptId },
            data: { finalScore, completed: true }
        });
        await tx.user.update({
            where: { id: userId },
            data: { videoScore: finalScore, currentStep: 'coding' }
        });
        return result;
    });
};