import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiDefaultProvider, EnvironmentVariables } from './env.types';

@Injectable()
export class AppConfigService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  get nodeEnv(): EnvironmentVariables['NODE_ENV'] {
    return this.configService.getOrThrow('NODE_ENV');
  }

  get port(): number {
    return this.configService.getOrThrow<number>('PORT');
  }

  get databaseUrl(): string {
    return this.configService.getOrThrow<string>('DATABASE_URL');
  }

  get directUrl(): string {
    return this.configService.getOrThrow<string>('DIRECT_URL');
  }

  get aiDefaultProvider(): AiDefaultProvider {
    return this.configService.getOrThrow<AiDefaultProvider>(
      'AI_DEFAULT_PROVIDER',
    );
  }

  get geminiApiKey(): string | undefined {
    const value = this.configService.get<string>('GEMINI_API_KEY');
    return value && value.length > 0 ? value : undefined;
  }

  get openAiApiKey(): string | undefined {
    const value = this.configService.get<string>('OPENAI_API_KEY');
    return value && value.length > 0 ? value : undefined;
  }

  get whatsappAccessToken(): string {
    return this.configService.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN');
  }

  get whatsappPhoneNumberId(): string {
    return this.configService.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
  }

  get whatsappBusinessAccountId(): string | undefined {
    const value = this.configService.get<string>(
      'WHATSAPP_BUSINESS_ACCOUNT_ID',
    );
    return value && value.length > 0 ? value : undefined;
  }

  get whatsappWebhookVerifyToken(): string {
    return this.configService.getOrThrow<string>(
      'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
    );
  }

  get metaGraphApiVersion(): string {
    return this.configService.getOrThrow<string>('META_GRAPH_API_VERSION');
  }
}
