/**
 * Aineisto Context Loader
 *
 * Loads documentation from local /public/Aineisto directory
 * Loads client data files from Firebase Storage
 * Formats them as context for AI prompts
 */

import * as StorageService from './aineistoStorageService';
import { logger } from './logger';

interface AineistoContext {
  content: string;
  fileCount: number;
  categories: string[];
}

/**
 * Load all Aineisto files and format as context
 * This provides full client data context to AI
 */
export async function loadAineistoContext(): Promise<AineistoContext> {
  const categories = [
    'LS-ilmoitukset',
    'Päätökset',
    'Yhteystiedot',
  ];

  let fullContent = '# ASIAKKAAN TIEDOT - TÄYDELLINEN KONTEKSTI\n\n';
  let fileCount = 0;

  // Load documentation
  try {
    const docResponse = await fetch('/Aineisto/DATA_PARSING_DOKUMENTAATIO.md');
    if (docResponse.ok) {
      const docContent = await docResponse.text();
      fullContent += `## Aineiston Rakenne\n\n${docContent}\n\n---\n\n`;
    }
  } catch (error) {
    logger.warn('Could not load documentation file');
  }

  // Load files from each category
  for (const category of categories) {
    fullContent += `## ${category}\n\n`;

    try {
      // Try to load Lapsi_1 files from this category
      // Note: We need to know the file names in advance or use a file listing API
      const files = await loadCategoryFiles(category);

      if (files.length > 0) {
        for (const file of files) {
          fullContent += `### ${file.name}\n\n${file.content}\n\n`;
          fileCount++;
        }
      } else {
        fullContent += `_Ei tiedostoja tässä kategoriassa_\n\n`;
      }
    } catch (error) {
      logger.debug(`Could not load files from category: ${category}`);
      fullContent += `_Virhe ladattaessa tiedostoja_\n\n`;
    }

    fullContent += '---\n\n';
  }

  return {
    content: fullContent,
    fileCount,
    categories,
  };
}

/**
 * Load files from a specific category (from Firebase Storage)
 * Note: This is a simplified version that tries known file patterns
 */
async function loadCategoryFiles(category: string): Promise<Array<{ name: string; content: string }>> {
  const files: Array<{ name: string; content: string }> = [];

  // Get known file patterns from StorageService
  const categoryFiles = StorageService.KNOWN_FILES[category as keyof typeof StorageService.KNOWN_FILES];

  if (!categoryFiles || categoryFiles.length === 0) {
    return files;
  }

  // Load files from Firebase Storage
  for (const filePath of categoryFiles) {
    try {
      const content = await StorageService.fetchMarkdownFile(filePath);
      if (content) {
        // Extract just the filename from the path
        const fileName = filePath.split('/').pop() || filePath;
        files.push({
          name: fileName,
          content,
        });
      }
    } catch (error) {
      // File doesn't exist, skip
      logger.debug(`File not found in Storage: ${filePath}`);
    }
  }

  return files;
}

/**
 * Get a summary of available Aineisto files
 */
export async function getAineistoSummary(): Promise<string> {
  const context = await loadAineistoContext();

  return `Käytettävissä olevia asiakastietoja:
- ${context.fileCount} tiedostoa ladattu
- Kategoriat: ${context.categories.join(', ')}

Voit viitata näihin tietoihin vastauksissasi käyttämällä tarkkoja päivämääriä ja lähteitä.`;
}

/**
 * Simplified loader that returns just the essential context
 * without full file contents (for shorter prompts)
 */
export async function loadAineistoContextSummary(): Promise<string> {
  const summary = await getAineistoSummary();
  return summary;
}

/**
 * Format LSClientData as markdown context for AI chatbot
 * This function takes structured client data and formats it into
 * a comprehensive markdown string that AI can use as context
 */
