import { IsObject, IsOptional, IsString } from 'class-validator';

export class TrackAnalyticsEventDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsOptional()
  @IsString()
  conversationId?: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;
}
