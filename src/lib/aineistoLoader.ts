/**
 * Aineisto Context Loader
 *
 * REFACTORED: Now loads from Firestore collections instead of Storage
 * Formats client data as context for AI prompts
 */

import * as FirestoreService from './firestoreDocumentService';
import { logger } from './logger';

interface AineistoContext {
  content: string;
  fileCount: number;
  categories: string[];
}

/**
 * Load all client documents from Firestore and format as context
 * This provides full client data context to AI
 *
 * @param clientId - Client ID to load documents for
 */
export async function loadAineistoContext(clientId: string): Promise<AineistoContext> {
  const categories = [
    'LS-ilmoitukset',
    'Päätökset',
    'PTA',
    'Asiakassuunnitelmat',
  ];

  let fullContent = '# ASIAKKAAN TIEDOT - TÄYDELLINEN KONTEKSTI\n\n';
  let fileCount = 0;

  try {
    // Load all documents from Firestore
    const allDocs = await FirestoreService.getAllClientDocuments(clientId);

    // LS-ilmoitukset
    fullContent += `## LS-ilmoitukset\n\n`;
    if (allDocs.notifications.length > 0) {
      logger.debug(`Loading ${allDocs.notifications.length} LS notifications for ${clientId}`);
      allDocs.notifications.forEach(doc => {
        fullContent += `### ${doc.date} - ${doc.documentKey}\n\n${doc.fullMarkdownText}\n\n`;
        fileCount++;
      });
    } else {
      fullContent += `_Ei tiedostoja tässä kategoriassa_\n\n`;
    }
    fullContent += '---\n\n';

    // Päätökset
    fullContent += `## Päätökset\n\n`;
    if (allDocs.decisions.length > 0) {
      logger.debug(`Loading ${allDocs.decisions.length} decisions for ${clientId}`);
      allDocs.decisions.forEach(doc => {
        fullContent += `### ${doc.date} - ${doc.documentKey}\n\n${doc.fullMarkdownText}\n\n`;
        fileCount++;
      });
    } else {
      fullContent += `_Ei tiedostoja tässä kategoriassa_\n\n`;
    }
    fullContent += '---\n\n';

    // PTA
    fullContent += `## PTA\n\n`;
    if (allDocs.ptaRecords.length > 0) {
      logger.debug(`Loading ${allDocs.ptaRecords.length} PTA records for ${clientId}`);
      allDocs.ptaRecords.forEach(doc => {
        fullContent += `### ${doc.date} - ${doc.documentKey}\n\n${doc.fullMarkdownText}\n\n`;
        fileCount++;
      });
    } else {
      fullContent += `_Ei tiedostoja tässä kategoriassa_\n\n`;
    }
    fullContent += '---\n\n';

    // Asiakassuunnitelmat
    fullContent += `## Asiakassuunnitelmat\n\n`;
    if (allDocs.servicePlans.length > 0) {
      logger.debug(`Loading ${allDocs.servicePlans.length} service plans for ${clientId}`);
      allDocs.servicePlans.forEach(doc => {
        fullContent += `### ${doc.date} - ${doc.documentKey}\n\n${doc.fullMarkdownText}\n\n`;
        fileCount++;
      });
    } else {
      fullContent += `_Ei tiedostoja tässä kategoriassa_\n\n`;
    }
    fullContent += '---\n\n';

  } catch (error) {
    logger.error(`Error loading client documents from Firestore:`, error);
    fullContent += `_Virhe ladattaessa tiedostoja Firestoresta_\n\n`;
  }

  logger.debug(`📁 Loaded ${fileCount} documents from Firestore for client ${clientId}`);

  return {
    content: fullContent,
    fileCount,
    categories,
  };
}


/**
 * Get a summary of available documents for a client
 *
 * @param clientId - Client ID to get summary for
 */
export async function getAineistoSummary(clientId: string): Promise<string> {
  const context = await loadAineistoContext(clientId);

  return `Käytettävissä olevia asiakastietoja:
- ${context.fileCount} dokumenttia ladattu Firestoresta
- Kategoriat: ${context.categories.join(', ')}

Voit viitata näihin tietoihin vastauksissasi käyttämällä tarkkoja päivämääriä ja lähteitä.`;
}

/**
 * Simplified loader that returns just the essential context
 * without full file contents (for shorter prompts)
 *
 * @param clientId - Client ID
 */
export async function loadAineistoContextSummary(clientId: string): Promise<string> {
  const summary = await getAineistoSummary(clientId);
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

  // Lastensuojeluhakemukset
  if (clientData.notifications && clientData.notifications.length > 0) {
    context += `## Lastensuojeluhakemukset (${clientData.notifications.length} kpl)\n\n`;
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
