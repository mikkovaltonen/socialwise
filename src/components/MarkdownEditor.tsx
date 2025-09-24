import React, { useRef, useEffect } from 'react';
import { Label } from "@/components/ui/label";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  minHeight?: string;
  className?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter text... Supports **bold**, *italic*, # headers, lists, and more!",
  label = "Content",
  minHeight = "300px",
  className = ""
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
      // Check for headers
      if (line.startsWith('### ')) {
        return (
          <div key={lineIndex} className="text-lg font-semibold text-blue-700">
            {line}
          </div>
        );
      } else if (line.startsWith('## ')) {
        return (
          <div key={lineIndex} className="text-xl font-bold text-blue-800">
            {line}
          </div>
        );
      } else if (line.startsWith('# ')) {
        return (
          <div key={lineIndex} className="text-2xl font-bold text-blue-900">
            {line}
          </div>
        );
      }

      // Process inline formatting
      let processedLine = line;
      const elements: React.ReactNode[] = [];
      let lastIndex = 0;

      // Process bold (**text** or __text__)
      const boldRegex = /(\*\*|__)(.*?)\1/g;
      let boldMatch;
      const tempLine = processedLine;

      while ((boldMatch = boldRegex.exec(tempLine)) !== null) {
        if (boldMatch.index > lastIndex) {
          elements.push(
            <span key={`text-${lineIndex}-${lastIndex}`}>
              {tempLine.substring(lastIndex, boldMatch.index)}
            </span>
          );
        }
        elements.push(
          <span key={`bold-${lineIndex}-${boldMatch.index}`} className="font-bold text-green-700">
            {boldMatch[0]}
          </span>
        );
        lastIndex = boldMatch.index + boldMatch[0].length;
      }

      // Process italic (*text* or _text_) - but not if it's part of bold
      const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
      let italicMatch;
      while ((italicMatch = italicRegex.exec(tempLine)) !== null) {
        // Skip if this overlaps with bold
        if (italicMatch.index >= lastIndex) {
          if (italicMatch.index > lastIndex) {
            elements.push(
              <span key={`text-${lineIndex}-${lastIndex}-i`}>
                {tempLine.substring(lastIndex, italicMatch.index)}
              </span>
            );
          }
          elements.push(
            <span key={`italic-${lineIndex}-${italicMatch.index}`} className="italic text-purple-600">
              {italicMatch[0]}
            </span>
          );
          lastIndex = italicMatch.index + italicMatch[0].length;
        }
      }

      // Add remaining text
      if (lastIndex < tempLine.length) {
        elements.push(
          <span key={`text-${lineIndex}-end`}>
            {tempLine.substring(lastIndex)}
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
          placeholder={placeholder}
          className="absolute inset-0 w-full h-full p-3 font-mono text-sm bg-transparent text-transparent caret-black border rounded-md resize-none overflow-y-auto overflow-x-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{ caretColor: 'black' }}
        />
      </div>

      <div className="text-xs text-gray-500 mt-2">
        Markdown: <span className="font-bold text-green-700">**bold**</span>, <span className="italic text-purple-600">*italic*</span>, <span className="text-blue-800 font-semibold">## headers</span>, - lists, [links](url)
      </div>
    </div>
  );
};

export default MarkdownEditor;