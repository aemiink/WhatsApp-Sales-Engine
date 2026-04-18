import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

export const AI_MODES = ['auto_reply', 'suggest_only', 'paused'] as const;
export type AiModeValue = (typeof AI_MODES)[number];

export class SetAiModeDto {
  @ApiProperty({
    enum: AI_MODES,
    example: 'auto_reply',
    description: 'Conversation AI mode.',
  })
  @IsString()
  @IsIn(AI_MODES)
  mode!: AiModeValue;
}
