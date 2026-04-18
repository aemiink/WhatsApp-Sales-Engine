import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListConversationsQueryDto {
  @ApiPropertyOptional({
    description:
      'Optional workspace filter. Must match the authenticated workspace.',
    example: 'ws_123',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
