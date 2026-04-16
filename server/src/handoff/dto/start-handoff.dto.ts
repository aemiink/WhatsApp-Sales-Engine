import { IsString } from 'class-validator';

export class StartHandoffDto {
  @IsString()
  conversationId!: string;
}
