import { IsOptional, IsString } from 'class-validator';

export class GetTrainingSettingsQueryDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
