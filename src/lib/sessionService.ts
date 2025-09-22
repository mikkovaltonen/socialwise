import { db } from './firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { storageService, KnowledgeDocument } from './storageService';

export interface ChatSession {
  systemPrompt: string;
  knowledgeContext: string;
  fullContext: string;
  documentsUsed: KnowledgeDocument[];
  aiModel: string;
  createdAt: Date;
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
   * Get all knowledge documents for a user
   */
  async getUserKnowledgeDocuments(userId: string): Promise<KnowledgeDocument[]> {
    try {
      return await storageService.getUserDocuments(userId);
    } catch (error) {
      console.error('Failed to fetch knowledge documents:', error);
      return [];
    }
  }

  /**
   * Build knowledge context from documents
   */
  async buildKnowledgeContext(documents: KnowledgeDocument[]): Promise<string> {
    if (documents.length === 0) {
      return '';
    }

    const contextParts: string[] = [];
    
    for (const doc of documents) {
      try {
        const content = await storageService.downloadDocument(doc);
        contextParts.push(`
## Document: ${doc.name}
**Format:** ${doc.originalFormat}
**Size:** ${doc.size} bytes
**Content:**
${content}

---
`);
      } catch (error) {
        console.error(`Failed to load document ${doc.name}:`, error);
        // Continue with other documents
      }
    }

    return `
# INTERNAL KNOWLEDGE BASE

The following documents contain internal company knowledge, policies, and procedures that should inform your responses:

${contextParts.join('\n')}

Please use this internal knowledge to provide accurate, company-specific guidance while maintaining the principles outlined in your system prompt.
`;
  }

  /**
   * Load Valmet policy documents from chat_init_context
   */
  private async loadValmetPolicyDocuments(): Promise<string> {
    const policyPaths = [
      '/chat_init_contect/valmet-procurement-policy.md',
      '/chat_init_contect/valmet-payment-policy.md',
      '/chat_init_contect/valmet-approval-limits-policy.md',
      '/chat_init_contect/valmet-supplier-spend-data.md'
    ];

    const policyContexts: string[] = [];

    for (const path of policyPaths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const content = await response.text();
          const filename = path.split('/').pop()?.replace('.md', '') || 'policy';
          const title = filename.split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ');
          
          policyContexts.push(`
## ${title}

${content}
`);
        }
      } catch (error) {
        console.warn(`Failed to load policy document: ${path}`, error);
      }
    }

    if (policyContexts.length > 0) {
      return `
# VALMET INTERNAL POLICIES AND GUIDELINES

${policyContexts.join('\n')}

---
`;
    }

    return '';
  }

  /**
   * Initialize a new chat session with full context
   */
  async initializeChatSession(userId: string): Promise<ChatSession> {
    try {
      // Get latest system prompt or use default
      const latestPrompt = await this.getLatestSystemPrompt(userId);
      let systemPrompt: string;
      let aiModel: string;
      
      if (!latestPrompt?.systemPrompt) {
        // Use default system prompt from public folder
        try {
          const response = await fetch('/sample_promtp.md');
          if (response.ok) {
            systemPrompt = await response.text();
            aiModel = 'gemini-2.5-pro';
          } else {
            throw new Error('No system prompt configured. Please create a prompt in the Admin panel.');
          }
        } catch (err) {
          throw new Error('No system prompt configured. Please create a prompt in the Admin panel.');
        }
      } else {
        systemPrompt = latestPrompt.systemPrompt;
        aiModel = latestPrompt.aiModel || 'gemini-2.5-pro';
      }

      // Get knowledge documents
      const documents = await this.getUserKnowledgeDocuments(userId);
      
      // Build knowledge context
      const knowledgeContext = await this.buildKnowledgeContext(documents);
      
      // Load Valmet policy documents
      const policyContext = await this.loadValmetPolicyDocuments();
      
      // Combine all contexts
      const fullKnowledgeContext = policyContext + knowledgeContext;

      // Combine system prompt with knowledge context
      const fullContext = this.combineContexts(systemPrompt, fullKnowledgeContext);

      return {
        systemPrompt,
        knowledgeContext: fullKnowledgeContext,
        fullContext,
        documentsUsed: documents,
        aiModel,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Failed to initialize chat session:', error);
      throw new Error('Failed to initialize chat session');
    }
  }

  /**
   * Combine system prompt with knowledge context
   */
  private combineContexts(systemPrompt: string, knowledgeContext: string): string {
    if (!knowledgeContext.trim()) {
      return systemPrompt;
    }

    return `${systemPrompt}

${knowledgeContext}

IMPORTANT: When responding, prioritize information from the internal knowledge base above while maintaining the tone and approach defined in your system prompt.`;
  }


  /**
   * Refresh session context (useful when documents are added/removed)
   */
  async refreshSessionContext(session: ChatSession, userId: string): Promise<ChatSession> {
    return await this.initializeChatSession(userId);
  }
}

export const sessionService = new SessionService();