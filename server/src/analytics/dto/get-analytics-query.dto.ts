import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetAnalyticsQueryDto {
  @ApiPropertyOptional({
    example: 'ws_123',
    description:
      'Optional workspace filter. Must match authenticated workspace.',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
