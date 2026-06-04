import { Module } from '@nestjs/common';
import { CodingController } from './coding.controller';
import { CodingService } from './coding.service';
import { CodingLLMService } from './llm.wrapper';

@Module({
  controllers: [CodingController],
  providers: [CodingService, CodingLLMService]
})
export class CodingModule {}
