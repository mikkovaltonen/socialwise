/**
 * Notification Summary Service
 *
 * Generoi lyhyen yhteenvedon asiakkaan lastensuojeluilmoituksista
 * käyttäen ILMOITUS_YHTEENVETO_PROMPT.md -promptia
 */

import * as IlmoitusYhteenvetoService from './ilmoitusYhteenvetoService';
import * as AineistoParser from './aineistoParser';
import { logger } from './logger';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Sleep helper for retry logic
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generoi yhteenvedon asiakkaan ilmoituksista
 *
 * @param clientId - Asiakkaan tunniste
 * @returns Yhteenveto merkkijonona tai null jos epäonnistuu
 */
export async function generateNotificationSummaryForClient(
  clientId: string
): Promise<string | null> {
  const MAX_RETRIES = 2;
  const BASE_DELAY = 1500;

  try {
    // Check API key
    if (!OPENROUTER_API_KEY) {
      logger.error('❌ VITE_OPENROUTER_API_KEY not configured');
      return 'API-avain puuttuu';
    }

    // Lataa asiakkaan tiedot
    const clientData = await AineistoParser.loadClientData(clientId);

    if (!clientData || !clientData.notifications || clientData.notifications.length === 0) {
      logger.debug(`No notifications found for client ${clientId}`);
      return 'Ei ilmoituksia';
    }

    // Ota viimeisin ilmoitus
    const latestNotification = clientData.notifications.sort((a, b) =>
      b.date.localeCompare(a.date)
    )[0];

    // Get LLM settings from Firestore
    const model = await IlmoitusYhteenvetoService.getLLMModel();
    const temperature = await IlmoitusYhteenvetoService.getTemperature();
    const systemPrompt = await IlmoitusYhteenvetoService.getPromptForGeneration();

    logger.debug(
      `📝 Generating summary for ${clientId} using ${model} (temp: ${temperature})`
    );

    // Prepare notification context
    const notificationContext = `
# Lastensuojeluhakemus

**Päivämäärä:** ${latestNotification.date}

**Ilmoittaja:** ${latestNotification.reporter.profession}

**Ilmoituksen syy:**
${latestNotification.reason}

**Korostukset:**
${latestNotification.highlights.map((h) => `- ${h}`).join('\n')}

**Täydellinen teksti:**
${latestNotification.fullText}
    `.trim();

    // Retry logic
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        logger.debug(`🔄 Summary generation attempt ${attempt + 1}/${MAX_RETRIES}`);

        // Call OpenRouter API
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'SocialWise - Notification Summary',
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
                content: notificationContext,
              },
            ],
            temperature: temperature,
          }),
        });

        // Handle errors
        if (response.status === 401) {
          logger.error('❌ OpenRouter authentication failed');
          return 'API-virhe (401)';
        }

        if (response.status === 429) {
          const delay = BASE_DELAY * Math.pow(2, attempt);
          logger.warn(`⏳ Rate limited. Retrying in ${delay}ms...`);

          if (attempt < MAX_RETRIES - 1) {
            await sleep(delay);
            continue;
          } else {
            return 'API rajapinta ylikuormitettu';
          }
        }

        if (!response.ok) {
          const errorText = await response.text();
          logger.error(`❌ OpenRouter API error (${response.status}):`, errorText);
          return `API-virhe (${response.status})`;
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Parse JSON response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          logger.error('❌ No JSON found in LLM response');
          return 'Yhteenvedon jäsennys epäonnistui';
        }

        const parsed = JSON.parse(jsonMatch[0]);

        // Return the summary field (max 100 characters)
        const summary = parsed.summary || 'Ei yhteenvetoa';
        logger.debug(`✅ Summary generated: "${summary}"`);

        return summary;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn(`⚠️ Attempt ${attempt + 1} failed: ${errorMessage}`);

        // Don't retry authentication errors
        if (errorMessage.includes('API-avain') || errorMessage.includes('authentication')) {
          return 'API-virhe';
        }

        // If last attempt, return error
        if (attempt === MAX_RETRIES - 1) {
          logger.error('❌ All attempts failed for summary generation');
          return 'Yhteenvedon generointi epäonnistui';
        }
      }
    }

    return 'Yhteenvedon generointi epäonnistui';
  } catch (error) {
    logger.error(`❌ Error generating summary for client ${clientId}:`, error);
    return 'Virhe yhteenvedon generoinnissa';
  }
}
