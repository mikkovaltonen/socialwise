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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-ls-blue-text">Kysy AI:lta</h2>
      </div>

      {/* Quick Questions Section */}
      <div className="px-6 pt-6 pb-4">
        <QuickQuestions onQuestionClick={onQuickQuestionClick} />
      </div>

      {/* Chat Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <ChatMessages messages={messages} isLoading={isLoading} />
      </div>

      {/* Chat Input - Fixed at Bottom */}
      <div className="p-6 border-t border-gray-200 bg-white">
        <ChatInput onSendMessage={onSendMessage} disabled={isLoading} />
      </div>
    </div>
  );
};

export default RightSidebar;
