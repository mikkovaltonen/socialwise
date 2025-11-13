/**
 * PTA Migration Script to Firestore
 *
 * Migrates PTA (Palvelutarpeen Arviointi) document to Firestore
 * Collection: crm_pta_documents
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const userEmail = process.env.VITE_FIREBASE_UER;
const userPassword = process.env.VITE_FIREBASE_PW;

// Validate environment variables
if (!firebaseConfig.projectId) {
  console.error('❌ Error: Missing Firebase configuration in .env file');
  process.exit(1);
}

if (!userEmail || !userPassword) {
  console.error('❌ Error: Missing VITE_FIREBASE_UER or VITE_FIREBASE_PW in .env file');
  process.exit(1);
}

// Initialize Firebase
console.log('🔧 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Source file
const SOURCE_FILE = path.join(process.cwd(), 'public', 'Aineisto', 'PTA_malliasiakas.md');
const COLLECTION_NAME = 'crm_pta_documents';

/**
 * Parse PTA markdown document
 */
function parsePTADocument(markdown: string) {
  // Extract date
  const dateMatch = markdown.match(/\*\*Päiväys:\*\*\s*(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  let date = new Date().toISOString().split('T')[0];
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Extract main sections
  const sections: Record<string, string> = {};

  const sectionRegex = /##\s+([^\n]+)\n([\s\S]*?)(?=\n##|$)/g;
  let match;

  while ((match = sectionRegex.exec(markdown)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    sections[title] = content;
  }

  // Extract family information
  const perheSection = sections['PERHE'] || '';
  const lapsiMatch = perheSection.match(/\*\*Lapsi:\*\*\s*(.+)/);
  const lapsi = lapsiMatch ? lapsiMatch[1].trim() : '';

  // Extract services
  const palvelutSection = sections['PALVELUT'] || '';
  const palvelut = palvelutSection.split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim());

  // Extract recommendations
  const johtopäätöksetSection = sections['SOSIAALIHUOLLON AMMATTIHENKILÖN JOHTOPÄÄTÖKSET ASIAKKUUDEN EDELLYTYKSISTÄ'] || '';
  const suosituksetMatch = johtopäätöksetSection.match(/\*\*Suositellut palvelut ja tavoitteet\*\*([\s\S]*)/);
  const suositukset = suosituksetMatch ? suosituksetMatch[1].trim() : '';

  // Extract key highlights
  const highlights: string[] = [];

  // Look for important items in each section
  Object.values(sections).forEach(section => {
    const boldItems = section.match(/\*\*([^*]+)\*\*/g);
    if (boldItems) {
      boldItems.slice(0, 3).forEach(item => {
        const cleaned = item.replace(/\*\*/g, '').trim();
        if (cleaned.length > 10 && cleaned.length < 100) {
          highlights.push(cleaned);
        }
      });
    }
  });

  return {
    date,
    clientId: 'lapsi-1',
    documentType: 'pta',
    title: 'Palvelutarpeen Arviointi',
    lapsi,
    sections,
    palvelut,
    suositukset,
    highlights: [...new Set(highlights)].slice(0, 5), // Remove duplicates, limit to 5
    fullText: markdown,
    createdAt: Timestamp.now(),
    createdBy: userEmail,
  };
}

/**
 * Main migration function
 */
async function migratePTA() {
  console.log('🚀 Starting PTA migration to Firestore');
  console.log(`📁 Source file: ${SOURCE_FILE}`);
  console.log(`📊 Collection: ${COLLECTION_NAME}`);
  console.log('');

  // Authenticate with Firebase
  try {
    console.log('🔐 Authenticating with Firebase...');
    await signInWithEmailAndPassword(auth, userEmail!, userPassword!);
    console.log(`✅ Authenticated as: ${userEmail}`);
    console.log('');
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    process.exit(1);
  }

  // Check if source file exists
  if (!fs.existsSync(SOURCE_FILE)) {
    console.error(`❌ Error: Source file not found: ${SOURCE_FILE}`);
    process.exit(1);
  }

  // Read and parse file
  console.log('📖 Reading PTA document...');
  const markdown = fs.readFileSync(SOURCE_FILE, 'utf-8');
  const ptaData = parsePTADocument(markdown);

  console.log(`✅ Document parsed`);
  console.log(`   Date: ${ptaData.date}`);
  console.log(`   Client: ${ptaData.clientId}`);
  console.log(`   Lapsi: ${ptaData.lapsi}`);
  console.log(`   Sections: ${Object.keys(ptaData.sections).length}`);
  console.log(`   Palvelut: ${ptaData.palvelut.length}`);
  console.log(`   Highlights: ${ptaData.highlights.length}`);
  console.log('');

  // Save to Firestore
  console.log('💾 Saving to Firestore...');

  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), ptaData);
    console.log(`✅ Document saved with ID: ${docRef.id}`);
    console.log('');
  } catch (error) {
    console.error('❌ Failed to save document:', error);
    process.exit(1);
  }

  // Generate summary
  console.log('═══════════════════════════════════════');
  console.log('📊 Migration Summary');
  console.log('═══════════════════════════════════════');
  console.log(`Collection: ${COLLECTION_NAME}`);
  console.log(`Document Type: PTA (Palvelutarpeen Arviointi)`);
  console.log(`Date: ${ptaData.date}`);
  console.log(`Client ID: ${ptaData.clientId}`);
  console.log(`Full text length: ${ptaData.fullText.length} characters`);
  console.log('');

  console.log('Key Sections:');
  Object.keys(ptaData.sections).forEach(section => {
    console.log(`  - ${section}`);
  });
  console.log('');

  console.log('Palvelut:');
  ptaData.palvelut.forEach(palvelu => {
    console.log(`  - ${palvelu.substring(0, 80)}...`);
  });
  console.log('');

  console.log('Highlights:');
  ptaData.highlights.forEach(highlight => {
    console.log(`  - ${highlight}`);
  });
  console.log('');

  console.log('✨ Migration complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. View document in Firebase Console:');
  console.log(`   https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/data/${COLLECTION_NAME}`);
  console.log('2. Update UI to display PTA documents');
  console.log('3. Test document loading in application');
}

// Run migration
migratePTA()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
