import { getSystemPromptForUser } from './systemPromptService';
import { loadAineistoContext } from './aineistoLoader';

export interface ChatSession {
  sessionId: string;
  systemPrompt: string;
  fullContext: string;
  aiModel: string;
  createdAt: Date;
}

export class SessionService {
  /**
   * Initialize a new chat session with full context
   */
  async initializeChatSession(userId: string): Promise<ChatSession> {
    try {
      // Use the new versioned prompt system (production/testing)
      // This will use the user's selected version or production as default
      const systemPrompt = await getSystemPromptForUser({ uid: userId } as any);
      const aiModel = 'gemini-2.5-pro';

      if (!systemPrompt) {
        // Fallback to default if no prompt configured
        try {
          const response = await fetch('/system_prompt.md');
          if (response.ok) {
            const systemPrompt = await response.text();
          } else {
            throw new Error('No system prompt configured. Please create a prompt in the Admin panel.');
          }
        } catch (err) {
          throw new Error('No system prompt configured. Please create a prompt in the Admin panel.');
        }
      }

      // Load Aineisto context (full client data from markdown files)
      console.log('📁 Loading Aineisto context for chat session...');
      const aineistoContext = await loadAineistoContext();
      console.log(`✅ Loaded ${aineistoContext.fileCount} files from Aineisto`);

      // Combine system prompt with Aineisto context
      const fullContext = `${systemPrompt}\n\n---\n\n${aineistoContext.content}`;

      // Generate unique session ID
      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🆕 NEW CHAT SESSION CREATED: ${sessionId}`);

      return {
        sessionId,
        systemPrompt,
        fullContext,
        aiModel,
        createdAt: new Date()
      } as ChatSession;
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      throw new Error('Failed to initialize chat session');
    }
  }



  /**
   * Refresh session context (useful when documents are added/removed)
   */
  async refreshSessionContext(session: ChatSession, userId: string): Promise<ChatSession> {
    return await this.initializeChatSession(userId);
  }
}

export const sessionService = new SessionService();