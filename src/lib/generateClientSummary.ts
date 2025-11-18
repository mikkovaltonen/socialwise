/**
 * Generate Client Summary using LLM
 *
 * Analyzes all client data and generates a concise summary of:
 * - Main problems
 * - Time period
 */

import type { LSClientData } from '@/data/ls-types';
import { getClientSummaryPromptForGeneration } from './clientSummaryPromptService';
import { loadAineistoContext } from './aineistoLoader';
import { getSummaryLLMModel, getSummaryTemperature } from './systemPromptService';
import { logger } from './logger';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPEN_ROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ClientSummary {
  mainProblems: string;
  timePeriod: string;
  isLoading: boolean;
  error?: string;
}

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a concise client summary using LLM with retry logic
 */
export async function generateClientSummary(clientData: LSClientData): Promise<ClientSummary> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 2000; // 2 seconds

  // Use fixed model for summaries (not user-configurable)
  const model = getSummaryLLMModel();
  const temperature = getSummaryTemperature();
  logger.debug(`🎛️ Summary generation using model: ${model}, temperature: ${temperature}`);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Load Aineisto context (full client data from markdown files)
      const aineistoContext = await loadAineistoContext();
      logger.debug(`📁 Loaded ${aineistoContext.fileCount} files from Aineisto`);

      // Prepare context from all client data
      const context = prepareClientContext(clientData);

      // Combine contexts
      const fullContext = `${aineistoContext.content}\n\n---\n\n${context}`;

      // Get latest CLIENT summary prompt from Firestore (or default)
      const systemPrompt = await getClientSummaryPromptForGeneration();

      logger.debug(`🔄 Attempting to generate summary (attempt ${attempt + 1}/${MAX_RETRIES})...`);

      // Call LLM
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'SocialWise - Client Summary',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: fullContext,
            },
          ],
          temperature: temperature,
        }),
      });

      // Handle rate limiting with retry
      if (response.status === 429) {
        const delay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff
        logger.warn(`⏳ Rate limited. Retrying in ${delay}ms...`);

        if (attempt < MAX_RETRIES - 1) {
          await sleep(delay);
          continue; // Try again
        } else {
          throw new Error('API rate limit exceeded. Yritä hetken kuluttua uudelleen.');
        }
      }

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      logger.debug('✅ Summary generated successfully');

      return {
        mainProblems: parsed.mainProblems || 'Ei määritelty',
        timePeriod: parsed.timePeriod || '',
        isLoading: false,
      };
    } catch (error) {
      // If this is the last attempt, return error state
      if (attempt === MAX_RETRIES - 1) {
        logger.error('❌ Error generating client summary after retries:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return {
          mainProblems: '',
          timePeriod: '',
          isLoading: false,
          error: errorMessage.includes('rate limit')
            ? 'API-rajapinta ylikuormitettu. Yritä hetken kuluttua uudelleen.'
            : 'Virhe tiivistelmän generoinnissa',
        };
      }

      // For other attempts, continue to retry
      logger.warn(`⚠️ Attempt ${attempt + 1} failed, retrying...`);
    }
  }

  // Fallback (should never reach here)
  return {
    mainProblems: '',
    timePeriod: '',
    isLoading: false,
    error: 'Tiivistelmän generointi epäonnistui',
  };
}

/**
 * Prepare client context for LLM
 */
function prepareClientContext(clientData: LSClientData): string {
  const {
    clientName,
    notifications,
    caseNotes,
    decisions,
    ptaRecords,
    servicePlans,
  } = clientData;

  // Extract key information
  const notificationSummaries = notifications.map(n =>
    `- ${n.date}: ${n.reporter.profession} - ${n.highlights[0] || n.summary}`
  ).join('\n');

  const decisionSummaries = decisions.length > 0
    ? decisions.map(d => `- ${d.date}: ${d.decisionType} - ${d.summary}`).join('\n')
    : 'Ei päätöksiä';

  const ptaSummaries = ptaRecords.length > 0
    ? ptaRecords.slice(0, 3).map(p => `- ${p.date}: ${p.eventType} - ${p.summary}`).join('\n')
    : 'Ei kirjauksia';

  // Get earliest and latest dates
  const allDates = [
    ...notifications.map(n => n.date),
    ...decisions.map(d => d.date),
    ...ptaRecords.map(p => p.date),
  ].sort();

  const earliestDate = allDates[0] || '';
  const latestDate = allDates[allDates.length - 1] || '';

  return `Asiakkaan nimi: ${clientName}

Aikaväli: ${earliestDate} - ${latestDate}

Lastensuojeluilmoitukset (${notifications.length} kpl):
${notificationSummaries}

Päätökset:
${decisionSummaries}

Palveluntarvearviointi (viimeisimmät 3):
${ptaSummaries}

Asiakassuunnitelmat: ${servicePlans.length} kpl

Analysoi tiedot ja tunnista:
1. Pääongelmat (max 60 merkkiä, pilkulla eroteltu lista)
2. Aikaväli (muodossa DD.MM.YYYY - DD.MM.YYYY)`;
}
