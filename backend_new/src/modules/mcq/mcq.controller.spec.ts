import { Test, TestingModule } from '@nestjs/testing';
import { McqController } from './mcq.controller';

describe('McqController', () => {
  let controller: McqController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [McqController],
    }).compile();

    controller = module.get<McqController>(McqController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
