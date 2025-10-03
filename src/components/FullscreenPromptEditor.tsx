/**
 * Fullscreen Prompt Editor with Markdown Preview
 * Provides a distraction-free editing experience with live Markdown preview
 */

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import MarkdownEditor from './MarkdownEditor';
import { X, Save } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface FullscreenPromptEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  title: string;
  saving?: boolean;
}

export function FullscreenPromptEditor({
  open,
  onOpenChange,
  content,
  onChange,
  onSave,
  title,
  saving = false
}: FullscreenPromptEditorProps) {
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = (value: string) => {
    setLocalContent(value);
    onChange(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      onSave();
    }
    // Escape to exit fullscreen
    if (e.key === 'Escape') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Full-screen editor for editing system prompts with markdown support
          </DialogDescription>
        </VisuallyHidden>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="flex items-center gap-2">
              {/* Action Buttons */}
              <Button
                size="sm"
                onClick={onSave}
                disabled={saving}
                className="h-8"
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full p-6">
              <MarkdownEditor
                value={localContent}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder="Enter your prompt here..."
                label=""
                minHeight="calc(100% - 2rem)"
                className="h-full"
              />
            </div>
          </div>

          {/* Footer with tips */}
          <div className="px-6 py-2 border-t bg-gray-50 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span>Markdown: **bold** *italic* # Header [link](url)</span>
                <span>• Ctrl+S to save</span>
                <span>• ESC to exit</span>
              </div>
              <div className="flex items-center gap-3">
                <span>{localContent.split('\n').length} rows</span>
                <span>•</span>
                <span>{localContent.length} characters</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}