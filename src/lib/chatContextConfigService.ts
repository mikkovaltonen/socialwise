/**
 * Chat Context Configuration Service (Firestore)
 * Manages system-wide chat context document configuration in Firestore
 */

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

export interface ChatContextDocument {
  id: string;
  title: string;
  description: string;
  path: string;
  pdfPath?: string;
  type?: 'markdown' | 'pdf' | 'both';
  active: boolean;
  category?: 'policy' | 'instruction' | 'process' | 'system';
  priority?: number;
}

export interface ChatContextConfig {
  documents: ChatContextDocument[];
  lastUpdated: Timestamp | null;
  updatedBy: string;
}

// Firestore document path
const CHAT_CONTEXT_CONFIG_DOC = 'crm_system_prompts/chat_context_config';

// Default configuration for chat initialization documents
export const DEFAULT_CHAT_CONTEXT_DOCUMENTS: ChatContextDocument[] = [
  {
    id: 'procurement',
    title: 'Valmet Global Procurement Policy',
    description: 'Purchasing and payment processes, supplier management, buying channels, and compliance requirements',
    path: '/chat_init_contect/valmet-procurement-policy.md',
    active: true,
    category: 'policy',
    priority: 1
  },
  {
    id: 'payment',
    title: 'Valmet Global Payment Policy',
    description: 'Payment channels, frequency, authorization requirements, and exception handling',
    path: '/chat_init_contect/valmet-payment-policy.md',
    active: true,
    category: 'policy',
    priority: 2
  },
  {
    id: 'approval',
    title: 'Valmet Approval Limits Policy',
    description: 'Purchase invoice approval limits, rights management, and compliance framework',
    path: '/chat_init_contect/valmet-approval-limits-policy.md',
    active: true,
    category: 'policy',
    priority: 3
  },
  {
    id: 'basware-shop',
    title: 'Basware Shop Instructions',
    description: 'Guided freetext order instructions for Basware Shop procurement system (includes visual guides)',
    path: '/chat_init_contect/basware-shop-instructions.md',
    pdfPath: '/chat_init_contect/Guided freetext order instructions for Basware Shop.pdf',
    type: 'both',
    active: false,
    category: 'instruction',
    priority: 6
  },
  {
    id: 'leased-workers',
    title: 'Leased Workers Process',
    description: 'Process instructions for managing leased workers in Workday system',
    path: '/chat_init_contect/leased-workers-process.md',
    active: false,
    category: 'process',
    priority: 4
  },
  {
    id: 'external-workforce',
    title: 'External Workforce Policy',
    description: 'Policy guidelines for external workforce management and compliance',
    path: '/chat_init_contect/external-workforce-policy.md',
    active: true,
    category: 'policy',
    priority: 5
  }
];

/**
 * Initialize chat context config in Firestore if it doesn't exist
 */
export async function initializeChatContextConfig(userId: string): Promise<void> {
  try {
    const docRef = doc(db, CHAT_CONTEXT_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      await setDoc(docRef, {
        documents: DEFAULT_CHAT_CONTEXT_DOCUMENTS,
        lastUpdated: serverTimestamp(),
        updatedBy: userId
      });
      console.log('✅ Chat context config initialized in Firestore');
    }
  } catch (error) {
    console.error('Error initializing chat context config:', error);
  }
}

/**
 * Load chat context configuration from Firestore
 */
export async function loadChatContextConfig(): Promise<ChatContextDocument[]> {
  try {
    const docRef = doc(db, CHAT_CONTEXT_CONFIG_DOC);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as ChatContextConfig;
      return mergeWithDefaults(data.documents);
    }
  } catch (error) {
    console.error('Failed to load chat context config from Firestore:', error);
  }

  return DEFAULT_CHAT_CONTEXT_DOCUMENTS;
}

/**
 * Save chat context configuration to Firestore
 */
export async function saveChatContextConfig(
  documents: ChatContextDocument[],
  userId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, CHAT_CONTEXT_CONFIG_DOC);

    await setDoc(docRef, {
      documents,
      lastUpdated: serverTimestamp(),
      updatedBy: userId
    });

    console.log('✅ Chat context config saved to Firestore:',
      documents.filter(d => d.active).map(d => d.id)
    );
    return true;
  } catch (error) {
    console.error('Failed to save chat context config to Firestore:', error);
    return false;
  }
}

/**
 * Merge config with defaults to handle new documents
 */
function mergeWithDefaults(savedConfig: ChatContextDocument[]): ChatContextDocument[] {
  const merged = [...DEFAULT_CHAT_CONTEXT_DOCUMENTS];

  // Update with saved preferences
  for (const savedDoc of savedConfig) {
    const index = merged.findIndex(d => d.id === savedDoc.id);
    if (index !== -1) {
      // Preserve saved active state and priority
      merged[index] = {
        ...merged[index],
        active: savedDoc.active,
        priority: savedDoc.priority !== undefined ? savedDoc.priority : merged[index].priority
      };
    }
  }

  return merged;
}

/**
 * Get only active documents sorted by priority
 */
export async function getActiveChatContextDocuments(): Promise<ChatContextDocument[]> {
  const config = await loadChatContextConfig();
  return config
    .filter(doc => doc.active)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Update the active state of a specific document
 */
export async function updateDocumentActiveState(
  documentId: string,
  active: boolean,
  userId: string
): Promise<boolean> {
  const config = await loadChatContextConfig();
  const doc = config.find(d => d.id === documentId);

  if (doc) {
    doc.active = active;
    return await saveChatContextConfig(config, userId);
  }

  return false;
}

/**
 * Update document priorities
 */
export async function updateDocumentPriorities(
  priorities: { id: string; priority: number }[],
  userId: string
): Promise<boolean> {
  const config = await loadChatContextConfig();

  for (const { id, priority } of priorities) {
    const doc = config.find(d => d.id === id);
    if (doc) {
      doc.priority = priority;
    }
  }

  return await saveChatContextConfig(config, userId);
}

/**
 * Reset to default configuration
 */
export async function resetToDefaultConfig(userId: string): Promise<boolean> {
  try {
    return await saveChatContextConfig(DEFAULT_CHAT_CONTEXT_DOCUMENTS, userId);
  } catch (error) {
    console.error('Failed to reset to default config:', error);
    return false;
  }
}

/**
 * Estimate total context size
 */
export async function estimateChatContextSize(): Promise<{
  totalSize: number;
  documents: Array<{ id: string; title: string; size: number }>;
}> {
  const config = await loadChatContextConfig();
  const activeDocuments = config.filter(doc => doc.active);

  const documentSizes = await Promise.all(
    activeDocuments.map(async (doc) => {
      try {
        const response = await fetch(doc.path);
        const text = await response.text();
        const size = text.length;

        return {
          id: doc.id,
          title: doc.title,
          size
        };
      } catch (error) {
        console.error(`Failed to estimate size for ${doc.id}:`, error);
        return {
          id: doc.id,
          title: doc.title,
          size: 0
        };
      }
    })
  );

  const totalSize = documentSizes.reduce((sum, doc) => sum + doc.size, 0);

  return {
    totalSize,
    documents: documentSizes
  };
}