import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

console.log('🔍 Testing Firebase and API connections...\n');

// Test Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

console.log('📋 Firebase Config:');
console.log(`  Project ID: ${firebaseConfig.projectId}`);
console.log(`  Auth Domain: ${firebaseConfig.authDomain}`);
console.log(`  API Key: ${firebaseConfig.apiKey?.substring(0, 10)}...`);
console.log('');

async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase connection...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Try to read from suppliers_complete collection
    const suppliersRef = collection(db, 'suppliers_complete');
    const q = query(suppliersRef, limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log('✅ Firebase connection successful!');
      console.log(`   Found ${snapshot.size} document(s) in suppliers_complete collection`);
    } else {
      console.log('⚠️  Firebase connected but suppliers_complete collection is empty');
    }
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    if (error.code === 'permission-denied') {
      console.log('   Check Firestore security rules');
    }
  }
}

async function testGeminiAPI() {
  try {
    console.log('\n🤖 Testing Gemini API...');
    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.log('❌ Gemini API key not found in .env');
      return;
    }

    console.log(`   API Key: ${apiKey.substring(0, 10)}...`);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

    if (response.ok) {
      console.log('✅ Gemini API key is valid!');
      const data = await response.json();
      console.log(`   Available models: ${data.models?.length || 0}`);
    } else {
      console.log('❌ Gemini API key validation failed:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
  }
}

// Run tests
(async () => {
  await testFirebase();
  await testGeminiAPI();
  console.log('\n✨ Tests completed!');
  process.exit(0);
})();