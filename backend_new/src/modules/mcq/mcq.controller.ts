import { Controller, Req, UseGuards, Get, Post, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { McqService } from './mcq.service';

@Controller('api/mcq')
@UseGuards(JwtAuthGuard)
export class McqController {
    constructor(private readonly mcqService : McqService) {}
    @Get('start')
    async start(@Req() req){
        return this.mcqService.getAttempt(req.user.id);
    }

    @Post('submit')
    async submit(@Req() req, @Body() body : {attemptId: string, answers: string[]}) {
        return this.mcqService.submitAttempt(req.user.id, body.attemptId, body.answers);
    }
}
