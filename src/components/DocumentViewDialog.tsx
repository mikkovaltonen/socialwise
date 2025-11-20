/**
 * Generic Document View Dialog
 *
 * Universal document viewer for all document types
 * Displays complete document with all sections in a modal dialog
 * Supports: LS-ilmoitus, Päätös, Asiakassuunnitelma, Asiakaskirjaus, PTA
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, X, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import MarkdownDocumentEditor, { DocumentType } from './MarkdownDocumentEditor';

// Custom components for ReactMarkdown to preserve line breaks
const markdownComponents = {
  p: ({ children }: any) => <p style={{ whiteSpace: 'pre-line' }}>{children}</p>,
};

interface DocumentData {
  fullText: string;
  sections?: Record<string, string>;
  filename?: string;
  date?: string;
  updatedBy?: string;
  updatedAt?: string;
}

interface DocumentViewDialogProps {
  open: boolean;
  onClose: () => void;
  documentType: DocumentType;
  document: DocumentData | null;
  clientId?: string;
  onSaved?: () => void;
}

// Document type display names
const documentTitles: Record<DocumentType, string> = {
  'ls-ilmoitus': 'Lastensuojeluhakemus',
  'päätös': 'Päätös',
  'pta': 'Palvelutarpeen Arviointi',
  'asiakassuunnitelma': 'Asiakassuunnitelma',
  'asiakaskirjaus': 'Asiakaskirjaus',
  'yhteystiedot': 'Yhteystiedot',
};

export const DocumentViewDialog: React.FC<DocumentViewDialogProps> = ({
  open,
  onClose,
  documentType,
  document,
  clientId = 'malliasiakas',
  onSaved,
}) => {
  const [showEditor, setShowEditor] = React.useState(false);

  const handleEdit = () => {
    console.log('🔵 [DocumentViewDialog] handleEdit called - opening editor');
    console.log('  - documentType:', documentType);
    console.log('  - document.filename:', document?.filename);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    console.log('🔵 [DocumentViewDialog] handleEditorClose called');
    setShowEditor(false);
  };

  const handleEditorSaved = () => {
    console.log('🔵 [DocumentViewDialog] handleEditorSaved called from MarkdownDocumentEditor');
    console.log('  - closing editor');
    setShowEditor(false);
    console.log('  - closing DocumentViewDialog');
    onClose();
    // Data will be refreshed by parent component
    if (onSaved) {
      console.log('🔄 [DocumentViewDialog] Calling parent onSaved (will trigger data refresh)');
      onSaved();
    }
  };

  if (!document) return null;

  const title = documentTitles[documentType] || 'Dokumentti';

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    {title}
                  </DialogTitle>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <Separator />

            {/* Audit Info */}
            {(document.updatedBy || document.updatedAt) && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    {document.updatedBy && (
                      <span>
                        <strong>Viimeisin muuttaja:</strong> {document.updatedBy}
                      </span>
                    )}
                    {document.updatedAt && (
                      <span>
                        <strong>Muutettu:</strong> {new Date(document.updatedAt).toLocaleString('fi-FI')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Full Document Sections */}
            <div className="space-y-6">
              {document.sections && Object.keys(document.sections).length > 0 ? (
                // Display sections if available, filter out STATUS comment
                Object.entries(document.sections)
                  .filter(([title]) => !title.includes('<!-- STATUS:'))
                  .map(([title, content], idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              ) : (
                // Fallback to full text with STATUS filtered out
                <Card>
                  <CardContent className="pt-6">
                   <div className="prose prose-sm max-w-none">
                     <ReactMarkdown components={markdownComponents}>
                       {document.fullText.replace(/<!--\s*STATUS:\s*(Kesken|Tulostettu)\s*-->\n*/g, '')}
                     </ReactMarkdown>
                   </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <Button
              variant="default"
              size="sm"
              onClick={handleEdit}
              className="flex items-center gap-2"
            >
              <Edit3 className="h-4 w-4" />
              MUOKKAA
            </Button>
            <Button variant="outline" onClick={onClose}>
              Sulje
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      {document && (
        <MarkdownDocumentEditor
          open={showEditor}
          onClose={handleEditorClose}
          documentType={documentType}
          clientId={clientId}
          existingContent={document.fullText}
          existingFilename={document.filename}
          onSaved={handleEditorSaved}
        />
      )}
    </>
  );
};

export default DocumentViewDialog;
