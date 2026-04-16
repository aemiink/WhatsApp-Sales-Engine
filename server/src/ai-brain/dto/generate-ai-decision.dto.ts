import { IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateAiDecisionDto {
  @IsString()
  conversationId!: string;

  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}
