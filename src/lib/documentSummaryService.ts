/**
 * Document Summary Service
 *
 * Generates LLM-powered summaries for documents using OpenRouter API
 * Synchronous processing - user waits 2-3 seconds during save
 *
 * Uses Firestore-based configuration from Admin panel:
 * - LS-ilmoitus: ilmoitusYhteenvetoService (ILMOITUS_YHTEENVETO)
 * - PTA: ptaYhteenvetoService (PALVELUNTARPEEN_ARVIOINTI_YHTEENVETO)
 * - Päätös: paatosYhteenvetoService (PAATOS_YHTEENVETO)
 */

import { logger } from './logger';
import type { DocumentCategory } from './firestoreDocumentService';
import * as ilmoitusYhteenvetoService from './ilmoitusYhteenvetoService';
import * as ptaYhteenvetoService from './ptaYhteenvetoService';
import * as paatosYhteenvetoService from './paatosYhteenvetoService';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Fallback model for unsupported document types
const FALLBACK_MODEL = 'x-ai/grok-4-fast';
const FALLBACK_TEMPERATURE = 0.3;

/**
 * Generate summary for a document using LLM
 *
 * @param fullMarkdownText - Complete markdown document
 * @param category - Document category (determines prompt and configuration)
 * @returns Parsed JSON object with summary fields (date, summary, etc.) or fallback object with summary string
 */
export async function generateDocumentSummary(
  fullMarkdownText: string,
  category: DocumentCategory
): Promise<any> {
  // Skip LLM generation for case notes (asiakaskirjaus)
  // Manual summary is required and stored directly
  if (category === 'asiakaskirjaus') {
    logger.debug('Skipping LLM generation for asiakaskirjaus (manual summary required)');
    return { summary: '' };  // Return empty object, manual summary will be set separately
  }

  try {
    // Get configuration from appropriate service based on category
    let model: string;
    let temperature: number;
    let prompt: string;

    if (category === 'ls-ilmoitus') {
      // Use Firestore-based configuration for LS notifications
      model = await ilmoitusYhteenvetoService.getLLMModel();
      temperature = await ilmoitusYhteenvetoService.getTemperature();
      const basePrompt = await ilmoitusYhteenvetoService.getPromptForGeneration();
      prompt = `${basePrompt}\n\nDokumentti:\n${fullMarkdownText}`;
      logger.debug(`Using ILMOITUS_YHTEENVETO config: ${model} @ ${temperature}`);
    } else if (category === 'pta-record') {
      // Use Firestore-based configuration for PTA
      model = await ptaYhteenvetoService.getLLMModel();
      temperature = await ptaYhteenvetoService.getTemperature();
      const basePrompt = await ptaYhteenvetoService.getPromptForGeneration();
      prompt = `${basePrompt}\n\nDokumentti:\n${fullMarkdownText}`;
      logger.debug(`Using PALVELUNTARPEEN_ARVIOINTI_YHTEENVETO config: ${model} @ ${temperature}`);
    } else if (category === 'päätös') {
      // Use Firestore-based configuration for Päätös
      model = await paatosYhteenvetoService.getLLMModel();
      temperature = await paatosYhteenvetoService.getTemperature();
      const basePrompt = await paatosYhteenvetoService.getPromptForGeneration();
      prompt = `${basePrompt}\n\nDokumentti:\n${fullMarkdownText}`;
      logger.debug(`Using PAATOS_YHTEENVETO config: ${model} @ ${temperature}`);
    } else {
      // Fallback: Use hardcoded configuration for unsupported types
      model = FALLBACK_MODEL;
      temperature = FALLBACK_TEMPERATURE;
      prompt = buildSummaryPrompt(fullMarkdownText, category);
      logger.debug(`Using fallback config for ${category}: ${model} @ ${temperature}`);
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SocialWise - Document Summary',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: temperature,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error:', errorText);
      return 'Yhteenvedon generointi epäonnistui';
    }

    const data = await response.json();
    const rawSummary = data.choices?.[0]?.message?.content?.trim();

    if (!rawSummary) {
      logger.warn('Empty summary from LLM');
      return { summary: 'Ei yhteenvetoa' };
    }

    // Try to parse JSON response
    try {
      // Remove markdown code blocks if present (```json ... ```)
      const cleanedSummary = rawSummary
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleanedSummary);
      logger.info(`✅ Parsed JSON summary for ${category}:`, parsed);
      return parsed;  // Return structured object
    } catch (parseError) {
      // Fallback: If not valid JSON, return as plain text
      logger.warn(`Could not parse JSON summary for ${category}, using raw string:`, parseError);
      return { summary: rawSummary };
    }
  } catch (error) {
    logger.error('Error generating document summary:', error);
    return { summary: 'Yhteenvedon generointi epäonnistui' };
  }
}

