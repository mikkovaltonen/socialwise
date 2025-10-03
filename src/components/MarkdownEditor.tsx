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

  // Function to render markdown-style formatting with colors
  // This maintains exact character positioning for cursor alignment
  const renderFormattedText = (text: string) => {
    if (!text && !isFocused) return <span className="text-gray-400">{placeholder}</span>;
    if (!text) return <span>&nbsp;</span>;

    // Split text into lines for processing
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // For empty lines, render a non-breaking space to maintain line height
      if (line === '') {
        return (
          <div key={lineIndex} style={{ minHeight: '1.5em' }}>
            &nbsp;
          </div>
        );
      }

      // Create an array of styled characters/segments
      const segments: JSX.Element[] = [];
      let currentIndex = 0;

      // Helper to add plain text
      const addPlainText = (text: string, startIdx: number) => {
        return text.split('').map((char, i) => (
          <span key={`char-${lineIndex}-${startIdx + i}`}>
            {char}
          </span>
        ));
      };

      // Check for headers (whole line styling)
      let lineClass = "";
      let isHeader = false;

      if (line.startsWith('# ')) {
        lineClass = "text-blue-600 font-bold";
        isHeader = true;
      } else if (line.startsWith('## ')) {
        lineClass = "text-blue-600 font-bold";
        isHeader = true;
      } else if (line.startsWith('### ')) {
        lineClass = "text-blue-600 font-bold";
        isHeader = true;
      } else if (line.startsWith('> ')) {
        lineClass = "text-gray-500 italic";
      }

      // If it's a header or quote, apply style to entire line
      if (isHeader || line.startsWith('> ')) {
        return (
          <div key={lineIndex} className={lineClass}>
            {line.split('').map((char, i) => (
              <span key={`char-${lineIndex}-${i}`}>
                {char}
              </span>
            ))}
          </div>
        );
      }

      // Process inline formatting character by character
      let i = 0;
      while (i < line.length) {
        let matched = false;

        // Check for bold **text**
        if (line.substring(i, i + 2) === '**') {
          const endIndex = line.indexOf('**', i + 2);
          if (endIndex !== -1) {
            // Add the opening **
            segments.push(
              <span key={`bold-open-${lineIndex}-${i}`} className="text-gray-400">*</span>
            );
            segments.push(
              <span key={`bold-open2-${lineIndex}-${i}`} className="text-gray-400">*</span>
            );

            // Add the bold text
            const boldText = line.substring(i + 2, endIndex);
            boldText.split('').forEach((char, idx) => {
              segments.push(
                <span key={`bold-text-${lineIndex}-${i + 2 + idx}`} className="font-bold">
                  {char}
                </span>
              );
            });

            // Add the closing **
            segments.push(
              <span key={`bold-close-${lineIndex}-${endIndex}`} className="text-gray-400">*</span>
            );
            segments.push(
              <span key={`bold-close2-${lineIndex}-${endIndex}`} className="text-gray-400">*</span>
            );

            i = endIndex + 2;
            matched = true;
          }
        }

        // Check for italic *text* (single asterisk)
        else if (line[i] === '*' && line[i + 1] !== '*' && i > 0 && line[i - 1] !== '*') {
          const endIndex = line.indexOf('*', i + 1);
          if (endIndex !== -1 && line[endIndex + 1] !== '*' && line[endIndex - 1] !== '*') {
            // Add the opening *
            segments.push(
              <span key={`italic-open-${lineIndex}-${i}`} className="text-gray-400">*</span>
            );

            // Add the italic text
            const italicText = line.substring(i + 1, endIndex);
            italicText.split('').forEach((char, idx) => {
              segments.push(
                <span key={`italic-text-${lineIndex}-${i + 1 + idx}`} className="italic">
                  {char}
                </span>
              );
            });

            // Add the closing *
            segments.push(
              <span key={`italic-close-${lineIndex}-${endIndex}`} className="text-gray-400">*</span>
            );

            i = endIndex + 1;
            matched = true;
          }
        }

        // Check for code `text`
        else if (line[i] === '`') {
          const endIndex = line.indexOf('`', i + 1);
          if (endIndex !== -1) {
            // Add the opening `
            segments.push(
              <span key={`code-open-${lineIndex}-${i}`} className="text-gray-400">`</span>
            );

            // Add the code text
            const codeText = line.substring(i + 1, endIndex);
            codeText.split('').forEach((char, idx) => {
              segments.push(
                <span key={`code-text-${lineIndex}-${i + 1 + idx}`} className="bg-gray-100 px-0.5">
                  {char}
                </span>
              );
            });

            // Add the closing `
            segments.push(
              <span key={`code-close-${lineIndex}-${endIndex}`} className="text-gray-400">`</span>
            );

            i = endIndex + 1;
            matched = true;
          }
        }

        // Check for links [text](url)
        else if (line[i] === '[') {
          const closeBracket = line.indexOf(']', i + 1);
          if (closeBracket !== -1 && line[closeBracket + 1] === '(') {
            const closeParen = line.indexOf(')', closeBracket + 2);
            if (closeParen !== -1) {
              // Add [
              segments.push(
                <span key={`link-open-${lineIndex}-${i}`} className="text-gray-400">[</span>
              );

              // Add link text
              const linkText = line.substring(i + 1, closeBracket);
              linkText.split('').forEach((char, idx) => {
                segments.push(
                  <span key={`link-text-${lineIndex}-${i + 1 + idx}`} className="text-blue-600 underline">
                    {char}
                  </span>
                );
              });

              // Add ](
              segments.push(
                <span key={`link-mid-${lineIndex}-${closeBracket}`} className="text-gray-400">]</span>
              );
              segments.push(
                <span key={`link-mid2-${lineIndex}-${closeBracket}`} className="text-gray-400">(</span>
              );

              // Add URL
              const url = line.substring(closeBracket + 2, closeParen);
              url.split('').forEach((char, idx) => {
                segments.push(
                  <span key={`link-url-${lineIndex}-${closeBracket + 2 + idx}`} className="text-blue-600 underline">
                    {char}
                  </span>
                );
              });

              // Add )
              segments.push(
                <span key={`link-close-${lineIndex}-${closeParen}`} className="text-gray-400">)</span>
              );

              i = closeParen + 1;
              matched = true;
            }
          }
        }

        // If no match, add the character as-is
        if (!matched) {
          segments.push(
            <span key={`char-${lineIndex}-${i}`}>
              {line[i]}
            </span>
          );
          i++;
        }
      }

      return (
        <div key={lineIndex} style={{ minHeight: '1.5em' }}>
          {segments.length > 0 ? segments : <span>&nbsp;</span>}
        </div>
      );
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <div className="relative" style={{ height: minHeight, minHeight }}>
        {/* Formatted text overlay - exact same positioning as textarea */}
        <div
          ref={formattedRef}
          className="absolute inset-0 p-3 font-mono text-sm whitespace-pre overflow-y-auto overflow-x-hidden border rounded-md bg-white pointer-events-none leading-normal"
          style={{
            height: minHeight,
            wordBreak: 'break-all',
            letterSpacing: 'normal'
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
            wordBreak: 'break-all',
            letterSpacing: 'normal'
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