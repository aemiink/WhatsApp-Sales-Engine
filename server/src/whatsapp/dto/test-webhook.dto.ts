import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class TestWebhookDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Raw WhatsApp webhook payload to test parser + execution flow.',
  })
  @IsObject()
  @IsNotEmpty()
  payload!: Record<string, unknown>;
}
