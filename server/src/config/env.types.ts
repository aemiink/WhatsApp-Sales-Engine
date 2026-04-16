export const AI_DEFAULT_PROVIDERS = ['gemini', 'openai'] as const;

export type AiDefaultProvider = (typeof AI_DEFAULT_PROVIDERS)[number];

export interface EnvironmentVariables {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  DATABASE_URL: string;
  DIRECT_URL: string;
  AI_DEFAULT_PROVIDER: AiDefaultProvider;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  WHATSAPP_ACCESS_TOKEN: string;
  WHATSAPP_PHONE_NUMBER_ID: string;
  WHATSAPP_BUSINESS_ACCOUNT_ID?: string;
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: string;
  META_GRAPH_API_VERSION: string;
}
