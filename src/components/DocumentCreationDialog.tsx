/**
 * Document Creation Dialog
 *
 * Unified dialog for creating all types of client documents.
 * Replaces scattered "Lisää uusi" buttons across the application.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Scale,
  ClipboardList,
  StickyNote,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import MarkdownDocumentEditor, { DocumentType } from './MarkdownDocumentEditor';
import { logger } from '@/lib/logger';
import { convertToMarkdown, getSupportedFileExtensions } from '@/lib/documentConverter';

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
    icon: <Scale className="h-6 w-6" />,
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
  const [uploadedContent, setUploadedContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setUploadedContent('');
      setSelectedType(null);
      setError('');
      setIsProcessing(false);
    }
  }, [open]);

  const handleTypeSelect = (type: DocumentType) => {
    setSelectedType(type);
    setUploadedContent(''); // Clear any uploaded content
    setEditorOpen(true);
  };

  const handleUploadClick = (type: DocumentType, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setSelectedType(type);
    setError('');
    // Trigger file input
    setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setSelectedType(null);
    setUploadedContent('');
  };

  const handleDocumentSaved = () => {
    setEditorOpen(false);
    setSelectedType(null);
    setUploadedContent('');
    onClose();
    if (onSaved) onSaved();
  };

  const handleDialogClose = () => {
    if (!editorOpen) {
      onClose();
      setError('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!selectedType) {
      setError('Valitse ensin asiakirjan tyyppi');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Convert document to markdown first
      logger.info(`📄 File uploaded: ${file.name}`);
      const conversionResult = await convertToMarkdown(file);
      const markdown = conversionResult.markdown;

      logger.info(`✅ Converted to markdown: ${markdown.length} characters`);

      // Structure the document using LLM
      const structuredContent = await structureDocumentWithLLM(markdown, selectedType);

      setUploadedContent(structuredContent);
      setEditorOpen(true);
      setIsProcessing(false);
    } catch (err) {
      logger.error('Error processing uploaded file:', err);
      const errorMessage = err instanceof Error ? err.message : 'Virhe tiedoston käsittelyssä. Yritä uudelleen.';
      setError(errorMessage);
      setIsProcessing(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const structureDocumentWithLLM = async (content: string, docType: DocumentType): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key puuttuu');
    }

    // Define structure templates for each document type
    const structurePrompts: Record<DocumentType, string> = {
      'ls-ilmoitus': `Jäsennä seuraava lastensuojeluilmoitus oikeaan rakenteeseen:

# Lastensuojeluilmoitus

## PÄIVÄYS
[Päivämäärä muodossa DD.MM.YYYY - ÄLÄ täytä, tämä kenttä täytetään automaattisesti]

## ILMOITTAJAN TIEDOT
[Poimii dokumentista ilmoittajan tiedot - nimi, rooli, yhteystiedot]

## LAPSEN TIEDOT
[ÄLÄ täytä, tämä kenttä täytetään automaattisesti asiakastiedoista]

## HUOLTAJIEN TIEDOT
[ÄLÄ täytä, tämä kenttä täytetään automaattisesti asiakastiedoista]

## HUOLEN AIHEET
[Poimii dokumentista huolenaiheet ja huolta aiheuttavat seikat]

## ILMOITUKSEN PERUSTE
[Poimii dokumentista ilmoituksen varsinainen peruste ja keskeiset syyt]

## TOIMENPITEET
[Poimii dokumentista tehdyt tai suunnitellut toimenpiteet]

## ALLEKIRJOITUS JA KÄSITTELYN PÄÄTTYMISPÄIVÄMÄÄRÄ
[Poimii dokumentista allekirjoitustiedot ja käsittelyn päättymispäivämäärä, jos löytyy]

TÄRKEÄÄ: Jätä PÄIVÄYS, ILMOITTAJAN TIEDOT, LAPSEN TIEDOT ja HUOLTAJIEN TIEDOT -kentät TYHJIKSI. Keskity vain muokattaviin kenttiin (HUOLEN AIHEET, ILMOITUKSEN PERUSTE, TOIMENPITEET, ALLEKIRJOITUS).`,

      'pta': `Jäsennä seuraava palveluntarvearviointi oikeaan rakenteeseen:

# Palvelutarpeen arviointi

## Päiväys
[Päivämäärä muodossa DD.MM.YYYY]

## PERHE
[Perheen kuvaus]

## TAUSTA
[Taustatieto]

## PALVELUT
[Palvelut]

## YHTEISTYÖTAHOT ja VERKOSTO
[Verkosto]

## LAPSEN JA PERHEEN TAPAAMINEN
[Tapaaminen]

## ASIAKKAAN MIELIPIDE JA NÄKEMYS PALVELUTARPEESEEN
[Mielipide]

## SOSIAALIHUOLLON AMMATTIHENKILÖN JOHTOPÄÄTÖKSET
[Johtopäätökset]

## ARVIO OMATYÖNTEKIJÄN TARPEESTA
[Arvio]

## JAKELU JA ALLEKIRJOITUS
[Jakelu]

Poimii tiedot alkuperäisestä tekstistä ja sijoita ne oikeisiin kohtiin.`,

      'päätös': `Jäsennä seuraava päätös TÄSMÄLLEEN tähän rakenteeseen. ÄLÄ MUUTA OTSIKKORAKENTEITA:

# Päätös

## Päivämäärä
[Poimii päivämäärä muodossa DD.MM.YYYY - TÄMÄN ON OLTAVA OMA OTSIKKO, EI **Päivämäärä:** kenttä]

## Tausta
[Päätöksen tausta ja syyt]

## Päätös
[Varsinainen päätös ja toimenpiteet]

## Perustelut
[Päätöksen perustelut ja lakiviitteet]

## Muutoksenhaku
[Muutoksenhakuohjeet]

TÄRKEÄÄ:
- Käytä VAIN näitä otsikkoja (##), ei ** kenttiä
- Päivämäärä on OMA OTSIKKO (## Päivämäärä), ei inline-kenttä
- Poimii sisältö alkuperäisestä tekstistä otsikkojen alle`,

      'asiakaskirjaus': `Jäsennä seuraava asiakaskirjaus oikeaan rakenteeseen:

# Asiakaskirjaus

**Päiväys:** [Päivämäärä]

## Tapaamisen tiedot
[Tapaamisen tiedot]

## Keskustelun aiheet
[Aiheet]

## Havainnot
[Havainnot]

## Jatkotoimet
[Jatkotoimet]

Poimii tiedot alkuperäisestä tekstistä ja sijoita ne oikeisiin kohtiin.`,

      'asiakassuunnitelma': `Jäsennä seuraava asiakassuunnitelma oikeaan rakenteeseen:

# Asiakassuunnitelma

**Päiväys:** [Päivämäärä]

## Lähtötilanne
[Lähtötilanne]

## Tavoitteet
[Tavoitteet]

## Toimenpiteet
[Toimenpiteet]

## Seuranta ja arviointi
[Seuranta]

Poimii tiedot alkuperäisestä tekstistä ja sijoita ne oikeisiin kohtiin.`,

      'yhteystiedot': `Jäsennä seuraavat yhteystiedot oikeaan rakenteeseen:

# Yhteystiedot

## Asiakas
[Asiakkaan tiedot]

## Yhteyshenkilöt
[Yhteyshenkilöt]

## Verkosto
[Verkosto]

## Huomioitavaa
[Huomiot]

Poimii tiedot alkuperäisestä tekstistä ja sijoita ne oikeisiin kohtiin.`,
    };

    const prompt = structurePrompts[docType];

    logger.debug('🤖 Structuring document with Grok-4-Fast...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SocialWise - Document Structuring',
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4-fast',
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: `Alkuperäinen dokumentti:\n\n${content}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('LLM API error:', errorText);
      throw new Error('Dokumentin jäsentäminen epäonnistui');
    }

    const data = await response.json();
    const structuredText = data.choices?.[0]?.message?.content?.trim() || content;

    logger.info('✅ Document structured successfully');
    return structuredText;
  };

  return (
    <>
      <Dialog open={open && !editorOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Luo uusi asiakirja</DialogTitle>
            <DialogDescription>
              Valitse luotavan asiakirjan tyyppi tai lataa dokumentti koneelta
            </DialogDescription>
          </DialogHeader>

          {/* Error message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Muunnetaan dokumentti markdown-muotoon ja jäsennetään AI:lla...
              </AlertDescription>
            </Alert>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept={getSupportedFileExtensions()}
            onChange={handleFileUpload}
            disabled={isProcessing}
            className="hidden"
          />

          {/* Document type selection with upload buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            {DOCUMENT_TYPES.map((docType) => (
              <div
                key={docType.type}
                className={`
                  border rounded-lg hover:border-primary transition-all
                  ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                {/* Main card - click to create new */}
                <button
                  onClick={() => handleTypeSelect(docType.type)}
                  disabled={isProcessing}
                  className="w-full flex items-start gap-4 p-4 text-left group hover:bg-accent transition-colors rounded-t-lg"
                >
                  <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                    {docType.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Label className="text-base font-semibold cursor-pointer group-hover:text-primary">
                      {docType.label}
                    </Label>
                  </div>
                </button>

                {/* Upload button */}
                <div className="border-t px-4 py-2 bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleUploadClick(docType.type, e)}
                    disabled={isProcessing}
                    className="w-full text-xs hover:bg-accent"
                  >
                    <Upload className="w-3 h-3 mr-2" />
                    Lataa koneelta
                  </Button>
                </div>
              </div>
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
          existingContent={uploadedContent}
          onSaved={handleDocumentSaved}
        />
      )}
    </>
  );
}
