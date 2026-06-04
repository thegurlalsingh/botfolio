import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { videoLLMService } from './llm.wrapper';

@Module({
  controllers: [VideoController],
  providers: [VideoService, videoLLMService]
})
export class VideoModule {}
