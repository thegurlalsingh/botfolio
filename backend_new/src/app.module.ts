import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthService } from './modules/auth/auth.service';
import { AuthModule } from './modules/auth/auth.module';
import { JwtStrategy } from './modules/auth/jwt.strategy';
import { ResumeModule } from './modules/resume/resume.module';
import { LlmModule } from './modules/llm/llm.module';
import { McqModule } from './modules/mcq/mcq.module';
import { VideoModule } from './modules/video/video.module';
import { CodingModule } from './modules/coding/coding.module';

@Module({
  imports: [AuthModule, PrismaModule, ResumeModule, LlmModule, McqModule, VideoModule, CodingModule],
  controllers: [AppController],
  providers: [AppService, JwtStrategy],
})
export class AppModule {}
