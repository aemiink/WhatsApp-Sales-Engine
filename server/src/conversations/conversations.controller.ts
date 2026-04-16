import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { RequestUser } from '../auth/interfaces/request-user.interface';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Roles('admin', 'agent')
  @Post()
  async create(
    @CurrentUser() user: RequestUser,
    @Body() body: CreateConversationDto,
  ) {
    return this.conversationsService.createConversation({
      workspaceId: user.workspaceId,
      phoneNumber: body.phoneNumber,
    });
  }

  @Get()
  async list(@CurrentUser() user: RequestUser) {
    return this.conversationsService.listConversations(user.workspaceId);
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
  async findWorkspaceConversations(
    @CurrentUser() user: RequestUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    if (workspaceId !== user.workspaceId) {
      throw new ForbiddenException('Workspace mismatch');
    }

    return this.conversationsService.getWorkspaceConversations(
      user.workspaceId,
    );
  }
}
