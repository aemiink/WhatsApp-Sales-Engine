import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class StartHandoffExecutionDto {
  @ApiPropertyOptional({
    maxLength: 200,
    example: 'Customer requested human agent support.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
