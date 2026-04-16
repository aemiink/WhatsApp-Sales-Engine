import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppConfigService } from './config/app-config.service';

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
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-value';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-value';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: AppConfigService,
          useValue: {
            appVersion: '0.0.1',
          },
        },
      ],
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

  describe('getVersion', () => {
    it('should return application version', () => {
      expect(appController.getVersion()).toEqual({
        service: 'whatsapp-sales-engine-backend',
        version: '0.0.1',
      });
    });
  });
});
