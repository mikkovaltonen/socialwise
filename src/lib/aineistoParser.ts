/**
 * Runtime Aineisto Parser
 *
 * Dynaamisesti lukee ja parsii markdown-tiedostot Firebase Storage -palvelusta.
 * Korvaa staattisen build-time parserin (process-ls-data.ts) runtime-toiminnallisuudella.
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
import * as StorageService from './aineistoStorageService';
import { getSummaryPromptForGeneration } from './summaryPromptService';
import { getIlmoitusSummaryPromptForGeneration } from './ilmoitusSummaryService';
import { getPTALLMModel, getSummaryTemperature } from './systemPromptService';
import { getClientOrganization } from './organizationService';

// ============================================================================
// Constants
// ============================================================================

const AINEISTO_BASE_PATH = '/Aineisto';

export const AINEISTO_CATEGORIES = {
  LS_ILMOITUKSET: 'LS-ilmoitukset',
  ASIAKASKIRJAUKSET: 'Asiakaskirjaukset',
  PAATOKSET: 'Päätökset',
  YHTEYSTIEDOT: 'Yhteystiedot',
  PTA: 'PTA',
  ASIAKASSUUNNITELMAT: 'Asiakassuunnitelmat'
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Hakee kaikki markdown-tiedostot annetusta kansiosta
 */
async function fetchMarkdownFiles(category: string): Promise<string[]> {
  const path = `${AINEISTO_BASE_PATH}/${category}`;

  try {
    // Tämä on yksinkertaistettu - todellisessa tuotannossa tarvittaisiin
    // backend-endpoint joka listaa tiedostot
    // Nyt käytämme fetch-kutsuja tunnettuihin tiedostoihin
    const response = await fetch(`${path}/`);

    if (!response.ok) {
      console.warn(`Cannot list files in ${path}`);
      return [];
    }

    // Tämä ei toimi suoraan - tarvitaan joko:
    // 1. Backend endpoint joka listaa tiedostot
    // 2. Manifest-tiedosto joka listaa saatavilla olevat tiedostot
    // 3. Kovakoodatut tiedostonimet

    return [];
  } catch (error) {
    console.error(`Error fetching files from ${category}:`, error);
    return [];
  }
}

/**
 * Hakee yksittäisen markdown-tiedoston Firebase Storage -palvelusta
 */
async function fetchMarkdownFile(category: string, filename: string): Promise<string | null> {
  const path = `${category}/${filename}`;

  try {
    return await StorageService.fetchMarkdownFile(path);
  } catch (error) {
    console.error(`Error fetching file ${path}:`, error);
    return null;
  }
}

/**
 * Parsii YAML frontmatterin markdown-tiedostosta
 */
function parseFrontmatter(markdown: string): { frontmatter: Record<string, any>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content: markdown };
  }

  const [, frontmatterStr, content] = match;
  const frontmatter: Record<string, any> = {};

  // Yksinkertainen YAML-parsinta (riittävä peruskenttiin)
  frontmatterStr.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  return { frontmatter, content };
}

/**
 * Poimii arvon markdown-kentästä (esim. "**Nimi:** Matti Meikäläinen")
 */
