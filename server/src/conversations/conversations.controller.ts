import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(@Body() body: CreateConversationDto) {
    return this.conversationsService.createConversation(body);
  }

  @Get('workspace/:workspaceId')
  async findWorkspaceConversations(@Param('workspaceId') workspaceId: string) {
    return this.conversationsService.getWorkspaceConversations(workspaceId);
  }
}
