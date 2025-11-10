/**
 * Lastensuojelu Data Processing Script
 *
 * This script reads markdown files from public/Aineisto and converts them
 * into structured TypeScript data for the LS-portal.
 *
 * Run with: npx tsx data_preparation/process-ls-data.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import type {
  LSClientData,
  LSNotification,
  CaseNote,
  PTARecord,
  Decision,
  ContactInfo,
  ServicePlan,
  MainProblem,
  TimelineEvent,
} from '../src/data/ls-types';

// ============================================================================
// Configuration
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AINEISTO_PATH = path.join(__dirname, '../public/Aineisto');
const OUTPUT_PATH = path.join(__dirname, '../src/data/ls-client-data.ts');

// ============================================================================
// Helper Functions
// ============================================================================

function readMarkdownFile(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8');
}

function extractFrontmatter(content: string): { frontmatter: any; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterLines = match[1].split('\n');
  const frontmatter: any = {};

  frontmatterLines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  });

  return { frontmatter, body: match[2] };
}

function extractSection(content: string, sectionTitle: string): string {
  const regex = new RegExp(`##\\s+${sectionTitle}[\\s\\S]*?(?=##|$)`, 'i');
  const match = content.match(regex);
  return match ? match[0] : '';
}

function extractFieldValue(section: string, fieldName: string): string {
  const regex = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+?)(?=\\n|\\*\\*|$)`, 'i');
  const match = section.match(regex);
  return match ? match[1].trim() : '';
}

// ============================================================================
// Parse LS-ilmoitukset (Notifications)
// ============================================================================

function parseNotification(filePath: string): LSNotification {
  const content = readMarkdownFile(filePath);
  const { frontmatter, body } = extractFrontmatter(content);

  const filename = path.basename(filePath);
  const dateMatch = filename.match(/(\d{4})_(\d{2})_(\d{2})/);
  const date = dateMatch ? `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}` : '';

  // Extract reporter info
  const reporterSection = extractSection(body, 'ILMOITUKSEN TEKIJÄ') || extractSection(body, 'Ilmoituksen tekijä');
  const reporter = {
    name: extractFieldValue(reporterSection, 'Nimi'),
    profession: extractFieldValue(reporterSection, 'Ammatti/asema') || extractFieldValue(reporterSection, 'Ammatti'),
    address: extractFieldValue(reporterSection, 'Osoite'),
    phone: extractFieldValue(reporterSection, 'Puhelin') || extractFieldValue(reporterSection, 'Puhelinnumero'),
    email: extractFieldValue(reporterSection, 'Sähköposti'),
    isOfficial: reporterSection.toLowerCase().includes('viranomais') || reporterSection.toLowerCase().includes('opettaja') || reporterSection.toLowerCase().includes('kuraattori'),
  };

  // Extract child info
  const childSection = extractSection(body, 'ILMOITUKSEN KOHDE') || extractSection(body, 'Lapsi, jota ilmoitus koskee');
  const child = {
    name: extractFieldValue(childSection, 'Nimi'),
    socialSecurityNumber: extractFieldValue(childSection, 'Henkilötunnus'),
    address: extractFieldValue(childSection, 'Osoite'),
    school: extractFieldValue(childSection, 'Koulu/päivähoitopaikka') || extractFieldValue(childSection, 'Koulu'),
  };

  // Extract guardians
  const guardiansSection = extractSection(body, 'HUOLTAJAT') || extractSection(body, 'Huoltajat');
  const motherInfo = extractFieldValue(guardiansSection, 'Äiti') || guardiansSection.match(/Huoltaja 1[\s\S]*?Nimi:\*\*\s*(.+?)\s*\(Äiti\)/i);
  const fatherInfo = extractFieldValue(guardiansSection, 'Isä') || guardiansSection.match(/Huoltaja 2[\s\S]*?Nimi:\*\*\s*(.+?)\s*\(Isä\)/i);

  // Extract reason
  const reasonSection = extractSection(body, 'ILMOITUKSEN SYY');
  const reason = reasonSection.replace(/##\s*ILMOITUKSEN SYY.*?\n/, '').trim();

  // Extract highlights
  const highlightsSection = extractSection(body, 'Korostukset ja huomiot');
  const highlights: string[] = [];
  const highlightMatches = highlightsSection.matchAll(/>\s*(.+)/g);
  for (const match of highlightMatches) {
    highlights.push(match[1].trim());
  }

  // Determine urgency based on keywords
  let urgency: 'low' | 'medium' | 'high' | 'critical' = 'medium';
  const urgentKeywords = ['kiireellinen', 'välitön', 'pelko', 'väkivalta', 'turvallisuus'];
  const criticalKeywords = ['raiskaa', 'pahoinpitely', 'hengenvaarallinen'];

  if (criticalKeywords.some(kw => body.toLowerCase().includes(kw))) {
    urgency = 'critical';
  } else if (urgentKeywords.some(kw => body.toLowerCase().includes(kw))) {
    urgency = 'high';
  }

  // Create summary
  const summary = highlights[0] || reason.substring(0, 100) + '...';

  return {
    id: `notification-${date}`,
    date,
    filename,
    reporter,
    child,
    guardians: {
      mother: motherInfo ? { name: String(motherInfo) } : undefined,
      father: fatherInfo ? { name: String(fatherInfo) } : undefined,
    },
    reason,
    urgency,
    highlights,
    summary,
    fullText: body,
  };
}

// ============================================================================
// Parse Asiakaskirjaukset (Case Notes)
// ============================================================================

function parseCaseNotes(filePath: string): CaseNote[] {
  const content = readMarkdownFile(filePath);
  const caseNotes: CaseNote[] = [];

  // Split by date headers (# DD.MM.YYYY format)
  const dateRegex = /#\s+(\d+\.\d+\.\d+)/g;
  const sections = content.split(dateRegex).slice(1);

  for (let i = 0; i < sections.length; i += 2) {
    const dateStr = sections[i].trim();
    const noteContent = sections[i + 1].trim();

    // Parse date (DD.MM.YYYY -> YYYY-MM-DD)
    const dateParts = dateStr.split('.');
    const isoDate = `20${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

    // Extract keywords (first line before ilmoitusperuste)
    const lines = noteContent.split('\n');
    const keywordsLine = lines[0];
    const keywords = keywordsLine
      .split(',')
      .map(kw => kw.replace(/-/g, '').trim())
      .filter(kw => kw.length > 0);

    // Extract ilmoitusperuste
    const groundMatch = noteContent.match(/ilmoitusperuste:\s*(.+)/i);
    const notificationGround = groundMatch ? groundMatch[1].trim() : 'ei määritelty';

    caseNotes.push({
      id: `casenote-${isoDate}`,
      date: isoDate,
      keywords,
      notificationGround,
      fullText: noteContent,
    });
  }

  return caseNotes;
}

// ============================================================================
// Parse PTA Records
// ============================================================================

function parsePTARecords(filePath: string): { records: PTARecord[]; decisions: Decision[] } {
  const content = readMarkdownFile(filePath);
  const records: PTARecord[] = [];
  const decisions: Decision[] = [];

  // Split by date headers
  const dateRegex = /\*?\*?(\d+\.\d+\.\d+)\*?\*?\s+(.+?)(?=\n|$)/g;
  let match;
  const entries: Array<{ date: string; title: string; content: string; startIndex: number }> = [];

  while ((match = dateRegex.exec(content)) !== null) {
    entries.push({
      date: match[1],
      title: match[2],
      content: '',
      startIndex: match.index,
    });
  }

  // Extract content for each entry
  for (let i = 0; i < entries.length; i++) {
    const startIndex = entries[i].startIndex;
    const endIndex = i < entries.length - 1 ? entries[i + 1].startIndex : content.length;
    entries[i].content = content.substring(startIndex, endIndex);
  }

  // Process each entry
  entries.forEach(entry => {
    const dateParts = entry.date.split('.');
    const isoDate = `20${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;

    // Detect event type
    let eventType: PTARecord['eventType'] = 'muu';
    const titleLower = entry.title.toLowerCase();
    if (titleLower.includes('kotikäynti')) eventType = 'kotikäynti';
    else if (titleLower.includes('puhelu')) eventType = 'puhelu';
    else if (titleLower.includes('tapaaminen')) eventType = 'tapaaminen';
    else if (titleLower.includes('neuvottelu')) eventType = 'neuvottelu';
    else if (titleLower.includes('päätös')) eventType = 'päätös';

    // Extract AI guidance
    const aiGuidanceMatches = entry.content.match(/\(AI[^)]+\)/gi) || [];
    const aiGuidance = aiGuidanceMatches.join(' ');

    // Create summary
    const firstSentence = entry.content.split('\n').find(line => line.length > 20) || '';
    const summary = firstSentence.substring(0, 150).trim();

    // Extract actions (look for verb phrases)
    const actions: string[] = [];
    const actionMatches = entry.content.matchAll(/(?:Sovittu|Todettu|Kerrottu|Keskusteltu),?\s+että\s+(.+?)(?:\.|$)/gi);
    for (const match of actionMatches) {
      actions.push(match[1].trim());
    }

    // Check if this is a decision
    if (titleLower.includes('päätös') || entry.content.includes('Lastensuojelulaki')) {
      let decisionType: Decision['decisionType'] = 'muu';
      if (entry.content.includes('kiireellinen sijoitus')) decisionType = 'kiireellinen_sijoitus';
      else if (entry.content.includes('asiakkuus avataan')) decisionType = 'asiakkuuden_avaaminen';
      else if (entry.content.includes('avohuollon tuki')) decisionType = 'avohuollon_tukitoimi';

      const legalBasisMatch = entry.content.match(/Lastensuojelulaki\s+§?\s*(\d+)/i);
      const legalBasis = legalBasisMatch ? `Lastensuojelulaki § ${legalBasisMatch[1]}` : '';

      decisions.push({
        id: `decision-${isoDate}`,
        date: isoDate,
        decisionType,
        summary: entry.title,
        legalBasis,
        fullText: entry.content,
      });
    }

    records.push({
      id: `pta-${isoDate}-${eventType}`,
      date: isoDate,
      eventType,
      participants: [], // Could be extracted with more sophisticated parsing
      summary,
      actions,
      aiGuidance: aiGuidance || undefined,
      fullText: entry.content,
    });
  });

  return { records, decisions };
}

// ============================================================================
// Build Contact Info
// ============================================================================

function buildContactInfo(notifications: LSNotification[]): ContactInfo {
  // Use the most recent notification for primary contact info
  const latestNotification = notifications[notifications.length - 1];

  const reporters = notifications.map(n => ({
    name: n.reporter.name,
    profession: n.reporter.profession,
    phone: n.reporter.phone,
    email: n.reporter.email,
    workplace: undefined,
  }));

  return {
    child: latestNotification.child,
    guardians: latestNotification.guardians,
    reporters,
    professionals: {
      // These would be filled from PTA records in a more sophisticated parser
    },
  };
}

// ============================================================================
// Determine Main Problem
// ============================================================================

function determineMainProblem(caseNotes: CaseNote[]): MainProblem {
  // Count notification grounds
  const groundCounts: Record<string, number> = {};
  const allSubcategories: Set<string> = new Set();

  caseNotes.forEach(note => {
    groundCounts[note.notificationGround] = (groundCounts[note.notificationGround] || 0) + 1;
    note.keywords.forEach(kw => allSubcategories.add(kw));
  });

  // Find most common ground
  const sortedGrounds = Object.entries(groundCounts).sort((a, b) => b[1] - a[1]);
  const mainCategory = sortedGrounds[0]?.[0] || 'ei määritelty';

  // Determine severity based on keywords
  let severity: MainProblem['severity'] = 'medium';
  const criticalKeywords = ['väkivalta', 'raiskaa', 'vahingoittaminen'];
  const highKeywords = ['alkoholi', 'päihteet', 'karannut', 'poliisi'];

  if (Array.from(allSubcategories).some(kw => criticalKeywords.some(ckw => kw.includes(ckw)))) {
    severity = 'critical';
  } else if (Array.from(allSubcategories).some(kw => highKeywords.some(hkw => kw.includes(hkw)))) {
    severity = 'high';
  }

  return {
    category: mainCategory,
    subcategories: Array.from(allSubcategories),
    description: `Lastensuojeluasiakkuus, pääasiallinen huoli: ${mainCategory}`,
    severity,
  };
}

// ============================================================================
// Build Timeline
// ============================================================================

function buildTimeline(clientData: Omit<LSClientData, 'timeline'>): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];

  // Add notifications
  clientData.notifications.forEach(n => {
    timeline.push({
      id: `timeline-${n.id}`,
      date: n.date,
      type: 'notification',
      title: `LS-ilmoitus: ${n.reporter.profession}`,
      summary: n.summary,
      relatedId: n.id,
    });
  });

  // Add case notes
  clientData.caseNotes.forEach(cn => {
    timeline.push({
      id: `timeline-${cn.id}`,
      date: cn.date,
      type: 'case_note',
      title: `Asiakaskirjaus: ${cn.notificationGround}`,
      summary: cn.keywords.join(', '),
      relatedId: cn.id,
    });
  });

  // Add decisions
  clientData.decisions.forEach(d => {
    timeline.push({
      id: `timeline-${d.id}`,
      date: d.date,
      type: 'decision',
      title: `Päätös: ${d.summary}`,
      summary: d.legalBasis,
      relatedId: d.id,
    });
  });

  // Add PTA records
  clientData.ptaRecords.forEach(pta => {
    timeline.push({
      id: `timeline-${pta.id}`,
      date: pta.date,
      type: 'pta_record',
      title: `${pta.eventType}: ${pta.summary.substring(0, 50)}`,
      summary: pta.summary,
      relatedId: pta.id,
    });
  });

  // Sort by date
  timeline.sort((a, b) => a.date.localeCompare(b.date));

  return timeline;
}

// ============================================================================
// Main Processing Function
// ============================================================================

function processLSData(): LSClientData {
  console.log('📂 Reading LS data from Aineisto folder...\n');

  // Parse notifications
  console.log('📄 Processing LS-ilmoitukset...');
  const notificationFiles = [
    '2016_08_03_Lastensuojeluilmoitus.md',
    '2017_11_16_Lastensuojeluilmoitus.md',
    '2018_04_26_Lastensuojeluilmoitus.md',
  ];

  const notifications = notificationFiles.map(file => {
    const filePath = path.join(AINEISTO_PATH, 'LS-ilmoitukset', file);
    console.log(`  ✓ ${file}`);
    return parseNotification(filePath);
  });

  // Parse case notes
  console.log('\n📄 Processing Asiakaskirjaukset...');
  const caseNotesPath = path.join(AINEISTO_PATH, 'Asiakaskirjaukset', 'lastensuojeluhakemusten_ilmoitusperusteita.md');
  const caseNotes = parseCaseNotes(caseNotesPath);
  console.log(`  ✓ Parsed ${caseNotes.length} case notes`);

  // Parse PTA records
  console.log('\n📄 Processing PTA records...');
  const ptaPath = path.join(AINEISTO_PATH, 'PTA', 'Ls_ilmoituksiin_liittyvat_kirjaukset.md');
  const { records: ptaRecords, decisions } = parsePTARecords(ptaPath);
  console.log(`  ✓ Parsed ${ptaRecords.length} PTA records`);
  console.log(`  ✓ Extracted ${decisions.length} decisions`);

  // Build contact info
  console.log('\n📞 Building contact information...');
  const contactInfo = buildContactInfo(notifications);

  // Determine main problem
  console.log('\n🎯 Analyzing main problem...');
  const mainProblem = determineMainProblem(caseNotes);
  console.log(`  ✓ Main category: ${mainProblem.category}`);
  console.log(`  ✓ Severity: ${mainProblem.severity}`);

  // Build service plans (extracted from PTA records)
  console.log('\n📋 Building service plans...');
  const servicePlans: ServicePlan[] = [
    {
      id: 'serviceplan-1',
      serviceType: 'Viikoittaiset tapaamiset sosiaaliohjaajan kanssa',
      startDate: '2017-05-04',
      status: 'completed',
      description: 'Säännölliset tapaamiset tilanteen seurantaa varten',
    },
    {
      id: 'serviceplan-2',
      serviceType: 'Perhetyö',
      startDate: '2017-05-01',
      endDate: '2018-02-21',
      status: 'cancelled',
      description: 'Perhetyön tuki, äiti kieltäytyi tuesta 21.2.2018',
    },
  ];

  // Build complete client data
  const clientData: Omit<LSClientData, 'timeline'> = {
    clientId: 'lapsi-1',
    clientName: 'Lapsi 1',
    mainProblem,
    notifications,
    caseNotes,
    decisions,
    contactInfo,
    ptaRecords,
    servicePlans,
  };

  // Build timeline
  console.log('\n⏱️  Building timeline...');
  const timeline = buildTimeline(clientData);
  console.log(`  ✓ Created ${timeline.length} timeline events`);

  const completeClientData: LSClientData = {
    ...clientData,
    timeline,
  };

  return completeClientData;
}

// ============================================================================
// Generate TypeScript File
// ============================================================================

function generateTypeScriptFile(data: LSClientData): void {
  console.log('\n💾 Generating TypeScript file...');

  const tsContent = `/**
 * Lastensuojelu Client Data
 *
 * Auto-generated from Aineisto markdown files
 * Run \`npm run process-ls-data\` to regenerate
 *
 * Generated: ${new Date().toISOString()}
 */

