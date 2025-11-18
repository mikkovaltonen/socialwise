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

import React, { useState, useEffect, useRef } from 'react';
import { uploadMarkdownFile } from '@/lib/aineistoStorageService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, X, Eye, Edit3, AlertCircle, Check, Loader2, Maximize2, Minimize2, Upload } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Document type definitions
export type DocumentType =
  | 'ls-ilmoitus'
  | 'päätös'
  | 'pta'
  | 'asiakassuunnitelma'
  | 'asiakaskirjaus'
  | 'yhteystiedot';

interface MarkdownDocumentEditorProps {
  open: boolean;
  onClose: () => void;
  documentType: DocumentType;
  existingContent?: string;
  existingFilename?: string;
  onSaved?: () => void;
}

// Document templates
const TEMPLATES: Record<DocumentType, string> = {
  'ls-ilmoitus': `# Lastensuojeluilmoitus

**Päiväys:** ${new Date().toLocaleDateString('fi-FI')}

## Ilmoittajan tiedot
- **Nimi:**
- **Ammatti/Asema:**
- **Yhteystiedot:**

## Huolen aihe
Kuvaa tilanne ja huolen aihe tähän...

## Havaitut seikat
-
-

## Toimenpiteet
-
`,

  'päätös': `# Päätös

**Päiväysmäärä:** ${new Date().toLocaleDateString('fi-FI')}

## Päätöksen tyyppi
Valitse: Asiakkuuden avaaminen / Jatkaminen / Lopettaminen / Muu

## Päätöksen sisältö
Kirjoita päätöksen sisältö tähän...

## Perustelut
-
-

## Jatkotoimenpiteet
-
`,

  'pta': `# Palvelutarpeen arviointi

**Päiväys:** ${new Date().toLocaleDateString('fi-FI')}

## Osallistujat
-
-

## Tilanteen kuvaus
Kuvaa perheen ja lapsen tilanne...

## Tuen tarve
-
-

## Suunnitellut toimenpiteet
-
`,

  'asiakassuunnitelma': `# Asiakassuunnitelma

**Päiväys:** ${new Date().toLocaleDateString('fi-FI')}
**Voimassaolo:**

## Tavoitteet
1.
2.

## Sovitut toimenpiteet
- **Toimenpide:**
  - Vastuuhenkilö:
  - Aikataulu:

## Seuranta
Seuraava arviointi:
`,

  'asiakaskirjaus': `# Asiakaskirjaus

**Päiväys:** ${new Date().toLocaleDateString('fi-FI')}

## Tapaamisen tyyppi
Valitse: Kotikäynti / Tapaaminen toimistolla / Puhelinkeskustelu / Muu

## Tapaamisen sisältö
Kuvaa tapaaminen tai tapahtuma...

## Huomiot
-
-

## Jatkotoimenpiteet
-
`,

  'yhteystiedot': `# Yhteystiedot

## Lapsi
- **Nimi:**
- **Henkilötunnus:**
- **Osoite:**
- **Puhelin:**

## Huoltajat
### Huoltaja 1
- **Nimi:**
- **Puhelin:**
- **Sähköposti:**

### Huoltaja 2
- **Nimi:**
- **Puhelin:**
- **Sähköposti:**

## Muut tärkeät yhteystiedot
-
`,
};

// Generate filename based on document type and date
function generateFilename(type: DocumentType, existingFilename?: string): string {
  if (existingFilename) {
    return existingFilename;
  }

  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}_${month}_${day}`;

  const typeMap: Record<DocumentType, { folder: string; suffix: string }> = {
    'ls-ilmoitus': { folder: 'LS-ilmoitukset', suffix: 'Lastensuojeluilmoitus' },
    'päätös': { folder: 'Päätökset', suffix: 'päätös' },
    'pta': { folder: 'PTA', suffix: 'palvelutarpeen_arviointi' },
    'asiakassuunnitelma': { folder: 'Asiakassuunnitelmat', suffix: 'asiakassuunnitelma' },
    'asiakaskirjaus': { folder: 'Asiakaskirjaukset', suffix: 'asiakaskirjaus' },
    'yhteystiedot': { folder: 'Yhteystiedot', suffix: 'yhteystiedot' },
  };

  const { folder, suffix } = typeMap[type];
  // HUOM: Tämä vaatii clientId:n propsista tulevaisuudessa
  // Tällä hetkellä käytetään oletusarvoa
  const clientId = 'lapsi-1'; // TODO: Hae propsista
  return `${clientId}/${folder}/${dateStr}_${suffix}.md`;
}

export default function MarkdownDocumentEditor({
  open,
  onClose,
  documentType,
  existingContent,
  existingFilename,
  onSaved,
}: MarkdownDocumentEditorProps) {
  const [content, setContent] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize content when dialog opens
  useEffect(() => {
    if (open) {
      if (existingContent) {
        setContent(existingContent);
      } else {
        setContent(TEMPLATES[documentType] || '');
      }
      setMessage('');
      setError('');
      setPreviewMode(false);
    }
  }, [open, documentType, existingContent]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.md')) {
      setError('Vain .md tiedostot ovat sallittuja');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setContent(text);
      setMessage('✅ Tiedosto ladattu onnistuneesti!');
      setTimeout(() => setMessage(''), 3000);
    };
    reader.onerror = () => {
      setError('Virhe tiedoston lukemisessa');
    };
    reader.readAsText(file);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Dokumentti ei voi olla tyhjä');
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      const filename = generateFilename(documentType, existingFilename);
      const success = await uploadMarkdownFile(filename, content);

      if (success) {
        setMessage('✅ Dokumentti tallennettu onnistuneesti!');
        setTimeout(() => {
          if (onSaved) onSaved();
          onClose();
        }, 1500);
      } else {
        setError('Tallennus epäonnistui. Tarkista että olet kirjautunut sisään.');
      }
    } catch (err) {
      console.error('Error saving document:', err);
      setError('Virhe tallennuksessa. Yritä uudelleen.');
    } finally {
      setSaving(false);
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
    <Dialog open={open} onOpenChange={onClose}>
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

        {/* View Mode Toggle */}
        <div className="flex gap-2 border-b pb-2">
          <Button
            variant={!previewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode(false)}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Muokkaa
          </Button>
          <Button
            variant={previewMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Esikatselu
          </Button>
          <div className="ml-auto">
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              Lataa tiedosto
            </Button>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 overflow-hidden">
          {!previewMode ? (
            <div className="h-full">
              <Label htmlFor="markdown-editor" className="text-sm text-gray-600 mb-2 block">
                Markdown-sisältö (Käytä # otsikkoja, ** lihavointi, - luettelot)
              </Label>
              <Textarea
                id="markdown-editor"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-[calc(100%-2rem)] font-mono text-sm resize-none"
                placeholder="Kirjoita dokumentin sisältö Markdown-muodossa..."
              />
            </div>
          ) : (
            <div className="h-full overflow-y-auto border rounded-md p-6 bg-white prose prose-sm max-w-none">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="w-4 h-4 mr-2" />
            Peruuta
          </Button>
          <Button onClick={handleSave} disabled={saving || !content.trim()}>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
