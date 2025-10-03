/**
 * Chat Initialization Configuration
 * Manages which policy documents are loaded as context for the AI assistant
 * NOW USES FIRESTORE FOR SYSTEM-WIDE CONFIGURATION
 */

import {
  loadChatContextConfig,
  saveChatContextConfig,
  getActiveChatContextDocuments,
  updateDocumentActiveState as updateActiveState,
  resetToDefaultConfig as resetConfig,
  estimateChatContextSize,
  initializeChatContextConfig,
  ChatContextDocument
} from './chatContextConfigService';

export interface ChatInitDocument {
  id: string;
  title: string;
  description: string;
  path: string;
  pdfPath?: string;
  type?: 'markdown' | 'pdf' | 'both';
  active: boolean; // Whether this document is included in chat context
  category?: 'policy' | 'instruction' | 'process' | 'system';
  priority?: number; // Higher priority documents are loaded first (1 = highest)
}

// Default configuration for chat initialization documents
export const DEFAULT_CHAT_INIT_DOCUMENTS: ChatInitDocument[] = [
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
    active: false, // Disabled by default as it's more specific
    category: 'instruction',
    priority: 6
  },
  {
    id: 'leased-workers',
    title: 'Leased Workers Process',
    description: 'Process instructions for managing leased workers in Workday system',
    path: '/chat_init_contect/leased-workers-process.md',
    active: false, // Disabled by default as it's specific to leased workers
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

// Storage key for user's custom configuration
const STORAGE_KEY = 'valmet_chat_init_config';

/**
 * Load user's chat initialization configuration from localStorage
 */
export function loadChatInitConfig(): ChatInitDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored) as ChatInitDocument[];
      // Merge with defaults to ensure new documents are included
      return mergeWithDefaults(config);
    }
  } catch (error) {
    console.error('Failed to load chat init config:', error);
  }
  return DEFAULT_CHAT_INIT_DOCUMENTS;
}

/**
 * Save user's chat initialization configuration to localStorage
 */
export function saveChatInitConfig(config: ChatInitDocument[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    console.log('Chat init config saved:', config.filter(d => d.active).map(d => d.id));
  } catch (error) {
    console.error('Failed to save chat init config:', error);
  }
}

/**
 * Merge user config with defaults to handle new documents
 */
function mergeWithDefaults(userConfig: ChatInitDocument[]): ChatInitDocument[] {
  const merged = [...DEFAULT_CHAT_INIT_DOCUMENTS];

  // Update with user preferences
  for (const userDoc of userConfig) {
    const index = merged.findIndex(d => d.id === userDoc.id);
    if (index !== -1) {
      // Preserve user's active state but update other fields from defaults
      merged[index] = {
        ...merged[index],
        active: userDoc.active,
        priority: userDoc.priority !== undefined ? userDoc.priority : merged[index].priority
      };
    }
  }

  return merged;
}

/**
 * Get only active documents sorted by priority
 */
export function getActiveChatInitDocuments(): ChatInitDocument[] {
  const config = loadChatInitConfig();
  return config
    .filter(doc => doc.active)
    .sort((a, b) => (a.priority || 999) - (b.priority || 999));
}

/**
 * Update the active state of a specific document
 */
export function updateDocumentActiveState(documentId: string, active: boolean): void {
  const config = loadChatInitConfig();
  const doc = config.find(d => d.id === documentId);
  if (doc) {
    doc.active = active;
    saveChatInitConfig(config);
  }
}

/**
 * Update priorities for documents (for reordering)
 */
export function updateDocumentPriorities(priorities: { [id: string]: number }): void {
  const config = loadChatInitConfig();
  for (const doc of config) {
    if (priorities[doc.id] !== undefined) {
      doc.priority = priorities[doc.id];
    }
  }
  saveChatInitConfig(config);
}

/**
 * Reset configuration to defaults
 */
export function resetToDefaultConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('Chat init config reset to defaults');
}

