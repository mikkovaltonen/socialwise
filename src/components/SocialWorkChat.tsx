/**
 * SocialWorkChat - AI Assistant Chat Component
 *
 * Clean rebuild focusing on core functionality:
 * - Simple, maintainable code
 * - OpenRouter API integration
 * - User-configurable LLM model
 * - Client context from LSPortal
 */

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, RotateCcw, Loader2, PanelRightClose, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SessionService } from '@/lib/sessionService';
import { getUserLLMModel, getUserTemperature } from '@/lib/systemPromptService';
import { useAuth } from '@/hooks/useAuth';
import type { LSClientData } from '@/data/ls-types';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface SocialWorkChatRef {
  resetChat: () => void;
}

interface SocialWorkChatProps {
  onLogout?: () => void;
  chatVisible?: boolean;
  onChatVisibleChange?: (visible: boolean) => void;
  onFullscreenChange?: (fullscreen: boolean) => void;
  clientData?: LSClientData | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================================
// Component
// ============================================================================

const SocialWorkChat = forwardRef<SocialWorkChatRef, SocialWorkChatProps>(
  ({ chatVisible = true, onChatVisibleChange, onFullscreenChange, clientData }, ref) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionInitializing, setSessionInitializing] = useState(false);
    const [sessionContext, setSessionContext] = useState<string | null>(null);
    const [llmModel, setLlmModel] = useState<string>('');
    const [temperature, setTemperature] = useState<number>(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionService = new SessionService();

    // OpenRouter API configuration
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
    const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

    // Expose reset method via ref
    useImperativeHandle(ref, () => ({
      resetChat: () => {
        handleReset();
      },
    }));

    // Initialize session when component mounts or client data changes
    useEffect(() => {
      initializeSession();
    }, [clientData, user]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initialize chat session with context
    const initializeSession = async () => {
      if (!user) return;

      // Prevent re-initialization if session already exists
      if (sessionContext) {
        logger.debug('⏭️ Session already initialized, skipping re-initialization');
        return;
      }

      try {
        setSessionInitializing(true);

        // Get user's LLM model preference
        const userModel = await getUserLLMModel(user.uid);
        const userTemp = await getUserTemperature(user.uid);
        setLlmModel(userModel);
        setTemperature(userTemp);

        // Get user's name with fallbacks
        logger.debug('👤 User object:', {
          displayName: user.displayName,
          email: user.email,
          uid: user.uid
        });
        const userName = user.displayName || user.email?.split('@')[0] || 'Käyttäjä';
        logger.debug('👤 Selected userName:', userName);

        // Initialize session with context
        const session = await sessionService.initializeChatSession(
          user.uid,
          userName,
          user.email || '',
          clientData
        );

        setSessionContext(session.fullContext);

        // Add greeting message
        const greetingMessage: Message = {
          role: 'assistant',
          content: clientData
            ? `👋 Tervetuloa, **${userName}**!\n\nOlen nyt ladannut asiakkaan **${clientData.clientName}** tiedot kontekstiini.\n\nVoin auttaa sinua dokumentoinnissa, päätöksenteossa ja palvelun suunnittelussa. Mitä haluaisit tietää tai tehdä?`
            : `👋 Tervetuloa SocialWise-työpöytään, **${userName}**!\n\n**Valitse asiakas** vasemmalta päästäksesi alkuun.\n\nKun valitset asiakkaan, voin auttaa sinua dokumentoinnissa, päätöksenteossa ja palvelun suunnittelussa.`,
        };

        setMessages([greetingMessage]);
        logger.debug('✅ Chat session initialized');
      } catch (error) {
        logger.error('❌ Failed to initialize session:', error);
      } finally {
        setSessionInitializing(false);
      }
    };

    // Send message to AI
    const handleSendMessage = async () => {
      const trimmedInput = input.trim();
      if (!trimmedInput || isLoading || !sessionContext) return;

      // Add user message
      const userMessage: Message = { role: 'user', content: trimmedInput };
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        // Build messages array for API - include all messages for full context
        const apiMessages = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Add current user message
        apiMessages.push({
          role: 'user',
          content: trimmedInput,
        });

        logger.debug('🔵 Sending to OpenRouter:', {
          model: llmModel,
          temperature: temperature,
          messageCount: apiMessages.length,
          contextLength: sessionContext?.length || 0,
        });

        // Call OpenRouter API
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SocialWise - Chat',
          },
          body: JSON.stringify({
            model: llmModel,
            messages: [
              {
                role: 'system',
                content: sessionContext,
              },
              ...apiMessages,
            ],
            temperature: temperature,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          logger.error('❌ OpenRouter API error details:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            model: llmModel,
          });
          throw new Error(`OpenRouter API error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        const responseMessage = data.choices?.[0]?.message;

        // Normal text response
        const aiResponse = responseMessage?.content || 'Virhe: Ei vastausta';
        const assistantMessage: Message = { role: 'assistant', content: aiResponse };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        logger.error('❌ Error sending message:', error);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Pahoittelut, tapahtui virhe. Yritä uudelleen.',
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    };

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    };

    // Reset chat
    const handleReset = () => {
      setMessages([]);
      setSessionContext(null);
      initializeSession();
    };

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-ls-blue to-ls-blue-dark">
        {/* Header */}
        <div className="bg-ls-blue-dark text-white px-4 py-2 flex justify-between items-center border-b border-white/20">
          <h2 className="text-sm font-semibold">AI-Avustaja</h2>
          <div className="flex gap-1">
            {onFullscreenChange && (
              <button
                onClick={() => {
                  const newFullscreen = !isFullscreen;
                  setIsFullscreen(newFullscreen);
                  onFullscreenChange(newFullscreen);
                }}
                className="hover:bg-white/10 text-white p-1.5 rounded transition-colors duration-200"
                title={isFullscreen ? "Poistu koko näytöstä" : "Koko näyttö"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
            {onChatVisibleChange && !isFullscreen && (
              <button
                onClick={() => onChatVisibleChange(false)}
                className="hover:bg-white/10 text-white p-1.5 rounded transition-colors duration-200"
                title="Piilota AI-chat"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
          {sessionInitializing && (
            <div className="flex justify-start">
              <div className="bg-white/95 rounded-lg px-2.5 py-1.5 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span className="text-[11px] text-gray-700">Alustetaan AI...</span>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`px-2.5 py-1.5 rounded-lg max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-white text-ls-blue-dark ml-auto shadow-md'
                    : 'bg-white/95 shadow-sm text-gray-800'
                }`}
              >
                <div className="max-w-none text-[13px] leading-relaxed">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/95 rounded-lg px-2.5 py-1.5 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span className="text-[11px] text-gray-700">AI miettii...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-ls-blue-dark border-t border-white/20 p-2.5">
          <div className="flex space-x-1.5 items-center">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Kirjoita kysymys..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || sessionInitializing}
              className="flex-1 h-8 px-2.5 text-xs border-white/30 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-white text-gray-800 placeholder-gray-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || sessionInitializing}
              className="h-8 px-3 bg-white text-ls-blue-dark hover:bg-white/90 rounded-lg font-semibold shadow-md text-xs"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-8 px-2.5 text-white border-white/30 hover:bg-white/10 rounded-lg"
              title="Nollaa keskustelu"
              disabled={sessionInitializing}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

SocialWorkChat.displayName = 'SocialWorkChat';

export default SocialWorkChat;
