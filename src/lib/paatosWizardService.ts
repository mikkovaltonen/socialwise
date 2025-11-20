/**
 * Päätös Wizard Prompt Management Service
 *
 * Manages decision wizard prompts with global LLM settings
 * Collection: PAATOS_WIZARD
 * Test file: /public/PAATOS_WIZARD_PROMPT.md
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import { listDocuments } from './firestoreDocumentService';
import { getActiveInstructions } from './pdfInstructionService';
import { logger } from './logger';

export interface PaatosWizardPrompt {
  id?: string;
  content: string;
  llmModel: string;
  temperature: number;
  promptVersion: 'test' | 'production';
  createdAt: Timestamp;
  createdBy: string;
  createdByEmail?: string;
  description?: string;
}

const PROMPTS_COLLECTION = 'PAATOS_WIZARD';

/**
 * Get default prompt from /public/PAATOS_WIZARD_PROMPT.md
 */
export async function getDefaultPrompt(): Promise<string> {
  try {
    const response = await fetch('/PAATOS_WIZARD_PROMPT.md');
    if (response.ok) {
      console.log('✅ Loaded päätös wizard prompt from /PAATOS_WIZARD_PROMPT.md');
      return await response.text();
    }
  } catch (error) {
    console.error('❌ Error loading PAATOS_WIZARD_PROMPT.md:', error);
  }

  // Fallback
  return `Olet AI-avustaja, joka luo ehdotuksia lastensuojelun päätöksi in.`;
}

/**
 * Get the latest prompt
 */
export async function getLatestPrompt(): Promise<PaatosWizardPrompt | null> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);
    const q = query(
      promptsRef,
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as PaatosWizardPrompt;
    }

    return null;
  } catch (error) {
    console.error('Error fetching latest päätös wizard prompt:', error);
    return null;
  }
}

/**
 * Get prompt content for generation (respects promptVersion)
 */
export async function getPromptForGeneration(): Promise<string> {
  try {
    const latest = await getLatestPrompt();

    if (latest && latest.promptVersion === 'test') {
      // Load from file
      console.log('📝 Using test päätös wizard prompt from file');
      try {
        const response = await fetch('/PAATOS_WIZARD_PROMPT.md');
        if (response.ok) {
          return await response.text();
        }
      } catch (error) {
        console.warn('Could not load test prompt file, falling back to production');
      }
    }

    // Load from Firestore (production)
    if (latest) {
      console.log(`📝 Using production päätös wizard prompt from ${latest.createdAt.toDate().toLocaleString()}`);
      return latest.content;
    }

    // Fallback to default
    console.log('📝 Using default päätös wizard prompt');
    return await getDefaultPrompt();
  } catch (error) {
    console.error('Error getting päätös wizard prompt for generation:', error);
    return await getDefaultPrompt();
  }
}

/**
 * Get LLM model from latest prompt
 */
export async function getLLMModel(): Promise<string> {
  try {
    const latest = await getLatestPrompt();
    if (latest && latest.llmModel) {
      return latest.llmModel;
    }
    throw new Error('No päätös wizard prompt found with LLM model');
  } catch (error) {
    console.error('Error fetching LLM model:', error);
    throw error;
  }
}

/**
 * Get temperature from latest prompt
 */
export async function getTemperature(): Promise<number> {
  try {
    const latest = await getLatestPrompt();
    if (latest && latest.temperature !== undefined) {
      return latest.temperature;
    }
    throw new Error('No päätös wizard prompt found with temperature');
  } catch (error) {
    console.error('Error fetching temperature:', error);
    throw error;
  }
}

/**
 * Save a new prompt (creates new document)
 */
export async function savePrompt(
  content: string,
  userId: string,
  llmModel: string,
  temperature: number,
  promptVersion: 'test' | 'production',
  userEmail?: string,
  description?: string
): Promise<string | null> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);

    const docRef = await addDoc(promptsRef, {
      content,
      llmModel,
      temperature,
      promptVersion,
      createdAt: serverTimestamp(),
      createdBy: userId,
      createdByEmail: userEmail || '',
      description: description || 'Päätös wizard prompt update'
    });

    console.log(`✅ New päätös wizard prompt saved with ID: ${docRef.id} (Model: ${llmModel}, Temp: ${temperature}, Version: ${promptVersion})`);
    return docRef.id;
  } catch (error) {
    console.error('Error saving päätös wizard prompt:', error);
    return null;
  }
}

/**
 * Get prompt history (last N prompts)
 */
export async function getPromptHistory(limitCount: number = 50): Promise<PaatosWizardPrompt[]> {
  try {
    const promptsRef = collection(db, PROMPTS_COLLECTION);
    const q = query(
      promptsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PaatosWizardPrompt));
  } catch (error) {
    console.error('Error fetching päätös wizard prompt history:', error);
    return [];
  }
}

/**
 * Initialize prompts if collection is empty
 */
