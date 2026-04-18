import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ManualSendMessageDto {
  @ApiProperty({
    minLength: 1,
    maxLength: 4096,
    example: 'Merhaba, size kampanya detaylarını paylaşabilirim.',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;
}
