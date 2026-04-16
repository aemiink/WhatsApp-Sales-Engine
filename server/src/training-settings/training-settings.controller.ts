import { Body, Controller, Get, Patch, Query } from '@nestjs/common';
import { GetTrainingSettingsQueryDto } from './dto/get-training-settings-query.dto';
import { UpdateTrainingSettingsDto } from './dto/update-training-settings.dto';
import { TrainingSettingsService } from './training-settings.service';

@Controller('training-settings')
export class TrainingSettingsController {
  constructor(
    private readonly trainingSettingsService: TrainingSettingsService,
  ) {}

  @Get()
  async getSettings(@Query() query: GetTrainingSettingsQueryDto) {
    return this.trainingSettingsService.getTrainingSettings(query.workspaceId);
  }

  @Patch()
  async updateSettings(@Body() body: UpdateTrainingSettingsDto) {
    return this.trainingSettingsService.updateTrainingSettings(body);
  }
}
