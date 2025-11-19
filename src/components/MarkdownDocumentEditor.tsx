/**
 * Markdown Document Editor Component
 *
 * Allows users to create and edit client documents:
 * - LS-ilmoitukset (Child Protection Notifications)
 * - Päätökset (Decisions)
 * - PTA (Service Need Assessments)
 * - Asiakassuunnitelmat (Service Plans)
 * - Asiakaskirjaukset (Case Notes)
 * - Yhteystiedot (Contact Information)
 */

import React, { useState, useEffect } from 'react';
import * as FirestoreService from '@/lib/firestoreDocumentService';
import { extractDateFromMarkdown } from '@/lib/aineistoParser';
import type { DocumentCategory } from '@/lib/firestoreDocumentService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Edit3, AlertCircle, Check, Loader2, Maximize2, Minimize2, Trash2 } from 'lucide-react';

// Document type definitions
export type DocumentType =
  | 'ls-ilmoitus'
  | 'päätös'
  | 'pta'
  | 'asiakassuunnitelma'
  | 'asiakaskirjaus'
  | 'yhteystiedot';

interface DocumentSection {
  heading: string;
  content: string;
  locked: boolean;
  isMetadata?: boolean;
}

interface MarkdownDocumentEditorProps {
  open: boolean;
  onClose: () => void;
  documentType: DocumentType;
  clientId: string;
  existingContent?: string;
  existingFilename?: string;
  onSaved?: () => void;
}

// Structured document templates with locked headings
const DOCUMENT_STRUCTURES: Record<DocumentType, DocumentSection[]> = {
  'ls-ilmoitus': [
    { heading: '# Lastensuojeluilmoitus', content: '', locked: true, isMetadata: true },
    { heading: '## Päiväys', content: '', locked: true },
    { heading: '## Ilmoittajan tiedot', content: '', locked: true },
    { heading: '## Lapsen tiedot', content: '', locked: true },
    { heading: '## Huoltajien tiedot', content: '', locked: true },
    { heading: '## Ilmoituksen peruste', content: '', locked: true },
  ],

  'päätös': [
    { heading: '# Päätös', content: '', locked: true },
    { heading: '## Päivämäärä', content: '', locked: true },
    { heading: '## Tausta', content: '', locked: true },
    { heading: '## Päätös', content: '', locked: true },
    { heading: '## Perustelut', content: '', locked: true },
    { heading: '## Muutoksenhaku', content: '', locked: true },
  ],

  'pta': [
    { heading: '# Palvelutarpeen arviointi', content: '', locked: true },
    { heading: '## Päiväys', content: '', locked: true },
    { heading: '## PERHE', content: '', locked: true },
    { heading: '## TAUSTA', content: '', locked: true },
    { heading: '## PALVELUT', content: '', locked: true },
    { heading: '## YHTEISTYÖTAHOT ja VERKOSTO', content: '', locked: true },
    { heading: '## LAPSEN JA PERHEEN TAPAAMINEN', content: '', locked: true },
    { heading: '## ASIAKKAAN MIELIPIDE JA NÄKEMYS PALVELUTARPEESEEN', content: '', locked: true },
    { heading: '## SOSIAALIHUOLLON AMMATTIHENKILÖN JOHTOPÄÄTÖKSET', content: '', locked: true },
    { heading: '## ARIO OMATYÖNTEKIJÄN TARPEESTA', content: '', locked: true },
    { heading: '## JAKELU JA ALLEKIRJOITUS', content: '', locked: true },
  ],

  'asiakassuunnitelma': [
    { heading: '# Asiakassuunnitelma', content: '', locked: true },
    { heading: `**Päiväys:** ${new Date().toLocaleDateString('fi-FI')}`, content: '', locked: true, isMetadata: true },
    { heading: '## Lähtötilanne', content: '', locked: true },
    { heading: '## Tavoitteet', content: '', locked: true },
    { heading: '## Toimenpiteet', content: '', locked: true },
    { heading: '## Seuranta ja arviointi', content: '', locked: true },
  ],

  'asiakaskirjaus': [
    { heading: '# Asiakaskirjaus', content: '', locked: true },
    { heading: `**Päiväys:** ${new Date().toLocaleDateString('fi-FI')}`, content: '', locked: true, isMetadata: true },
    { heading: '## Tapaamisen tiedot', content: '', locked: true },
    { heading: '## Keskustelun aiheet', content: '', locked: true },
    { heading: '## Havainnot', content: '', locked: true },
    { heading: '## Jatkotoimet', content: '', locked: true },
  ],

  'yhteystiedot': [
    { heading: '# Yhteystiedot', content: '', locked: true },
    { heading: '## Asiakas', content: '', locked: true },
    { heading: '## Yhteyshenkilöt', content: '', locked: true },
    { heading: '## Verkosto', content: '', locked: true },
    { heading: '## Huomioitavaa', content: '', locked: true },
  ],
};

