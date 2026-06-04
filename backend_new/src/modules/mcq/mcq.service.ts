import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundError } from 'rxjs';
import { mcqLLMService } from './llm.wrapper';

@Injectable()
export class McqService {
    constructor(
        private prisma: PrismaService,
        private llmService: mcqLLMService
    ){}

    async getAttempt(userId : string){
        let attempt = await this.prisma.mcqAttempt.findFirst({
            where: {userId, completed: false}
        });

        if(attempt){
            console.log("Existing attempt found!! Continuing....");
            return attempt;
        }

        const user = await this.prisma.user.findUnique({
            where: {id: userId}
        });

        const finishedAttempt = await this.prisma.mcqAttempt.findFirst({
            where: {userId, completed: true}
        })

        if(!user){
            throw new NotFoundException('User not found in database!!');
        }

        if(finishedAttempt){
            throw new ForbiddenException("You have been already completed your assesment.");
        }

        console.log("User found and creating new attempt.");

        const questions = await this.llmService.mcqLLM(user);

        return this.prisma.mcqAttempt.create({
            data: {
                userId, 
                questions
            }
        });
    }


    async submitAttempt(userId: string, attemptId: string, answers: string[]){
        const attempt = await this.prisma.mcqAttempt.findUnique({
            where: {
                id: attemptId
            }
        });

        if(!attempt || attempt.userId !== userId){
            throw new NotFoundException('Attempt not found');
        }

        if (attempt.completed) {
            throw new ForbiddenException('This MCQ attempt has already been submitted.');
        }

        const questions = attempt.questions as any[];
        let score = 0;
        answers.forEach((ans, index) => {
            if(ans === questions[index]?.correct){
                score++;
            }
        })

        await this.prisma.$transaction([
            this.prisma.mcqAttempt.update({
                where: {
                    id: attemptId
                }, 
                data: {
                    answers, score, completed: true
                },
            }),
            this.prisma.user.update({
                where: {
                    id: userId
                },
                data: {
                    currentStep: 'video',
                    mcqScore: score
                }
            })
        ]);
        
        return { score, total: questions.length };

    }
    
}
