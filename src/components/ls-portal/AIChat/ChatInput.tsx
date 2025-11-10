/**
 * ChatInput
 *
 * Input field for user to type and send messages
 */

import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSendMessage?: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
  placeholder = 'Kirjoita kysymys...',
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage?.(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={3}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-ls-blue focus:border-transparent
                   disabled:bg-gray-100 disabled:cursor-not-allowed
                   resize-none text-sm"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="w-full flex items-center justify-center gap-2
                   bg-ls-blue hover:bg-ls-blue-dark
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   text-white font-medium py-3 px-4 rounded-lg
                   transition-colors duration-200"
      >
        <Send className="w-4 h-4" />
        <span>Lähetä</span>
      </button>
    </form>
  );
};

export default ChatInput;
