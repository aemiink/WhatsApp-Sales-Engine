import { IsIn, IsOptional, IsString } from 'class-validator';
import { AI_MODES } from './set-ai-mode.dto';
import type { AiModeValue } from './set-ai-mode.dto';

export class EndHandoffExecutionDto {
  @IsOptional()
  @IsString()
  @IsIn(AI_MODES)
  resumeMode?: AiModeValue;
}
