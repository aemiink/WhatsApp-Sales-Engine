import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { RequestUser } from '../../auth/interfaces/request-user.interface';
import { SendTextWhatsAppMessageDto } from '../dto/send-text-whatsapp-message.dto';
import { WhatsAppMessageSenderService } from '../services/whatsapp-message-sender.service';

@ApiTags('whatsapp-messages')
@ApiBearerAuth('bearer')
@Controller('whatsapp/messages')
export class WhatsAppMessagesController {
  constructor(private readonly senderService: WhatsAppMessageSenderService) {}

  @Roles('admin', 'agent')
  @Post('send')
  @HttpCode(200)
  async sendText(
    @CurrentUser() user: RequestUser,
    @Body() body: SendTextWhatsAppMessageDto,
  ) {
    return this.senderService.sendTextMessage({
      workspaceId: user.workspaceId,
      to: body.to,
      text: body.text,
    });
  }
}
