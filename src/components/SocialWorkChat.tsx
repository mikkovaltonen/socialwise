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
import { Send, RotateCcw, Loader2, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SessionService } from '@/lib/sessionService';
import { getUserLLMModel, getUserTemperature } from '@/lib/systemPromptService';
import { useAuth } from '@/hooks/useAuth';
import type { LSClientData } from '@/data/ls-types';

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
  ({ chatVisible = true, onChatVisibleChange, clientData }, ref) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionInitializing, setSessionInitializing] = useState(false);
    const [sessionContext, setSessionContext] = useState<string | null>(null);
    const [llmModel, setLlmModel] = useState<string>('google/gemini-flash-lite-1.5-8b');
    const [temperature, setTemperature] = useState<number>(0.05);

    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionService = new SessionService();

    // OpenRouter API configuration
    const OPENROUTER_API_KEY = import.meta.env.VITE_OPEN_ROUTER_API_KEY || '';
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

      try {
        setSessionInitializing(true);

        // Get user's LLM model preference
        const userModel = await getUserLLMModel(user.uid);
        const userTemp = await getUserTemperature(user.uid);
        setLlmModel(userModel);
        setTemperature(userTemp);

        // Get user's name with fallbacks
        console.log('👤 User object:', {
          displayName: user.displayName,
          email: user.email,
          uid: user.uid
        });
        const userName = user.displayName || user.email?.split('@')[0] || 'Käyttäjä';
        console.log('👤 Selected userName:', userName);

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
        console.log('✅ Chat session initialized');
      } catch (error) {
        console.error('❌ Failed to initialize session:', error);
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
              ...messages
                .filter((m) => m.role !== 'assistant' || !m.content.startsWith('👋'))
                .map((m) => ({
                  role: m.role === 'assistant' ? 'assistant' : 'user',
                  content: m.content,
                })),
              {
                role: 'user',
                content: trimmedInput,
              },
            ],
            temperature: temperature,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content || 'Virhe: Ei vastausta';

        // Add AI response
        const assistantMessage: Message = { role: 'assistant', content: aiResponse };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error('❌ Error sending message:', error);
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
        <div className="bg-ls-blue-dark text-white px-4 py-3 flex justify-between items-center border-b border-white/20">
          <h2 className="text-lg font-semibold">AI-Avustaja</h2>
          {onChatVisibleChange && (
            <button
              onClick={() => onChatVisibleChange(false)}
              className="hover:bg-white/10 text-white p-1.5 rounded transition-colors duration-200"
              title="Piilota AI-chat"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {sessionInitializing && (
            <div className="flex justify-start">
              <div className="bg-white/95 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-700">Alustetaan AI...</span>
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
                className={`px-4 py-3 rounded-xl max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-white text-ls-blue-dark ml-auto shadow-md'
                    : 'bg-white/95 shadow-sm text-gray-800'
                }`}
              >
                <div className="prose max-w-none">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/95 rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-gray-700">AI miettii...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-ls-blue-dark border-t border-white/20 p-4">
          <div className="flex space-x-2 items-center">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Kirjoita kysymys..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || sessionInitializing}
              className="flex-1 h-10 px-3 text-base border-white/30 rounded-lg focus:ring-2 focus:ring-white focus:border-white bg-white text-gray-800 placeholder-gray-400"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading || sessionInitializing}
              className="h-10 px-4 bg-white text-ls-blue-dark hover:bg-white/90 rounded-lg font-semibold shadow-md"
            >
              <Send className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              className="h-10 px-3 text-white border-white/30 hover:bg-white/10 rounded-lg"
              title="Nollaa keskustelu"
              disabled={sessionInitializing}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

SocialWorkChat.displayName = 'SocialWorkChat';

export default SocialWorkChat;
