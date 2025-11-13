/**
 * Chatbot Message Service
 *
 * Loads greeting and message templates from chatbot_prompt.md
 * Provides functions to generate context-aware messages
 */

// Cache for loaded messages
let messagesCache: {
  WELCOME_WITH_CLIENT: string;
  WELCOME_NO_CLIENT: string;
  CLIENT_CHANGED: string;
  CHAT_RESET: string;
} | null = null;

/**
 * Load and parse greeting messages from chatbot_prompt.md
 */
async function loadGreetingMessages() {
  if (messagesCache) {
    return messagesCache;
  }

  try {
    const response = await fetch('/chatbot_prompt.md');
    if (!response.ok) {
      throw new Error('Failed to load chatbot_prompt.md');
    }

    const content = await response.text();

    // Extract messages from markdown code blocks
    const extractMessage = (sectionName: string): string => {
      const regex = new RegExp(`### ${sectionName}[\\s\\S]*?\`\`\`\\s*([\\s\\S]*?)\`\`\``, 'm');
      const match = content.match(regex);
      if (!match || !match[1]) {
        throw new Error(`Message template "${sectionName}" not found in chatbot_prompt.md! Check file structure.`);
      }
      return match[1].trim();
    };

    messagesCache = {
      WELCOME_WITH_CLIENT: extractMessage('WELCOME_WITH_CLIENT'),
      WELCOME_NO_CLIENT: extractMessage('WELCOME_NO_CLIENT'),
      CLIENT_CHANGED: extractMessage('CLIENT_CHANGED'),
      CHAT_RESET: extractMessage('CHAT_RESET'),
    };

    console.log('✅ Loaded greeting messages from chatbot_prompt.md');
    return messagesCache;
  } catch (error) {
    console.error('❌ Failed to load greeting messages:', error);
    throw error; // No fallbacks - let errors surface!
  }
}

/**
 * Get welcome message when client is selected
 */
export async function getWelcomeMessage(userName: string, clientName: string): Promise<string> {
  const messages = await loadGreetingMessages();
  return messages.WELCOME_WITH_CLIENT
    .replace('{userName}', userName)
    .replace('{clientName}', clientName);
}

/**
 * Get welcome message when no client is selected
 */
export async function getNoClientMessage(): Promise<string> {
  const messages = await loadGreetingMessages();
  return messages.WELCOME_NO_CLIENT;
}

/**
 * Get message when client is changed
 */
export async function getClientChangeMessage(clientName: string): Promise<string> {
  const messages = await loadGreetingMessages();
  return messages.CLIENT_CHANGED.replace('{clientName}', clientName);
}

/**
 * Get message when chat is reset
 */
export async function getResetMessage(userName: string, clientName: string): Promise<string> {
  const messages = await loadGreetingMessages();
  return messages.CHAT_RESET
    .replace('{userName}', userName)
    .replace('{clientName}', clientName);
}

/**
 * Clear cache (for testing or when prompt file is updated)
 */
export function clearMessageCache(): void {
  messagesCache = null;
}
