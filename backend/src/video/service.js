// Core business logic for the video interview pipeline: start, upload, transcribe, assess, and progress through steps
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { extractAudio } from './extractAudio.js';
import { transcribeAudio } from './transcribe.js';
import { generateBehavioralQuestion } from './generate_questions.js';
import { assessAnswer } from './assessAnswer.js';
import { createVideoAttempt, completeVideoAttempt, findActiveVideoAttempt, findVideoAttemptForUser, completeInterviewStep, createNextInterviewStep, moveToNextStep } from './repository.js';
import prisma from '../db/prisma.js';

const storage = new Storage({
    projectId: process.env.GCP_PROJECT_ID,
    keyFilename: process.env.GCP_KEY_FILE || '/app/keys/gcp-key.json',
});
const bucket = storage.bucket(process.env.GCP_BUCKET);

export const startVideoAttempt = async (userId) => {
    const activeAttempt = await findActiveVideoAttempt(userId);

    if (activeAttempt) {
        const currentStep = activeAttempt.steps.find(step => step.stepNumber === activeAttempt.currentStep);

        if (!currentStep) {
            throw new Error('Current interview step not found');
        }

        return {
            totalSteps: activeAttempt.totalSteps,
            currentStep: activeAttempt.currentStep,
            attemptId: activeAttempt.id,
            question: currentStep.question
        };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            jobDescriptions: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }
    const jd = user.jobDescriptions[0]?.content || "";
    const question = await generateBehavioralQuestion(user, jd);
    const attempt = await createVideoAttempt(userId, question);

    return {
        attemptId: attempt.id,
        question: question,
        currentStep: 1,
        totalSteps: attempt.totalSteps
    };
};

export const uploadVideoAndExtractAudio = async (userId, file) => {
    const timestamp = Date.now();
    const tempVideoPath = path.join(process.cwd(), `temp_video_${userId}_${timestamp}.webm`);
    const tempAudioPath = path.join(process.cwd(), `temp_audio_${userId}_${timestamp}.mp3`);
    try {
        fs.writeFileSync(tempVideoPath, file.buffer);
        const videoBlob = bucket.file(`videos/${userId}_${timestamp}.webm`);
        await videoBlob.save(file.buffer, {
            contentType: file.mimetype,
        });
        const videoUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${videoBlob.name}`;
        await extractAudio(tempVideoPath, tempAudioPath);

        const audioBlob = bucket.file(`audios/${userId}_${timestamp}.mp3`);
        await audioBlob.save(fs.readFileSync(tempAudioPath), {
            contentType: 'audio/mp3',
        });
        const audioUrl = `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${audioBlob.name}`;
        return { videoUrl, audioUrl };
    }
    finally {
        if (fs.existsSync(tempVideoPath)) {
            fs.unlinkSync(tempVideoPath);
        }
        if (fs.existsSync(tempAudioPath)) {
            fs.unlinkSync(tempAudioPath);
        }
    }
};

export const transcibeUploadedAudio = async (audioUrl) => {
    return transcribeAudio(audioUrl);
};

export const submitVideoAttempt = async (userId, attemptId, videoUrl, audioUrl) => {
    const attempt = await findVideoAttemptForUser(attemptId, userId);

    if (!attempt) {
        throw new Error('Video attempt not found');
    }

    if (attempt.completed) {
        throw new Error('Video attempt has already been submitted');
    }

    const currentStep = attempt.steps.find(step => step.stepNumber === attempt.currentStep);

    if (!currentStep) {
        throw new Error('Current interview step not found');
    }

    if (currentStep.completed) {
        throw new Error('Current step has already been completed');
    }

    const transcription = await transcribeAudio(audioUrl);

    const transcript = transcription?.text;

    if (!transcript?.trim()) {
        throw new Error('Could not create a transcript from the uploaded video');
    }

    const assessment = await assessAnswer(currentStep.question, transcript);

    if (typeof assessment?.score !== 'number' || typeof assessment?.feedback !== 'string') {
        throw new Error('Invalid video assessment response');
    }

    const score = Number(assessment.score);
    const relevance = Number(assessment.relevance ?? 0);
    const clarity = Number(assessment.clarity ?? 0);
    const confidence = Number(assessment.confidence ?? 0);

    const completedStepData = {
        videoUrl,
        audioUrl,
        transcript,
        score,
        relevance,
        clarity,
        confidence,
        feedback: assessment.feedback,
        completed: true
    };

    if (currentStep.stepNumber >= attempt.totalSteps) {
        const completedScores = attempt.steps
            .filter(step => step.completed && typeof step.score === 'number')
            .map(step => Number(step.score));

        completedScores.push(score);

        const finalScore = completedScores.reduce((sum, value) => sum + value, 0) / completedScores.length;

        await completeInterviewStep(attemptId, currentStep.stepNumber, completedStepData);

        await completeVideoAttempt(userId, attemptId, Number(finalScore.toFixed(2)));

        return {
            completed: true,
            currentStep: attempt.totalSteps,
            totalSteps: attempt.totalSteps,
            transcript,
            score,
            feedback: assessment.feedback,
            relevance,
            clarity,
            confidence,
            finalScore: Number(finalScore.toFixed(2))
        };
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            jobDescriptions: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    });

    if (!user) {
        throw new Error('User not found');
    }

    const jd = user.jobDescriptions[0]?.content || '';

    const interviewContext = {
        currentStep: currentStep.stepNumber,
        steps: [
            {
                ...currentStep,
                transcript,
                score,
                relevance,
                clarity,
                confidence,
                feedback: assessment.feedback,
                completed: true
            }
        ]
    };

    const nextStepNumber = currentStep.stepNumber + 1;

    const nextQuestion = await generateBehavioralQuestion(user, jd, interviewContext);

    if (typeof nextQuestion !== 'string' || !nextQuestion.trim()) {
        throw new Error('Failed to generate next interview question');
    }

    await completeInterviewStep(attemptId, currentStep.stepNumber, completedStepData);

    await createNextInterviewStep(attemptId, nextStepNumber, nextQuestion);

    await moveToNextStep(attemptId, nextStepNumber);

    return {
        completed: false,
        currentStep: nextStepNumber,
        totalSteps: attempt.totalSteps,
        previousStep: {
            stepNumber: currentStep.stepNumber,
            transcript,
            score,
            feedback: assessment.feedback,
            relevance,
            clarity,
            confidence
        },
        nextQuestion
    };
};