import { Storage } from '@google-cloud/storage';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import speech from '@google-cloud/speech';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { videoLLMService } from './llm.wrapper';

@Injectable()
export class VideoService {
    private storage = new Storage({ keyFilename: process.env.GCP_KEY_FILE });

    private speechClient = new speech.SpeechClient({ keyFilename: process.env.GCP_KEY_FILE });

    private bucket = this.storage.bucket(process.env.GCP_BUCKET!);

    constructor( private prisma: PrismaService, private llmService: videoLLMService ) { }

    async startVideoRound(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                videoAttempts: true,
            },
        });

        if (!user) {
            throw new NotFoundException(
                'User not found',
            );
        }

        console.log('Checking existing attempt.');

        const existing = await this.prisma.videoAttempt.findFirst({
            where: {
                userId,
                completed: false,
            },
        });

        if (existing) {
            console.log(
                'Existing attempt found. Returning existing attempt.',
            );
            return existing;
        }

        const question = await this.llmService.videoQuestionLLM(
            user,
        );

        console.log('Question generated successfully.');

        await this.prisma.user.update({
            where: {
                id: userId
            },
            data: {
                currentStep: 'coding',
            }
        })
        return await this.prisma.videoAttempt.create({
            data: {
                userId,
                question: question as any,
                completed: false,
            },
        });
    }

    async processVideoResponse(
        file: Express.Multer.File,
        userId: string,
        attemptId: string,
    ) {
        const timeStamp = Date.now();

        const tempVideo = path.join(
            process.cwd(),
            `temp_video_${userId}_${timeStamp}.webm`,
        );

        const tempAudio = path.join(
            process.cwd(),
            `temp_audio_${userId}_${timeStamp}.mp3`,
        );

        try {
            console.log('Saving temp video.');

            fs.writeFileSync(tempVideo, file.buffer);

            console.log('Uploading video.');

            const videoUrl = await this.uploadFile(
                file.buffer,
                `videos/${userId}_${timeStamp}.webm`,
                file.mimetype,
            );

            console.log(
                'Successfully saved and uploaded video.',
            );

            console.log('Extracting audio.');

            await this.extractAudio(tempVideo, tempAudio);

            console.log('Uploading audio.');

            const audioBuffer = fs.readFileSync(tempAudio);

            const audioUrl = await this.uploadFile(
                audioBuffer,
                `audios/${userId}_${timeStamp}.mp3`,
                'audio/mpeg',
            );

            console.log(
                'Successfully extracted and uploaded audio.',
            );

            console.log('Starting transcription.');

            const transcript = await this.transcribe(audioUrl);

            console.log(
                'Audio transcribed successfully.',
            );

            const attempt =
                await this.prisma.videoAttempt.findUnique({
                    where: {
                        id: attemptId,
                    },
                });

            if (!attempt) {
                throw new InternalServerErrorException(
                    'Video attempt not found',
                );
            }

            console.log('Assessing answer.');

            const assessment =
                await this.assessAnswer(
                    attempt.question as string,
                    transcript,
                );

            console.log(
                'Answer assessed successfully.',
            );

            await this.prisma.videoAttempt.update({
                where: {
                    id: attemptId,
                },
                data: {
                    videoUrl,
                    audioUrl,
                    transcript,                  score: assessment.score,
                    feedback: assessment.feedback,
                   completed: true,
                },
            });

            return {
                success: true,
                transcript,
                score: assessment.score,
                feedback: assessment.feedback,
                confidence: assessment.confidence,
                relevance: assessment.relevance,
                clarity: assessment.clarity,
            };
        } catch (error) {
            console.error(
                'Video processing error:',
                error,
            );

            throw new InternalServerErrorException(
                'Failed to process video response',
            );
        } finally {
            [tempVideo, tempAudio].forEach((filePath) => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });
        }
    }

    private async extractAudio(
        videoPath: string,
        audioPath: string,
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const script = path.join(
                process.cwd(),
                'src',
                'modules',
                'video',
                'video_to_audio.py',
            );

            const py = spawn('python3', [
                script,
                videoPath,
                audioPath,
            ]);

            let error = '';

            py.stderr.on('data', (chunk) => {
                error += chunk.toString();
            });

            py.on('close', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(
                        new Error(
                            `Audio extraction failed: ${error}`,
                        ),
                    );
                }
            });
        });
    }

    private async transcribe(
        audioUrl: string,
    ): Promise<string> {
        const gcsUri = audioUrl.replace(
            'https://storage.googleapis.com/',
            'gs://',
        );

        const [response] =
            await this.speechClient.recognize({
                audio: {
                    uri: gcsUri,
                },
                config: {
                    encoding: 'MP3',
                    sampleRateHertz: 16000,
                    languageCode: 'en-US',
                    enableAutomaticPunctuation: true,
                },
            });

        return (
            response.results
                ?.map(
                    (r) =>
                        r.alternatives?.[0]?.transcript || '',
                )
                .join(' ') || ''
        );
    }

    private async assessAnswer(
        question: string,
        transcript: string,
    ) {
        return await this.llmService.assessLlm(
            question,
            transcript,
        );
    }

    private async uploadFile(
        buffer: Buffer,
        destination: string,
        contentType: string,
    ): Promise<string> {
        const blob = this.bucket.file(destination);

        await blob.save(buffer, {
            contentType,
            resumable: false,
        });

        return `https://storage.googleapis.com/${process.env.GCP_BUCKET}/${destination}`;
    }
}