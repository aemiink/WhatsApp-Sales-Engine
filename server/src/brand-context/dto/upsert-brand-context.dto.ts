import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpsertBrandContextDto {
  @ApiPropertyOptional({
    example: 'friendly',
    description: 'Desired communication tone for replies.',
  })
  @IsOptional()
  @IsString()
  tone?: string;

  @ApiPropertyOptional({
    example: 'consultative',
    description: 'Preferred sales style hint.',
  })
  @IsOptional()
  @IsString()
  salesStyle?: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    description: 'Additional arbitrary context merged into Brand Context.',
  })
  @IsOptional()
  @IsObject()
  dataJson?: Record<string, unknown>;
}
