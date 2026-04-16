import { IsOptional, IsString } from 'class-validator';

export class GetAnalyticsQueryDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
