/**
 * PTA Document Dialog
 *
 * Full document viewer for PTA (Palvelutarpeen Arviointi) documents
 * Displays complete document with all sections in a modal dialog
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, Users, CheckCircle, X, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { PTARecord } from '@/data/ls-types';
import MarkdownDocumentEditor from './MarkdownDocumentEditor';

// Custom components for ReactMarkdown to preserve line breaks
const markdownComponents = {
  p: ({ children }: any) => <p style={{ whiteSpace: 'pre-line' }}>{children}</p>,
};

interface PTADocumentDialogProps {
  open: boolean;
  onClose: () => void;
  document: PTARecord | null;
  clientId?: string;
  onSaved?: () => void;
}

export const PTADocumentDialog: React.FC<PTADocumentDialogProps> = ({
  open,
  onClose,
  document,
  clientId = 'malliasiakas',
  onSaved,
}) => {
  const [showEditor, setShowEditor] = React.useState(false);

  const handleEdit = () => {
    console.log('🔵 [PTADocumentDialog] handleEdit called - opening editor');
    console.log('  - document.filename:', document?.filename);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    console.log('🔵 [PTADocumentDialog] handleEditorClose called');
    setShowEditor(false);
  };

  const handleEditorSaved = () => {
    console.log('🔵 [PTADocumentDialog] handleEditorSaved called from MarkdownDocumentEditor');
    console.log('  - closing editor');
    setShowEditor(false);

    // IMPORTANT: Call onSaved BEFORE onClose to ensure data refresh happens
    // onClose will unmount this component, so onSaved must be called first
    if (onSaved) {
      console.log('🔄 [PTADocumentDialog] Calling parent onSaved (will trigger data refresh)');
      onSaved();
    }

    console.log('  - closing PTADocumentDialog');
    onClose();
  };

  if (!document) return null;

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
                    Palvelutarpeen Arviointi
                  </DialogTitle>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
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

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4">
              {/* Participants */}
              {document.participants && document.participants.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Osallistujat
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {document.participants.map((participant, idx) => (
                        <Badge key={idx} variant="secondary">
                          {participant}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              {document.actions && document.actions.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Palvelut
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {document.actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Highlights */}
            {document.highlights && document.highlights.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Keskeiset kohdat
                  </h4>
                  <div className="space-y-2">
                    {document.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-white border border-blue-200 rounded-lg p-3"
                      >
                        <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-blue-800 italic">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

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

            {/* AI Guidance */}
            {document.aiGuidance && (
              <>
                <Separator />
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-purple-900 mb-3">
                      Suositellut palvelut ja tavoitteet
                    </h4>
                   <div className="prose prose-sm max-w-none text-purple-800">
                     <ReactMarkdown components={markdownComponents}>{document.aiGuidance}</ReactMarkdown>
                   </div>
                  </CardContent>
                </Card>
              </>
            )}
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
          documentType="pta"
          clientId={clientId}
          existingContent={document.fullText}
          existingFilename={document.filename}
          onSaved={handleEditorSaved}
        />
      )}
    </>
  );
};

export default PTADocumentDialog;
