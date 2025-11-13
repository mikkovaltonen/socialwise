/**
 * Upload PTA document to Firebase Storage
 *
 * Uploads PTA_malliasiakas.md to Firebase Storage Aineisto/PTA/ folder
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
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
if (!firebaseConfig.projectId || !firebaseConfig.storageBucket) {
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
const storage = getStorage(app);

// Source file
const SOURCE_FILE = path.join(process.cwd(), 'public', 'Aineisto', 'PTA_malliasiakas.md');

async function uploadPTA() {
  console.log('🚀 Starting PTA upload to Firebase Storage');
  console.log(`📁 Source file: ${SOURCE_FILE}`);
  console.log(`🪣 Storage bucket: ${firebaseConfig.storageBucket}`);
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

  // Upload file
  try {
    const fileName = 'PTA_malliasiakas.md';
    const storagePath = `Aineisto/PTA/${fileName}`;

    console.log(`📤 Uploading: ${fileName}`);

    // Read file content
    const fileContent = fs.readFileSync(SOURCE_FILE);

    // Create storage reference
    const storageRef = ref(storage, storagePath);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, fileContent, {
      contentType: 'text/markdown',
      customMetadata: {
        originalPath: `PTA/${fileName}`,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userEmail || 'unknown',
      },
    });

    console.log(`✅ Uploaded: ${storagePath}`);
    console.log('');
  } catch (error) {
    console.error(`❌ Failed to upload:`, error);
    process.exit(1);
  }

  console.log('═══════════════════════════════════════');
  console.log('📊 Upload Summary');
  console.log('═══════════════════════════════════════');
  console.log(`Storage path: Aineisto/PTA/PTA_malliasiakas.md`);
  console.log(`File size: ${fs.statSync(SOURCE_FILE).size} bytes`);
  console.log('');
  console.log('✨ Upload complete!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Update aineistoStorageService.ts to include PTA path');
  console.log('2. Update aineistoParser.ts to fetch from Storage');
}

// Run upload
uploadPTA()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
