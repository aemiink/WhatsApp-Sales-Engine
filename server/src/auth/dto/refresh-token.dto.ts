import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Valid refresh token returned from login/refresh endpoints.',
    minLength: 20,
  })
  @IsString()
  @MinLength(20)
  refreshToken!: string;
}
