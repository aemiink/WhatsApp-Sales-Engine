import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class TrackAnalyticsEventDto {
  @ApiPropertyOptional({
    example: 'ws_123',
    description:
      'Optional workspace override. Server enforces authenticated workspace isolation.',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiPropertyOptional({
    example: 'conv_123',
    description: 'Related conversation identifier when available.',
  })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({
    example: 'message_received',
    description: 'Analytics event type.',
  })
  @IsString()
  type!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Event payload metadata.',
  })
  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;
}