export async function initializePrompts(userId: string): Promise<void> {
  try {
    const latest = await getLatestPrompt();

    if (!latest) {
      const content = await getDefaultPrompt();
      await savePrompt(
        content,
        userId,
        'google/gemini-2.5-flash-lite', // Default LLM model
        0.3, // Default temperature
        'production', // Default prompt version
        '',
        'Initial päätös wizard prompt'
      );
      console.log('✅ Päätös wizard prompts initialized');
    }
  } catch (error) {
    console.error('Error initializing päätös wizard prompts:', error);
  }
}

// ============================================================================
// Decision Draft Generation
// ============================================================================

export interface DecisionDraft {
  summary: string;
  ratkaisuTaiPaatos: string;
  asianKeskeinenSisalto: string;
  paatoksenPerustelutJaToimeenpano: string;
  ratkaisuVoimassa: string;
  valmistelijaJaSosiaalityontekija: string;
  ratkaisija: string;
  tiedoksiantoPMV: string;
}

/**
 * Generate a decision draft using LLM
 *
 * Process:
 * 1. Load all client documents from Firestore
 * 2. Load chatbot instructions (system prompt)
 * 3. Load päätös wizard prompt
 * 4. Build context with all data
 * 5. Call OpenRouter API
 * 6. Parse JSON response
 *
 * @param clientId - Client ID
 * @returns Decision draft with all fields filled
 */
export async function generateDecisionDraft(clientId: string): Promise<DecisionDraft> {
  const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
  const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    logger.info(`🔮 [Päätös Wizard] Starting decision draft generation for client ${clientId}`);

    // 1. Load all client documents
    logger.debug('📁 [Päätös Wizard] Loading client documents...');
    const [lsNotifications, decisions, ptaRecords, servicePlans, caseNotes] = await Promise.all([
      listDocuments('LASTENSUOJELUILMOITUKSET', clientId),
      listDocuments('PÄÄTÖKSET', clientId),
      listDocuments('PALVELUTARVEARVIOINNIT', clientId),
      listDocuments('ASIAKASSUUNNITELMAT', clientId),
      listDocuments('ASIAKASKIRJAUKSET', clientId),
    ]);

    logger.debug(`📊 [Päätös Wizard] Loaded documents: ${lsNotifications.length} LS-ilmoitukset, ${decisions.length} päätökset, ${ptaRecords.length} PTA, ${servicePlans.length} asiakassuunnitelmat, ${caseNotes.length} asiakaskirjaukset`);

    // 2. Load Bot Instructions (Chatbotin Lisäohjeet)
    logger.debug('📝 [Päätös Wizard] Loading Bot Instructions...');
    const botInstructions = await getActiveInstructions();
    const botInstructionsText = botInstructions.map(inst => inst.content).join('\n\n---\n\n');
    logger.debug(`📝 [Päätös Wizard] Bot Instructions loaded: ${botInstructions.length} documents, ${botInstructionsText.length} characters`);

    // 3. Load päätös wizard prompt
    logger.debug('🎯 [Päätös Wizard] Loading wizard prompt...');
    const wizardPrompt = await getPromptForGeneration();
    logger.debug(`🎯 [Päätös Wizard] Wizard prompt loaded: ${wizardPrompt.length} characters`);

    // 4. Build context
    logger.debug('🔧 [Päätös Wizard] Building context...');
    const context = buildContext(botInstructionsText, lsNotifications, decisions, ptaRecords, servicePlans, caseNotes, wizardPrompt);
    logger.debug(`🔧 [Päätös Wizard] Context built: ${context.length} characters`);

    // 5. Get LLM settings
    const model = await getLLMModel();
    const temperature = await getTemperature();
    logger.info(`🤖 [Päätös Wizard] Using model: ${model}, temperature: ${temperature}`);

    // 6. Call OpenRouter API
    logger.debug('☁️ [Päätös Wizard] Calling OpenRouter API...');
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SocialWise - Päätös Wizard',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: context,
          },
        ],
        temperature: temperature,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('❌ [Päätös Wizard] OpenRouter API error:', errorText);
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.choices?.[0]?.message?.content?.trim();
    logger.debug(`✅ [Päätös Wizard] LLM response received: ${rawResponse?.length || 0} characters`);

    if (!rawResponse) {
      logger.error('❌ [Päätös Wizard] Empty response from LLM');
      throw new Error('Empty response from LLM');
    }

    // 7. Parse JSON response
    logger.debug('🔍 [Päätös Wizard] Parsing JSON response...');
    const draft = parseDecisionDraft(rawResponse);
    logger.info('✅ [Päätös Wizard] Decision draft generated successfully');

    return draft;
  } catch (error) {
    logger.error('❌ [Päätös Wizard] Error generating decision draft:', error);
    throw error;
  }
}

/**
 * Build context for LLM prompt
 */
