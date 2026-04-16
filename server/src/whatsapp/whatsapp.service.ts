import { Inject, Injectable } from '@nestjs/common';
import { SendWhatsAppMessageDto } from './dto/send-whatsapp-message.dto';
import { WHATSAPP_PROVIDER_TOKEN } from './providers/whatsapp-provider.interface';
import type { WhatsAppProvider } from './providers/whatsapp-provider.interface';

@Injectable()
export class WhatsappService {
  constructor(
    @Inject(WHATSAPP_PROVIDER_TOKEN)
    private readonly whatsappProvider: WhatsAppProvider,
  ) {}

  async sendMessage(input: SendWhatsAppMessageDto): Promise<unknown> {
    return this.whatsappProvider.sendMessage(input);
  }
}
