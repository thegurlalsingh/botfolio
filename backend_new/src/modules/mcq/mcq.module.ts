import { Module } from '@nestjs/common';
import { McqController } from './mcq.controller';
import { McqService } from './mcq.service';
import { LlmModule } from '../llm/llm.module';
import { mcqLLMService } from './llm.wrapper';

@Module({
  imports: [LlmModule],
  controllers: [McqController],
  providers: [McqService, mcqLLMService]
})
export class McqModule {}
