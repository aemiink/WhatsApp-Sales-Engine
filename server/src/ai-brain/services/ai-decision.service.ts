import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiProviderName } from '../../ai/interfaces/ai-provider.interface';
import { AiProviderFactoryService } from '../../ai/services/ai-provider-factory.service';
import { AppConfigService } from '../../config/app-config.service';
import { buildSalesDecisionPrompt } from '../prompts/sales-decision.prompt';
import { SalesAiDecision } from '../schemas/sales-ai-decision.schema';
import { TestAiDecisionDto } from '../dto/test-ai-decision.dto';
import { AiContextAssemblerService } from './ai-context-assembler.service';
import { AiDecisionValidatorService } from './ai-decision-validator.service';

@Injectable()
export class AiDecisionService {
  private readonly logger = new Logger(AiDecisionService.name);

  constructor(
    private readonly aiProviderFactoryService: AiProviderFactoryService,
    private readonly aiContextAssemblerService: AiContextAssemblerService,
    private readonly aiDecisionValidatorService: AiDecisionValidatorService,
    private readonly appConfigService: AppConfigService,
  ) {}

  async generateDecision(input: TestAiDecisionDto): Promise<SalesAiDecision> {
    const assembledInput =
      await this.aiContextAssemblerService.assembleFromMessage(
        input.conversationId,
        input.messageId,
      );
    const prompt = buildSalesDecisionPrompt(assembledInput);

    const providers = this.aiProviderFactoryService.getExecutionOrder(
      input.provider,
    );
    if (providers.length === 0) {
      throw new ServiceUnavailableException('No configured AI provider found.');
    }

    let lastError: unknown = null;
    let lastProviderName: AiProviderName | null = null;
    let totalAttempts = 0;

    for (const provider of providers) {
      const maxAttempts = this.appConfigService.aiMaxRetries + 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        totalAttempts += 1;
        lastProviderName = provider.name;

        try {
          this.logger.log(
            `AI decision requested provider=${provider.name} attempt=${attempt}/${maxAttempts}`,
          );

          const rawDecision = await provider.generateSalesDecision({
            systemPrompt: prompt.systemPrompt,
            userPrompt: prompt.userPrompt,
            timeoutMs: this.appConfigService.aiTimeoutMs,
            temperature: 0.2,
          });
          const validated =
            this.aiDecisionValidatorService.validate(rawDecision);

          this.logger.log(
            `AI decision generated provider=${provider.name} attempts=${totalAttempts}`,
          );
          return validated;
        } catch (error: unknown) {
          lastError = error;
          this.logger.warn(
            `AI decision attempt failed provider=${provider.name} attempt=${attempt}/${maxAttempts}`,
          );
        }
      }
    }

    const reason =
      lastError instanceof Error
        ? lastError.message
        : 'Unknown AI provider error';
    throw new ServiceUnavailableException(
      `Failed to generate AI decision after ${totalAttempts} attempt(s) using provider ${lastProviderName ?? 'unknown'}: ${reason}`,
    );
  }
}
