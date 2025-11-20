/**
 * Päätös Wizard Dialog
 *
 * AI-powered decision draft generation wizard
 * - Shows loading state while generating
 * - Generates draft using LLM (all client docs + chatbot instructions)
 * - Saves draft to Firestore PÄÄTÖKSET collection
 * - Opens MarkdownDocumentEditor with the draft
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { generateDecisionDraft, DecisionDraft } from '@/lib/paatosWizardService';
import { saveDocument, generateDocumentKey } from '@/lib/firestoreDocumentService';
import { logger } from '@/lib/logger';

interface PaatosWizardDialogProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onDraftReady: (docId: string) => void; // Callback when draft is saved
}

type WizardState = 'generating' | 'success' | 'error';

export default function PaatosWizardDialog({
  open,
  onClose,
  clientId,
  onDraftReady,
}: PaatosWizardDialogProps) {
  const [state, setState] = useState<WizardState>('generating');
  const [error, setError] = useState<string>('');
  const [progress, setProgress] = useState<string>('Aloitetaan...');

  useEffect(() => {
    if (open && clientId) {
      generateDraft();
    }
  }, [open, clientId]);

  const generateDraft = async () => {
    logger.info(`🔮 [Päätös Wizard Dialog] Starting wizard for client ${clientId}`);
    setState('generating');
    setError('');

    try {
      // Step 1: Generate draft with LLM
      setProgress('Ladataan asiakkaan dokumentteja...');
      logger.debug('📁 [Päätös Wizard Dialog] Loading documents...');

      await new Promise(resolve => setTimeout(resolve, 500)); // Brief delay for UX

      setProgress('Generoidaan päätösehdotusta teköälyllä...');
      logger.debug('🤖 [Päätös Wizard Dialog] Calling generateDecisionDraft()...');

      const draft = await generateDecisionDraft(clientId);
      logger.info('✅ [Päätös Wizard Dialog] Draft generated successfully');

      // Step 2: Save to Firestore with structured fields
      setProgress('Tallennetaan ehdotusta...');
      logger.debug('💾 [Päätös Wizard Dialog] Saving to Firestore with structured fields...');

      const docKey = generateDocumentKey(clientId);

      const docId = await saveDocument(
        'PÄÄTÖKSET',
        {
          clientId,
          documentKey: docKey,
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          summary: draft.summary, // AI-generated summary from wizard
          category: 'päätös',
          editor: 'botti', // AI-generated document

          // Structured fields (no fullMarkdownText - it's redundant!)
          ratkaisuTaiPaatos: draft.ratkaisuTaiPaatos,
          asianVireilletulopaiva: new Date().toLocaleDateString('fi-FI'),
          asianKeskeinenSisalto: draft.asianKeskeinenSisalto,
          paatoksenPerustelutJaToimeenpano: draft.paatoksenPerustelutJaToimeenpano,
          ratkaisuVoimassa: draft.ratkaisuVoimassa,
          valmistelijaJaSosiaalityontekija: draft.valmistelijaJaSosiaalityontekija,
          ratkaisija: draft.ratkaisija,
          tiedoksiantoPMV: draft.tiedoksiantoPMV,
        },
        docKey
      );

      logger.info(`✅ [Päätös Wizard Dialog] Draft saved to Firestore: ${docId}`);

      // Step 4: Success!
      setState('success');
      setProgress('Päätösehdotus valmis!');

      // Auto-open editor after brief delay
      setTimeout(() => {
        logger.info(`📄 [Päätös Wizard Dialog] Opening editor for doc ${docId}`);
        onDraftReady(docId);
        onClose();
      }, 1500);

    } catch (err: any) {
      logger.error('❌ [Päätös Wizard Dialog] Error:', err);
      setState('error');
      setError(err.message || 'Päätösehdotuksen generointi epäonnistui');
    }
  };

  const handleClose = () => {
    if (state !== 'generating') {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-600" />
            Päätösehdotuksen generointi
          </DialogTitle>
          <DialogDescription>
            Teköäly luo ehdotuksen päätösdokumentiksi asiakkaan tietojen perusteella
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Generating State */}
          {state === 'generating' && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
              <div className="text-center">
                <p className="font-medium text-gray-900">{progress}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Tämä voi kestää muutaman sekunnin...
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {state === 'success' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <p className="font-medium">{progress}</p>
                <p className="text-sm mt-1">Avataan dokumenttieditori...</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {state === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <p className="font-medium">Virhe generoinnissa</p>
                <p className="text-sm mt-1">{error}</p>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
