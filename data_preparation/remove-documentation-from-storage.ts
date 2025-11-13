/**
 * Remove DATA_PARSING_DOKUMENTAATIO.md from Firebase Storage
 * This file should remain in local /public/Aineisto folder
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, deleteObject } from 'firebase/storage';
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

async function removeDocumentation() {
  console.log('🚀 Starting documentation file removal from Firebase Storage');
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

  // Delete the documentation file
  try {
    const filePath = 'Aineisto/DATA_PARSING_DOKUMENTAATIO.md';
    console.log(`🗑️  Deleting: ${filePath}`);

    const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log(`✅ Successfully deleted: ${filePath}`);
    console.log('');
    console.log('✨ Documentation file removed from Firebase Storage!');
    console.log('📁 File remains in local /public/Aineisto folder');
  } catch (error) {
    console.error('❌ Error deleting file:', error);
    process.exit(1);
  }
}

// Run removal
removeDocumentation()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
