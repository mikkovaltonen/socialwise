import { getSystemPromptForUser } from './systemPromptService';
import { loadAineistoContext, formatClientContext } from './aineistoLoader';

export interface ChatSession {
  sessionId: string;
  systemPrompt: string;
  fullContext: string;
  aiModel: string;
  createdAt: Date;
  userName?: string;
  userEmail?: string;
  clientData?: any; // LSClientData
}

export class SessionService {
  /**
   * Initialize a new chat session with full context
   * @param userId - Firebase user ID
   * @param userName - User's display name (optional)
   * @param userEmail - User's email (optional)
   * @param clientData - Current client data to include in context (optional)
   */
  async initializeChatSession(
    userId: string,
    userName: string,
    userEmail: string,
    clientData?: any
  ): Promise<ChatSession> {
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

      // Build user context
      let userContext = '';
      if (userName || userEmail) {
        userContext = '\n\n---\n\n## KÄYTTÄJÄN TIEDOT\n\n';
        userContext += `**Nimi:** ${userName}\n`;
        userContext += `**Rooli:** Sosiaalityöntekijä\n`;
        userContext += `**Kirjautumis-email:** ${userEmail}\n`;
        userContext += `**Kirjautumisaika:** ${new Date().toLocaleString('fi-FI')}\n\n`;
      }

      // Build client context
      let clientContext = '';
      if (clientData) {
        console.log(`📋 Adding client data to context: ${clientData.clientName}`);
        clientContext = formatClientContext(clientData);
      }

      // Combine all contexts
      const fullContext = systemPrompt + userContext + clientContext;

      // Generate unique session ID
      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('🆕 NEW CHAT SESSION CREATED');
      console.log(`- Session ID: ${sessionId}`);
      console.log(`- User: ${userName}`);
      console.log(`- Client: ${clientData?.clientName || 'No client'}`);
      console.log(`- Context length: ${fullContext.length} characters`);

      return {
        sessionId,
        systemPrompt,
        fullContext,
        aiModel,
        createdAt: new Date(),
        userName,
        userEmail,
        clientData
      } as ChatSession;
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      throw new Error('Failed to initialize chat session');
    }
  }



  /**
   * Update session with new client data
   * Used when user switches to a different client
   */
  async updateSessionWithClientData(
    session: ChatSession,
    clientData: any
  ): Promise<ChatSession> {
    console.log('🔄 UPDATING SESSION WITH NEW CLIENT DATA');
    console.log(`- Previous client: ${session.clientData?.clientName || 'None'}`);
    console.log(`- New client: ${clientData.clientName}`);

    // Build user context
    let userContext = '';
    if (session.userName || session.userEmail) {
      userContext = '\n\n---\n\n## KÄYTTÄJÄN TIEDOT\n\n';
      userContext += `**Nimi:** ${session.userName}\n`;
      userContext += `**Rooli:** Sosiaalityöntekijä\n`;
      userContext += `**Kirjautumis-email:** ${session.userEmail}\n`;
      userContext += `**Kirjautumisaika:** ${session.createdAt.toLocaleString('fi-FI')}\n\n`;
    }

    // Build new client context
    const clientContext = formatClientContext(clientData);

    // Rebuild full context
    const fullContext = session.systemPrompt + userContext + clientContext;

    console.log(`✅ Session updated - New context length: ${fullContext.length} characters`);

    return {
      ...session,
      fullContext,
      clientData
    };
  }

  /**
   * Refresh session context (useful when documents are added/removed)
   */
  async refreshSessionContext(session: ChatSession, userId: string): Promise<ChatSession> {
    return await this.initializeChatSession(
      userId,
      session.userName,
      session.userEmail,
      session.clientData
    );
  }
}

export const sessionService = new SessionService();