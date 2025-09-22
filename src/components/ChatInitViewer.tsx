import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Book, CreditCard, CheckCircle, Loader2, TrendingUp } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { ScrollArea } from "@/components/ui/scroll-area";

interface PolicyDocument {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  content?: string;
}

const ChatInitViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('procurement');
  const [documents, setDocuments] = useState<PolicyDocument[]>([
    {
      id: 'procurement',
      title: 'Valmet Global Procurement Policy',
      description: 'Purchasing and payment processes, supplier management, buying channels, and compliance requirements',
      icon: <FileText className="h-5 w-5" />,
      path: '/chat_init_contect/valmet-procurement-policy.md'
    },
    {
      id: 'payment',
      title: 'Valmet Global Payment Policy',
      description: 'Payment channels, frequency, authorization requirements, and exception handling',
      icon: <CreditCard className="h-5 w-5" />,
      path: '/chat_init_contect/valmet-payment-policy.md'
    },
    {
      id: 'approval',
      title: 'Valmet Approval Limits Policy',
      description: 'Purchase invoice approval limits, rights management, and compliance framework',
      icon: <CheckCircle className="h-5 w-5" />,
      path: '/chat_init_contect/valmet-approval-limits-policy.md'
    },
    {
      id: 'supplier-spend',
      title: 'Valmet Supplier & Spend Data 2023',
      description: 'Finland supplier spending data, categories, and payment metrics for 2023 operations',
      icon: <TrendingUp className="h-5 w-5" />,
      path: '/chat_init_contect/valmet-supplier-spend-data.md'
    }
  ]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const updatedDocs = await Promise.all(
      documents.map(async (doc) => {
        try {
          const response = await fetch(doc.path);
          if (response.ok) {
            const content = await response.text();
            return { ...doc, content };
          }
        } catch (error) {
          console.error(`Failed to load ${doc.title}:`, error);
        }
        return doc;
      })
    );
    setDocuments(updatedDocs);
    setLoading(false);
  };

  const activeDocument = documents.find(doc => doc.id === activeTab);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-gradient-to-r from-green-50 to-green-100">
        <div className="flex items-center gap-3">
          <Book className="h-6 w-6 text-green-700" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Chat Initialization Context</h2>
            <p className="text-sm text-gray-600 mt-1">
              These Valmet policies are automatically loaded as context for the AI assistant
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full max-w-5xl">
            {documents.map((doc) => (
              <TabsTrigger 
                key={doc.id} 
                value={doc.id}
                className="flex items-center gap-2"
              >
                {doc.icon}
                <span className="hidden sm:inline">{doc.title.replace('Valmet Global ', '').replace('Valmet ', '')}</span>
                <span className="sm:hidden">
                  {doc.id === 'procurement' ? 'Procurement' : 
                   doc.id === 'payment' ? 'Payment' : 
                   doc.id === 'approval' ? 'Approval' :
                   'Spend Data'}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-6 overflow-hidden">
          {documents.map((doc) => (
            <TabsContent 
              key={doc.id} 
              value={doc.id} 
              className="h-full mt-4"
            >
              <Card className="h-full flex flex-col border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b">
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    {doc.icon}
                    {doc.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : doc.content ? (
                    <ScrollArea className="h-full">
                      <div className="p-6">
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                              h2: ({children}) => <h2 className="text-xl font-semibold text-gray-800 mb-3 mt-5">{children}</h2>,
                              h3: ({children}) => <h3 className="text-lg font-medium text-gray-700 mb-2 mt-4">{children}</h3>,
                              h4: ({children}) => <h4 className="text-base font-medium text-gray-700 mb-2 mt-3">{children}</h4>,
                              p: ({children}) => <p className="text-gray-600 mb-3 leading-relaxed">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-600">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-600">{children}</ol>,
                              li: ({children}) => <li className="ml-4">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                              table: ({children}) => (
                                <div className="overflow-x-auto mb-4">
                                  <table className="min-w-full border-collapse border border-gray-300">{children}</table>
                                </div>
                              ),
                              thead: ({children}) => <thead className="bg-gray-100">{children}</thead>,
                              tbody: ({children}) => <tbody>{children}</tbody>,
                              tr: ({children}) => <tr className="border-b border-gray-300">{children}</tr>,
                              th: ({children}) => <th className="border border-gray-300 px-4 py-2 text-left font-semibold text-gray-800">{children}</th>,
                              td: ({children}) => <td className="border border-gray-300 px-4 py-2 text-gray-600">{children}</td>,
                              blockquote: ({children}) => (
                                <blockquote className="border-l-4 border-green-500 pl-4 my-3 italic text-gray-700">{children}</blockquote>
                              ),
                              code: ({children, className}) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-sm text-gray-800">{children}</code>
                                ) : (
                                  <code className="block bg-gray-100 p-3 rounded text-sm overflow-x-auto">{children}</code>
                                );
                              }
                            }}
                          >
                            {doc.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <p>Document not found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Info Footer */}
      <div className="px-6 py-3 border-t bg-green-50">
        <p className="text-xs text-green-700 text-center">
          <strong>Note:</strong> These documents are automatically available to the AI assistant for providing accurate, policy-compliant responses.
        </p>
      </div>
    </div>
  );
};

export default ChatInitViewer;