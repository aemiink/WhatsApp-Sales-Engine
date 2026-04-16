import { IsOptional, IsString } from 'class-validator';

export class WhatsAppWebhookVerificationQueryDto {
  @IsOptional()
  @IsString()
  hubMode?: string;

  @IsOptional()
  @IsString()
  hubVerifyToken?: string;

  @IsOptional()
  @IsString()
  hubChallenge?: string;
}
