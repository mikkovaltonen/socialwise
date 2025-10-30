/**
 * Firebase Client SDK Setup
 * Uses email/password authentication from .env
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from parent directory
config({ path: resolve(__dirname, '../.env') });

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isAuthenticated = false;

/**
 * Initialize Firebase Client SDK
 */
function initializeFirebase(): void {
  if (getApps().length === 0) {
    const firebaseConfig = {
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.VITE_FIREBASE_APP_ID,
    };

    if (!firebaseConfig.projectId) {
      throw new Error('Firebase projectId is missing. Check VITE_FIREBASE_PROJECT_ID in .env');
    }

    console.log('🔐 Initializing Firebase Client SDK');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log(`✅ Firebase initialized for project: ${firebaseConfig.projectId}`);
  } else {
    app = getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
  }
}

/**
 * Authenticate with email/password and get Firestore instance
 */
export async function authenticateAndGetFirestore(): Promise<Firestore> {
  // Initialize Firebase if not already done
  if (!app) {
    initializeFirebase();
  }

  // Authenticate if not already authenticated
  if (!isAuthenticated) {
    const email = process.env.FIRESTORE_USER;
    const password = process.env.FIRESTORE_PW;

    if (!email || !password) {
      throw new Error('FIRESTORE_USER and FIRESTORE_PW must be set in .env');
    }

    console.log(`🔐 Authenticating as: ${email}`);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      isAuthenticated = true;
      console.log('✅ Authentication successful');
    } catch (error: any) {
      console.error('❌ Authentication failed:', error.message);
      throw new Error(`Firebase authentication failed: ${error.message}`);
    }
  }

  return db;
}

/**
 * Get Firestore instance (must call authenticateAndGetFirestore first)
 */
export function getDb(): Firestore {
  if (!db) {
    throw new Error('Firebase not initialized. Call authenticateAndGetFirestore() first.');
  }
  if (!isAuthenticated) {
    throw new Error('Not authenticated. Call authenticateAndGetFirestore() first.');
  }
  return db;
}
