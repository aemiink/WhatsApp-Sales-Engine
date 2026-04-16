import { IsString } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  workspaceId!: string;

  @IsString()
  phoneNumber!: string;
}
