import { Module } from '@nestjs/common';
import { SalesEngineController } from './sales-engine.controller';
import { SalesEngineService } from './sales-engine.service';

@Module({
  controllers: [SalesEngineController],
  providers: [SalesEngineService],
  exports: [SalesEngineService],
})
export class SalesEngineModule {}
