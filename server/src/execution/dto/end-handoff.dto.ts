import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { AI_MODES } from './set-ai-mode.dto';
import type { AiModeValue } from './set-ai-mode.dto';

export class EndHandoffExecutionDto {
  @ApiPropertyOptional({
    enum: AI_MODES,
    example: 'suggest_only',
    description:
      'Optional mode to apply after ending handoff. Defaults to previous conversation mode.',
  })
  @IsOptional()
  @IsString()
  @IsIn(AI_MODES)
  resumeMode?: AiModeValue;
}
