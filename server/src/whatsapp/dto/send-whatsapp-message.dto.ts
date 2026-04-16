import { IsString } from 'class-validator';

export class SendWhatsAppMessageDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  phoneNumber!: string;

  @IsString()
  content!: string;
}
