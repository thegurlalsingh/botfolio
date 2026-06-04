import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CodingLLMService } from './llm.wrapper';
import axios from 'axios';

@Injectable()
export class CodingService {
    constructor(private prisma: PrismaService, private codingLLMService: CodingLLMService) {}
    
    async startCodingRound(userId: string){
        const user = await this.prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        if(!user){
            console.log('User not found!');
            throw new NotFoundException('User not found');
        }

        console.log('User found!');
        let attempt = await this.prisma.codingAttempt.findFirst({
            where: {
                userId: userId, completed: false
            }
        });

        if(attempt) {
            console.log('Existing attempt found.');
            return attempt;
        }

        const generated = await this.codingLLMService.codingQuestionLLM(user);
        
        return this.prisma.codingAttempt.create({
            data: {
                userId, question: generated.question, testCases: generated.testCases, completed: false
            }
        });
    }

    async executeCode(script: string, language: string, versionIndex: string = '0', stdin: string = ''){
        try{
            const response = await axios.post('https://api.jdoodle.com/v1/execute', {
                clientId: process.env.JDOODLE_CLIENT_ID,
                clientSecret: process.env.JDOODLE_CLIENT_SECRET,
                script: script,
                language: language,
                versionIndex: versionIndex,
                stdin: stdin
            });

            return response.data;
        }
        catch (error){
            console.error("JDoodle API Error Data:", error?.response?.data);
            console.error("JDoodle API Status:", error?.response?.status);
            throw new InternalServerErrorException('Failed to execute code on Jdoodle');
        }
    }

    async submitCodingAnswer(userId: string, attemptId: string, code: string, language: string){
        const attempt = await this.prisma.codingAttempt.findFirst({
            where: {
                id: attemptId, userId
            }
        });

        if(!attempt){
            throw new NotFoundException('Attempt not found');
        }

        if(attempt.completed){
            new BadRequestException('Attempt already submitted');
        }
        const testCases = attempt.testCases as any[];

        let passedCount = 0;

        for(const tc of testCases){
            const result = await this.executeCode(code, language, '0', tc.input);
            if(result.output && result.output.trim() === tc.expectedOutput.trim()){
                passedCount++;
            }
        }

        const score = (passedCount / testCases.length) * 10;

        const assessment = await this.codingLLMService.assessLlm(attempt.question, code, language);

        await this.prisma.$transaction([
            this.prisma.codingAttempt.update({
                where: {
                    id: attemptId
                },
                data: {
                    code, language, score: score, feedback: assessment.feedback, completed: true
                }
            }),

            this.prisma.user.update({
                where: {id: userId},
                data: {codingScore: score, currentStep: 'completed'}
            })
        ]);

        return {
            success: true,
            message: 'code submitted successfully',
            testCasesPassed: `${passedCount} / ${testCases.length}`,
            score,
            feedback: assessment.feedback,
            timeComplexity: assessment.timeComplexity,
            spaceComplexity: assessment.spaceComplexity
        };
    }
}
