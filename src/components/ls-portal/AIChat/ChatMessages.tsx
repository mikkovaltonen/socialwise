/**
 * ChatMessages
 *
 * Displays the conversation between user and AI assistant
 */

import React, { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading?: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isLoading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-center">
        <div className="text-white/60">
          <p className="text-xs">Ei viestejä vielä.</p>
          <p className="text-xs mt-2">
            Valitse valmis kysymys tai kirjoita oma kysymyksesi.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[80%] rounded-lg px-3 py-2 ${
              message.role === 'user'
                ? 'bg-white/20 text-white'
                : 'bg-white/10 text-white'
            }`}
          >
            <p className="text-xs whitespace-pre-wrap">{message.content}</p>
            <p
              className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-white/60' : 'text-white/50'
              }`}
            >
              {message.timestamp.toLocaleTimeString('fi-FI', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-white/10 rounded-lg px-3 py-2">
            <Loader2 className="w-4 h-4 text-white animate-spin" />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
