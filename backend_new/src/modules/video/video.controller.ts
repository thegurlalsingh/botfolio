import { BadRequestException, Body, Controller, Get, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { VideoService } from './video.service';
import { get } from 'http';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/video')
@UseGuards(JwtAuthGuard)
export class VideoController {
    constructor(private readonly videoService : VideoService) {}

    @Get('start')
    async startVideoRound(@Req() req){
        const userId = req.user.id;
        return this.videoService.startVideoRound(userId);
    }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('video', {
        limits: {
            fileSize: 100 * 1024 * 1024, // 100MB max limit
        },
        fileFilter: (req, file, callback) => {
            if (!file.mimetype.startsWith('video/')) {
                return callback(
                    new BadRequestException('Only video files are allowed!'),
                    false,
                );
            }
            callback(null, true);
        },
        }),
    )

    async submitVideo(
        @UploadedFile() file: Express.Multer.File,
        @Req() req,
        @Body('attemptId') attemptId: string
    ) {
        if(!file){
            throw new BadRequestException('No video file uploaded');
        }
        if(!attemptId){
            throw new BadRequestException('No attempId found!');
        }
        const userId = req.user.id;
        return this.videoService.processVideoResponse(file, userId, attemptId);
    }


}
