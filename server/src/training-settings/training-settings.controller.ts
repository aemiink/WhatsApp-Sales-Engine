import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { UpdateTrainingSettingsDto } from './dto/update-training-settings.dto';
import { TrainingSettingsService } from './training-settings.service';

@Controller('training-settings')
export class TrainingSettingsController {
  constructor(
    private readonly trainingSettingsService: TrainingSettingsService,
  ) {}

  @Get()
  async getSettings(@CurrentUser() user: RequestUser) {
    return this.trainingSettingsService.getTrainingSettings(user.workspaceId);
  }

  @Roles('admin', 'agent')
  @Patch()
  async updateSettings(
    @CurrentUser() user: RequestUser,
    @Body() body: UpdateTrainingSettingsDto,
  ) {
    return this.trainingSettingsService.updateTrainingSettings({
      workspaceId: user.workspaceId,
      productsJson: body.productsJson,
      faqJson: body.faqJson,
      rulesJson: body.rulesJson,
      forbiddenResponsesJson: body.forbiddenResponsesJson,
      handoffRulesJson: body.handoffRulesJson,
    });
  }
}