function extractFieldValue(content: string, fieldName: string): string {
  const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?:\\n|$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

/**
 * Poimii kaikki korostukset (blockquote-lainaukset)
 */
function extractHighlights(content: string): string[] {
  const highlights: string[] = [];
  const blockquoteRegex = /^>\s*(.+?)$/gm;
  let match;

  while ((match = blockquoteRegex.exec(content)) !== null) {
    highlights.push(match[1].trim());
  }

  return highlights;
}

/**
 * Poimii päätös-dokumenttien korostukset ([oleellinen] ja [päätös peruste])
 */
function extractDecisionHighlights(content: string): string[] {
  const highlights: string[] = [];

  // Poimii [oleellinen] merkityt kohdat
  const essentialRegex = /\[oleellinen\]\s*([^[\n]+)/g;
  let match;

  while ((match = essentialRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && !highlights.includes(text)) {
      highlights.push(text);
    }
  }

  // Poimii [päätös peruste] merkityt kohdat
  const basisRegex = /\[päätös peruste\]\s*([^[\n]+)/g;

  while ((match = basisRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && !highlights.includes(text)) {
      highlights.push(text);
    }
  }

  return highlights;
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
 * Parsii päivämäärän tiedostonimestä (esim. "2016_08_03_Lastensuojeluilmoitus.md")
 */
function parseDateFromFilename(filename: string): string {
  const dateMatch = filename.match(/^(\d{4})_(\d{2})_(\d{2})/);
  if (dateMatch) {
    const [, year, month, day] = dateMatch;
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}


// ============================================================================
// Category-specific Parsers
// ============================================================================

/**
 * Parsii LS-ilmoituksen markdown-tiedostosta
 */
function parseLSNotification(filename: string, markdown: string): LSNotification {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const date = parseDateFromFilename(filename);

  // Poimii ilmoittajan tiedot
  const reporterSection = extractSection(content, 'ILMOITUKSEN TEKIJÄ');
  const reporterName = extractFieldValue(reporterSection, 'Nimi');
  const reporterProfession = extractFieldValue(reporterSection, 'Ammatti/asema');
  const reporterPhone = extractFieldValue(reporterSection, 'Puhelin');
  const reporterEmail = extractFieldValue(reporterSection, 'Sähköposti');
  const reporterAddress = extractFieldValue(reporterSection, 'Osoite');

  // Poimii lapsen tiedot
  const childSection = extractSection(content, 'ILMOITUKSEN KOHDE');
  const childName = extractFieldValue(childSection, 'Nimi');
  const childSSN = extractFieldValue(childSection, 'Henkilötunnus');
  const childAddress = extractFieldValue(childSection, 'Osoite');
  const childSchool = extractFieldValue(childSection, 'Koulu/päivähoitopaikka');

  // Poimii huoltajien tiedot
  const guardiansSection = extractSection(content, 'HUOLTAJAT');
  const motherInfo = extractFieldValue(guardiansSection, 'Äiti');
  const fatherInfo = extractFieldValue(guardiansSection, 'Isä');

  // Poimii ilmoituksen syyn
  const reason = extractSection(content, 'ILMOITUKSEN SYY');

  // Poimii korostukset
  const highlights = extractHighlights(content);

  // Viranomaisen tarkistus
  const isOfficial = ['opettaja', 'lääkäri', 'sairaanhoitaja', 'poliisi', 'päivähoitaja']
    .some(profession => reporterProfession.toLowerCase().includes(profession));

  return {
    id: filename.replace('.md', ''),
    date,
    filename,
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
    summary: reason.substring(0, 150) + (reason.length > 150 ? '...' : ''),
    fullText: markdown
  };
}

/**
 * Parsii asiakaskirjauksen markdown-tiedostosta
 */
function parseCaseNote(filename: string, markdown: string): CaseNote {
  const { frontmatter, content } = parseFrontmatter(markdown);
  const date = parseDateFromFilename(filename);

  // Poimii avainsanat
  const keywordsStr = extractFieldValue(content, 'Avainsanat');
  const keywords = keywordsStr ? keywordsStr.split(',').map(k => k.trim()) : [];

  // Poimii ilmoitusperusteen
  const notificationGround = extractSection(content, 'Ilmoitusperuste') ||
                             extractFieldValue(content, 'Ilmoitusperuste');

  return {
    id: filename.replace('.md', ''),
    date,
    keywords,
    notificationGround,
    fullText: markdown
  };
}


/**
 * Parsii päätöksen markdown-tiedostosta
 */
function parseDecision(filename: string, markdown: string): Decision {
  const { frontmatter, content } = parseFrontmatter(markdown);

  // 1. PÄIVÄMÄÄRÄ
  // Priorisoi: RATKAISU/PÄÄTÖS osiossa oleva pvm > tiedostonimestä
  let date = parseDateFromFilename(filename);

  // Etsi päivämäärää RATKAISU/PÄÄTÖS osiosta
  const decisionDateMatch = content.match(/(?:Ratkaisu voimassa|RATKAISU|PÄÄTÖS).*?(\d{1,2})\.(\d{1,2})\.(\d{4})/i);
  if (decisionDateMatch) {
    const [, day, month, year] = decisionDateMatch;
    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // 2. PÄÄTÖKSEN TYYPPI (tunnista tekstistä)
  let decisionType: Decision['decisionType'] = 'muu';

  if (content.match(/asiakkuus päättyy|asiakkuuden päättyminen/i)) {
    decisionType = 'asiakkuuden_paattyminen';
  } else if (content.match(/ryhdytään.*?selvityksen/i) || content.match(/selvitys.*?aloitetaan/i)) {
    decisionType = 'selvitys_aloitetaan';
  } else if (content.match(/asiakkuus avataan|asiakkuuden avaaminen/i)) {
    decisionType = 'asiakkuuden_avaaminen';
  } else if (content.match(/kiireellinen sijoitus/i)) {
    decisionType = 'kiireellinen_sijoitus';
  } else if (content.match(/avohuollon tukitoimi/i)) {
    decisionType = 'avohuollon_tukitoimi';
  }

  // 3. TIIVISTELMÄ (ensimmäinen [oleellinen] merkitty lause tai RATKAISU osiosta)
  let summary = '';

  // Yritä poimia ensimmäinen [oleellinen] merkitty kohta
  const essentialMatch = content.match(/\[oleellinen\]\s*([^[\n]+)/);
  if (essentialMatch) {
    summary = essentialMatch[1].trim();
  } else {
    // Jos ei löydy [oleellinen], yritä RATKAISU/PÄÄTÖS osiota
    const ratkaisuSection = extractSection(content, 'RATKAISU') || extractSection(content, 'PÄÄTÖS');
    if (ratkaisuSection) {
      // Ota ensimmäinen lause (max 200 merkkiä)
      summary = ratkaisuSection.substring(0, 200).trim();
      if (ratkaisuSection.length > 200) {
        summary += '...';
      }
    } else {
      // Fallback: Luo tiivistelmä otsikosta
      summary = `Päätös lastensuojelun asiakkuudesta`;
    }
  }

  // 4. LAKIPOHJA (LS § X tai Lastensuojelulaki § X)
  let legalBasis = '';
  const legalMatch = content.match(/(?:LS|Lastensuojelulaki)[^\d]*(\d+)\s*§/i);
  if (legalMatch) {
    legalBasis = `Lastensuojelulaki § ${legalMatch[1]}`;
  }

  // 5. HIGHLIGHTS
  const highlights = extractDecisionHighlights(content);

  return {
    id: filename.replace('.md', ''),
    date,
    decisionType,
    summary,
    legalBasis,
    highlights: highlights.length > 0 ? highlights : undefined,
    fullText: markdown
  };
}

/**
 * Parsii asiakassuunnitelman markdown-tiedostosta
 */
function parseServicePlan(filename: string, markdown: string): ServicePlan {
  const { frontmatter, content } = parseFrontmatter(markdown);

  // Poimii palvelutyypin
  const serviceType = extractFieldValue(content, 'Palvelutyyppi') ||
                     extractFieldValue(content, 'Tyyppi');

  // Poimii päivämäärät
  const startDate = extractFieldValue(content, 'Aloituspäivä') ||
                   parseDateFromFilename(filename);
  const endDate = extractFieldValue(content, 'Päättymispäivä');

  // Poimii tilan
  const statusStr = extractFieldValue(content, 'Tila');
  const status = (statusStr.toLowerCase() as ServicePlan['status']) || 'active';

  // Poimii kuvauksen
  const description = extractSection(content, 'Kuvaus');

  // Poimii tavoitteet
  const goalsStr = extractSection(content, 'Tavoitteet');
  const goals = goalsStr ?
    goalsStr.split('\n').filter(g => g.trim()).map(g => g.replace(/^[-*]\s*/, '').trim()) :
    undefined;

  // Poimii tulokset
  const outcomes = extractSection(content, 'Tulokset');

  return {
    id: filename.replace('.md', ''),
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
// Public API
// ============================================================================

/**
 * Lataa ja parsii LS-ilmoitukset
 */
export async function loadLSNotifications(): Promise<LSNotification[]> {
  const category = AINEISTO_CATEGORIES.LS_ILMOITUKSET;

  // Tunnetut tiedostot (kovakoodattu - tuotannossa käytettäisiin manifestia tai backend-endpointtia)
  const knownFiles = [
    'Lapsi_1_2016_08_03_Lastensuojeluilmoitus.md',
    'Lapsi_1_2017_11_16_Lastensuojeluilmoitus.md',
    'Lapsi_1_2018_04_26_Lastensuojeluilmoitus.md'
  ];

  const notifications: LSNotification[] = [];

  for (const filename of knownFiles) {
    const markdown = await fetchMarkdownFile(category, filename);
    if (markdown) {
      try {
        const notification = parseLSNotification(filename, markdown);
        notifications.push(notification);
      } catch (error) {
        console.error(`Error parsing ${filename}:`, error);
      }
    }
  }

  return notifications.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Generoi asiakaskirjaukset yhteenvetona kaikista dokumenteista
 * Asiakaskirjaukset eivät ole enää erillinen lähdekansio, vaan automaattisesti
 * generoitu lista kaikista tapahtumista (LS-ilmoitukset, päätökset, PTA, suunnitelmat)
 */
export async function loadCaseNotes(): Promise<CaseNote[]> {
  const caseNotes: CaseNote[] = [];

  // Lataa kaikki dokumenttityypit
  const [notifications, decisions, ptaRecords, servicePlans] = await Promise.all([
    loadLSNotifications(),
    loadDecisions(),
    loadPTARecords(),
    loadServicePlans()
  ]);

  // Luo kirjaus jokaisesta LS-ilmoituksesta
  notifications.forEach(notification => {
    // Luo lyhyt kuvaus ilmoituksesta
    const description = notification.highlights.length > 0
      ? notification.highlights[0] // Ensimmäinen korostus
      : notification.summary.substring(0, 100); // Tai yhteenvedon alku

    caseNotes.push({
      id: `ls-${notification.id}`,
      date: notification.date,
      keywords: [
        'lastensuojeluilmoitus',
        notification.reporter.profession.toLowerCase()
      ],
      notificationGround: `${notification.reporter.profession} tehnyt lastensuojeluilmoituksen. ${description}`,
      fullText: `${notification.reporter.profession} tehnyt lastensuojeluilmoituksen. ${description}`
    });
  });

  // Luo kirjaus jokaisesta päätöksestä
  decisions.forEach(decision => {
    const decisionTypeFi = decision.decisionType
      .replace('asiakkuuden_avaaminen', 'Asiakkuus avattu')
      .replace('kiireellinen_sijoitus', 'Kiireellinen sijoitus tehty')
      .replace('avohuollon_tukitoimi', 'Avohuollon tukitoimi aloitettu')
      .replace('huostaanotto', 'Huostaanotto tehty')
      .replace(/_/g, ' ');

    caseNotes.push({
      id: `decision-${decision.id}`,
      date: decision.date,
      keywords: [
        'päätös',
        decision.decisionType.replace(/_/g, ' '),
        'virallinen'
      ],
      notificationGround: `${decisionTypeFi}. ${decision.summary.substring(0, 100)}`,
      fullText: `${decisionTypeFi}. ${decision.summary.substring(0, 100)}`
    });
  });

  // Luo kirjaus jokaisesta Palveluntarvearviointi-kirjauksesta
  ptaRecords.forEach(pta => {
    const eventTypeFi = pta.eventType
      .replace('kotikäynti', 'Kotikäynti')
      .replace('puhelu', 'Puhelinkeskustelu')
      .replace('tapaaminen', 'Tapaaminen')
      .replace('neuvottelu', 'Neuvottelu')
      .replace('päätös', 'Päätös');

    const shortSummary = pta.summary.substring(0, 80);
    const description = pta.actions.length > 0
      ? pta.actions[0]  // Ensimmäinen toimenpide
      : shortSummary;

    caseNotes.push({
      id: `pta-${pta.id}`,
      date: pta.date,
      keywords: [
        'pta',
        pta.eventType,
        ...pta.participants.slice(0, 2)
      ],
      notificationGround: `${eventTypeFi} ${pta.participants.length > 0 ? `(${pta.participants[0]})` : ''}. ${description}`,
      fullText: `${eventTypeFi} ${pta.participants.length > 0 ? `(${pta.participants[0]})` : ''}. ${description}`
    });
  });

  // Luo kirjaus jokaisesta asiakassuunnitelmasta
  servicePlans.forEach(plan => {
    const statusFi = plan.status
      .replace('active', 'aloitettu')
      .replace('completed', 'päättynyt')
      .replace('cancelled', 'keskeytetty');

    const firstGoal = plan.goals && plan.goals.length > 0
      ? plan.goals[0]
      : plan.description.substring(0, 80);

    caseNotes.push({
      id: `plan-${plan.id}`,
      date: plan.startDate,
      keywords: [
        'asiakassuunnitelma',
        plan.serviceType.toLowerCase(),
        plan.status
      ],
      notificationGround: `${plan.serviceType} ${statusFi}. ${firstGoal}`,
      fullText: `${plan.serviceType} ${statusFi}. ${firstGoal}`
    });
  });

  // Järjestä aikajärjestykseen (uusimmat ensin)
  return caseNotes.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Lataa ja parsii päätökset
 */
export async function loadDecisions(): Promise<Decision[]> {
  const category = AINEISTO_CATEGORIES.PAATOKSET;

  // Tunnetut tiedostot (kovakoodattu - Vercel-yhteensopiva)
  const knownFiles = [
    'Lapsi_1_2025_03_22_päätös.md'
  ];

  const decisions: Decision[] = [];

  for (const filename of knownFiles) {
    const markdown = await fetchMarkdownFile(category, filename);
    if (markdown) {
      try {
        const decision = parseDecision(filename, markdown);
        decisions.push(decision);
      } catch (error) {
        console.error(`Error parsing decision ${filename}:`, error);
      }
    }
  }

  return decisions.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Parsii Palveluntarvearviointi-dokumentin markdown-tiedostosta
 * YKSINKERTAISTETTU: Poimii vain päivämäärän ja raaka markdown.
 * Yhteenveto tehdään LLM-kutsulla erikseen.
 */
function parsePTARecord(filename: string, markdown: string): PTARecord {
  const { frontmatter, content } = parseFrontmatter(markdown);

  // Poimii päivämäärän (yrittää ensin sisällöstä, sitten tiedostonimestä)
  const dateMatch = content.match(/\*\*Päiväys:\*\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  let date = parseDateFromFilename(filename);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return {
    id: filename.replace('.md', ''),
    date,
    eventType: 'muu',
    participants: [],
    summary: '', // Täytetään LLM:llä erikseen
    actions: [],
    fullText: markdown,
  };
}

/**
 * Generoi yhden lauseen yhteenveto LLM:llä
 * Käyttää summary_prompt.md tiedoston promptia
 * Sisältää retry-logiikan rate limiting -virheiden käsittelyyn
 */
async function generateSummaryWithLLM(markdown: string): Promise<string> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 2000; // 2 seconds

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Hae OpenRouter API key ympäristömuuttujasta
      const apiKey = import.meta.env.VITE_OPEN_ROUTER_API_KEY;

      if (!apiKey) {
        throw new Error('OpenRouter API key not found! Check .env file for VITE_OPEN_ROUTER_API_KEY');
      }

      // Hae summary prompt Firestoresta tai tiedostosta
      const summaryPrompt = await getSummaryPromptForGeneration();

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin || 'https://valmet-buyer.firebaseapp.com',
        },
        body: JSON.stringify({
          model: getPTALLMModel(), // Kiinteä malli PTA-yhteenvetoihin (ei käyttäjäkohtainen)
          messages: [
            {
              role: 'system',
              content: summaryPrompt
            },
            {
              role: 'user',
              content: `Dokumentti:\n${markdown.substring(0, 3000)}` // Rajoita 3000 merkkiin kustannusten säästämiseksi
            }
          ],
          temperature: getSummaryTemperature(), // Matala lämpötila = tarkempi yhteenveto
          max_tokens: 100
        })
      });

      // Käsittele 429 Too Many Requests virhe
      if (response.status === 429) {
        const retryDelay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff: 2s, 4s, 8s
        console.warn(`⏳ Rate limited (429). Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);

        if (attempt < MAX_RETRIES - 1) {
          await delay(retryDelay);
          continue; // Yritä uudelleen
        } else {
          console.error('❌ Rate limit exceeded after max retries');
          return 'Palveluntarpeen arviointi (rate limit)';
        }
      }

      if (!response.ok) {
        console.error('LLM API error:', response.status, response.statusText);

        // Jos tämä on viimeinen yritys, palauta fallback
        if (attempt === MAX_RETRIES - 1) {
          return 'Palveluntarpeen arviointi';
        }

        // Muuten yritä uudelleen
        await delay(BASE_DELAY);
        continue;
      }

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content?.trim() || 'Palveluntarpeen arviointi';

      return summary;
    } catch (error) {
      console.error(`Error generating summary with LLM (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);

      // Jos tämä on viimeinen yritys, palauta fallback
      if (attempt === MAX_RETRIES - 1) {
        return 'Palveluntarpeen arviointi';
      }

      // Muuten yritä uudelleen viiveen jälkeen
      await delay(BASE_DELAY);
    }
  }

  // Fallback (ei pitäisi koskaan päätyä tänne)
  return 'Palveluntarpeen arviointi';
}

/**
 * Generoi ilmoituksen yhteenvedon LLM:llä
 * @param markdown - Ilmoituksen markdown-sisältö
 * @returns Promise joka palauttaa yhteenveto tekstin
 */
async function generateIlmoitusSummaryWithLLM(markdown: string): Promise<string> {
  const MAX_RETRIES = 3;
  const BASE_DELAY = 2000; // 2 seconds

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Hae OpenRouter API key ympäristömuuttujasta
      const apiKey = import.meta.env.VITE_OPEN_ROUTER_API_KEY;

      if (!apiKey) {
        throw new Error('OpenRouter API key not found! Check .env file for VITE_OPEN_ROUTER_API_KEY');
      }

      // Hae ilmoitus summary prompt Firestoresta tai tiedostosta
      const summaryPrompt = await getIlmoitusSummaryPromptForGeneration();

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin || 'https://valmet-buyer.firebaseapp.com',
        },
        body: JSON.stringify({
          model: getPTALLMModel(), // Käytä samaa mallia kuin PTA
          messages: [
            {
              role: 'system',
              content: summaryPrompt
            },
            {
              role: 'user',
              content: `Ilmoitus:\n${markdown.substring(0, 3000)}` // Rajoita 3000 merkkiin kustannusten säästämiseksi
            }
          ],
          temperature: getSummaryTemperature(), // Matala lämpötila = tarkempi yhteenveto
          max_tokens: 100
        })
      });

      // Käsittele 429 Too Many Requests virhe
      if (response.status === 429) {
        const retryDelay = BASE_DELAY * Math.pow(2, attempt); // Exponential backoff: 2s, 4s, 8s
        console.warn(`⏳ Rate limited (429). Retrying in ${retryDelay}ms... (attempt ${attempt + 1}/${MAX_RETRIES})`);

        if (attempt < MAX_RETRIES - 1) {
          await delay(retryDelay);
          continue; // Yritä uudelleen
        } else {
          console.error('❌ Rate limit exceeded after max retries');
          return 'Rate limit ylitetty';
        }
      }

      if (!response.ok) {
        console.error('LLM API error:', response.status, response.statusText);

        // Jos tämä on viimeinen yritys, palauta fallback
        if (attempt === MAX_RETRIES - 1) {
          return 'Ilmoituksen yhteenveto';
        }

        // Muuten yritä uudelleen
        await delay(BASE_DELAY);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';

      // Jos saatiin sisältöä, käytä sitä
      if (content && content.length > 5) {
        // Poista mahdolliset markdown koodiblokit
        const cleanContent = content.replace(/```json\s*|\s*```/g, '').trim();
        return cleanContent.substring(0, 100); // Rajaa 100 merkkiin
      }

      // Jos tämä on viimeinen yritys, palauta fallback
      if (attempt === MAX_RETRIES - 1) {
        return 'Ilmoituksen yhteenveto';
      }

    } catch (error) {
      console.error(`Error generating ilmoitus summary with LLM (attempt ${attempt + 1}/${MAX_RETRIES}):`, error);

      // Jos tämä on viimeinen yritys, palauta fallback
      if (attempt === MAX_RETRIES - 1) {
        return 'Ilmoituksen yhteenveto';
      }
    }
  }

  // Fallback (ei pitäisi koskaan päätyä tänne)
  return 'Ilmoituksen yhteenveto';
}

/**
 * Lataa ja parsii Palveluntarvearviointi-kirjaukset Firebase Storagesta
 * NOPEA: Palauttaa recordit ILMAN LLM-yhteenvetoja (placeholder summarylla)
 */
export async function loadPTARecords(): Promise<PTARecord[]> {
  const category = AINEISTO_CATEGORIES.PTA;

  // Tunnetut tiedostot Firebase Storagessa
  const knownFiles = [
    'PTA_malliasiakas.md'
  ];

  const records: PTARecord[] = [];

  for (const filename of knownFiles) {
    const markdown = await fetchMarkdownFile(category, filename);
    if (markdown) {
      try {
        const record = parsePTARecord(filename, markdown);
        // Ei generoi yhteenvetoa tässä - palauttaa placeholder
        record.summary = 'Ladataan yhteenvetoa...';
        records.push(record);
      } catch (error) {
        console.error(`Error parsing PTA ${filename}:`, error);
      }
    }
  }

  return records.sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Viive-funktio (utility)
 * @param ms - Viive millisekunneissa
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generoi yhteenvedot PTA-recordeille LLM:llä
 * HIDAS: Käytetään taustalla kun recordit on jo ladattu
 * @param records - PTA recordit joille generoidaan yhteenvedot
 * @returns Promise joka päivittää recordien summaryt
 */
export async function generatePTASummaries(records: PTARecord[]): Promise<PTARecord[]> {
  const updatedRecords: PTARecord[] = [];

  // Käsittele recordit SARJASSA viiveellä (ei Promise.all)
  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      // Käytä fullText joka on jo ladattu recordiin
      if (record.fullText) {
        // Generoi yhteenveto LLM:llä
        record.summary = await generateSummaryWithLLM(record.fullText);
      } else {
        console.warn(`No fullText found for record ${record.id}`);
        record.summary = 'Ei sisältöä yhteenvedon generointiin';
      }
    } catch (error) {
      console.error(`Error generating summary for ${record.id}:`, error);
      record.summary = 'Yhteenvedon generointi epäonnistui';
    }

    updatedRecords.push(record);

    // Lisää 3.5 sekunnin viive ennen seuraavaa kutsua (paitsi viimeisen jälkeen)
    // Kasvatettu 1.5s → 3.5s rate limiting -ongelmien välttämiseksi
    if (i < records.length - 1) {
      console.log(`⏳ Odotetaan 3.5s ennen seuraavaa PTA-yhteenvetoa (${i + 2}/${records.length})...`);
      await delay(3500);
    }
  }

  return updatedRecords;
}

/**
 * Generoi yhteenvedot LS-ilmoituksille LLM:llä
 * HIDAS: Käytetään taustalla kun ilmoitukset on jo ladattu
 * @param notifications - LS-ilmoitukset joille generoidaan yhteenvedot
 * @returns Promise joka päivittää ilmoitusten summaryt
 */
export async function generateIlmoitusSummaries(notifications: LSNotification[]): Promise<LSNotification[]> {
  const updatedNotifications: LSNotification[] = [];

  // Käsittele ilmoitukset SARJASSA viiveellä (ei Promise.all)
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];

    try {
      // Käytä fullText joka on jo ladattu ilmoitukseen
      if (notification.fullText) {
        // Generoi yhteenveto LLM:llä
        const summary = await generateIlmoitusSummaryWithLLM(notification.fullText);

        // Päivitä ilmoitus yhteenvetolla
        notification.summary = summary;

        // Aseta kiireellisyys perustuen yhteenvetoon (yksinkertainen heuristiikka)
        if (summary.toLowerCase().includes('väkivalta') || summary.toLowerCase().includes('vaara') || summary.toLowerCase().includes('uhka')) {
          notification.urgency = 'kriittinen';
        } else if (summary.toLowerCase().includes('päihteet') || summary.toLowerCase().includes('hoito') || summary.toLowerCase().includes('terveys')) {
          notification.urgency = 'kiireellinen';
        } else {
          notification.urgency = 'normaali';
        }
      } else {
        console.warn(`No fullText found for notification ${notification.id}`);
        notification.summary = 'Ei sisältöä yhteenvedon generointiin';
      }
    } catch (error) {
      console.error(`Error generating summary for ${notification.id}:`, error);
      notification.summary = 'Yhteenvedon generointi epäonnistui';
    }

    updatedNotifications.push(notification);

    // Lisää 3.5 sekunnin viive ennen seuraavaa kutsua (paitsi viimeisen jälkeen)
    if (i < notifications.length - 1) {
      console.log(`⏳ Odotetaan 3.5s ennen seuraavaa ilmoitus-yhteenvetoa (${i + 2}/${notifications.length})...`);
      await delay(3500);
    }
  }

  return updatedNotifications;
}

/**
 * Lataa ja parsii asiakassuunnitelmat
 */
export async function loadServicePlans(): Promise<ServicePlan[]> {
  // Tyhjä kansio - palauttaa tyhjä array
  return [];
}

/**
 * Parsii yhteystiedot markdown-tiedostosta
 * Tukee muotoa:
 * ## Lapsi
 * **Nimi:** Maja Virtanen
 * **Henkilötunnus:** 010115-123A
 * ...
 */
function parseContactInfo(markdown: string): ContactInfo {
  // Poimii lapsen tiedot
  const childSection = extractSection(markdown, 'Lapsi');
  const childName = extractFieldValue(childSection, 'Nimi');
  const childSSN = extractFieldValue(childSection, 'Henkilötunnus');
  const childAddress = extractFieldValue(childSection, 'Osoite');
  const childSchool = extractFieldValue(childSection, 'Koulu');
  const childPhone = extractFieldValue(childSection, 'Puhelin');

  // Poimii huoltajien tiedot
  const guardiansSection = extractSection(markdown, 'Huoltajat');

  // Äiti
  const motherSection = extractSection(guardiansSection, 'Äiti');
  const motherName = extractFieldValue(motherSection, 'Nimi');
  const motherPhone = extractFieldValue(motherSection, 'Puhelin');
  const motherEmail = extractFieldValue(motherSection, 'Sähköposti');

  // Isä
  const fatherSection = extractSection(guardiansSection, 'Isä');
  const fatherName = extractFieldValue(fatherSection, 'Nimi');
  const fatherPhone = extractFieldValue(fatherSection, 'Puhelin');
  const fatherEmail = extractFieldValue(fatherSection, 'Sähköposti');

  // Poimii ammattilaisten tiedot
  const professionalsSection = extractSection(markdown, 'Ammattilaiset');

  // Vastuusosiaalityöntekijä
  const socialWorkerSection = extractSection(professionalsSection, 'Vastuusosiaalityöntekijä');
  const socialWorkerName = extractFieldValue(socialWorkerSection, 'Nimi');
  const socialWorkerPhone = extractFieldValue(socialWorkerSection, 'Puhelin');

  // Sosiaaliohjaaja
  const socialGuideSection = extractSection(professionalsSection, 'Sosiaaliohjaaja');
  const socialGuideName = extractFieldValue(socialGuideSection, 'Nimi');
  const socialGuidePhone = extractFieldValue(socialGuideSection, 'Puhelin');

  // Opettaja
  const teacherSection = extractSection(professionalsSection, 'Opettaja');
  const teacherName = extractFieldValue(teacherSection, 'Nimi');
  const teacherSchool = extractFieldValue(teacherSection, 'Koulu');
  const teacherPhone = extractFieldValue(teacherSection, 'Puhelin');
  const teacherEmail = extractFieldValue(teacherSection, 'Sähköposti');

  // Rakenna ContactInfo objekti (EI kovakoodattuja arvoja!)
  const contactInfo: ContactInfo = {
    child: {
      name: childName!, // Required - no fallback!
      socialSecurityNumber: childSSN || '',
      address: childAddress || '',
      school: childSchool || undefined
    },
    guardians: {},
    reporters: [],
    professionals: {}
  };

  // Lisää äiti jos tiedot löytyy
  if (motherName) {
    contactInfo.guardians.mother = {
      name: motherName,
      phone: motherPhone || undefined,
      email: motherEmail || undefined
    };
  }

  // Lisää isä jos tiedot löytyy
  if (fatherName) {
    contactInfo.guardians.father = {
      name: fatherName,
      phone: fatherPhone || undefined,
      email: fatherEmail || undefined
    };
  }

  // Lisää vastuusosiaalityöntekijä jos tiedot löytyy
  if (socialWorkerName || socialWorkerPhone) {
    contactInfo.professionals.socialWorker = {
      name: socialWorkerName!, // Required - no fallback!
      phone: socialWorkerPhone || undefined
    };
  }

  // Lisää sosiaaliohjaaja jos tiedot löytyy
  if (socialGuideName || socialGuidePhone) {
    contactInfo.professionals.socialGuide = {
      name: socialGuideName!, // Required - no fallback!
      phone: socialGuidePhone || undefined
    };
  }

  // Lisää opettaja jos tiedot löytyy
  if (teacherName || teacherPhone) {
    contactInfo.professionals.teacher = {
      name: teacherName || 'Opettaja',
      school: teacherSchool || undefined,
      phone: teacherPhone || undefined,
      email: teacherEmail || undefined
    };
  }

  return contactInfo;
}

/**
 * Lataa yhteystiedot tiedostosta (client-specific)
 */
export async function loadContactInfo(clientId: string = 'lapsi-1'): Promise<ContactInfo | null> {
  const category = AINEISTO_CATEGORIES.YHTEYSTIEDOT;

  // Muunna client ID tiedostonimeksi (esim. "lapsi-1" -> "Lapsi_1_yhteystiedot.md")
  const fileId = clientId.replace('lapsi-', 'Lapsi_');
  const filename = `${fileId}_yhteystiedot.md`;

  const markdown = await fetchMarkdownFile(category, filename);
  if (!markdown) {
    console.warn(`Contact info file not found: ${filename}`);
    return null;
  }

  try {
    return parseContactInfo(markdown);
  } catch (error) {
    console.error('Error parsing contact info:', error);
    return null;
  }
}

/**
 * Lataa kaikki asiakastiedot
 */
export async function loadClientData(clientId: string = 'lapsi-1'): Promise<LSClientData | null> {
  try {
    const [notifications, caseNotes, decisions, ptaRecords, servicePlans, contactInfo] = await Promise.all([
      loadLSNotifications(),
      loadCaseNotes(),
      loadDecisions(),
      loadPTARecords(),
      loadServicePlans(),
      loadContactInfo()
    ]);

    if (notifications.length === 0 && !contactInfo) {
      return null;
    }

    // Luo aikajana kaikista tapahtumista
    const timeline = [
      ...notifications.map(n => ({
        id: `notification-${n.id}`,
        date: n.date,
        type: 'notification' as const,
        title: 'Lastensuojeluilmoitus',
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
    ].sort((a, b) => b.date.localeCompare(a.date));

    // Load organization data
    const organization = await getClientOrganization(clientId) || {
      clientId,
      clientName: `Asiakas ${clientId}`,
      roles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      clientId,
      clientName: organization.clientName,
      socialSecurityNumber: organization.socialSecurityNumber,
      organization,
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
    console.error('Error loading client data:', error);
    return null;
  }
}

/**
 * Tarkistaa onko kategoriassa sisältöä
 */
export async function hasCategoryContent(category: keyof typeof AINEISTO_CATEGORIES): Promise<boolean> {
  switch (category) {
    case 'LS_ILMOITUKSET':
      const notifications = await loadLSNotifications();
      return notifications.length > 0;
    case 'ASIAKASKIRJAUKSET':
      // Asiakaskirjaukset generoidaan muista dokumenteista, joten tarkistetaan
      // onko mitään dokumentteja olemassa
      const [notifs, decs, ptas, plans] = await Promise.all([
        loadLSNotifications(),
        loadDecisions(),
        loadPTARecords(),
        loadServicePlans()
      ]);
      return notifs.length > 0 || decs.length > 0 || ptas.length > 0 || plans.length > 0;
    case 'PAATOKSET':
      const decisions = await loadDecisions();
      return decisions.length > 0;
    case 'PTA':
      const ptaRecords = await loadPTARecords();
      return ptaRecords.length > 0;
    case 'ASIAKASSUUNNITELMAT':
      const servicePlans = await loadServicePlans();
      return servicePlans.length > 0;
    case 'YHTEYSTIEDOT':
      // Yhteystiedot ladataan tiedostosta
      const contactInfo = await loadContactInfo();
      return contactInfo !== null;
    default:
      return false;
  }
}
