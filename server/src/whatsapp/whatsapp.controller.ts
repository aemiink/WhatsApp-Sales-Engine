import { Body, Controller, Post } from '@nestjs/common';
import { SendWhatsAppMessageDto } from './dto/send-whatsapp-message.dto';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('messages')
  async sendMessage(@Body() body: SendWhatsAppMessageDto): Promise<unknown> {
    return this.whatsappService.sendMessage(body);
  }
}
