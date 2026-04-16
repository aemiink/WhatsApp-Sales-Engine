import { IsOptional, IsString } from 'class-validator';

export class GetBrandContextQueryDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
