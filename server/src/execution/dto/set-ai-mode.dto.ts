import { IsIn, IsString } from 'class-validator';

export const AI_MODES = ['auto_reply', 'suggest_only', 'paused'] as const;
export type AiModeValue = (typeof AI_MODES)[number];

export class SetAiModeDto {
  @IsString()
  @IsIn(AI_MODES)
  mode!: AiModeValue;
}
