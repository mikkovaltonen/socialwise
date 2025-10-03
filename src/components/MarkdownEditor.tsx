import React, { useRef, useEffect } from 'react';
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

  // Sync scroll positions
  const handleScroll = () => {
    if (textareaRef.current && formattedRef.current) {
      formattedRef.current.scrollTop = textareaRef.current.scrollTop;
      formattedRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Function to render markdown-style formatting with colors
  const renderFormattedText = (text: string) => {
    if (!text) return <span className="text-gray-400">{placeholder}</span>;

    // Split text into lines for processing
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // Check for blockquote
      if (line.startsWith('> ')) {
        return (
          <div key={lineIndex} className="text-gray-500 italic pl-3 border-l-2 border-gray-300">
            {line}
          </div>
        );
      }
      // Check for headers - blue and bold
      else if (line.startsWith('### ')) {
        return (
          <div key={lineIndex} className="text-lg font-bold text-blue-600">
            {line}
          </div>
        );
      } else if (line.startsWith('## ')) {
        return (
          <div key={lineIndex} className="text-xl font-bold text-blue-600">
            {line}
          </div>
        );
      } else if (line.startsWith('# ')) {
        return (
          <div key={lineIndex} className="text-2xl font-bold text-blue-600">
            {line}
          </div>
        );
      }

      // Process inline formatting
      const elements: React.ReactNode[] = [];
      const remainingText = line;
      let keyIndex = 0;

      // Complex regex to handle all inline elements
      const inlineRegex = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(__([^_]+)__)|((?<!\*)\*(?!\*)([^*]+)\*(?!\*))|((?<!_)_(?!_)([^_]+)_(?!_))|(`([^`]+)`)/g;

      let lastEnd = 0;
      let match;

      while ((match = inlineRegex.exec(line)) !== null) {
        // Add text before match
        if (match.index > lastEnd) {
          elements.push(
            <span key={`text-${lineIndex}-${keyIndex++}`}>
              {line.substring(lastEnd, match.index)}
            </span>
          );
        }

        // Link [text](url)
        if (match[1]) {
          elements.push(
            <span key={`link-${lineIndex}-${keyIndex++}`}>
              <span className="text-gray-400">[</span>
              <span className="text-blue-600 underline">{match[2]}</span>
              <span className="text-gray-400">](</span>
              <span className="text-blue-600 underline">{match[3]}</span>
              <span className="text-gray-400">)</span>
            </span>
          );
        }
        // Bold **text**
        else if (match[4]) {
          elements.push(
            <span key={`bold-${lineIndex}-${keyIndex++}`}>
              <span className="text-gray-400">**</span>
              <span className="font-bold">{match[5]}</span>
              <span className="text-gray-400">**</span>
            </span>
          );
        }
        // Bold __text__
        else if (match[6]) {
          elements.push(
            <span key={`bold2-${lineIndex}-${keyIndex++}`}>
              <span className="text-gray-400">__</span>
              <span className="font-bold">{match[7]}</span>
              <span className="text-gray-400">__</span>
            </span>
          );
        }
        // Italic *text*
        else if (match[8]) {
          elements.push(
            <span key={`italic-${lineIndex}-${keyIndex++}`}>
              <span className="text-gray-400">*</span>
              <span className="italic">{match[9]}</span>
              <span className="text-gray-400">*</span>
            </span>
          );
        }
        // Italic _text_
        else if (match[10]) {
          elements.push(
            <span key={`italic2-${lineIndex}-${keyIndex++}`}>
              <span className="text-gray-400">_</span>
              <span className="italic">{match[11]}</span>
              <span className="text-gray-400">_</span>
            </span>
          );
        }
        // Code `text`
        else if (match[12]) {
          elements.push(
            <span key={`code-${lineIndex}-${keyIndex++}`}>
              <span className="text-gray-400">`</span>
              <span className="bg-gray-100 px-1 rounded font-mono text-sm">{match[13]}</span>
              <span className="text-gray-400">`</span>
            </span>
          );
        }

        lastEnd = match.index + match[0].length;
      }

      // Add remaining text
      if (lastEnd < line.length) {
        elements.push(
          <span key={`text-${lineIndex}-end`}>
            {line.substring(lastEnd)}
          </span>
        );
      }

      // If no formatting was found, just return the line
      if (elements.length === 0) {
        return (
          <div key={lineIndex}>
            {line || '\u00A0'}
          </div>
        );
      }

      return (
        <div key={lineIndex}>
          {elements}
        </div>
      );
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <div className="relative" style={{ height: minHeight, minHeight }}>
        {/* Formatted text overlay */}
        <div
          ref={formattedRef}
          className="absolute inset-0 p-3 font-mono text-sm whitespace-pre-wrap break-words overflow-y-auto overflow-x-hidden border rounded-md bg-white pointer-events-none"
          style={{ height: minHeight }}
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
          placeholder={placeholder}
          readOnly={readOnly}
          className="absolute inset-0 w-full h-full p-3 font-mono text-sm bg-transparent text-transparent caret-black border rounded-md resize-none overflow-y-auto overflow-x-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ caretColor: 'black' }}
        />
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Markdown: <span className="font-bold">**bold**</span>, <span className="italic">*italic*</span>, <span className="text-blue-600 font-bold"># headers</span>, <span className="text-gray-500 italic">&gt; quotes</span>, <span className="text-blue-600 underline">[links](url)</span>
      </div>
    </div>
  );
};

export default MarkdownEditor;