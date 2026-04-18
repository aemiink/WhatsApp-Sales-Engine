import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Public } from '../../auth/decorators/public.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import type { RequestUser } from '../../auth/interfaces/request-user.interface';
import { TestWebhookDto } from '../dto/test-webhook.dto';
import { WhatsAppWebhookVerificationQueryDto } from '../dto/webhook-verification-query.dto';
import { WhatsAppWebhookService } from '../services/whatsapp-webhook.service';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('whatsapp-webhook')
@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  constructor(private readonly webhookService: WhatsAppWebhookService) {}

  @Public()
  @Get()
  verifyWebhook(
    @Query('hub.mode') hubMode: string | undefined,
    @Query('hub.verify_token') hubVerifyToken: string | undefined,
    @Query('hub.challenge') hubChallenge: string | undefined,
    @Res() response: Response,
  ): void {
    const challenge = this.webhookService.verifyWebhook({
      hubMode,
      hubVerifyToken,
      hubChallenge,
    } as WhatsAppWebhookVerificationQueryDto);

    response.status(200).send(challenge);
  }

  @Public()
  @Post()
  @HttpCode(200)
  ingestWebhook(
    @Body() payload: unknown,
    @Headers('x-hub-signature-256') signatureHeader: string | undefined,
    @Req() request: RawBodyRequest,
  ) {
    return this.webhookService.ingestWebhook(payload, {
      signatureHeader,
      rawBody: request.rawBody,
    });
  }

  @Roles('admin')
  @Post('test')
  @HttpCode(200)
  @ApiBearerAuth('bearer')
  testWebhook(@CurrentUser() user: RequestUser, @Body() body: TestWebhookDto) {
    return this.webhookService.testWebhookForWorkspace(
      user.workspaceId,
      body.payload,
    );
  }
}