function buildContext(
  botInstructions: string,
  lsNotifications: any[],
  decisions: any[],
  ptaRecords: any[],
  servicePlans: any[],
  caseNotes: any[],
  wizardPrompt: string
): string {
  let context = '';

  // 1. Bot Instructions (Chatbotin Lisäohjeet)
  if (botInstructions && botInstructions.length > 0) {
    context += '# CHATBOTIN LISÄOHJEET\n\n';
    context += botInstructions;
    context += '\n\n';
  }

  // 2. Client documents
  context += '# ASIAKKAAN DOKUMENTIT\n\n';

  // LS-ilmoitukset
  if (lsNotifications.length > 0) {
    context += `## LS-ilmoitukset (${lsNotifications.length} kpl)\n\n`;
    lsNotifications.forEach((doc, idx) => {
      context += `### ${idx + 1}. ${doc.date || 'Ei päivämäärää'}\n`;
      context += `**Yhteenveto:** ${doc.summary || 'Ei yhteenvetoa'}\n`;
      context += `**Kiireellisyys:** ${doc.urgency || 'Ei määritelty'}\n\n`;
      if (doc.fullMarkdownText) {
        context += doc.fullMarkdownText + '\n\n';
      }
      context += '---\n\n';
    });
  }

  // Päätökset
  if (decisions.length > 0) {
    context += `## Päätökset (${decisions.length} kpl)\n\n`;
    decisions.forEach((doc, idx) => {
      context += `### ${idx + 1}. ${doc.date || 'Ei päivämäärää'}\n`;
      context += `**Yhteenveto:** ${doc.summary || 'Ei yhteenvetoa'}\n\n`;
      if (doc.fullMarkdownText) {
        context += doc.fullMarkdownText + '\n\n';
      }
      context += '---\n\n';
    });
  }

  // PTA-kirjaukset
  if (ptaRecords.length > 0) {
    context += `## PTA-kirjaukset (${ptaRecords.length} kpl)\n\n`;
    ptaRecords.forEach((doc, idx) => {
      context += `### ${idx + 1}. ${doc.date || 'Ei päivämäärää'}\n`;
      context += `**Yhteenveto:** ${doc.summary || 'Ei yhteenvetoa'}\n\n`;
      if (doc.fullMarkdownText) {
        context += doc.fullMarkdownText + '\n\n';
      }
      context += '---\n\n';
    });
  }

  // Asiakassuunnitelmat
  if (servicePlans.length > 0) {
    context += `## Asiakassuunnitelmat (${servicePlans.length} kpl)\n\n`;
    servicePlans.forEach((doc, idx) => {
      context += `### ${idx + 1}. ${doc.date || 'Ei päivämäärää'}\n`;
      context += `**Yhteenveto:** ${doc.summary || 'Ei yhteenvetoa'}\n\n`;
      if (doc.fullMarkdownText) {
        context += doc.fullMarkdownText + '\n\n';
      }
      context += '---\n\n';
    });
  }

  // Asiakaskirjaukset
  if (caseNotes.length > 0) {
    context += `## Asiakaskirjaukset (${caseNotes.length} kpl)\n\n`;
    caseNotes.forEach((doc, idx) => {
      context += `### ${idx + 1}. ${doc.date || 'Ei päivämäärää'}\n`;
      context += `**Yhteenveto:** ${doc.summary || 'Ei yhteenvetoa'}\n\n`;
      if (doc.fullMarkdownText) {
        context += doc.fullMarkdownText + '\n\n';
      }
      context += '---\n\n';
    });
  }

  // 3. Wizard task
  context += '# TEHTÄVÄ\n\n';
  context += wizardPrompt;

  return context;
}

/**
 * Parse LLM response into DecisionDraft
 */
function parseDecisionDraft(rawResponse: string): DecisionDraft {
  try {
    // Remove markdown code blocks if present
    const cleanedResponse = rawResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    // Validate required fields
    const draft: DecisionDraft = {
      summary: parsed.summary || '',
      ratkaisuTaiPaatos: parsed.ratkaisuTaiPaatos || '',
      asianKeskeinenSisalto: parsed.asianKeskeinenSisalto || '',
      paatoksenPerustelutJaToimeenpano: parsed.paatoksenPerustelutJaToimeenpano || '',
      ratkaisuVoimassa: parsed.ratkaisuVoimassa || '',
      valmistelijaJaSosiaalityontekija: parsed.valmistelijaJaSosiaalityontekija || '',
      ratkaisija: parsed.ratkaisija || '',
      tiedoksiantoPMV: parsed.tiedoksiantoPMV || '',
    };

    logger.debug('✅ [Päätös Wizard] JSON parsed successfully');
    return draft;
  } catch (error) {
    logger.error('❌ [Päätös Wizard] Failed to parse JSON:', error);
    logger.error('Raw response:', rawResponse);
    throw new Error('Failed to parse LLM response as JSON');
  }
}
