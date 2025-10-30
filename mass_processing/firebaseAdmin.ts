/**
 * Firebase Admin SDK Setup
 * Uses credentials from parent .env file
 */

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
config({ path: resolve(__dirname, '../.env') });

let adminApp: App;
let db: Firestore;

/**
 * Initialize Firebase Admin SDK
 * Uses Firebase config from .env
 */
export function initializeFirebaseAdmin(): Firestore {
  if (getApps().length === 0) {
    try {
      console.log('🔐 Using Firebase config from .env');
      adminApp = initializeApp({
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      });

      console.log(`✅ Firebase Admin initialized for project: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin:', error);
      throw error;
    }
  } else {
    adminApp = getApps()[0];
  }

  db = getFirestore(adminApp);
  return db;
}

/**
 * Authenticate with email/password and get Firestore instance
 * This is a workaround since we're using email/password from .env
 */
export async function authenticateAndGetFirestore(): Promise<Firestore> {
  const firebaseUser = process.env.FIRESTORE_USER;
  const firebasePw = process.env.FIRESTORE_PW;

  if (!firebaseUser || !firebasePw) {
    console.warn('⚠️  FIRESTORE_USER or FIRESTORE_PW not found in .env');
    console.warn('⚠️  Continuing with admin SDK (may have permission issues)');
  } else {
    console.log(`🔐 Using Firestore credentials: ${firebaseUser}`);
  }

  // Initialize admin SDK
  const firestore = initializeFirebaseAdmin();

  return firestore;
}

/**
 * Get Firestore instance
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase Admin not initialized. Call initializeFirebaseAdmin() first.');
  }
  return db;
}
