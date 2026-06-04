import { Controller, Post, UploadedFile, UseGuards, UseInterceptors, Req } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { JwtAuthGuard } from 'src/modules/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/resume')
export class ResumeController {
    constructor(private readonly resumeService: ResumeService) {}

    @Post('upload')
    @UseGuards(JwtAuthGuard)
    @UseInterceptors(FileInterceptor('resume', {
        limits: {fileSize: 10 * 1024 * 1024},
        fileFilter: (req, file, cb) => {
            if(file.mimetype === 'application/pdf') cb(null, true);
            else cb(new Error('Only PDF files allowed!!!'), false);
        },
    }))

    async uploadResume(@UploadedFile() file: Express.Multer.File, @Req() req){
        const userId = req.user.id;
        return this.resumeService.processResume(file, userId);
    }
}
