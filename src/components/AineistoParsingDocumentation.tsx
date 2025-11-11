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
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        components={{
          // Customized heading styles
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-8 pb-2 border-b-2 border-blue-600">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold text-gray-800 mb-3 mt-6">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xl font-semibold text-gray-700 mb-2 mt-4">
              {children}
            </h3>
          ),
          // Code blocks with syntax highlighting
          code: ({ inline, children }) => {
            if (inline) {
              return (
                <code className="bg-gray-100 text-red-600 px-2 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                {children}
              </code>
            );
          },
          // Tables with better styling
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900 border-b border-gray-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
              {children}
            </td>
          ),
          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic text-gray-700">
              {children}
            </blockquote>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 my-3 text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 my-3 text-gray-700">
              {children}
            </ol>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // Horizontal rule
          hr: () => <hr className="my-8 border-t-2 border-gray-300" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default AineistoParsingDocumentation;
