import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    example: '+905551112233',
    description: 'WhatsApp customer phone number in E.164 format.',
  })
  @IsString()
  phoneNumber!: string;
}
