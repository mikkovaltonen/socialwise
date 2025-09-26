// Migration script to delete IT categories and rename collection
// This script needs to be run with Firebase Admin SDK credentials
//
// To run this script:
// 1. Download service account key from Firebase Console
// 2. Place it in the project root as firebase-admin-key.json
// 3. Run: node cleanup_and_rename_collection.js

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to find service account file
let serviceAccount;
try {
  // Try different possible file names
  const possibleFiles = [
    'firebase-admin-key.json',
    'serviceAccountKey.json',
    'valmet-buyer-firebase-adminsdk-ysagd-9f96f8fbcd.json',
    'firebase-service-account.json'
  ];

  let found = false;
  for (const file of possibleFiles) {
    try {
      serviceAccount = JSON.parse(readFileSync(join(__dirname, file), 'utf8'));
      console.log(`Found service account file: ${file}`);
      found = true;
      break;
    } catch (e) {
      // Continue to next file
    }
  }

  if (!found) {
    console.error('❌ Firebase Admin SDK service account file not found!');
    console.log('\nTo run this migration script:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Save the file as "firebase-admin-key.json" in this directory');
    console.log('4. Run this script again: node cleanup_and_rename_collection.js');
    process.exit(1);
  }
} catch (error) {
  console.error('Error loading service account:', error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'valmet-buyer'
});

const db = admin.firestore();

async function cleanupAndRenameCollection() {
  console.log('Starting cleanup and migration process...');

  const sourceCollection = 'supplier_spend';
  const targetCollection = 'ext_labour_suppliers';

  try {
    // Get all documents from supplier_spend
    const snapshot = await db.collection(sourceCollection).get();
    console.log(`Found ${snapshot.size} documents in ${sourceCollection}`);

    let deletedCount = 0;
    let migratedCount = 0;
    const batch = db.batch();
    let batchCount = 0;

    // Categories to delete
    const categoriesToDelete = [
      'iPRO, Office IT, IT consulting',
      'Indirect procurement iPRO, Office IT, IT services'
    ];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const mainCategory = data.original?.['Supplier Main Category'] || '';

      // Check if this supplier should be deleted
      if (categoriesToDelete.some(cat => mainCategory.includes(cat))) {
        console.log(`Deleting supplier: ${data.original?.['Company']} - Category: ${mainCategory}`);
        deletedCount++;
        continue; // Skip migration for these
      }

      // Migrate remaining documents to new collection
      const targetDocRef = db.collection(targetCollection).doc(doc.id);
      batch.set(targetDocRef, data);
      batchCount++;
      migratedCount++;

      // Commit batch every 500 operations
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`Migrated ${migratedCount} documents so far...`);
        batchCount = 0;
      }
    }

    // Commit any remaining operations
    if (batchCount > 0) {
      await batch.commit();
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total documents processed: ${snapshot.size}`);
    console.log(`Documents deleted (not migrated): ${deletedCount}`);
    console.log(`Documents migrated to ${targetCollection}: ${migratedCount}`);

    // Now delete all documents from the old collection
    console.log(`\nDeleting all documents from ${sourceCollection}...`);
    const deleteBatch = db.batch();
    let deleteBatchCount = 0;

    const deleteSnapshot = await db.collection(sourceCollection).get();
    for (const doc of deleteSnapshot.docs) {
      deleteBatch.delete(doc.ref);
      deleteBatchCount++;

      if (deleteBatchCount >= 500) {
        await deleteBatch.commit();
        deleteBatchCount = 0;
      }
    }

    if (deleteBatchCount > 0) {
      await deleteBatch.commit();
    }

    console.log(`\nSuccessfully cleaned up ${sourceCollection}`);
    console.log(`New collection ${targetCollection} is ready with ${migratedCount} documents`);

  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  }

  process.exit(0);
}

cleanupAndRenameCollection();