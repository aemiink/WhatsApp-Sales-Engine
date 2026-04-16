import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { SendTextWhatsAppMessageDto } from '../dto/send-text-whatsapp-message.dto';
import { WhatsAppMessageSenderService } from '../services/whatsapp-message-sender.service';

@Controller('whatsapp/messages')
export class WhatsAppMessagesController {
  constructor(private readonly senderService: WhatsAppMessageSenderService) {}

  @Post('send')
  @HttpCode(200)
  async sendText(@Body() body: SendTextWhatsAppMessageDto) {
    return this.senderService.sendTextMessage(body);
  }
}
