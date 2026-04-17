import { Injectable, Logger } from '@nestjs/common';

const typingSessions = new Map<string, { conversationId: string; userId: string; startedAt: number }>();

@Injectable()
export class TypingService {
  private readonly logger = new Logger(TypingService.name);

  startTyping(conversationId: string, userId: string) {
    const key = `${conversationId}:${userId}`;
    typingSessions.set(key, {
      conversationId,
      userId,
      startedAt: Date.now(),
    });

    setTimeout(() => {
      typingSessions.delete(key);
    }, 5000);
  }

  stopTyping(conversationId: string, userId: string) {
    const key = `${conversationId}:${userId}`;
    typingSessions.delete(key);
  }

  isTyping(conversationId: string): string[] {
    const typingUsers: string[] = [];
    for (const [, session] of typingSessions.entries()) {
      if (session.conversationId === conversationId) {
        typingUsers.push(session.userId);
      }
    }
    return typingUsers;
  }

  broadcastTyping(conversationId: string, userId: string) {
    this.startTyping(conversationId, userId);
  }
}