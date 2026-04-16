import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SendTextWhatsAppMessageDto {
  @IsOptional()
  @IsString()
  workspaceId?: string;

  @IsString()
  @Matches(/^\d+$/, {
    message: 'to must contain digits only, for example 905551112233',
  })
  to!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4096)
  text!: string;
}
