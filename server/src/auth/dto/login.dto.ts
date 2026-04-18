import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'agent@workspace.com',
    description: 'User e-mail for authentication.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    minLength: 8,
    example: 'StrongPassword123!',
    description: 'User password.',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: 'ws_123',
    description:
      'Optional workspace override for users with multiple memberships.',
  })
  @IsOptional()
  @IsString()
  workspaceId?: string;
}
