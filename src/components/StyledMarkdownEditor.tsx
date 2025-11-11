/**
 * Styled Markdown Editor
 *
 * Shows markdown formatting visually (# headers are larger, ** bold text is bold)
 * BUT keeps the raw markdown symbols visible (**, #, etc.)
 */

import React, { useRef, useEffect } from 'react';

interface StyledMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const StyledMarkdownEditor: React.FC<StyledMarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  id,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Apply styling when value changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.textContent !== value) {
      editorRef.current.textContent = value;
      applyFormatting();
    }
  }, [value]);

  const applyFormatting = () => {
    if (!editorRef.current) return;

    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    const cursorPosition = range ? range.startOffset : 0;

    // Get text content
    const text = editorRef.current.textContent || '';

    // Clear editor
    editorRef.current.innerHTML = '';

    // Split by lines
    const lines = text.split('\n');

    lines.forEach((line, lineIndex) => {
      const lineDiv = document.createElement('div');
      lineDiv.className = 'min-h-[1.5rem]'; // Ensure empty lines have height

      // Check if line is a header
      if (line.startsWith('# ')) {
        lineDiv.className += ' text-2xl font-bold text-gray-900';
        lineDiv.textContent = line;
      } else if (line.startsWith('## ')) {
        lineDiv.className += ' text-xl font-bold text-gray-800';
        lineDiv.textContent = line;
      } else if (line.startsWith('### ')) {
        lineDiv.className += ' text-lg font-semibold text-gray-800';
        lineDiv.textContent = line;
      } else {
        // Process inline formatting (bold with **)
        const segments = line.split(/(\*\*.*?\*\*)/g);

        segments.forEach(segment => {
          if (segment.startsWith('**') && segment.endsWith('**')) {
            const span = document.createElement('span');
            span.className = 'font-bold text-gray-900';
            span.textContent = segment; // Keep the ** symbols
            lineDiv.appendChild(span);
          } else {
            const textNode = document.createTextNode(segment);
            lineDiv.appendChild(textNode);
          }
        });
      }

      editorRef.current?.appendChild(lineDiv);
    });
  };

  const handleInput = () => {
    if (!editorRef.current) return;

    const text = editorRef.current.textContent || '';
    onChange(text);
    applyFormatting();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="relative">
      <style>{`
        .styled-markdown-editor[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .styled-markdown-editor:focus {
          outline: none;
          ring: 2px;
          ring-color: #3b82f6;
        }
      `}</style>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        className={`
          styled-markdown-editor
          border border-gray-300 rounded-md p-3 min-h-[400px]
          font-mono text-sm text-gray-900
          focus:border-blue-500 focus:ring-2 focus:ring-blue-500
          overflow-y-auto
          bg-white
          ${className}
        `}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
        data-placeholder={placeholder}
        id={id}
      />
    </div>
  );
};

export default StyledMarkdownEditor;