export function formatClientContext(clientData: any): string {
  let context = '\n\n---\n\n# ASIAKKAAN TIEDOT - TÄYDELLINEN KONTEKSTI\n\n';

  // Perustiedot
  context += `## Asiakkaan Perustiedot\n\n`;
  context += `**Nimi:** ${clientData.clientName}\n`;

  if (clientData.contactInfo?.child) {
    const child = clientData.contactInfo.child;
    if (child.socialSecurityNumber) {
      context += `**Henkilötunnus:** ${child.socialSecurityNumber}\n`;
    }
    if (child.address) {
      context += `**Osoite:** ${child.address}\n`;
    }
    if (child.school) {
      context += `**Koulu:** ${child.school}\n`;
    }
  }
  context += '\n';

  // Lastensuojeluilmoitukset
  if (clientData.notifications && clientData.notifications.length > 0) {
    context += `## Lastensuojeluilmoitukset (${clientData.notifications.length} kpl)\n\n`;
    clientData.notifications.forEach((notif: any) => {
      context += `### ${notif.date}`;
      if (notif.reporter?.profession) {
        context += ` - ${notif.reporter.profession}`;
      }
      if (notif.reporter?.name) {
        context += ` (${notif.reporter.name})`;
      }
      context += '\n\n';

      if (notif.fullText) {
        context += notif.fullText + '\n\n';
      } else if (notif.summary) {
        context += notif.summary + '\n\n';
      }
    });
  }

  // Päätökset
  if (clientData.decisions && clientData.decisions.length > 0) {
    context += `## Päätökset (${clientData.decisions.length} kpl)\n\n`;
    clientData.decisions.forEach((decision: any) => {
      context += `### ${decision.date}`;
      if (decision.decisionType) {
        context += ` - ${decision.decisionType}`;
      }
      context += '\n\n';

      if (decision.fullText) {
        context += decision.fullText + '\n\n';
      } else if (decision.summary) {
        context += decision.summary + '\n\n';
      }
    });
  }

  // PTA-kirjaukset
  if (clientData.ptaRecords && clientData.ptaRecords.length > 0) {
    context += `## Palveluntarvearviointi (${clientData.ptaRecords.length} kpl)\n\n`;
    clientData.ptaRecords.forEach((pta: any) => {
      context += `### ${pta.date}`;
      if (pta.eventType) {
        context += ` - ${pta.eventType}`;
      }
      context += '\n\n';

      if (pta.fullText) {
        context += pta.fullText + '\n\n';
      } else if (pta.summary) {
        context += `**Yhteenveto:** ${pta.summary}\n\n`;
      }
    });
  }

  // Asiakassuunnitelmat
  if (clientData.servicePlans && clientData.servicePlans.length > 0) {
    context += `## Asiakassuunnitelmat (${clientData.servicePlans.length} kpl)\n\n`;
    clientData.servicePlans.forEach((plan: any) => {
      context += `### ${plan.startDate}`;
      if (plan.serviceType) {
        context += ` - ${plan.serviceType}`;
      }
      context += '\n\n';

      if (plan.description) {
        context += `**Kuvaus:** ${plan.description}\n`;
      }
      if (plan.status) {
        context += `**Tila:** ${plan.status}\n`;
      }
      if (plan.goals && plan.goals.length > 0) {
        context += `**Tavoitteet:**\n`;
        plan.goals.forEach((goal: string) => {
          context += `- ${goal}\n`;
        });
      }
      context += '\n';
    });
  }

  // Yhteystiedot
  if (clientData.contactInfo) {
    context += `## Yhteystiedot\n\n`;

    // Huoltajat
    if (clientData.contactInfo.guardians) {
      if (clientData.contactInfo.guardians.mother) {
        const mother = clientData.contactInfo.guardians.mother;
        context += `**Äiti:** ${mother.name || 'Ei tietoa'}`;
        if (mother.phone) context += ` (puh. ${mother.phone})`;
        if (mother.email) context += ` (email: ${mother.email})`;
        context += '\n';
      }
      if (clientData.contactInfo.guardians.father) {
        const father = clientData.contactInfo.guardians.father;
        context += `**Isä:** ${father.name || 'Ei tietoa'}`;
        if (father.phone) context += ` (puh. ${father.phone})`;
        if (father.email) context += ` (email: ${father.email})`;
        context += '\n';
      }
    }

    // Ammattilaiset
    if (clientData.contactInfo.professionals) {
      if (clientData.contactInfo.professionals.socialWorker) {
        const sw = clientData.contactInfo.professionals.socialWorker;
        context += `**Vastuusosiaalityöntekijä:** ${sw.name || 'Ei määritelty'}`;
        if (sw.phone) context += ` (puh. ${sw.phone})`;
        context += '\n';
      }
      if (clientData.contactInfo.professionals.socialGuide) {
        const sg = clientData.contactInfo.professionals.socialGuide;
        context += `**Sosiaaliohjaaja:** ${sg.name || 'Ei määritelty'}`;
        if (sg.phone) context += ` (puh. ${sg.phone})`;
        context += '\n';
      }
    }
    context += '\n';
  }

  context += '---\n\n';

  logger.debug(`📄 Formatted client context: ${context.length} characters`);

  return context;
}
