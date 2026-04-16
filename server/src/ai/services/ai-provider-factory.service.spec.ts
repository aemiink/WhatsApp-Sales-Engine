import { AiProviderFactoryService } from './ai-provider-factory.service';

describe('AiProviderFactoryService', () => {
  it('returns primary and fallback providers when both keys are configured', () => {
    const factory = new AiProviderFactoryService(
      {
        aiDefaultProvider: 'gemini',
        geminiApiKey: 'gemini-key',
        openAiApiKey: 'openai-key',
      } as never,
      { name: 'gemini' } as never,
      { name: 'openai' } as never,
    );

    const providers = factory.getExecutionOrder();

    expect(providers.map((provider) => provider.name)).toEqual([
      'gemini',
      'openai',
    ]);
  });

  it('returns only primary provider when fallback key is missing', () => {
    const factory = new AiProviderFactoryService(
      {
        aiDefaultProvider: 'gemini',
        geminiApiKey: 'gemini-key',
        openAiApiKey: undefined,
      } as never,
      { name: 'gemini' } as never,
      { name: 'openai' } as never,
    );

    const providers = factory.getExecutionOrder();

    expect(providers.map((provider) => provider.name)).toEqual(['gemini']);
  });

  it('supports explicit provider selection', () => {
    const factory = new AiProviderFactoryService(
      {
        aiDefaultProvider: 'gemini',
        geminiApiKey: 'gemini-key',
        openAiApiKey: 'openai-key',
      } as never,
      { name: 'gemini' } as never,
      { name: 'openai' } as never,
    );

    const providers = factory.getExecutionOrder('openai');

    expect(providers.map((provider) => provider.name)).toEqual([
      'openai',
      'gemini',
    ]);
  });
});
