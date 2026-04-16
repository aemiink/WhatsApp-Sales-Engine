import { Inject, Injectable, Logger } from '@nestjs/common';
import { SendTextWhatsAppMessageDto } from '../dto/send-text-whatsapp-message.dto';
import { maskPhoneNumber } from '../utils/phone-mask.util';
import { WHATSAPP_PROVIDER_TOKEN } from '../providers/whatsapp-provider.interface';
import type {
  SendTextMessageResult,
  WhatsAppProvider,
} from '../providers/whatsapp-provider.interface';

@Injectable()
export class WhatsAppMessageSenderService {
  private readonly logger = new Logger(WhatsAppMessageSenderService.name);

  constructor(
    @Inject(WHATSAPP_PROVIDER_TOKEN)
    private readonly whatsappProvider: WhatsAppProvider,
  ) {}

  async sendTextMessage(
    input: SendTextWhatsAppMessageDto,
  ): Promise<SendTextMessageResult> {
    this.logger.log(
      `Outbound WhatsApp send requested to=${maskPhoneNumber(input.to)} workspace=${input.workspaceId ?? 'global'}`,
    );

    const response = await this.whatsappProvider.sendTextMessage({
      to: input.to,
      text: input.text,
      workspaceId: input.workspaceId,
    });

    this.logger.log(
      `Outbound WhatsApp send succeeded to=${maskPhoneNumber(input.to)} idCount=${response.messages.length}`,
    );

    return response;
  }
}
