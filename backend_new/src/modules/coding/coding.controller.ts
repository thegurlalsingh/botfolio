import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CodingService } from './coding.service';

@Controller('api/coding')
@UseGuards(JwtAuthGuard)
export class CodingController {
    constructor(private readonly codingService: CodingService) {}

    @Get('start')
    async start(@Req() req){
        return this.codingService.startCodingRound(req.user.id);
    }

    @Post('run')
    async runCode(@Body() body: {script: string, language: string, versionIndex: string, stdin: string}){
        return this.codingService.executeCode(body.script, body.language, body.versionIndex, body.stdin);
    }

    @Post('submit')
    async submit(@Req() req, @Body() body: {attemptId: string, code: string, language: string}){
        this.codingService.submitCodingAnswer(req.user.id, body.attemptId, body.code, body.language);
    }
}