// Helper function to parse existing content into sections
function parseContentIntoSections(content: string, structure: DocumentSection[]): DocumentSection[] {
  if (!content) return structure;

  const lines = content.split('\n');
  const sections = [...structure];
  let currentSectionIndex = -1;
  let currentContent: string[] = [];

  for (const line of lines) {
    // Check if this line is a heading from our structure
    // For flexible matching, try exact match first, then partial match for non-metadata sections
    let headingMatch = sections.findIndex((s, idx) =>
      line.trim() === s.heading.trim() && idx > currentSectionIndex
    );

    // If no exact match and line is a heading, try to find by heading text (ignoring # symbols)
    if (headingMatch === -1 && line.trim().startsWith('#')) {
      const lineHeadingText = line.trim().replace(/^#+\s*/, '').toLowerCase();
      headingMatch = sections.findIndex((s, idx) => {
        const sectionHeadingText = s.heading.replace(/^#+\s*/, '').toLowerCase();
        return lineHeadingText === sectionHeadingText && idx > currentSectionIndex && !s.isMetadata;
      });
    }

    if (headingMatch !== -1) {
      // Save previous section's content
      if (currentSectionIndex >= 0 && !sections[currentSectionIndex].isMetadata) {
        sections[currentSectionIndex].content = currentContent.join('\n').trim();
      }
      currentSectionIndex = headingMatch;
      currentContent = [];
    } else if (currentSectionIndex >= 0 && !sections[currentSectionIndex].isMetadata) {
      // Add to current section content (skip metadata sections)
      if (line.trim() !== '' || currentContent.length > 0) {
        currentContent.push(line);
      }
    }
  }

  // Save last section's content
  if (currentSectionIndex >= 0 && !sections[currentSectionIndex].isMetadata) {
    sections[currentSectionIndex].content = currentContent.join('\n').trim();
  }

  return sections;
}

// Helper function to combine sections back into markdown
function combineSectionsToMarkdown(sections: DocumentSection[]): string {
  return sections
    .map((section) => {
      if (section.isMetadata) {
        return section.heading;
      }
      if (section.content.trim()) {
        return `${section.heading}\n${section.content}`;
      }
      return section.heading;
    })
    .join('\n\n');
}

export default function MarkdownDocumentEditor({
  open,
  onClose,
  documentType,
  clientId,
  existingContent,
  existingFilename,
  onSaved,
}: MarkdownDocumentEditorProps) {
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ptaStatus, setPtaStatus] = useState<'Kesken' | 'Tulostettu'>('Kesken');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [manualSummary, setManualSummary] = useState('');

  const handleClose = () => {
    console.log('🔵 [MarkdownDocumentEditor] handleClose called');
    console.log('  - hasUnsavedChanges:', hasUnsavedChanges);
    console.log('  - will call onSaved:', hasUnsavedChanges && !!onSaved);

    // Call onSaved only when closing if there were changes
    if (hasUnsavedChanges && onSaved) {
      console.log('🔄 [MarkdownDocumentEditor] Calling onSaved callback');
      onSaved();
    }
    console.log('🚪 [MarkdownDocumentEditor] Calling onClose to close dialog');
    onClose();
  };

  // Initialize sections when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🔵 [MarkdownDocumentEditor] Dialog opened');
      console.log('  - documentType:', documentType);
      console.log('  - existingFilename:', existingFilename);
      console.log('  - existingContent length:', existingContent?.length || 0);
      console.log('  - Delete button will show:', !!existingFilename);

      const structure = DOCUMENT_STRUCTURES[documentType] || [];
      if (existingContent) {
        setSections(parseContentIntoSections(existingContent, structure));

        // Extract PTA status if exists
        if (documentType === 'pta') {
          const statusMatch = existingContent.match(/<!--\s*STATUS:\s*(Kesken|Tulostettu)\s*-->/);
          if (statusMatch) {
            setPtaStatus(statusMatch[1] as 'Kesken' | 'Tulostettu');
          }
        }

        // Load manual summary for case notes when editing
        if (documentType === 'asiakaskirjaus' && existingFilename) {
          const loadManualSummary = async () => {
            try {
              const docId = existingFilename.replace('.md', '');
              const doc = await FirestoreService.getDocument('ASIAKASKIRJAUKSET', docId);
              if (doc && (doc as FirestoreService.CaseNoteDocument).manualSummary) {
                setManualSummary((doc as FirestoreService.CaseNoteDocument).manualSummary || '');
              }
            } catch (error) {
              console.error('Error loading manual summary:', error);
            }
          };
          loadManualSummary();
        }
      } else {
        setSections(structure);
        setPtaStatus('Kesken');
        setManualSummary(''); // Reset manual summary for new case notes
      }
      setMessage('');
      setError('');
      setHasUnsavedChanges(false);
    }
  }, [open, documentType, existingContent, existingFilename]);

  const updateSectionContent = (index: number, newContent: string) => {
    setSections((prev) =>
      prev.map((section, i) => (i === index ? { ...section, content: newContent } : section))
    );
  };

  const handleSave = async () => {
    console.log('🔵 [MarkdownDocumentEditor] handleSave called');
    console.log('  - documentType:', documentType);
    console.log('  - clientId:', clientId);
    console.log('  - existingFilename:', existingFilename);

    let combinedContent = combineSectionsToMarkdown(sections);

    if (!combinedContent.trim()) {
      setError('Dokumentti ei voi olla tyhjä');
      return;
    }

    // Validate manual summary for case notes
    if (documentType === 'asiakaskirjaus' && !manualSummary.trim()) {
      setError('Lyhyt yhteenveto on pakollinen asiakaskirjauksille');
      return;
    }

    setSaving(true);
    setMessage('Luodaan yhteenvetoa...');
    setError('');

    try {
      // Map documentType to Firestore collection
      const categoryMap: Record<DocumentType, DocumentCategory> = {
        'ls-ilmoitus': 'ls-ilmoitus',
        'päätös': 'päätös',
        'pta': 'pta-record',
        'asiakassuunnitelma': 'asiakassuunnitelma',
        'asiakaskirjaus': 'asiakaskirjaus', // Case notes stored in ASIAKASKIRJAUKSET
        'yhteystiedot': 'ls-ilmoitus', // Contact info stored as LS notification
      };

      const category = categoryMap[documentType];
      const collectionName = FirestoreService.getCollectionFromCategory(category);

      // Extract date from markdown content
      const extractedDate = extractDateFromMarkdown(combinedContent);

      // Clean fullMarkdownText: Remove STATUS comments (now stored in separate field)
      const cleanedMarkdown = combinedContent.replace(/<!--\s*STATUS:\s*(Kesken|Tulostettu)\s*-->\n*/g, '');

      // Prepare document data
      const documentData: Partial<FirestoreService.FirestoreDocument> = {
        clientId,
        fullMarkdownText: cleanedMarkdown,
        date: extractedDate,
        category,
      };

      // Add PTA-specific fields
      if (documentType === 'pta') {
        (documentData as Partial<FirestoreService.PTADocument>).status = ptaStatus;
      }

      // Add CaseNote-specific fields
      if (documentType === 'asiakaskirjaus') {
        (documentData as Partial<FirestoreService.CaseNoteDocument>).manualSummary = manualSummary;
      }

      // Extract docId from existingFilename if editing
      let docId: string | undefined;
      if (existingFilename) {
        // existingFilename format: "{clientId}_{timestamp}.md"
        docId = existingFilename.replace('.md', '');
      }

      console.log('  - Saving to Firestore collection:', collectionName);
      console.log('  - Document ID:', docId || 'new document');
      console.log('  - Generating LLM summary...');

      // Save to Firestore (generates LLM summary automatically)
      const savedDocId = await FirestoreService.saveDocument(
        collectionName,
        documentData,
        docId
      );

      console.log('✅ [MarkdownDocumentEditor] Save successful, document ID:', savedDocId);

      // For case notes, close automatically after save
      if (documentType === 'asiakaskirjaus') {
        setMessage('✅ Asiakaskirjaus tallennettu!');
        setTimeout(() => {
          if (onSaved) {
            onSaved(); // Trigger parent refresh
          }
          onClose(); // Close the editor dialog
        }, 800);
      } else {
        setMessage('✅ Dokumentti tallennettu onnistuneesti! Voit jatkaa muokkausta tai sulkea ikkunan.');
        setHasUnsavedChanges(true);
        // Don't close automatically for other document types - let user decide
      }
    } catch (err) {
      console.error('❌ [MarkdownDocumentEditor] Error saving document:', err);
      setError('Virhe tallennuksessa. Yritä uudelleen.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingFilename) {
      setError('Ei tiedostoa poistettavaksi');
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      // Map documentType to Firestore collection
      const categoryMap: Record<DocumentType, DocumentCategory> = {
        'ls-ilmoitus': 'ls-ilmoitus',
        'päätös': 'päätös',
        'pta': 'pta-record',
        'asiakassuunnitelma': 'asiakassuunnitelma',
        'asiakaskirjaus': 'asiakaskirjaus', // Case notes stored in ASIAKASKIRJAUKSET
        'yhteystiedot': 'ls-ilmoitus',
      };

      const category = categoryMap[documentType];
      const collectionName = FirestoreService.getCollectionFromCategory(category);

      // Extract docId from existingFilename
      const docId = existingFilename.replace('.md', '');

      console.log('🔵 [MarkdownDocumentEditor] Deleting from Firestore');
      console.log('  - Collection:', collectionName);
      console.log('  - Document ID:', docId);

      const success = await FirestoreService.deleteDocument(collectionName, docId);

      if (success) {
        setMessage('✅ Dokumentti poistettu onnistuneesti!');
        console.log('🔵 [MarkdownDocumentEditor] Document deleted, closing both dialogs');
        // Close both dialogs and trigger data refresh
        setTimeout(() => {
          if (onSaved) {
            console.log('🔄 [MarkdownDocumentEditor] Calling onSaved to close parent dialog');
            onSaved(); // This closes PTADocumentDialog and refreshes data
          }
          onClose(); // Close MarkdownDocumentEditor
        }, 1000);
      } else {
        setError('Poisto epäonnistui. Tarkista että olet kirjautunut sisään.');
      }
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Virhe poistossa. Yritä uudelleen.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const documentTitles: Record<DocumentType, string> = {
    'ls-ilmoitus': 'Lastensuojeluilmoitus',
    'päätös': 'Päätös',
    'pta': 'Palvelutarpeen arviointi',
    'asiakassuunnitelma': 'Asiakassuunnitelma',
    'asiakaskirjaus': 'Asiakaskirjaus',
    'yhteystiedot': 'Yhteystiedot',
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={`${
          isFullscreen
            ? 'w-screen h-screen max-w-none max-h-none m-0 rounded-none'
            : 'max-w-7xl max-h-[95vh]'
        } overflow-hidden flex flex-col`}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Edit3 className="w-5 h-5" />
                {existingFilename ? 'Muokkaa dokumenttia' : 'Luo uusi'} - {documentTitles[documentType]}
              </DialogTitle>
              <DialogDescription>
                {existingFilename
                  ? `Muokkaa dokumenttia: ${existingFilename}`
                  : 'Luo uusi dokumentti Markdown-muodossa'
                }
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </DialogHeader>

        {/* Messages */}
        {message && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b pb-3">
          {/* PTA Status Selector */}
          {documentType === 'pta' && (
            <div className="flex items-center gap-2">
              <Label htmlFor="pta-status" className="text-sm">Status:</Label>
              <Select value={ptaStatus} onValueChange={(value) => setPtaStatus(value as 'Kesken' | 'Tulostettu')}>
                <SelectTrigger id="pta-status" className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kesken">Kesken</SelectItem>
                  <SelectItem value="Tulostettu">Tulostettu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Manual Summary for Case Notes */}
          {documentType === 'asiakaskirjaus' && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="manual-summary" className="text-sm font-semibold">
                Lyhyt yhteenveto (pakollinen)
              </Label>
              <Textarea
                id="manual-summary"
                value={manualSummary}
                onChange={(e) => setManualSummary(e.target.value)}
                placeholder="Kirjoita lyhyt yhteenveto asiakaskirjauksesta (esim. 'Kotikäynti, keskusteltu koulunkäynnistä')"
                className="min-h-[60px] resize-none"
                maxLength={200}
              />
              <p className="text-xs text-gray-500">
                {manualSummary.length}/200 merkkiä
              </p>
            </div>
          )}
        </div>

        {/* Structured Editor - Word-like Layout */}
        <div className="flex-1 overflow-y-auto pr-2 bg-white">
          <div className="max-w-4xl mx-auto p-8 space-y-6">
            {sections.map((section, originalIndex) => {
              // Skip metadata sections in rendering
              if (section.isMetadata) return null;

              return (
                <div key={originalIndex} className="space-y-3">
                  {/* Heading as styled text (Word-like) */}
                  {section.heading.startsWith('# ') && (
                    <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-3">
                      {section.heading.replace(/^# /, '')}
                    </h1>
                  )}
                  {section.heading.startsWith('## ') && (
                    <h2 className="text-xl font-semibold text-gray-800 mt-5 mb-2 uppercase tracking-wide">
                      {section.heading.replace(/^## /, '')}
                    </h2>
                  )}
                  {section.heading.startsWith('### ') && (
                    <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">
                      {section.heading.replace(/^### /, '')}
                    </h3>
                  )}
                  {!section.heading.startsWith('#') && (
                    <div className="text-sm font-mono text-gray-600">
                      {section.heading}
                    </div>
                  )}

                  {/* Editable Content - Clean textarea */}
                  <Textarea
                    value={section.content}
                    onChange={(e) => updateSectionContent(originalIndex, e.target.value)}
                    className="min-h-[120px] resize-y border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder={`Kirjoita sisältö...`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-between items-center pt-4 border-t">
          <div>
            {existingFilename && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={saving || isDeleting}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Poista
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose} disabled={saving || isDeleting}>
              <X className="w-4 h-4 mr-2" />
              Sulje
            </Button>
            <Button onClick={handleSave} disabled={saving || isDeleting}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tallennetaan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Tallenna
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Poista dokumentti</AlertDialogTitle>
          <AlertDialogDescription>
            Oletko varma että haluat poistaa tämän dokumentin? Tätä toimintoa ei voi peruuttaa.
          </AlertDialogDescription>
          {existingFilename && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">{existingFilename}</p>
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Peruuta
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
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
}
