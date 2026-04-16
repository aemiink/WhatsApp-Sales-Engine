import { IsString } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  phoneNumber!: string;
}