import type { LSClientData } from './ls-types';

export const lsClientData: LSClientData = ${JSON.stringify(data, null, 2)};

export default lsClientData;
`;

  fs.writeFileSync(OUTPUT_PATH, tsContent, 'utf-8');
  console.log(`  ✓ Written to ${OUTPUT_PATH}`);
}

// ============================================================================
// Run
// ============================================================================

console.log('🚀 Lastensuojelu Data Processing\n');
console.log('='.repeat(60));

try {
  const clientData = processLSData();
  generateTypeScriptFile(clientData);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Processing complete!\n');
  console.log('📊 Summary:');
  console.log(`   • Notifications: ${clientData.notifications.length}`);
  console.log(`   • Case Notes: ${clientData.caseNotes.length}`);
  console.log(`   • PTA Records: ${clientData.ptaRecords.length}`);
  console.log(`   • Decisions: ${clientData.decisions.length}`);
  console.log(`   • Service Plans: ${clientData.servicePlans.length}`);
  console.log(`   • Timeline Events: ${clientData.timeline.length}`);
  console.log(`   • Main Problem: ${clientData.mainProblem.category} (${clientData.mainProblem.severity})`);
  console.log('\n');
} catch (error) {
  console.error('\n❌ Error processing data:', error);
  process.exit(1);
}
