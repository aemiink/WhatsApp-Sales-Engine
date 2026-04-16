import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConversationsService } from '../../conversations/conversations.service';
import { MessagesService } from '../../conversations/messages.service';
import { DEFAULT_WORKSPACE_ID } from '../../common/constants/workspace.constants';
import { SendTextWhatsAppMessageDto } from '../dto/send-text-whatsapp-message.dto';
import { maskPhoneNumber } from '../utils/phone-mask.util';
import { WHATSAPP_PROVIDER_TOKEN } from '../providers/whatsapp-provider.interface';
import type {
  SendTextMessageResult,
  WhatsAppProvider,
} from '../providers/whatsapp-provider.interface';
import { WhatsAppConnectionService } from './whatsapp-connection.service';

@Injectable()
export class WhatsAppMessageSenderService {
  private readonly logger = new Logger(WhatsAppMessageSenderService.name);

  constructor(
    @Inject(WHATSAPP_PROVIDER_TOKEN)
    private readonly whatsappProvider: WhatsAppProvider,
    private readonly whatsappConnectionService: WhatsAppConnectionService,
    private readonly conversationsService: ConversationsService,
    private readonly messagesService: MessagesService,
  ) {}

  async sendTextMessage(
    input: SendTextWhatsAppMessageDto,
  ): Promise<SendTextMessageResult> {
    const resolvedConnection =
      await this.whatsappConnectionService.resolveConnection(input.workspaceId);

    const workspaceId =
      input.workspaceId ??
      resolvedConnection.workspaceId ??
      DEFAULT_WORKSPACE_ID;

    this.logger.log(
      `Outbound WhatsApp send requested to=${maskPhoneNumber(input.to)} workspace=${workspaceId}`,
    );

    const response = await this.whatsappProvider.sendTextMessage({
      to: input.to,
      text: input.text,
      workspaceId,
    });

    const conversation = await this.conversationsService.findOrCreateByPhone(
      workspaceId,
      input.to,
    );

    const externalMessageId = response.messages[0]?.id;

    await this.messagesService.createOutboundMessage({
      conversationId: conversation.id,
      externalMessageId,
      content: input.text,
      rawPayload: response.rawResponse,
      timestamp: new Date(),
    });

    this.logger.log(
      `Outbound WhatsApp send succeeded to=${maskPhoneNumber(input.to)} idCount=${response.messages.length}`,
    );

    return response;
  }
}
