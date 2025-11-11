import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';

const AineistoParsingDocumentation = () => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/Aineisto/DATA_PARSING_DOKUMENTAATIO.md');

        if (!response.ok) {
          throw new Error(`Failed to load documentation: ${response.statusText}`);
        }

        const text = await response.text();
        setContent(text);
        setError(null);
      } catch (err) {
        console.error('Error loading documentation:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocumentation();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Ladataan dokumentaatiota...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Virhe dokumentaation lataamisessa</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap">
      <ReactMarkdown
        components={{
          // Headings: Bold and yellow (like prompt style)
          h1: ({ children }) => (
            <h1 className="font-bold text-yellow-600 text-lg my-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-bold text-yellow-600 text-base my-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="font-bold text-yellow-600 text-sm my-1">
              {children}
            </h3>
          ),
          // Bold text
          strong: ({ children }) => (
            <strong className="font-bold">
              {children}
            </strong>
          ),
          // Remove all other rich formatting - render as plain text
          code: ({ children }) => <span>{children}</span>,
          pre: ({ children }) => <div className="my-2">{children}</div>,
          p: ({ children }) => <p className="my-1">{children}</p>,
          ul: ({ children }) => <div className="ml-4">{children}</div>,
          ol: ({ children }) => <div className="ml-4">{children}</div>,
          li: ({ children }) => <div className="my-0.5">• {children}</div>,
          blockquote: ({ children }) => <div className="ml-4 my-1">{children}</div>,
          table: ({ children }) => <div className="my-2">{children}</div>,
          thead: ({ children }) => <div>{children}</div>,
          tbody: ({ children }) => <div>{children}</div>,
          tr: ({ children }) => <div>{children}</div>,
          th: ({ children }) => <span className="font-bold mr-4">{children}</span>,
          td: ({ children }) => <span className="mr-4">{children}</span>,
          a: ({ href, children }) => <span>{children}</span>,
          hr: () => <div className="my-2">{'─'.repeat(80)}</div>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AineistoParsingDocumentation;
