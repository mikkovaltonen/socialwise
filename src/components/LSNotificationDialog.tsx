/**
 * LS Notification Document Dialog
 *
 * Full document viewer for Lastensuojeluilmoitus (Child Welfare Notification) documents
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
import { FileText, User, AlertTriangle, CheckCircle, X, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { LSNotification } from '@/data/ls-types';
import MarkdownDocumentEditor from './MarkdownDocumentEditor';

// Custom components for ReactMarkdown to preserve line breaks
const markdownComponents = {
  p: ({ children }: any) => <p style={{ whiteSpace: 'pre-line' }}>{children}</p>,
};

interface LSNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  document: LSNotification | null;
  clientId?: string;
  onSaved?: () => void;
}

export const LSNotificationDialog: React.FC<LSNotificationDialogProps> = ({
  open,
  onClose,
  document,
  clientId = 'malliasiakas',
  onSaved,
}) => {
  const [showEditor, setShowEditor] = React.useState(false);

  const handleEdit = () => {
    console.log('🔵 [LSNotificationDialog] handleEdit called - opening editor');
    console.log('  - document.filename:', document?.filename);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    console.log('🔵 [LSNotificationDialog] handleEditorClose called');
    setShowEditor(false);
  };

  const handleEditorSaved = () => {
    console.log('🔵 [LSNotificationDialog] handleEditorSaved called from MarkdownDocumentEditor');
    console.log('  - closing editor');
    setShowEditor(false);

    // IMPORTANT: Call onSaved BEFORE onClose to ensure data refresh happens
    // onClose will unmount this component, so onSaved must be called first
    if (onSaved) {
      console.log('🔄 [LSNotificationDialog] Calling parent onSaved (will trigger data refresh)');
      onSaved();
    }

    console.log('  - closing LSNotificationDialog');
    onClose();
  };

  if (!document) return null;

  // Urgency badge color mapping
  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'kriittinen':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'kiireellinen':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normaali':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ei_kiireellinen':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    Lastensuojeluilmoitus
                  </DialogTitle>
                  {document.urgency && (
                    <Badge className={`mt-1 ${getUrgencyColor(document.urgency)}`}>
                      {document.urgency}
                    </Badge>
                  )}
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

            {/* LLM-Generated Structured Summary */}
            {(document.reporterSummary || document.reasonFromLLM) && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Date */}
                    {document.date && (
                      <div>
                        <h4 className="font-semibold text-sm text-orange-900 mb-1">
                          Päivämäärä
                        </h4>
                        <p className="text-sm text-orange-800">{document.date}</p>
                      </div>
                    )}

                    {/* Reporter from LLM */}
                    {document.reporterSummary && (
                      <div>
                        <h4 className="font-semibold text-sm text-orange-900 mb-1">
                          Ilmoittaja
                        </h4>
                        <p className="text-sm text-orange-800">{document.reporterSummary}</p>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {document.summary && (
                    <div>
                      <h4 className="font-semibold text-sm text-orange-900 mb-1">
                        Yhteenveto
                      </h4>
                      <p className="text-sm text-orange-800 font-medium">{document.summary}</p>
                    </div>
                  )}

                  {/* Reason from LLM */}
                  {document.reasonFromLLM && (
                    <div>
                      <h4 className="font-semibold text-sm text-orange-900 mb-1">
                        Ilmoituksen perusta
                      </h4>
                      <p className="text-sm text-orange-700 leading-relaxed">{document.reasonFromLLM}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Original Metadata (if no LLM data available) */}
            {!document.reporterSummary && !document.reasonFromLLM && (
              <div className="grid grid-cols-2 gap-4">
                {/* Reporter information */}
                {document.reporter && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Ilmoittaja
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p className="font-medium">{document.reporter.name}</p>
                        <p className="text-xs">{document.reporter.profession}</p>
                        {document.reporter.isOfficial && (
                          <Badge variant="secondary" className="text-xs">
                            Viranomainen
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Date */}
                {document.date && (
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">
                        Päiväys
                      </h4>
                      <p className="text-sm text-gray-600">{document.date}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Highlights */}
            {document.highlights && document.highlights.length > 0 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Keskeiset huolenaiheet
                  </h4>
                  <div className="space-y-2">
                    {document.highlights.map((highlight, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 bg-white border border-orange-200 rounded-lg p-3"
                      >
                        <CheckCircle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-orange-800 italic">
                          {highlight}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Full Document - Filter out STATUS comments */}
            <div className="space-y-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown components={markdownComponents}>
                      {document.fullText.replace(/<!--\s*STATUS:\s*(Kesken|Tulostettu)\s*-->\n*/g, '')}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
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
          documentType="ls-ilmoitus"
          clientId={clientId}
          existingContent={document.fullText}
          existingFilename={document.filename}
          onSaved={handleEditorSaved}
        />
      )}
    </>
  );
};

export default LSNotificationDialog;
