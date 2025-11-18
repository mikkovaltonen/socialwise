/**
 * Document Creation Dialog
 *
 * Unified dialog for creating all types of client documents.
 * Replaces scattered "Lisää uusi" buttons across the application.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Gavel,
  ClipboardList,
  StickyNote,
} from 'lucide-react';
import MarkdownDocumentEditor, { DocumentType } from './MarkdownDocumentEditor';

interface DocumentCreationDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSaved?: () => void;
}

interface DocumentTypeOption {
  type: DocumentType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const DOCUMENT_TYPES: DocumentTypeOption[] = [
  {
    type: 'ls-ilmoitus',
    label: 'Lastensuojeluilmoitus',
    description: 'Uusi lastensuojeluilmoitus',
    icon: <FileText className="h-6 w-6" />,
  },
  {
    type: 'pta',
    label: 'Palvelutarpeen arviointi',
    description: 'Palveluntarvearviointi (PTA)',
    icon: <ClipboardList className="h-6 w-6" />,
  },
  {
    type: 'päätös',
    label: 'Päätös',
    description: 'Virallinen päätös',
    icon: <Gavel className="h-6 w-6" />,
  },
  {
    type: 'asiakaskirjaus',
    label: 'Asiakaskirjaus',
    description: 'Vapaamuotoinen asiakaskirjaus',
    icon: <StickyNote className="h-6 w-6" />,
  },
];

export default function DocumentCreationDialog({
  open,
  onClose,
  clientId,
  onSaved,
}: DocumentCreationDialogProps) {
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setSelectedType(null);
  };

  const handleDocumentSaved = () => {
    setEditorOpen(false);
    setSelectedType(null);
    onClose();
    if (onSaved) onSaved();
  };

  const handleDialogClose = () => {
    if (!editorOpen) {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open && !editorOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Luo uusi asiakirja</DialogTitle>
            <DialogDescription>
              Valitse luotavan asiakirjan tyyppi
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {DOCUMENT_TYPES.map((docType) => (
              <button
                key={docType.type}
                onClick={() => handleTypeSelect(docType.type)}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent hover:border-primary transition-all text-left group"
              >
                <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                  {docType.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-base font-semibold cursor-pointer group-hover:text-primary">
                    {docType.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {docType.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {selectedType && (
        <MarkdownDocumentEditor
          open={editorOpen}
          onClose={handleEditorClose}
          documentType={selectedType}
          clientId={clientId}
          onSaved={handleDocumentSaved}
        />
      )}
    </>
  );
}
