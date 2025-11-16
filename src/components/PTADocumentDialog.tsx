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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, Calendar, Users, CheckCircle, X, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { PTARecord } from '@/data/ls-types';
import { preprocessMarkdownForDisplay } from '@/lib/utils';

// Custom components for ReactMarkdown to preserve line breaks
const markdownComponents = {
  p: ({ children }: any) => <p style={{ whiteSpace: 'pre-line' }}>{children}</p>,
};
import { deleteMarkdownFile } from '@/lib/aineistoStorageService';

interface PTADocumentDialogProps {
  open: boolean;
  onClose: () => void;
  document: PTARecord | null;
}

export const PTADocumentDialog: React.FC<PTADocumentDialogProps> = ({
  open,
  onClose,
  document,
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeletePTA = async () => {
    setIsDeleting(true);
    try {
      // Poista tiedosto Firebase Storagesta
      const filename = document.filename || `PTA_malliasiakas.md`;
      const success = await deleteMarkdownFile(`PTA/${filename}`);

      if (success) {
        onClose();
        setShowDeleteDialog(false);
        // Reload page to refresh data
        window.location.reload();
      } else {
        console.error('Failed to delete PTA file');
      }
    } catch (error) {
      console.error('Error deleting PTA:', error);
    } finally {
      setIsDeleting(false);
    }
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
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(document.date).toLocaleDateString('fi-FI')}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Summary Section */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Yhteenveto
                </h3>
                <p className="text-sm text-blue-800">{document.summary}</p>
              </CardContent>
            </Card>

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
              <h3 className="text-lg font-semibold text-gray-900">
                Täydellinen dokumentti
              </h3>

              {document.sections && Object.keys(document.sections).length > 0 ? (
                // Display sections if available
                Object.entries(document.sections).map(([title, content], idx) => (
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
                // Fallback to full text if sections not available
                <Card>
                  <CardContent className="pt-6">
                   <div className="prose prose-sm max-w-none">
                     <ReactMarkdown components={markdownComponents}>{document.fullText}</ReactMarkdown>
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
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Poista PTA
            </Button>
            <Button variant="outline" onClick={onClose}>
              Sulje
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Poista palvelutarpeen arviointi</AlertDialogTitle>
            <AlertDialogDescription>
              Oletko varma että haluat poistaa tämän PTA-dokumentin? Tätä toimintoa ei voi peruuttaa.
              {document && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">
                    {new Date(document.date).toLocaleDateString('fi-FI')} - {document.eventType}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Peruuta
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePTA}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Poistetaan...' : 'Poista'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PTADocumentDialog;
