import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '.env') });

console.log('🔍 Testing Firebase and OpenRouter API connections...\n');

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
    const q = query(suppliersRef, limit(5));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      console.log('✅ Firebase connection successful!');
      console.log(`   Found ${snapshot.size} document(s) in suppliers_complete collection`);

      // Show sample data
      const firstDoc = snapshot.docs[0];
      const data = firstDoc.data();
      console.log(`   Sample supplier: ${data.original?.Company || 'Unknown'}`);
      console.log(`   Main Category: ${data.original?.['Supplier Main Category'] || 'N/A'}`);
    } else {
      console.log('⚠️  Firebase connected but suppliers_complete collection is empty');
    }

    // Try to count total documents
    const allSuppliersRef = collection(db, 'suppliers_complete');
    const allSnapshot = await getDocs(allSuppliersRef);
    console.log(`   Total suppliers in database: ${allSnapshot.size}`);

  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    if (error.code === 'permission-denied') {
      console.log('   Check Firestore security rules');
    } else if (error.message.includes('API has not been used')) {
      console.log('   Firestore API needs to be enabled in Google Cloud Console');
    }
  }
}

async function testOpenRouterAPI() {
  try {
    console.log('\n🤖 Testing OpenRouter API...');
    const apiKey = process.env.VITE_OPEN_ROUTER_API_KEY;

    if (!apiKey) {
      console.log('❌ OpenRouter API key not found in .env');
      return;
    }

    console.log(`   API Key: ${apiKey.substring(0, 15)}...`);

    // Test OpenRouter API with a simple request
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8080',
        'X-Title': 'Valmet Procurement AI'
      }
    });

    if (response.ok) {
      console.log('✅ OpenRouter API key is valid!');
      const data = await response.json();
      console.log(`   Available models: ${data.data?.length || 0}`);

      // Show some available models
      if (data.data && data.data.length > 0) {
        console.log('   Sample models:');
        data.data.slice(0, 3).forEach(model => {
          console.log(`     - ${model.id}`);
        });
      }
    } else {
      console.log(`❌ OpenRouter API validation failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ OpenRouter API test failed:', error.message);
  }
}

// Test Chat Completion with OpenRouter
async function testOpenRouterChat() {
  try {
    console.log('\n💬 Testing OpenRouter Chat Completion...');
    const apiKey = process.env.VITE_OPEN_ROUTER_API_KEY;

    if (!apiKey) {
      return;
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:8080',
        'X-Title': 'Valmet Procurement AI'
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, API is working!" in exactly 5 words.'
          }
        ],
        max_tokens: 50
      })
    });

    if (response.ok) {
      console.log('✅ OpenRouter Chat API works!');
      const data = await response.json();
      console.log(`   Response: ${data.choices?.[0]?.message?.content || 'No response'}`);
    } else {
      console.log(`❌ Chat completion failed: ${response.status}`);
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ Chat test failed:', error.message);
  }
}

// Run tests
(async () => {
  await testFirebase();
  await testOpenRouterAPI();
  await testOpenRouterChat();
  console.log('\n✨ All tests completed!');
  process.exit(0);
})();