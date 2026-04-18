import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendTextWhatsAppMessageDto {
  @ApiPropertyOptional({
    example: 'ws_123',
    description: 'Optional workspace override. Server enforces auth workspace.',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @ApiProperty({
    example: '905551112233',
    description: 'Target WhatsApp number (digits only).',
  })
  @IsString()
  @Matches(/^\d+$/, {
    message: 'to must contain digits only, for example 905551112233',
  })
  to!: string;

  @ApiProperty({
    example: 'Merhaba, size nasıl yardımcı olabilirim?',
    minLength: 1,
    maxLength: 4096,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;
}
