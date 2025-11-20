/**
 * Runtime Aineisto Parser
 *
 * REFACTORED: Now reads from Firestore collections instead of Firebase Storage
 * Collections: LASTENSUOJELUILMOITUKSET, PALVELUTARVEARVIOINNIT, PÄÄTÖKSET, ASIAKASSUUNNITELMAT
 */

import type {
  LSNotification,
  CaseNote,
  PTARecord,
  Decision,
  ContactInfo,
  ServicePlan,
  LSClientData
} from '@/data/ls-types';
import * as FirestoreService from './firestoreDocumentService';
import type {
  LSNotificationDocument,
  PTADocument,
  DecisionDocument,
  ServicePlanDocument
} from './firestoreDocumentService';
import { getClientOrganization } from './organizationService';
import { getClientBasicInfo } from './clientService';
import { logger } from './logger';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Poimii arvon markdown-kentästä (esim. "**Nimi:** Matti Meikäläinen")
 */
function extractFieldValue(content: string, fieldName: string): string {
  const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?:\\n|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Poimii markdown-sektion sisällön
 * Tukee sekä ## että ### otsikoita
 */
function extractSection(content: string, sectionTitle: string): string {
  // Yritä ensin ## otsikolla
  let regex = new RegExp(`##\\s+${sectionTitle}\\s*\\n([\\s\\S]*?)(?=\\n##|$)`, 'i');
  let match = content.match(regex);

  if (match) {
    return match[1].trim();
  }

  // Yritä sitten ### otsikolla
  regex = new RegExp(`###\\s+${sectionTitle}\\s*\\n([\\s\\S]*?)(?=\\n###|\\n##|$)`, 'i');
  match = content.match(regex);

  return match ? match[1].trim() : '';
}

/**
 * Extract date from markdown content
 * Looks for "## Päiväys", "## Päivämäärä" section or "**Päiväys:**" field
 */
export function extractDateFromMarkdown(markdown: string): string {
  // Try finding date in Päiväys section first
  let dateSection = extractSection(markdown, 'Päiväys');

  // Also try Päivämäärä (used in päätös documents)
  if (!dateSection) {
    dateSection = extractSection(markdown, 'Päivämäärä');
  }

  if (dateSection) {
    const dateMatch = dateSection.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  // Try finding date in inline field
  const dateFieldMatch = markdown.match(/\*\*Päiv[äa](ys|määrä):\*\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dateFieldMatch) {
    const [, , , day, month, year] = dateFieldMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Fallback: placeholder date
  return '1900-01-01';
}

// ============================================================================
// Document Converters (Firestore → UI Types)
// ============================================================================

/**
 * Convert Firestore LSNotificationDocument to UI LSNotification type
 */
function convertLSNotification(doc: LSNotificationDocument): LSNotification {
  // Build fullMarkdownText from structured fields (new format)
  // Or use legacy fullMarkdownText if structured fields don't exist
  let content: string;
  if (doc.paivays || doc.ilmoittajanTiedot) {
    // New format: build from structured fields
    content = `# Lastensuojeluhakemus

## PÄIVÄYS
${doc.paivays || ''}

## ILMOITTAJAN TIEDOT
${doc.ilmoittajanTiedot || ''}

## LAPSEN TIEDOT
${doc.lapsenTiedot || ''}

## HUOLTAJIEN TIEDOT
${doc.huoltajienTiedot || ''}

## HUOLEN AIHEET
${doc.huolenAiheet || ''}

## ILMOITUKSEN PERUSTE
${doc.ilmoituksenPeruste || ''}

## TOIMENPITEET
${doc.toimenpiteet || ''}

## ALLEKIRJOITUS JA KÄSITTELYN PÄÄTTYMISPÄIVÄMÄÄRÄ
${doc.allekirjoitusJaKasittely || ''}`;
  } else {
    // Old format: use legacy fullMarkdownText
    content = doc.fullMarkdownText || '';
  }

  // Poimii ilmoittajan tiedot
  const reporterSection = extractSection(content, 'ILMOITUKSEN TEKIJÄ') ||
                          extractSection(content, 'ILMOITTAJAN TIEDOT') ||
                          extractSection(content, 'Ilmoittajan tiedot');
  const reporterName = extractFieldValue(reporterSection, 'Nimi');
  const reporterProfession = extractFieldValue(reporterSection, 'Ammatti/asema') ||
                             extractFieldValue(reporterSection, 'Ammatti') ||
                             'Ilmoittaja';
  const reporterPhone = extractFieldValue(reporterSection, 'Puhelin');
  const reporterEmail = extractFieldValue(reporterSection, 'Sähköposti');
  const reporterAddress = extractFieldValue(reporterSection, 'Osoite');

  // Poimii lapsen tiedot
  const childSection = extractSection(content, 'ILMOITUKSEN KOHDE') ||
                       extractSection(content, 'LAPSEN TIEDOT') ||
                       extractSection(content, 'Lapsen tiedot');
  const childName = extractFieldValue(childSection, 'Nimi');
  const childSSN = extractFieldValue(childSection, 'Henkilötunnus');
  const childAddress = extractFieldValue(childSection, 'Osoite');
  const childSchool = extractFieldValue(childSection, 'Koulu/päivähoitopaikka') ||
                      extractFieldValue(childSection, 'Koulu');

  // Poimii huoltajien tiedot
  const guardiansSection = extractSection(content, 'HUOLTAJAT') ||
                           extractSection(content, 'HUOLTAJIEN TIEDOT') ||
                           extractSection(content, 'Huoltajien tiedot');
  const motherInfo = extractFieldValue(guardiansSection, 'Äiti');
  const fatherInfo = extractFieldValue(guardiansSection, 'Isä');

  // Poimii ilmoituksen syyn
  const reason = extractSection(content, 'ILMOITUKSEN SYY') ||
                 extractSection(content, 'ILMOITUKSEN PERUSTE') ||
                 extractSection(content, 'Ilmoituksen peruste') ||
                 '';

  // Poimii korostukset (blockquote)
  const highlights: string[] = [];
  const blockquoteRegex = /^>\s*(.+?)$/gm;
  let match;
  while ((match = blockquoteRegex.exec(content)) !== null) {
    highlights.push(match[1].trim());
  }

  // Viranomaisen tarkistus
  const isOfficial = ['opettaja', 'lääkäri', 'sairaanhoitaja', 'poliisi', 'päivähoitaja']
    .some(profession => reporterProfession.toLowerCase().includes(profession));

  return {
    id: doc.id || doc.documentKey,
    date: doc.date,
    filename: doc.id ? `${doc.id}.md` : `${doc.documentKey}.md`,
    reporter: {
      name: reporterName,
      profession: reporterProfession,
      address: reporterAddress || undefined,
      phone: reporterPhone || undefined,
      email: reporterEmail || undefined,
      isOfficial
    },
    child: {
      name: childName,
      socialSecurityNumber: childSSN,
      address: childAddress,
      school: childSchool || undefined
    },
    guardians: {
      mother: motherInfo ? {
        name: motherInfo.split(',')[0].trim(),
        address: motherInfo.includes(',') ? motherInfo.split(',')[1].trim() : undefined,
        phone: motherInfo.match(/Puh\.\s*([\d\s]+)/)?.[1].trim(),
      } : undefined,
      father: fatherInfo && !fatherInfo.includes('ei ole tiedossa') ? {
        name: fatherInfo.split(',')[0].trim(),
      } : undefined
    },
    reason,
    highlights,
    summary: doc.summary,
    urgency: doc.urgency,
    fullText: content, // Use built content instead of doc.fullMarkdownText
    // LLM-generated structured fields
    reporterSummary: typeof doc.reporter === 'string' ? doc.reporter : doc.reporterSummary,
    reasonFromLLM: doc.reason,
    // Audit fields
    updatedAt: doc.updatedAt?.toDate().toISOString(),
    updatedBy: doc.updatedBy,
  };
}

/**
 * Convert Firestore PTADocument to UI PTARecord type
 */
function convertPTARecord(doc: PTADocument): PTARecord {
  // Build fullMarkdownText from structured fields (new format)
  // Or use legacy fullMarkdownText if structured fields don't exist
  let fullText: string;
  if (doc.paivays || doc.perhe) {
    // New format: build from structured fields
    fullText = `## Päiväys
${doc.paivays || ''}

## PERHE
${doc.perhe || ''}

## TAUSTA
${doc.tausta || ''}

## PALVELUT
${doc.palvelut || ''}

## YHTEISTYÖTAHOT ja VERKOSTO
${doc.yhteistyotahotJaVerkosto || ''}

## LAPSEN JA PERHEEN TAPAAMINEN
${doc.lapsenJaPerheenTapaaminen || ''}

## ASIAKKAAN MIELIPIDE JA NÄKEMYS PALVELUTARPEESEEN
${doc.asiakkaanMielipideJaNakemys || ''}

## SOSIAALIHUOLLON AMMATTIHENKILÖN JOHTOPÄÄTÖKSET
${doc.sosiaalityontekijanJohtopäätökset || ''}

## ARVIO OMATYÖNTEKIJÄN TARPEESTA
${doc.arvioOmatyontekijanTarpeesta || ''}

## JAKELU JA ALLEKIRJOITUS
${doc.jakeluJaAllekirjoitus || ''}`;
  } else {
    // Old format: use legacy fullMarkdownText
    fullText = doc.fullMarkdownText || '';
  }

  return {
    id: doc.id || doc.documentKey,
    date: doc.date,
    filename: doc.id ? `${doc.id}.md` : `${doc.documentKey}.md`,  // Use Firestore document ID
    eventType: doc.eventType || 'tapaaminen',
    participants: [], // Not extracted from markdown
    summary: doc.summary,
    actions: [], // Not extracted from markdown
    fullText,
    status: doc.status || 'Kesken',
    // Audit fields
    updatedAt: doc.updatedAt?.toDate().toISOString(),
    updatedBy: doc.updatedBy,
  };
}

/**
 * Convert Firestore DecisionDocument to UI Decision type
 */
function convertDecision(doc: DecisionDocument): Decision {
  // Build fullMarkdownText from structured fields (new format)
  // Or use legacy fullMarkdownText if structured fields don't exist
  let fullText: string;
  if (doc.ratkaisuTaiPaatos || doc.asianKeskeinenSisalto) {
    // New format: build from structured fields
    fullText = `## RATKAISU TAI PÄÄTÖS
${doc.ratkaisuTaiPaatos || ''}

## ASIAN VIREILLETULOPÄIVÄ
${doc.asianVireilletulopaiva || ''}

## ASIAN KESKEINEN SISÄLTÖ
${doc.asianKeskeinenSisalto || ''}

## PÄÄTÖKSEN PERUSTELUT JA TOIMEENPANO
${doc.paatoksenPerustelutJaToimeenpano || ''}

## RATKAISU VOIMASSA
${doc.ratkaisuVoimassa || ''}

## VALMISTELIJA / LAPSEN ASIOISTA VASTAAVA SOSIAALITYÖNTEKIJÄ
${doc.valmistelijaJaSosiaalityontekija || ''}

## RATKAISIJA / VASTUUSOSIAALITYÖNTEKIJÄ / JOHTAVA SOSIAALITYÖNTEKIJÄ
${doc.ratkaisija || ''}

## TIEDOKSIANTO PMV
${doc.tiedoksiantoPMV || ''}`;
  } else {
    // Old format: use legacy fullMarkdownText
    fullText = doc.fullMarkdownText || '';
  }

  const decision = {
    id: doc.id || doc.documentKey,
    date: doc.date,
    filename: doc.id ? `${doc.id}.md` : `${doc.documentKey}.md`,  // Use Firestore document ID
    decisionType: doc.decisionType || 'muu',
    summary: doc.summary || '',
    legalBasis: doc.legalBasis || '',
    highlights: doc.highlights || [],
    fullText
  };

  // Debug logging for summary
  if (!decision.summary || decision.summary.trim() === '') {
    logger.warn(`Decision ${decision.id} has empty summary`);
  } else {
    logger.debug(`Decision ${decision.id} summary: ${decision.summary.substring(0, 50)}...`);
  }

  return decision;
}

/**
 * Convert Firestore ServicePlanDocument to UI ServicePlan type
 */
function convertServicePlan(doc: ServicePlanDocument): ServicePlan {
  const content = doc.fullMarkdownText;

  // Poimii palvelutyypin
  const serviceType = extractFieldValue(content, 'Palvelutyyppi') ||
                     extractFieldValue(content, 'Tyyppi') ||
                     'Avohuollon tukitoimi';

  // Poimii päivämäärät
  const startDate = doc.validFrom || doc.date;
  const endDate = doc.validTo;

  // Poimii tilan
  const statusStr = extractFieldValue(content, 'Tila');
  const status = (statusStr.toLowerCase() as ServicePlan['status']) || 'active';

  // Poimii kuvauksen
  const description = extractSection(content, 'Kuvaus') || doc.summary;

  // Poimii tavoitteet
  const goalsStr = extractSection(content, 'Tavoitteet');
  const goals = goalsStr ?
    goalsStr.split('\n').filter(g => g.trim()).map(g => g.replace(/^[-*]\s*/, '').trim()) :
    undefined;

  // Poimii tulokset
  const outcomes = extractSection(content, 'Tulokset');

  return {
    id: doc.id || doc.documentKey,
    serviceType,
    startDate,
    endDate: endDate || undefined,
    status,
    description,
    goals,
    outcomes: outcomes || undefined
  };
}

// ============================================================================
// Public API - Load Functions (Firestore-based)
// ============================================================================

/**
 * Load LS notifications from Firestore
 *
 * @param clientId - Client ID
 */
export async function loadLSNotifications(clientId: string): Promise<LSNotification[]> {
  try {
    const docs = await FirestoreService.listDocuments('LASTENSUOJELUILMOITUKSET', clientId);
    return docs.map(doc => convertLSNotification(doc as LSNotificationDocument));
  } catch (error) {
    logger.error('Error loading LS notifications:', error);
    return [];
  }
}

/**
 * Load PTA records from Firestore
 *
 * @param clientId - Client ID
 */
export async function loadPTARecords(clientId: string): Promise<PTARecord[]> {
  try {
    const docs = await FirestoreService.listDocuments('PALVELUTARVEARVIOINNIT', clientId);
    return docs.map(doc => convertPTARecord(doc as PTADocument));
  } catch (error) {
    logger.error('Error loading PTA records:', error);
    return [];
  }
}

/**
 * Load decisions from Firestore
 *
 * @param clientId - Client ID
 */
export async function loadDecisions(clientId: string): Promise<Decision[]> {
  try {
    const docs = await FirestoreService.listDocuments('PÄÄTÖKSET', clientId);
    return docs.map(doc => convertDecision(doc as DecisionDocument));
  } catch (error) {
    logger.error('Error loading decisions:', error);
    return [];
  }
}

/**
 * Load service plans from Firestore
 *
 * @param clientId - Client ID
 */
export async function loadServicePlans(clientId: string): Promise<ServicePlan[]> {
  try {
    const docs = await FirestoreService.listDocuments('ASIAKASSUUNNITELMAT', clientId);
    return docs.map(doc => convertServicePlan(doc as ServicePlanDocument));
  } catch (error) {
    logger.error('Error loading service plans:', error);
    return [];
  }
}

/**
 * Load case notes from ASIAKASKIRJAUKSET collection
 *
 * @param clientId - Client ID
 */
export async function loadCaseNotes(clientId: string): Promise<CaseNote[]> {
  try {
    const documents = await FirestoreService.listDocuments('ASIAKASKIRJAUKSET', clientId);

    return documents.map((doc: FirestoreService.CaseNoteDocument) => ({
      id: doc.id || doc.documentKey,
      date: doc.date,
      filename: doc.id ? `${doc.id}.md` : `${doc.documentKey}.md`,
      keywords: doc.keywords,
      summary: doc.summary || '',
      fullText: doc.fullMarkdownText,
      updatedAt: doc.updatedAt?.toDate().toISOString(),
      updatedBy: doc.updatedBy,
    })).sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    logger.error(`Error loading case notes for ${clientId}:`, error);
    return [];
  }
}

/**
 * @deprecated Generate case notes as a summary of all documents
 * Case notes are auto-generated from LS notifications, decisions, PTA, and service plans
 * This is now deprecated - use loadCaseNotes() which loads from ASIAKASKIRJAUKSET collection
 *
 * @param clientId - Client ID
 */
export async function loadCaseNotesLegacy(clientId: string): Promise<CaseNote[]> {
  try {
    const caseNotes: CaseNote[] = [];

    // Load all document types
    const [notifications, decisions, ptaRecords, servicePlans] = await Promise.all([
      loadLSNotifications(clientId).catch(() => []),
      loadDecisions(clientId).catch(() => []),
      loadPTARecords(clientId).catch(() => []),
      loadServicePlans(clientId).catch(() => [])
    ]);

    // Create case note from each LS notification
    notifications.forEach(notification => {
      const description = notification.highlights.length > 0
        ? notification.highlights[0]
        : notification.summary.substring(0, 100);

      caseNotes.push({
        id: `ls-${notification.id}`,
        date: notification.date,
        keywords: [
          'lastensuojeluilmoitus',
          notification.reporter.profession.toLowerCase()
        ],
        summary: `${notification.reporter.profession} tehnyt lastensuojeluilmoituksen. ${description}`,
        fullText: notification.fullText
      });
    });

    // Create case note from each decision
    decisions.forEach(decision => {
      caseNotes.push({
        id: `decision-${decision.id}`,
        date: decision.date,
        keywords: ['päätös', decision.decisionType],
        summary: `Päätös: ${decision.summary}`,
        fullText: decision.fullText
      });
    });

    // Create case note from each PTA record
    ptaRecords.forEach(pta => {
      caseNotes.push({
        id: `pta-${pta.id}`,
        date: pta.date,
        keywords: ['palveluntarvearviointi', pta.eventType],
        summary: `Palveluntarvearviointi: ${pta.summary}`,
        fullText: pta.fullText
      });
    });

    // Create case note from each service plan
    servicePlans.forEach(plan => {
      caseNotes.push({
        id: `plan-${plan.id}`,
        date: plan.startDate,
        keywords: ['asiakassuunnitelma', plan.serviceType],
        summary: `Asiakassuunnitelma: ${plan.description || plan.serviceType}`,
        fullText: plan.description || ''
      });
    });

    return caseNotes.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    logger.error('Error loading case notes:', error);
    return [];
  }
}

/**
 * Load contact information from ASIAKAS_PERUSTIEDOT collection
 *
 * @param clientId - Client ID
 */
export async function loadContactInfo(clientId: string): Promise<ContactInfo | null> {
  try {
    const basicInfo = await getClientBasicInfo(clientId);
    if (!basicInfo) {
      return null;
    }

    // Muunna ClientBasicInfo -> ContactInfo
    // Huoltajat: Etsi äiti ja isä guardians-arraystä
    const mother = basicInfo.guardians?.find(g => g.rooli === 'äiti');
    const father = basicInfo.guardians?.find(g => g.rooli === 'isä');

    // Ammattilaiset: Muunna professionals-array objektiksi
    const professionals: ContactInfo['professionals'] = {};
    basicInfo.professionals?.forEach(prof => {
      const role = prof.rooli.toLowerCase();
      if (role.includes('sosiaali') && role.includes('työntekijä')) {
        professionals.socialWorker = {
          name: prof.nimi,
          phone: prof.puhelin,
          email: prof.sahkoposti,
        };
      } else if (role.includes('ohjaaja')) {
        professionals.socialGuide = {
          name: prof.nimi,
          phone: prof.puhelin,
          email: prof.sahkoposti,
        };
      } else if (role.includes('esimies')) {
        professionals.supervisor = {
          name: prof.nimi,
          phone: prof.puhelin,
          email: prof.sahkoposti,
        };
      }
    });

    const contactInfo: ContactInfo = {
      child: {
        name: basicInfo.child?.nimi || '',
        socialSecurityNumber: undefined,
        address: undefined,
        school: basicInfo.child?.koulu,
        phone: basicInfo.child?.puhelin,
        schoolPhone: basicInfo.child?.koulunPuhelin,
      },
      guardians: {
        mother: mother ? {
          name: mother.nimi,
          socialSecurityNumber: undefined,
          address: mother.osoite,
          phone: mother.puhelin,
          email: mother.sahkoposti,
        } : undefined,
        father: father ? {
          name: father.nimi,
          socialSecurityNumber: undefined,
          address: father.osoite,
          phone: father.puhelin,
          email: father.sahkoposti,
        } : undefined,
      },
      reporters: [],
      professionals,
    };

    return contactInfo;
  } catch (error) {
    logger.error(`Error loading contact info for ${clientId}:`, error);
    return null;
  }
}

/**
 * Load complete client data from Firestore
 *
 * @param clientId - Client ID
 */
export async function loadClientData(clientId: string): Promise<LSClientData> {
  try {
    const [notifications, caseNotes, decisions, ptaRecords, servicePlans, contactInfo] = await Promise.all([
      loadLSNotifications(clientId).catch(() => []),
      loadCaseNotes(clientId).catch(() => []),
      loadDecisions(clientId).catch(() => []),
      loadPTARecords(clientId).catch(() => []),
      loadServicePlans(clientId).catch(() => []),
      loadContactInfo(clientId).catch(() => null)
    ]);

    // Create timeline from all events
    const timeline = [
      ...notifications.map(n => ({
        id: `notification-${n.id}`,
        date: n.date,
        type: 'notification' as const,
        title: 'Lastensuojeluhakemus',
        summary: n.summary,
        relatedId: n.id
      })),
      ...caseNotes.map(n => ({
        id: `case-note-${n.id}`,
        date: n.date,
        type: 'case_note' as const,
        title: 'Asiakaskirjaus',
        summary: n.notificationGround,
        relatedId: n.id
      })),
      ...decisions.map(d => ({
        id: `decision-${d.id}`,
        date: d.date,
        type: 'decision' as const,
        title: 'Päätös',
        summary: d.summary,
        relatedId: d.id
      })),
      ...ptaRecords.map(p => ({
        id: `pta-${p.id}`,
        date: p.date,
        type: 'pta_record' as const,
        title: `Palveluntarvearviointi: ${p.eventType}`,
        summary: p.summary,
        relatedId: p.id
      })),
      ...servicePlans.map(s => ({
        id: `service-plan-${s.id}`,
        date: s.startDate,
        type: 'service_plan' as const,
        title: `Asiakassuunnitelma: ${s.serviceType}`,
        summary: s.description,
        relatedId: s.id
      }))
    ].sort((a, b) => {
      // Handle null dates by placing them at the end
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return b.date.localeCompare(a.date);
    });

    // Get client name from contactInfo
    const clientName = contactInfo?.child?.name || `Asiakas ${clientId}`;

    // Load organization data (optional)
    const organization = await getClientOrganization(clientId).catch(() => null);

    return {
      clientId,
      clientName,
      socialSecurityNumber: organization?.socialSecurityNumber,
      organization: organization || undefined,
      mainProblem: {
        category: 'Lapsen hyvinvointi',
        subcategories: ['Hoivan laiminlyönti', 'Turvattomuus'],
        description: notifications[0]?.reason || '',
        severity: 'medium'
      },
      notifications,
      caseNotes,
      decisions,
      contactInfo: contactInfo || undefined,
      ptaRecords,
      servicePlans,
      timeline
    };
  } catch (error) {
    logger.error('Error loading client data:', error);
    return {
      clientId,
      clientName: `Asiakas ${clientId}`,
      mainProblem: {
        category: 'Ei tietoja',
        subcategories: [],
        description: '',
        severity: 'medium'
      },
      notifications: [],
      caseNotes: [],
      decisions: [],
      ptaRecords: [],
      servicePlans: [],
      timeline: []
    };
  }
}

// ============================================================================
// DEPRECATED - LLM Summary Generation (Moved to documentSummaryService)
// ============================================================================

/**
 * @deprecated Use documentSummaryService.generateDocumentSummary() instead
 * Kept for backwards compatibility during migration
 */
export async function generatePTASummaries(ptaRecords: PTARecord[]): Promise<PTARecord[]> {
  logger.warn('generatePTASummaries() is deprecated - summaries are now generated on document save');
  return ptaRecords;
}

/**
 * @deprecated Use documentSummaryService.generateDocumentSummary() instead
 * Kept for backwards compatibility during migration
 */
export async function generateIlmoitusSummaries(notifications: LSNotification[]): Promise<LSNotification[]> {
  logger.warn('generateIlmoitusSummaries() is deprecated - summaries are now generated on document save');
  return notifications;
}
