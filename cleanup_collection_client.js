// Client-side migration script using Firebase client SDK
// This uses your .env credentials to perform the migration

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Firebase configuration from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanupAndRenameCollection() {
  console.log('🚀 Starting cleanup and migration process...');
  console.log('This script will:');
  console.log('1. Delete IT consulting suppliers (103 suppliers)');
  console.log('2. Delete IT services suppliers (8 suppliers)');
  console.log('3. Copy remaining suppliers to ext_labour_suppliers collection');
  console.log('4. Delete the original supplier_spend collection\n');

  // Ask for authentication
  console.log('Please provide your Firebase authentication credentials:');
  const email = await question('Email: ');
  const password = await question('Password: ');

  try {
    // Authenticate user
    console.log('\n🔐 Authenticating...');
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authentication successful!\n');
  } catch (error) {
    console.error('❌ Authentication failed:', error.message);
    rl.close();
    process.exit(1);
  }

  const sourceCollection = 'supplier_spend';
  const targetCollection = 'ext_labour_suppliers';

  try {
    // Get all documents from supplier_spend
    console.log(`📚 Reading documents from ${sourceCollection}...`);
    const snapshot = await getDocs(collection(db, sourceCollection));
    console.log(`✅ Found ${snapshot.size} documents\n`);

    let deletedCount = 0;
    let migratedCount = 0;
    let processedCount = 0;

    // Categories to delete
    const categoriesToDelete = [
      'iPRO, Office IT, IT consulting',
      'Indirect procurement iPRO, Office IT, IT services',
      'Indirect procurement iPRO, Office IT, IT consulting'
    ];

    // Process in batches to avoid memory issues
    const BATCH_SIZE = 100;
    let batch = writeBatch(db);
    let batchCount = 0;

    console.log('🔄 Processing documents...');

    for (const docSnap of snapshot.docs) {
      processedCount++;
      const data = docSnap.data();
      const mainCategory = data.original?.['Supplier Main Category'] || '';
      const companyName = data.original?.['Company'] || 'Unknown';

      // Check if this supplier should be deleted
      let shouldDelete = false;
      for (const cat of categoriesToDelete) {
        if (mainCategory.includes(cat)) {
          shouldDelete = true;
          break;
        }
      }

      if (shouldDelete) {
        if (deletedCount < 5) { // Show first 5 deletions
          console.log(`  ❌ Skipping: ${companyName} (${mainCategory})`);
        }
        deletedCount++;
      } else {
        // Migrate to new collection
        const targetDocRef = doc(db, targetCollection, docSnap.id);
        batch.set(targetDocRef, data);
        batchCount++;
        migratedCount++;

        if (migratedCount <= 5) { // Show first 5 migrations
          console.log(`  ✅ Migrating: ${companyName}`);
        }

        // Commit batch when it reaches the limit
        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  📦 Committed batch of ${batchCount} documents (${migratedCount} total migrated)`);
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      // Show progress every 50 documents
      if (processedCount % 50 === 0) {
        console.log(`  ⏳ Progress: ${processedCount}/${snapshot.size} documents processed`);
      }
    }

    // Commit any remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`  📦 Committed final batch of ${batchCount} documents`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total documents processed: ${snapshot.size}`);
    console.log(`Documents deleted (IT categories): ${deletedCount}`);
    console.log(`Documents migrated to ${targetCollection}: ${migratedCount}`);
    console.log('='.repeat(60) + '\n');

    // Ask for confirmation before deleting old collection
    const confirmDelete = await question(
      `\n⚠️  Ready to delete the original ${sourceCollection} collection.\n` +
      `This action cannot be undone. Type 'yes' to confirm: `
    );

    if (confirmDelete.toLowerCase() === 'yes') {
      console.log(`\n🗑️  Deleting all documents from ${sourceCollection}...`);

      // Delete in batches
      const deleteSnapshot = await getDocs(collection(db, sourceCollection));
      let deleteBatch = writeBatch(db);
      let deleteBatchCount = 0;
      let totalDeleted = 0;

      for (const docSnap of deleteSnapshot.docs) {
        deleteBatch.delete(docSnap.ref);
        deleteBatchCount++;
        totalDeleted++;

        if (deleteBatchCount >= BATCH_SIZE) {
          await deleteBatch.commit();
          console.log(`  🗑️  Deleted ${totalDeleted}/${deleteSnapshot.size} documents`);
          deleteBatch = writeBatch(db);
          deleteBatchCount = 0;
        }
      }

      if (deleteBatchCount > 0) {
        await deleteBatch.commit();
        console.log(`  🗑️  Deleted ${totalDeleted}/${deleteSnapshot.size} documents`);
      }

      console.log(`\n✅ Successfully deleted ${sourceCollection} collection`);
    } else {
      console.log('\n⏸️  Skipping deletion of original collection');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`✅ New collection '${targetCollection}' is ready with ${migratedCount} documents`);
    console.log(`✅ All code has been updated to use the new collection name`);
    console.log(`✅ System prompt has been updated with correct categories`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Error during migration:', error);
    process.exit(1);
  }

  rl.close();
  process.exit(0);
}

// Run the migration
cleanupAndRenameCollection().catch(console.error);