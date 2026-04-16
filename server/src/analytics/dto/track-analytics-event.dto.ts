import { IsObject, IsOptional, IsString } from 'class-validator';

export class TrackAnalyticsEventDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  type!: string;

  @IsOptional()
  @IsObject()
  payloadJson?: Record<string, unknown>;
}
