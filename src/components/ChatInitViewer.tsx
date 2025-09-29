import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Book, CreditCard, CheckCircle, Loader2, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ShoppingCart, Users, Briefcase, FileImage, ExternalLink, Download } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFViewer } from './PDFViewer';

interface PolicyDocument {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  pdfPath?: string;
  content?: string;
  type?: 'markdown' | 'pdf' | 'both';
}

const ChatInitViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('procurement');
  const [currentPages, setCurrentPages] = useState<{ [key: string]: number }>({
    procurement: 1,
    payment: 1,
    approval: 1,
    'basware-shop': 1,
    'leased-workers': 1,
    'external-workforce': 1
  });
  const LINES_PER_PAGE = 50; // Approximate lines per page
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
      id: 'basware-shop',
      title: 'Basware Shop Instructions',
      description: 'Guided freetext order instructions for Basware Shop procurement system (includes visual guides)',
      icon: <ShoppingCart className="h-5 w-5" />,
      path: '/chat_init_contect/basware-shop-instructions.md',
      pdfPath: '/chat_init_contect/Guided freetext order instructions for Basware Shop.pdf',
      type: 'both'
    },
    {
      id: 'leased-workers',
      title: 'Leased Workers Process',
      description: 'Process instructions for managing leased workers in Workday system',
      icon: <Users className="h-5 w-5" />,
      path: '/chat_init_contect/leased-workers-process.md'
    },
    {
      id: 'external-workforce',
      title: 'External Workforce Policy',
      description: 'Policy guidelines for external workforce management and compliance',
      icon: <Briefcase className="h-5 w-5" />,
      path: '/chat_init_contect/external-workforce-policy.md'
    }
  ]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('[ChatInitViewer] Component mounted, loading documents');
    loadDocuments();
  }, []);

  useEffect(() => {
    console.log(`[ChatInitViewer] Active tab changed to: ${activeTab}`);
    // Reset to page 1 when changing tabs
    if (!currentPages[activeTab] || currentPages[activeTab] !== 1) {
      setCurrentPages(prev => ({ ...prev, [activeTab]: 1 }));
    }
  }, [activeTab]);

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

  // Paging functions
  const getPageContent = (content: string, pageNumber: number) => {
    const lines = content.split('\n');
    const totalLines = lines.length;
    const totalPages = Math.ceil(totalLines / LINES_PER_PAGE);
    
    const startLine = (pageNumber - 1) * LINES_PER_PAGE;
    const endLine = Math.min(startLine + LINES_PER_PAGE, totalLines);
    
    const pageContent = lines.slice(startLine, endLine).join('\n');
    
    return {
      content: pageContent,
      currentPage: pageNumber,
      totalPages: totalPages,
      totalLines: totalLines,
      startLine: startLine + 1,
      endLine: endLine
    };
  };

  const navigateToPage = (docId: string, pageNumber: number) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc || !doc.content) return;
    
    const pageInfo = getPageContent(doc.content, pageNumber);
    if (pageNumber >= 1 && pageNumber <= pageInfo.totalPages) {
      setCurrentPages(prev => ({ ...prev, [docId]: pageNumber }));
      console.log(`[ChatInitViewer] Navigated to page ${pageNumber} of ${pageInfo.totalPages} for ${docId}`);
    }
  };


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
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 w-full max-w-6xl">
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
                   doc.id === 'basware-shop' ? 'Basware' :
                   doc.id === 'leased-workers' ? 'Leased' :
                   'External'}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-6 overflow-hidden min-h-0">
          {documents.map((doc) => (
            <TabsContent 
              key={doc.id} 
              value={doc.id} 
              className="h-full mt-4"
            >
              <Card className="h-full flex flex-col border-green-200 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-white border-b">
                  <CardTitle className="flex items-center gap-3 text-green-800">
                    {doc.icon}
                    {doc.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                </CardHeader>
                <CardContent className="flex-1 p-0 relative min-h-0 overflow-hidden">
                  {/* Show PDF/Markdown toggle for documents with both formats */}
                  {doc.type === 'both' && (
                    <div className="px-6 py-3 bg-blue-50 border-b flex items-center justify-between">
                      <Alert className="mb-0">
                        <FileImage className="h-4 w-4" />
                        <AlertDescription>
                          This document has visual content. View the PDF for complete information including images and diagrams.
                        </AlertDescription>
                      </Alert>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.pdfPath, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View PDF
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.pdfPath || '';
                            link.download = doc.pdfPath?.split('/').pop() || 'document.pdf';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  )}
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    </div>
                  ) : doc.content ? (
                    (() => {
                      const pageInfo = getPageContent(doc.content, currentPages[doc.id] || 1);
                      return (
                        <div className="relative h-full flex flex-col">
                          {/* Page info header */}
                          <div className="px-6 py-2 bg-gray-50 border-b flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Page {pageInfo.currentPage} of {pageInfo.totalPages} 
                              <span className="ml-2 text-xs text-gray-500">
                                (Lines {pageInfo.startLine}-{pageInfo.endLine} of {pageInfo.totalLines})
                              </span>
                            </span>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigateToPage(doc.id, 1)}
                                disabled={pageInfo.currentPage === 1}
                                title="First page"
                              >
                                <ChevronsLeft className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigateToPage(doc.id, pageInfo.currentPage - 1)}
                                disabled={pageInfo.currentPage === 1}
                                title="Previous page"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </Button>
                              <span className="px-3 py-1 text-sm flex items-center">
                                {pageInfo.currentPage} / {pageInfo.totalPages}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigateToPage(doc.id, pageInfo.currentPage + 1)}
                                disabled={pageInfo.currentPage === pageInfo.totalPages}
                                title="Next page"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigateToPage(doc.id, pageInfo.totalPages)}
                                disabled={pageInfo.currentPage === pageInfo.totalPages}
                                title="Last page"
                              >
                                <ChevronsRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Content area */}
                          <ScrollArea className="flex-1 w-full">
                        <div className="p-6 pb-12">
                          <div className="prose prose-sm max-w-none prose-gray">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeSlug]}
                            components={{
                              h1: ({children, id}) => (
                                <h1 id={id} className="text-2xl font-bold text-gray-900 mb-4 mt-6 scroll-mt-20">
                                  {children}
                                </h1>
                              ),
                              h2: ({children, id}) => (
                                <h2 id={id} className="text-xl font-semibold text-gray-800 mb-3 mt-5 scroll-mt-20">
                                  {children}
                                </h2>
                              ),
                              h3: ({children, id}) => (
                                <h3 id={id} className="text-lg font-medium text-gray-700 mb-2 mt-4 scroll-mt-20">
                                  {children}
                                </h3>
                              ),
                              h4: ({children, id}) => (
                                <h4 id={id} className="text-base font-medium text-gray-700 mb-2 mt-3 scroll-mt-20">
                                  {children}
                                </h4>
                              ),
                              p: ({children}) => <p className="text-gray-600 mb-3 leading-relaxed">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-600">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-600">{children}</ol>,
                              li: ({children}) => <li className="ml-4">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold text-gray-800">{children}</strong>,
                              a: ({href, children}) => {
                                // Handle internal links with smooth scrolling
                                if (href?.startsWith('#')) {
                                  return (
                                    <a
                                      href={href}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        const targetId = href.substring(1);
                                        console.log(`[ChatInitViewer] Internal link clicked: ${href} -> ${targetId}`);
                                        
                                        const targetElement = document.getElementById(targetId);
                                        if (targetElement) {
                                          console.log(`[ChatInitViewer] Found target element:`, targetElement);
                                          
                                          // Find the ScrollArea viewport for this document
                                          const scrollViewport = targetElement.closest('[data-radix-scroll-area-viewport]');
                                          if (scrollViewport) {
                                            // Get the content container (first child of viewport)
                                            const contentContainer = scrollViewport.firstElementChild;
                                            if (contentContainer) {
                                              // Calculate the target's position relative to the content container
                                              const targetRect = targetElement.getBoundingClientRect();
                                              const containerRect = contentContainer.getBoundingClientRect();
                                              const relativeTop = targetRect.top - containerRect.top + scrollViewport.scrollTop;
                                              
                                              console.log(`[ChatInitViewer] Scrolling to internal link:`, {
                                                targetTop: targetRect.top,
                                                containerTop: containerRect.top,
                                                currentScroll: scrollViewport.scrollTop,
                                                targetScroll: relativeTop
                                              });
                                              
                                              scrollViewport.scrollTo({ top: relativeTop - 100, behavior: 'smooth' }); // -100 for some top margin
                                            }
                                          } else {
                                            console.log(`[ChatInitViewer] No ScrollArea found, using standard scrollIntoView`);
                                            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                          }
                                        } else {
                                          console.warn(`[ChatInitViewer] Target element not found: ${targetId}`);
                                        }
                                      }}
                                      className="text-green-600 hover:text-green-700 underline cursor-pointer"
                                    >
                                      {children}
                                    </a>
                                  );
                                }
                                return (
                                  <a href={href} className="text-green-600 hover:text-green-700 underline" target="_blank" rel="noopener noreferrer">
                                    {children}
                                  </a>
                                );
                              },
                              table: ({children}) => (
                                <div className="my-6 w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                                  <table className="w-full border-collapse bg-white">{children}</table>
                                </div>
                              ),
                              thead: ({children}) => (
                                <thead className="bg-green-50 border-b-2 border-green-200">
                                  {children}
                                </thead>
                              ),
                              tbody: ({children}) => (
                                <tbody className="divide-y divide-gray-100">
                                  {children}
                                </tbody>
                              ),
                              tr: ({children}) => (
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                  {children}
                                </tr>
                              ),
                              th: ({children, style}) => {
                                // Extract text alignment from style prop if present
                                const align = (style?.textAlign as 'left' | 'center' | 'right') || 'left';
                                // Check if this is likely an abbreviation column (short content)
                                const content = String(children);
                                const isAbbreviation = content && content.length < 15 && !content.includes(' ');
                                
                                return (
                                  <th 
                                    className={`px-6 py-3 text-sm font-semibold text-gray-900 ${
                                      isAbbreviation ? 'w-32' : ''
                                    } ${
                                      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                                    }`}
                                  >
                                    {children}
                                  </th>
                                );
                              },
                              td: ({children, style}) => {
                                // Extract text alignment from style prop if present
                                const align = (style?.textAlign as 'left' | 'center' | 'right') || 'left';
                                const content = String(children);
                                const isAbbreviation = content && content.length < 15 && !content.includes(' ');
                                
                                return (
                                  <td 
                                    className={`px-6 py-3 text-sm text-gray-700 ${
                                      isAbbreviation ? 'font-mono font-medium' : ''
                                    } ${
                                      align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'
                                    }`}
                                  >
                                    {children}
                                  </td>
                                );
                              },
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
                            {pageInfo.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                          </ScrollArea>
                          
                          {/* Page navigation footer */}
                          <div className="px-6 py-3 bg-gray-50 border-t flex justify-center gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => navigateToPage(doc.id, 1)}
                              disabled={pageInfo.currentPage === 1}
                            >
                              First
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigateToPage(doc.id, pageInfo.currentPage - 1)}
                              disabled={pageInfo.currentPage === 1}
                            >
                              Previous
                            </Button>
                            <div className="flex items-center px-3">
                              <input
                                type="number"
                                min="1"
                                max={pageInfo.totalPages}
                                value={pageInfo.currentPage}
                                onChange={(e) => {
                                  const page = parseInt(e.target.value) || 1;
                                  navigateToPage(doc.id, page);
                                }}
                                className="w-16 px-2 py-1 text-center border rounded"
                              />
                              <span className="ml-2 text-sm text-gray-600">of {pageInfo.totalPages}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigateToPage(doc.id, pageInfo.currentPage + 1)}
                              disabled={pageInfo.currentPage === pageInfo.totalPages}
                            >
                              Next
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => navigateToPage(doc.id, pageInfo.totalPages)}
                              disabled={pageInfo.currentPage === pageInfo.totalPages}
                            >
                              Last
                            </Button>
                          </div>
                        </div>
                      );
                    })()
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