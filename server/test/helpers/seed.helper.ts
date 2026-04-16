export function createTestWorkspace(workspaceId = 'default-workspace') {
  return {
    id: workspaceId,
    name:
      workspaceId === 'default-workspace'
        ? 'Default Workspace'
        : `Workspace ${workspaceId}`,
  };
}

export function createBrandContextFixture(workspaceId = 'default-workspace') {
  return {
    workspaceId,
    tone: 'friendly',
    salesStyle: 'consultative',
    dataJson: {
      valueProps: ['Hızlı teslimat', 'Canlı destek'],
      targetAudience: 'SMB founders',
    },
  };
}

export function createConversationWithMessages(
  workspaceId = 'default-workspace',
) {
  return {
    conversation: {
      id: 'conv-seed-1',
      workspaceId,
      phoneNumber: '905551112233',
      leadStage: 'NEW',
      status: 'ACTIVE',
      aiMode: 'AUTO_REPLY',
    },
    messages: [
      {
        id: 'msg-seed-in-1',
        direction: 'INBOUND',
        senderType: 'USER',
        content: 'Merhaba, fiyat alabilir miyim?',
      },
      {
        id: 'msg-seed-out-1',
        direction: 'OUTBOUND',
        senderType: 'AI',
        content: 'Elbette, bütçenizi paylaşabilir misiniz?',
      },
    ],
  };
}

export function seedAutoReplyScenario(workspaceId = 'default-workspace') {
  return {
    workspace: createTestWorkspace(workspaceId),
    brandContext: createBrandContextFixture(workspaceId),
    conversationBundle: createConversationWithMessages(workspaceId),
  };
}
