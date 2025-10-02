/**
 * Chat Context Service
 * Loads and manages chat initialization context documents based on configuration
 */

import { getActiveChatInitDocuments } from './chatInitConfig';

/**
 * Load all active chat context documents
 * Returns concatenated content to be used as chat context
 */
export async function loadChatContext(): Promise<string> {
  try {
    const activeDocuments = getActiveChatInitDocuments();

    if (activeDocuments.length === 0) {
      console.log('📄 No active chat context documents configured');
      return '';
    }

    console.log(`📄 Loading ${activeDocuments.length} chat context documents...`);

    const contextParts: string[] = [];

    // Add header
    contextParts.push('# VALMET PROCUREMENT POLICIES AND GUIDELINES\n');
    contextParts.push('The following policies and guidelines are available for reference:\n\n');

    // Load each active document
    for (const doc of activeDocuments) {
      try {
        console.log(`  Loading: ${doc.title} (priority: ${doc.priority || 999})`);

        const response = await fetch(doc.path);
        if (response.ok) {
          const content = await response.text();

          // Add document separator and content
          contextParts.push(`## ${doc.title}\n`);
          contextParts.push(`${doc.description}\n\n`);
          contextParts.push(content);
          contextParts.push('\n\n---\n\n'); // Document separator
        } else {
          console.error(`  ❌ Failed to load ${doc.title}: HTTP ${response.status}`);
        }
      } catch (error) {
        console.error(`  ❌ Error loading ${doc.title}:`, error);
      }
    }

    const fullContext = contextParts.join('');
    const tokenEstimate = Math.ceil(fullContext.length / 4); // Rough estimate

    console.log(`✅ Loaded chat context: ${activeDocuments.length} documents, ~${Math.round(tokenEstimate / 1000)}k tokens`);

    return fullContext;
  } catch (error) {
    console.error('Error loading chat context:', error);
    return '';
  }
}

/**
 * Get a summary of active context documents
 * Useful for displaying to users what context is loaded
 */
export function getActiveContextSummary(): string {
  const activeDocuments = getActiveChatInitDocuments();

  if (activeDocuments.length === 0) {
    return 'No context documents configured';
  }

  const titles = activeDocuments.map(doc => doc.title.replace('Valmet ', '')).join(', ');
  return `Active context: ${titles}`;
}

/**
 * Check if specific document types are active
 */
export function isDocumentTypeActive(documentId: string): boolean {
  const activeDocuments = getActiveChatInitDocuments();
  return activeDocuments.some(doc => doc.id === documentId);
}

/**
 * Get list of active document IDs
 */
export function getActiveDocumentIds(): string[] {
  return getActiveChatInitDocuments().map(doc => doc.id);
}

/**
 * Create a context header for chat messages
 * This can be prepended to system prompts
 */
export async function createChatContextHeader(): Promise<string> {
  const activeDocuments = getActiveChatInitDocuments();

  if (activeDocuments.length === 0) {
    return '';
  }

  const header = [
    '📚 CONTEXT DOCUMENTS LOADED:',
    ...activeDocuments.map(doc => `• ${doc.title}${doc.category ? ` (${doc.category})` : ''}`),
    '',
    'These documents provide policy guidance and should be referenced when answering procurement-related questions.',
    ''
  ].join('\n');

  return header;
}