/**
 * Get total context size estimate (in tokens, approximate)
 */
export async function estimateContextSize(): Promise<{
  totalSize: number;
  documents: Array<{ id: string; title: string; size: number }>;
}> {
  const activeDocuments = getActiveChatInitDocuments();
  const documents: Array<{ id: string; title: string; size: number }> = [];
  let totalSize = 0;

  for (const doc of activeDocuments) {
    try {
      const response = await fetch(doc.path);
      if (response.ok) {
        const content = await response.text();
        // Rough estimate: 1 token ≈ 4 characters
        const tokenEstimate = Math.ceil(content.length / 4);
        documents.push({
          id: doc.id,
          title: doc.title,
          size: tokenEstimate
        });
        totalSize += tokenEstimate;
      }
    } catch (error) {
      console.error(`Failed to estimate size for ${doc.id}:`, error);
    }
  }

  return { totalSize, documents };
}

/**
 * Export configuration for backup
 */
export function exportConfig(): string {
  const config = loadChatInitConfig();
  return JSON.stringify(config, null, 2);
}

/**
 * Import configuration from backup
 */
export function importConfig(jsonString: string): boolean {
  try {
    const config = JSON.parse(jsonString) as ChatInitDocument[];
    // Validate structure
    if (!Array.isArray(config) || !config.every(doc =>
      typeof doc.id === 'string' &&
      typeof doc.active === 'boolean'
    )) {
      throw new Error('Invalid configuration format');
    }
    saveChatInitConfig(config);
    return true;
  } catch (error) {
    console.error('Failed to import config:', error);
    return false;
  }
}

// ============================================
// ASYNC FIRESTORE WRAPPERS FOR NEW IMPLEMENTATION
// ============================================

let configCache: ChatInitDocument[] | null = null;

/**
 * Initialize configuration in Firestore and migrate from localStorage if needed
 */
export async function initializeChatConfig(userId: string): Promise<void> {
  await initializeChatContextConfig(userId);

  // Migrate from localStorage if exists
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const config = JSON.parse(stored) as ChatInitDocument[];
      await saveChatContextConfig(config, userId);
      localStorage.removeItem(STORAGE_KEY);
      console.log('✅ Migrated chat config from localStorage to Firestore');
    }
  } catch (error) {
    console.error('Failed to migrate config:', error);
  }

  // Load config into cache
  configCache = await loadChatContextConfig();
}

/**
 * Load configuration from Firestore (async version)
 */
export async function loadChatInitConfigAsync(): Promise<ChatInitDocument[]> {
  const config = await loadChatContextConfig();
  configCache = config;
  return config;
}

/**
 * Save configuration to Firestore (async version)
 */
export async function saveChatInitConfigAsync(
  config: ChatInitDocument[],
  userId: string
): Promise<boolean> {
  const result = await saveChatContextConfig(config, userId);
  if (result) {
    configCache = config;
  }
  return result;
}

/**
 * Get active documents from Firestore (async version)
 */
export async function getActiveChatInitDocumentsAsync(): Promise<ChatInitDocument[]> {
  return getActiveChatContextDocuments();
}

/**
 * Update document active state in Firestore (async version)
 */
export async function updateDocumentActiveStateAsync(
  documentId: string,
  active: boolean,
  userId: string
): Promise<boolean> {
  const result = await updateActiveState(documentId, active, userId);
  if (result) {
    // Update cache
    configCache = await loadChatContextConfig();
  }
  return result;
}

/**
 * Reset to defaults in Firestore (async version)
 */
export async function resetToDefaultConfigAsync(userId: string): Promise<boolean> {
  const result = await resetConfig(userId);
  if (result) {
    configCache = await loadChatContextConfig();
  }
  return result;
}

/**
 * Estimate context size from Firestore config (async version)
 */
export async function estimateContextSizeAsync(): Promise<{
  totalSize: number;
  documents: Array<{ id: string; title: string; size: number }>;
}> {
  return estimateChatContextSize();
}