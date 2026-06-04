import { Module } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { ResumeController } from './resume.controller';
import { LlmModule } from '../llm/llm.module';
import { resumeLLMService } from './llm.wrapper';

@Module({
  imports: [LlmModule],
  providers: [ResumeService, resumeLLMService],
  controllers: [ResumeController]
})
export class ResumeModule {}
