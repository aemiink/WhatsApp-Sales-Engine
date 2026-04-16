import { AiDecisionInput } from '../types/ai-decision-input.types';

export interface SalesDecisionPromptPayload {
  systemPrompt: string;
  userPrompt: string;
}

export function buildSalesDecisionPrompt(
  input: AiDecisionInput,
): SalesDecisionPromptPayload {
  const systemPrompt = [
    'Sen satış odaklı bir WhatsApp müşteri temsilcisi decision engineisin.',
    'Sadece verilen bağlamı kullan, ürün/hizmet bilgisi uydurma.',
    'Marka tonu dışına çıkma, yasak cevapları ihlal etme.',
    'Gerekirse shouldHandoff=true dön ve güvenli bir suggestedReply yaz.',
    'Çıktın sadece geçerli JSON olmalı, markdown veya code block kullanma.',
    'Alanlar:',
    '{',
    '  "detectedIntent": string,',
    '  "leadStage": "new" | "qualified" | "hot" | "lost" | "support",',
    '  "objectionDetected": string | null,',
    '  "suggestedReply": string,',
    '  "shouldSendReply": boolean,',
    '  "shouldHandoff": boolean,',
    '  "nextBestAction": string | null,',
    '  "confidence": number (0 ile 1 arası)',
    '}',
    'Cevap dili Türkçe olmalı.',
  ].join('\n');

  const userPrompt = [
    'Aşağıdaki veriye göre structured satış kararı üret:',
    JSON.stringify(input, null, 2),
  ].join('\n\n');

  return {
    systemPrompt,
    userPrompt,
  };
}
