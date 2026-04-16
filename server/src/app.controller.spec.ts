import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
process.env.DIRECT_URL ??=
  'postgresql://postgres:postgres@localhost:5432/whatsapp_sales_engine?schema=public';
process.env.AI_DEFAULT_PROVIDER ??= 'gemini';
process.env.GEMINI_API_KEY ??= 'test-gemini-key';
process.env.WHATSAPP_ACCESS_TOKEN ??= 'test-wa-access-token';
process.env.WHATSAPP_PHONE_NUMBER_ID ??= '123456789';
process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ??= 'test-webhook-token';
process.env.META_GRAPH_API_VERSION ??= 'v21.0';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getHealth', () => {
    it('should return application health', () => {
      expect(appController.getHealth()).toEqual({
        service: 'whatsapp-sales-engine-backend',
        status: 'ok',
      });
    });
  });
});
