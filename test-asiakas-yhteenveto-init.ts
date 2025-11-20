/**
 * Test script to verify and initialize ASIAKAS_YHTEENVETO Firestore collection
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTION_NAME = 'ASIAKAS_YHTEENVETO';
const PROMPT_FILE = './public/ASIAKAS_YHTEENVETO_PROMPT.md';

async function checkCollection() {
  console.log('\n🔍 Checking ASIAKAS_YHTEENVETO collection...\n');

  try {
    const collectionRef = collection(db, COLLECTION_NAME);
    const q = query(collectionRef, orderBy('createdAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('❌ Collection is EMPTY - needs initialization');
      return { exists: false, count: 0, docs: [] };
    } else {
      console.log(`✅ Collection has ${snapshot.size} document(s)`);

      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Display documents
      docs.forEach((doc: any, index: number) => {
        console.log(`\n📄 Document ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   LLM Model: ${doc.llmModel}`);
        console.log(`   Temperature: ${doc.temperature}`);
        console.log(`   Prompt Version: ${doc.promptVersion}`);
        console.log(`   Created At: ${doc.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}`);
        console.log(`   Created By: ${doc.createdByEmail || doc.createdBy}`);
        console.log(`   Description: ${doc.description || 'N/A'}`);
        console.log(`   Content length: ${doc.content?.length || 0} chars`);
      });

      return { exists: true, count: snapshot.size, docs };
    }
  } catch (error) {
    console.error('❌ Error checking collection:', error);
    throw error;
  }
}

async function initializeCollection() {
  console.log('\n🚀 Initializing ASIAKAS_YHTEENVETO collection...\n');

  try {
    // Read prompt file
    const promptPath = path.resolve(PROMPT_FILE);
    console.log(`📖 Reading prompt from: ${promptPath}`);

    if (!fs.existsSync(promptPath)) {
      throw new Error(`Prompt file not found: ${promptPath}`);
    }

    const promptContent = fs.readFileSync(promptPath, 'utf-8');
    console.log(`✅ Loaded prompt (${promptContent.length} chars)`);

    // Create initial document
    const collectionRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(collectionRef, {
      content: promptContent,
      llmModel: 'google/gemini-2.5-flash-lite',
      temperature: 0.3,
      promptVersion: 'production',
      createdAt: serverTimestamp(),
      createdBy: 'system-init',
      createdByEmail: 'system@socialwise.fi',
      description: 'Initial asiakas yhteenveto prompt - automatic initialization',
    });

    console.log(`\n✅ Successfully initialized with document ID: ${docRef.id}`);
    console.log('   Model: google/gemini-2.5-flash-lite');
    console.log('   Temperature: 0.3');
    console.log('   Version: production');

    return docRef.id;
  } catch (error) {
    console.error('❌ Error initializing collection:', error);
    throw error;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ASIAKAS_YHTEENVETO Firestore Collection Check');
  console.log('═══════════════════════════════════════════════════════');

  try {
    // Check current state
    const result = await checkCollection();

    if (!result.exists) {
      console.log('\n⚠️  Collection needs initialization');
      console.log('Would you like to initialize now? (This will create the first document)');

      // Auto-initialize
      await initializeCollection();

      // Verify
      console.log('\n🔍 Verifying initialization...');
      const verifyResult = await checkCollection();

      if (verifyResult.exists && verifyResult.count > 0) {
        console.log('\n✅ SUCCESS: Collection initialized and verified!');
      } else {
        console.log('\n❌ ERROR: Initialization failed verification');
      }
    } else {
      console.log('\n✅ Collection already initialized - no action needed');
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  Check completed');
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main();
