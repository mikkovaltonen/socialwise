import React, { useRef, useState } from 'react';
import { Label } from "@/components/ui/label";
import ReactMarkdown from 'react-markdown';

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

  // Safe rendering using react-markdown
  const renderFormattedText = (text: string) => {
    if (!text && !isFocused) return <span className="text-gray-400">{placeholder}</span>;
    if (!text) return <span>&nbsp;</span>;

    return (
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown
          components={{
            // Style markdown elements to match the editor's design
            h1: ({children}) => <h1 className="text-blue-600 font-bold text-xl">{children}</h1>,
            h2: ({children}) => <h2 className="text-blue-600 font-bold text-lg">{children}</h2>,
            h3: ({children}) => <h3 className="text-blue-600 font-bold text-base">{children}</h3>,
            strong: ({children}) => <strong className="font-bold">{children}</strong>,
            em: ({children}) => <em className="italic">{children}</em>,
            code: ({children}) => <code className="bg-gray-100 px-1 rounded">{children}</code>,
            a: ({children, href}) => <a href={href} className="text-blue-600 underline">{children}</a>,
            blockquote: ({children}) => <blockquote className="text-gray-500 italic border-l-4 border-gray-300 pl-4">{children}</blockquote>,
            p: ({children}) => <p className="mb-2">{children}</p>,
            ul: ({children}) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
            ol: ({children}) => <ol className="list-decimal ml-4 mb-2">{children}</ol>,
            li: ({children}) => <li className="mb-1">{children}</li>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <Label>{label}</Label>}

      <div className="relative" style={{ minHeight }}>
        {/* Formatted text overlay */}
        <div
          ref={formattedRef}
          className="absolute inset-0 p-3 font-mono text-sm overflow-y-auto overflow-x-hidden border rounded-md bg-white pointer-events-none leading-normal"
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