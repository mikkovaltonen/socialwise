import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { KnowledgeDocument } from './storageService';
import { getSystemPromptForUser } from './systemPromptService';
import { loadChatContext, getActiveDocumentIds, createChatContextHeader } from './chatContextService';

export interface ChatSession {
  sessionId: string;
  systemPrompt: string;
  policyContext: string;
  fullContext: string;
  documentsUsed: KnowledgeDocument[];
  aiModel: string;
  createdAt: Date;
  activePolicyDocuments?: string[]; // IDs of active policy documents during this session
}

export interface SystemPromptVersion {
  id: string;
  version: number;
  systemPrompt: string;
  evaluation: string;
  savedDate: Date;
  aiModel: string;
  userId: string;
}

export class SessionService {
  /**
   * Get the latest system prompt for a user
   */
  async getLatestSystemPrompt(userId: string): Promise<SystemPromptVersion | null> {
    try {
      const q = query(
        collection(db, 'systemPromptVersions'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      // Sort by version on client side until index is created
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SystemPromptVersion[];
      
      // Find the highest version number
      const latestDoc = docs.reduce((latest, current) => 
        current.version > latest.version ? current : latest
      );
      
      return latestDoc;
    } catch (error) {
      console.error('Failed to fetch latest system prompt:', error);
      return null;
    }
  }


  /**
   * Load Valmet policy documents from chat_init_context based on configuration
   */
  private async loadValmetPolicyDocuments(): Promise<string> {
    // Use the configurable chat context service
    const policyContext = await loadChatContext();

    if (policyContext) {
      // Log which documents are active
      const activeIds = getActiveDocumentIds();
      console.log(`📚 Loaded ${activeIds.length} active policy documents:`, activeIds);
    }

    return policyContext;
  }

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

      // No internal knowledge documents - simplified solution
      const documents: KnowledgeDocument[] = [];
      const knowledgeContext = '';
      
      // Load Valmet policy documents (based on configuration)
      const policyContext = await this.loadValmetPolicyDocuments();

      // Add context header for clarity
      const contextHeader = await createChatContextHeader();

      // Only use policy context (no internal knowledge)
      const fullKnowledgeContext = contextHeader + '\n' + policyContext;

      // Combine system prompt with knowledge context
      const fullContext = this.combineContexts(systemPrompt, fullKnowledgeContext);

      // Generate unique session ID
      const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`🆕 NEW CHAT SESSION CREATED: ${sessionId}`);

      // Store which policy documents were active during this session
      const activePolicyDocuments = getActiveDocumentIds();
      console.log(`📄 Session ${sessionId} created with ${activePolicyDocuments.length} active policy documents`);

      return {
        sessionId,
        systemPrompt,
        policyContext: fullKnowledgeContext,
        fullContext,
        documentsUsed: documents,
        aiModel,
        createdAt: new Date(),
        activePolicyDocuments
      } as ChatSession;
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      throw new Error('Failed to initialize chat session');
    }
  }

  /**
   * Combine system prompt with context
   */
  private combineContexts(systemPrompt: string, knowledgeContext: string): string {
    if (!knowledgeContext.trim()) {
      return systemPrompt;
    }

    return `${systemPrompt}

${knowledgeContext}`;
  }


  /**
   * Refresh session context (useful when documents are added/removed)
   */
  async refreshSessionContext(session: ChatSession, userId: string): Promise<ChatSession> {
    return await this.initializeChatSession(userId);
  }
}

export const sessionService = new SessionService();