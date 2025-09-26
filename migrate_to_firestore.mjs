/**
 * Firestore Migration Script for Excel Data (ES Module version)
 * Migrates converted JSON data from Excel files to Firestore collections
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'valmet-buyer.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'valmet-buyer',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'valmet-buyer.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '737944042802',
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Generate a unique document ID
 */
function generateDocumentId(record, sheetName, index) {
  // Try to use existing ID fields
  if (record.id) return String(record.id);
  if (record.ID) return String(record.ID);
  if (record.Invoice_Number) return `invoice_${record.Invoice_Number}`;
  if (record.Contract_Number) return `contract_${record.Contract_Number}`;
  if (record.Supplier_Code) return `supplier_${record.Supplier_Code}_${index}`;
  if (record.Company) return `company_${record.Company.replace(/\s+/g, '_')}_${index}`;

  // Generate ID from sheet name and index
  const cleanSheetName = sheetName.toLowerCase().replace(/\s+/g, '_');
  return `${cleanSheetName}_${record._rowIndex || index}`;
}

/**
 * Prepare document data for Firestore
 */
function prepareDocumentData(record) {
  const docData = { ...record };

  // Convert date strings to Firestore Timestamps
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  for (const [key, value] of Object.entries(docData)) {
    if (typeof value === 'string' && isoDateRegex.test(value)) {
      docData[key] = Timestamp.fromDate(new Date(value));
    }
  }

  // Add server timestamp for migration
  docData._migratedAt = Timestamp.now();

  // Remove null/undefined/empty values
  Object.keys(docData).forEach(key => {
    if (docData[key] === null || docData[key] === undefined || docData[key] === '') {
      delete docData[key];
    }
  });

  return docData;
}

/**
 * Migrate JSON data to Firestore collection
 */
async function migrateToFirestore(config) {
  console.log(`\n📤 Migrating: ${config.description}`);
  console.log(`   Collection: ${config.collectionName}`);

  try {
    // Read JSON file
    const jsonPath = path.join(__dirname, 'public', 'firestore', config.jsonFile);
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const jsonData = JSON.parse(jsonContent);

    let totalRecords = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process each sheet
    for (const [sheetName, records] of Object.entries(jsonData)) {
      console.log(`\n   📄 Processing sheet: ${sheetName}`);

      // Use batch writes for better performance (max 500 operations per batch)
      const batchSize = 500;
      const batches = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      for (const record of records) {
        totalRecords++;

        // Generate document ID
        const docId = generateDocumentId(record, sheetName, totalRecords);

        // Prepare document data
        const docData = prepareDocumentData(record);

        // Add to batch
        const docRef = doc(db, config.collectionName, docId);
        currentBatch.set(docRef, docData);
        operationCount++;

        // If batch is full, create a new one
        if (operationCount >= batchSize) {
          batches.push(currentBatch);
          currentBatch = writeBatch(db);
          operationCount = 0;
        }
      }

      // Add remaining operations to batch
      if (operationCount > 0) {
        batches.push(currentBatch);
      }

      // Commit all batches
      console.log(`   🔄 Committing ${batches.length} batch(es)...`);
      for (let i = 0; i < batches.length; i++) {
        try {
          await batches[i].commit();
          const batchRecordCount = (i === batches.length - 1) ? operationCount : batchSize;
          successCount += batchRecordCount;
          console.log(`      ✅ Batch ${i + 1}/${batches.length} committed (${batchRecordCount} records)`);
        } catch (error) {
          console.error(`      ❌ Batch ${i + 1} failed:`, error.message);
          const batchRecordCount = (i === batches.length - 1) ? operationCount : batchSize;
          errorCount += batchRecordCount;
        }
      }
    }

    // Print summary
    console.log(`\n   📊 Migration Summary:`);
    console.log(`      Total records: ${totalRecords}`);
    console.log(`      Successful: ${successCount}`);
    console.log(`      Failed: ${errorCount}`);
    console.log(`      Success rate: ${((successCount / totalRecords) * 100).toFixed(2)}%`);

  } catch (error) {
    console.error(`   ❌ Migration failed:`, error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Firestore Migration');
  console.log('================================');

  const migrations = [
    {
      jsonFile: 'invoices_2023_training.json',
      collectionName: 'invoices_training_2023',
      description: 'Invoices 2023 Training Subcategory Data',
    },
    {
      jsonFile: 'ipro_contracts.json',
      collectionName: 'ipro_contracts',
      description: 'iPRO Contracts Data',
    },
    {
      jsonFile: 'training_suppliers_attributes.json',
      collectionName: 'training_suppliers',
      description: 'Training Suppliers and Attributes Data',
    },
  ];

  try {
    // Check Firebase configuration
    if (!firebaseConfig.apiKey) {
      console.error('\n❌ Firebase API key not found!');
      console.log('   Please ensure VITE_FIREBASE_API_KEY is set in your .env file');
      process.exit(1);
    }

    // Check if JSON files exist
    console.log('\n🔍 Checking JSON files...');
    let allFilesExist = true;

    for (const config of migrations) {
      const jsonPath = path.join(__dirname, 'public', 'firestore', config.jsonFile);
      if (!fs.existsSync(jsonPath)) {
        console.error(`   ❌ File not found: ${config.jsonFile}`);
        allFilesExist = false;
      } else {
        const stats = fs.statSync(jsonPath);
        const sizeInKB = (stats.size / 1024).toFixed(2);
        console.log(`   ✅ Found: ${config.jsonFile} (${sizeInKB} KB)`);
      }
    }

    if (!allFilesExist) {
      console.log(`\n   ℹ️ Please run the conversion script first:`);
      console.log(`      python3 convert_excel_to_json.py`);
      process.exit(1);
    }

    // Run migrations sequentially
    for (const config of migrations) {
      await migrateToFirestore(config);
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Check Firestore console to verify data:');
    console.log('      https://console.firebase.google.com/project/valmet-buyer/firestore');
    console.log('   2. Set up appropriate security rules');
    console.log('   3. Create indexes if needed for queries');
    console.log('   4. Test data retrieval in your application');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { migrateToFirestore, generateDocumentId, prepareDocumentData };