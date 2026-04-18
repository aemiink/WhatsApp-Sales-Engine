import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MessageStatusService } from './message-status.service';
import { MessagesService } from './messages.service';
import { ExportController } from './controllers/export.controller';

@Module({
  controllers: [ExportController, ConversationsController],
  providers: [ConversationsService, MessagesService, MessageStatusService],
  exports: [ConversationsService, MessagesService, MessageStatusService],
})
export class ConversationsModule {}
