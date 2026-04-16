import { Module } from '@nestjs/common';
import { BrandContextModule } from '../brand-context/brand-context.module';
import { TrainingSettingsController } from './training-settings.controller';
import { TrainingSettingsService } from './training-settings.service';

@Module({
  imports: [BrandContextModule],
  controllers: [TrainingSettingsController],
  providers: [TrainingSettingsService],
  exports: [TrainingSettingsService],
})
export class TrainingSettingsModule {}
