import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FileText, Book, CreditCard, CheckCircle, Loader2, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ShoppingCart, Users, Briefcase, FileImage, ExternalLink, Download, Settings as SettingsIcon, Info, RotateCcw, Save, Upload, FileDown } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PDFViewer } from './PDFViewer';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  ChatInitDocument,
  loadChatInitConfig,
  saveChatInitConfig,
  getActiveChatInitDocuments,
  updateDocumentActiveState,
  resetToDefaultConfig,
  estimateContextSize,
  exportConfig,
  importConfig,
  // Async Firestore versions
  initializeChatConfig,
  loadChatInitConfigAsync,
  saveChatInitConfigAsync,
  updateDocumentActiveStateAsync,
  resetToDefaultConfigAsync,
  estimateContextSizeAsync
} from '@/lib/chatInitConfig';

interface PolicyDocument extends ChatInitDocument {
  icon: React.ReactNode;
  content?: string;
}

const ChatInitViewer: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('procurement');
  const [showSettings, setShowSettings] = useState(false);
  const [contextSize, setContextSize] = useState<{ totalSize: number; documents: Array<{ id: string; title: string; size: number }> } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  ]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load configuration on mount
  useEffect(() => {
    console.log('[ChatInitViewer] Component mounted, loading documents');
    const config = loadChatInitConfig();
    const docsWithIcons = config.map(doc => ({
      ...doc,
      icon: getDocumentIcon(doc.id),
      content: undefined
    }));
    setDocuments(docsWithIcons);
    loadDocuments(docsWithIcons);
    updateContextSize();
  }, []);

  // Helper function to get icon for document
  const getDocumentIcon = (id: string): React.ReactNode => {
    switch (id) {
      case 'procurement': return <FileText className="h-5 w-5" />;
      case 'payment': return <CreditCard className="h-5 w-5" />;
      case 'approval': return <CheckCircle className="h-5 w-5" />;
      case 'basware-shop': return <ShoppingCart className="h-5 w-5" />;
      case 'leased-workers': return <Users className="h-5 w-5" />;
      case 'external-workforce': return <Briefcase className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  useEffect(() => {
    console.log(`[ChatInitViewer] Active tab changed to: ${activeTab}`);
    // Reset to page 1 when changing tabs
    if (!currentPages[activeTab] || currentPages[activeTab] !== 1) {
      setCurrentPages(prev => ({ ...prev, [activeTab]: 1 }));
    }
  }, [activeTab]);

  const loadDocuments = async (docsToLoad?: PolicyDocument[]) => {
    setLoading(true);
    const docs = docsToLoad || documents;
    const updatedDocs = await Promise.all(
      docs.map(async (doc) => {
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

  const updateContextSize = async () => {
    const size = await estimateContextSize();
    setContextSize(size);
  };

  const handleToggleDocument = (docId: string, active: boolean) => {
    updateDocumentActiveState(docId, active);
    setDocuments(prev => prev.map(doc =>
      doc.id === docId ? { ...doc, active } : doc
    ));
    updateContextSize();
    toast.success(`${active ? 'Enabled' : 'Disabled'} document in chat context`);
  };

  const handleResetToDefaults = () => {
    resetToDefaultConfig();
    const config = loadChatInitConfig();
    const docsWithIcons = config.map(doc => ({
      ...doc,
      icon: getDocumentIcon(doc.id),
      content: documents.find(d => d.id === doc.id)?.content
    }));
    setDocuments(docsWithIcons);
    updateContextSize();
    toast.success('Configuration reset to defaults');
  };

  const handleExportConfig = () => {
    const configJson = exportConfig();
    const blob = new Blob([configJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat-init-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Configuration exported');
  };

  const handleImportConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (importConfig(content)) {
        const config = loadChatInitConfig();
        const docsWithIcons = config.map(doc => ({
          ...doc,
          icon: getDocumentIcon(doc.id),
          content: documents.find(d => d.id === doc.id)?.content
        }));
        setDocuments(docsWithIcons);
        updateContextSize();
        toast.success('Configuration imported successfully');
      } else {
        toast.error('Failed to import configuration');
      }
    };
    reader.readAsText(file);

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activeDocument = documents.find(doc => doc.id === activeTab);
  const activeDocuments = documents.filter(doc => doc.active);
  const inactiveDocuments = documents.filter(doc => !doc.active);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="h-6 w-6 text-green-700" />
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Chat Initialization Context</h2>
              <p className="text-sm text-gray-600 mt-1">
                {activeDocuments.length} of {documents.length} documents active •
                {contextSize ? ` ~${Math.round(contextSize.totalSize / 1000)}k tokens` : ' Loading...'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2"
          >
            <SettingsIcon className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-6 pt-4">
          <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 w-full max-w-6xl">
            {documents.filter(doc => doc.active).map((doc) => (
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
          {documents.filter(doc => doc.active).map((doc) => (
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
          <strong>Note:</strong> Active documents ({activeDocuments.length}) are automatically available to the AI assistant. Configure which documents to include using the settings button.
        </p>
      </div>

      {/* Configuration Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Chat Context Documents</DialogTitle>
            <DialogDescription>
              Select which documents should be included in the AI assistant's context. Active documents are automatically loaded when starting a chat session.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Context Size Info */}
            {contextSize && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Total Context Size:</strong> ~{Math.round(contextSize.totalSize / 1000)}k tokens
                  {contextSize.totalSize > 100000 && (
                    <span className="text-orange-600"> (Consider reducing for better performance)</span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Separator />

            {/* Document List */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Available Documents</h3>
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                >
                  <Switch
                    id={`doc-${doc.id}`}
                    checked={doc.active}
                    onCheckedChange={(checked) => handleToggleDocument(doc.id, checked)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1">
                    <Label
                      htmlFor={`doc-${doc.id}`}
                      className="text-sm font-medium cursor-pointer flex items-center gap-2"
                    >
                      {doc.icon}
                      {doc.title}
                      {doc.active && (
                        <Badge variant="default" className="text-xs">Active</Badge>
                      )}
                    </Label>
                    <p className="text-xs text-gray-600">{doc.description}</p>
                    {doc.category && (
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                    )}
                    {contextSize?.documents.find(d => d.id === doc.id) && (
                      <span className="text-xs text-gray-500">
                        ~{Math.round(contextSize.documents.find(d => d.id === doc.id)!.size / 1000)}k tokens
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Configuration Actions */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetToDefaults}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportConfig}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export Config
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Config
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportConfig}
                className="hidden"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSettings(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInitViewer;