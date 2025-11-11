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
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={2}
        className="w-full px-3 py-2 border border-white/30 rounded-lg
                   bg-white/10 text-white placeholder-white/50
                   focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent
                   disabled:bg-white/5 disabled:cursor-not-allowed
                   resize-none text-xs"
      />
      <button
        type="submit"
        disabled={disabled || !message.trim()}
        className="w-full flex items-center justify-center gap-2
                   bg-white/20 hover:bg-white/30
                   disabled:bg-white/5 disabled:cursor-not-allowed
                   text-white font-medium py-2 px-3 rounded-lg text-xs
                   transition-colors duration-200"
      >
        <Send className="w-3 h-3" />
        <span>Lähetä</span>
      </button>
    </form>
  );
};

export default ChatInput;