/**
 * Build appropriate prompt based on document category
 */
function buildSummaryPrompt(fullMarkdownText: string, category: DocumentCategory): string {
  const baseInstruction = 'Luo tiivis yhteenveto (max 2 lausetta) seuraavasta dokumentista.';

  const categoryInstructions: Record<DocumentCategory, string> = {
    'ls-ilmoitus': `${baseInstruction} Keskity ilmoituksen perusteeseen ja keskeisiin huolenaiheisiin.

Dokumentti:
${fullMarkdownText}

Yhteenveto:`,

    'pta-record': `${baseInstruction} Keskity tapaamisen tarkoitukseen ja keskeisiin havaintoihin.

Dokumentti:
${fullMarkdownText}

Yhteenveto:`,

    päätös: `${baseInstruction} Keskity päätöksen sisältöön ja perusteluihin.

Dokumentti:
${fullMarkdownText}

Yhteenveto:`,

    asiakassuunnitelma: `${baseInstruction} Keskity suunnitelman tavoitteisiin ja toimenpiteisiin.

Dokumentti:
${fullMarkdownText}

Yhteenveto:`,
  };

  return categoryInstructions[category] || `${baseInstruction}\n\n${fullMarkdownText}\n\nYhteenveto:`;
}

/**
 * Extract urgency level from LS notification (LLM-based)
 * Used specifically for lastensuojeluilmoitukset
 */
export async function extractUrgencyLevel(
  fullMarkdownText: string
): Promise<'kriittinen' | 'kiireellinen' | 'normaali' | 'ei_kiireellinen'> {
  try {
    const prompt = `Analysoi seuraava lastensuojeluilmoitus ja määritä kiireellisyystaso.

Vastaa VAIN yhdellä sanalla:
- kriittinen (välitön vaara)
- kiireellinen (nopea toiminta tarvitaan)
- normaali (tavallinen käsittely)
- ei_kiireellinen (ei kiireellistä)

Dokumentti:
${fullMarkdownText}

Kiireellisyystaso:`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SocialWise - Urgency Detection',
      },
      body: JSON.stringify({
        model: FALLBACK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      logger.error('Failed to extract urgency level');
      return 'normaali';
    }

    const data = await response.json();
    const urgency = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    // Validate response
    const validUrgencies = ['kriittinen', 'kiireellinen', 'normaali', 'ei_kiireellinen'];
    if (validUrgencies.includes(urgency)) {
      return urgency as any;
    }

    logger.warn(`Invalid urgency level: ${urgency}, defaulting to normaali`);
    return 'normaali';
  } catch (error) {
    logger.error('Error extracting urgency level:', error);
    return 'normaali';
  }
}

/**
 * Extract decision type from päätös document (LLM-based)
 */
export async function extractDecisionType(
  fullMarkdownText: string
): Promise<
  | 'asiakkuuden_avaaminen'
  | 'asiakkuuden_paattyminen'
  | 'selvitys_aloitetaan'
  | 'kiireellinen_sijoitus'
  | 'avohuollon_tukitoimi'
  | 'muu'
> {
  try {
    const prompt = `Analysoi seuraava lastensuojelun päätös ja määritä päätöstyyppi.

Vastaa VAIN yhdellä näistä:
- asiakkuuden_avaaminen
- asiakkuuden_paattyminen
- selvitys_aloitetaan
- kiireellinen_sijoitus
- avohuollon_tukitoimi
- muu

Dokumentti:
${fullMarkdownText}

Päätöstyyppi:`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'SocialWise - Decision Type',
      },
      body: JSON.stringify({
        model: FALLBACK_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 20,
      }),
    });

    if (!response.ok) {
      logger.error('Failed to extract decision type');
      return 'muu';
    }

    const data = await response.json();
    const decisionType = data.choices?.[0]?.message?.content?.trim().toLowerCase();

    const validTypes = [
      'asiakkuuden_avaaminen',
      'asiakkuuden_paattyminen',
      'selvitys_aloitetaan',
      'kiireellinen_sijoitus',
      'avohuollon_tukitoimi',
      'muu',
    ];

    if (validTypes.includes(decisionType)) {
      return decisionType as any;
    }

    logger.warn(`Invalid decision type: ${decisionType}, defaulting to muu`);
    return 'muu';
  } catch (error) {
    logger.error('Error extracting decision type:', error);
    return 'muu';
  }
}
