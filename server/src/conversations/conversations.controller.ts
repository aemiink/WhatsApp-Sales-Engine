import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { DEFAULT_WORKSPACE_ID } from '../common/constants/workspace.constants';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ListConversationsQueryDto } from './dto/list-conversations-query.dto';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  async create(@Body() body: CreateConversationDto) {
    return this.conversationsService.createConversation(body);
  }

  @Get()
  async list(@Query() query: ListConversationsQueryDto) {
    const workspaceId = query.workspaceId ?? DEFAULT_WORKSPACE_ID;
    return this.conversationsService.listConversations(workspaceId);
  }

  @Get(':id')
  async detail(@Param('id') id: string) {
    const detail = await this.conversationsService.getConversationDetail(id);

    if (!detail) {
      throw new NotFoundException('Conversation not found');
    }

    return detail;
  }

  @Get('workspace/:workspaceId')
  async findWorkspaceConversations(@Param('workspaceId') workspaceId: string) {
    return this.conversationsService.getWorkspaceConversations(workspaceId);
  }
}
