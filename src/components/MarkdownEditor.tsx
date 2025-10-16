import React, { useRef, useEffect, useState } from 'react';
import { Label } from "@/components/ui/label";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  className?: string;
  readOnly?: boolean;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text... Supports **bold**, *italic*, # headers, lists, and more!",
  label = "Content",
  minHeight = "300px",
  className = "",
  readOnly = false,
  onKeyDown
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formattedRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Sync scroll positions
  const handleScroll = () => {
    if (textareaRef.current && formattedRef.current) {
      formattedRef.current.scrollTop = textareaRef.current.scrollTop;
      formattedRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Simplified rendering that preserves exact text positioning
  const renderFormattedText = (text: string) => {
    if (!text && !isFocused) return <span className="text-gray-400">{placeholder}</span>;
    if (!text) return <span>&nbsp;</span>;

    // Process the text with regex to add formatting
    let processedText = text;

    // Store replacements to apply
    const replacements: Array<{pattern: RegExp, replacement: string}> = [
      // Headers
      {pattern: /^(#{1,3}\s+)(.*)$/gm, replacement: '<span class="text-blue-600 font-bold">$1$2</span>'},
      // Bold
      {pattern: /\*\*([^*]+)\*\*/g, replacement: '<span class="text-gray-400">**</span><span class="font-bold">$1</span><span class="text-gray-400">**</span>'},
      // Italic (avoid matching bold markers)
      {pattern: /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)/g, replacement: '<span class="text-gray-400">*</span><span class="italic">$1</span><span class="text-gray-400">*</span>'},
      // Code
      {pattern: /`([^`]+)`/g, replacement: '<span class="text-gray-400">`</span><span class="bg-gray-100 px-0.5">$1</span><span class="text-gray-400">`</span>'},
      // Links
      {pattern: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<span class="text-gray-400">[</span><span class="text-blue-600 underline">$1</span><span class="text-gray-400">](</span><span class="text-blue-600 underline">$2</span><span class="text-gray-400">)</span>'},
      // Blockquotes
      {pattern: /^(&gt;\s+)(.*)$/gm, replacement: '<span class="text-gray-500 italic">$1$2</span>'}
    ];

    // Apply HTML encoding first
    processedText = processedText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Apply markdown formatting
    replacements.forEach(({pattern, replacement}) => {
      processedText = processedText.replace(pattern, replacement);
    });

    // Convert newlines to <br/> tags
    processedText = processedText.replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <div className="relative" style={{ minHeight }}>
        {/* Formatted text overlay */}
        <div
          ref={formattedRef}
          className="absolute inset-0 p-3 font-mono text-sm whitespace-pre-wrap overflow-y-auto overflow-x-hidden border rounded-md bg-white pointer-events-none leading-normal"
          style={{
            minHeight,
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {renderFormattedText(value)}
        </div>

        {/* Actual textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={onKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="absolute inset-0 w-full h-full p-3 font-mono text-sm bg-transparent text-transparent caret-black border rounded-md resize-none overflow-y-auto overflow-x-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 leading-normal"
          style={{
            caretColor: 'black',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}
          spellCheck={false}
        />
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Markdown: <span className="font-bold">**bold**</span>, <span className="italic">*italic*</span>, <span className="text-blue-600 font-bold"># headers</span>, <span className="text-gray-500 italic">&gt; quotes</span>, <span className="text-blue-600 underline">[links](url)</span>
      </div>
    </div>
  );
};

export default MarkdownEditor;