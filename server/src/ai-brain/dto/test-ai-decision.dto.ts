import { IsIn, IsOptional, IsString } from 'class-validator';
import type { AiProviderName } from '../../ai/interfaces/ai-provider.interface';

const PROVIDERS: AiProviderName[] = ['gemini', 'openai'];

export class TestAiDecisionDto {
  @IsString()
  conversationId!: string;

  @IsString()
  messageId!: string;

  @IsOptional()
  @IsString()
  @IsIn(PROVIDERS)
  provider?: AiProviderName;
}
