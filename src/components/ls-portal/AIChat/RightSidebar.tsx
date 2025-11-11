/**
 * RightSidebar
 *
 * Right sidebar with AI chat interface:
 * - Quick questions section
 * - Chat messages area
 * - Input field with send button
 */

import React from 'react';
import { QuickQuestions } from './QuickQuestions';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RightSidebarProps {
  messages?: Message[];
  onSendMessage?: (message: string) => void;
  onQuickQuestionClick?: (question: string) => void;
  isLoading?: boolean;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  messages = [],
  onSendMessage,
  onQuickQuestionClick,
  isLoading = false,
}) => {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-ls-blue to-ls-blue-dark">
      {/* Header */}
      <div className="p-4 border-b border-white/20">
        <h2 className="text-lg font-bold text-white">Kysy AI:lta</h2>
      </div>

      {/* Quick Questions Section */}
      <div className="px-4 pt-4 pb-3">
        <QuickQuestions onQuestionClick={onQuickQuestionClick} />
      </div>

      {/* Chat Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <ChatMessages messages={messages} isLoading={isLoading} />
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="p-4 border-t border-white/20">
        <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default RightSidebar;
