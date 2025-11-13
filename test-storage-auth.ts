/**
 * Test Script: Firebase Storage Authentication
 *
 * Tests that user/password authentication works with Firebase Storage
 * Uses credentials from .env file
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, getBytes } from 'firebase/storage';
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
  console.error('Required: VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET');
  process.exit(1);
}

if (!userEmail || !userPassword) {
  console.error('❌ Error: Missing user credentials in .env file');
  console.error('Required: VITE_FIREBASE_UER, VITE_FIREBASE_PW');
  process.exit(1);
}

// Test file path (one of the files we uploaded)
const TEST_FILE_PATH = 'Aineisto/Yhteystiedot/Lapsi_1_yhteystiedot.md';

// Initialize Firebase
console.log('🔧 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

console.log('✅ Firebase initialized');
console.log(`📁 Storage bucket: ${firebaseConfig.storageBucket}`);
console.log('');

async function testStorageAuth() {
  console.log('═══════════════════════════════════════');
  console.log('🧪 Firebase Storage Authentication Test');
  console.log('═══════════════════════════════════════');
  console.log('');

  // Step 1: Authenticate user
  console.log('Step 1: Authenticating user...');
  console.log(`👤 Email: ${userEmail}`);

  try {
    const userCredential = await signInWithEmailAndPassword(auth, userEmail!, userPassword!);
    console.log(`✅ Authentication successful!`);
    console.log(`   User ID: ${userCredential.user.uid}`);
    console.log(`   Email verified: ${userCredential.user.emailVerified}`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Authentication failed!');
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.error('Possible causes:');
    console.error('  - Wrong email or password');
    console.error('  - User does not exist in Firebase Auth');
    console.error('  - Firebase Auth not enabled');
    console.error('');
    console.error('Solution:');
    console.error('  1. Go to Firebase Console → Authentication');
    console.error('  2. Verify user exists');
    console.error('  3. Check credentials in .env file');
    process.exit(1);
  }

  // Step 2: Try to fetch a file from Storage
  console.log('Step 2: Fetching file from Firebase Storage...');
  console.log(`📄 File: ${TEST_FILE_PATH}`);

  try {
    const fileRef = ref(storage, TEST_FILE_PATH);
    const arrayBuffer = await getBytes(fileRef);

    // Convert to text
    const decoder = new TextDecoder('utf-8');
    const content = decoder.decode(arrayBuffer);

    console.log(`✅ File fetched successfully!`);
    console.log(`   Size: ${arrayBuffer.byteLength} bytes`);
    console.log(`   Preview: ${content.substring(0, 100)}...`);
    console.log('');
  } catch (error: any) {
    console.error('❌ Failed to fetch file from Storage!');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error('');

    if (error.code === 'storage/unauthorized') {
      console.error('Possible causes:');
      console.error('  - Storage rules do not allow authenticated read');
      console.error('  - User not properly authenticated');
      console.error('');
      console.error('Solution:');
      console.error('  1. Check Storage rules in Firebase Console');
      console.error('  2. Ensure rules allow: if request.auth != null');
    } else if (error.code === 'storage/object-not-found') {
      console.error('Possible causes:');
      console.error('  - File does not exist in Storage');
      console.error('  - File path is incorrect');
      console.error('');
      console.error('Solution:');
      console.error('  1. Verify file exists in Firebase Console → Storage');
      console.error(`  2. Check path: ${TEST_FILE_PATH}`);
    } else if (error.message.includes('CORS')) {
      console.error('Possible causes:');
      console.error('  - CORS not configured on Storage bucket');
      console.error('');
      console.error('Solution:');
      console.error('  1. Run: gcloud auth login');
      console.error('  2. Run: gsutil cors set storage-cors.json gs://socialwise-c8ddc.firebasestorage.app');
    } else {
      console.error('Unknown error. Check Firebase Console for details.');
    }

    process.exit(1);
  }

  // Step 3: Test multiple files
  console.log('Step 3: Testing multiple files...');

  const testFiles = [
    'Aineisto/LS-ilmoitukset/Lapsi_1_2016_08_03_Lastensuojeluilmoitus.md',
    'Aineisto/Päätökset/Lapsi_1_2025_03_22_päätös.md',
  ];

  let successCount = 0;
  let failCount = 0;

  for (const filePath of testFiles) {
    try {
      const fileRef = ref(storage, filePath);
      const arrayBuffer = await getBytes(fileRef);
      console.log(`   ✅ ${filePath.split('/').pop()} (${arrayBuffer.byteLength} bytes)`);
      successCount++;
    } catch (error: any) {
      console.log(`   ❌ ${filePath.split('/').pop()} (${error.code})`);
      failCount++;
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📊 Test Results');
  console.log('═══════════════════════════════════════');
  console.log(`Total files tested: ${testFiles.length + 1}`);
  console.log(`✅ Successful: ${successCount + 1}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log('');

  if (failCount === 0) {
    console.log('🎉 All tests passed!');
    console.log('');
    console.log('✅ Authentication works');
    console.log('✅ Storage access works');
    console.log('✅ Files are readable');
    console.log('');
    console.log('Your app should work correctly now!');
  } else {
    console.log('⚠️  Some tests failed. Check errors above.');
  }

  console.log('');
  console.log('👋 Test complete!');
}

// Run test
testStorageAuth()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
