/**
 * Firestore Migration Script for Excel Data
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
import * as fs from 'fs';
import * as path from 'path';

// Firebase configuration (uses environment variables)
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

interface MigrationConfig {
  jsonFile: string;
  collectionName: string;
  description: string;
}

interface ImportRecord {
  [key: string]: any;
  _importedAt?: string;
  _sourceFile?: string;
  _sheetName?: string;
  _rowIndex?: number;
}

/**
 * Migrate JSON data to Firestore collection
 */
async function migrateToFirestore(config: MigrationConfig): Promise<void> {
  console.log(`\n📤 Migrating: ${config.description}`);
  console.log(`   Collection: ${config.collectionName}`);

  try {
    // Read JSON file
    const jsonPath = path.join(__dirname, 'public', 'firestore', config.jsonFile);
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    let totalRecords = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process each sheet
    for (const [sheetName, records] of Object.entries(jsonData)) {
      console.log(`\n   📄 Processing sheet: ${sheetName}`);
      const sheetRecords = records as ImportRecord[];

      // Use batch writes for better performance (max 500 operations per batch)
      const batchSize = 500;
      const batches: any[] = [];
      let currentBatch = writeBatch(db);
      let operationCount = 0;

      for (const record of sheetRecords) {
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
      console.log(`   🔄 Committing ${batches.length} batches...`);
      for (let i = 0; i < batches.length; i++) {
        try {
          await batches[i].commit();
          successCount += (i === batches.length - 1) ? operationCount : batchSize;
          console.log(`      ✅ Batch ${i + 1}/${batches.length} committed`);
        } catch (error) {
          console.error(`      ❌ Batch ${i + 1} failed:`, error);
          errorCount += (i === batches.length - 1) ? operationCount : batchSize;
        }
      }
    }

    // Print summary
    console.log(`\n   📊 Migration Summary:`);
    console.log(`      Total records: ${totalRecords}`);
    console.log(`      Successful: ${successCount}`);
    console.log(`      Failed: ${errorCount}`);

  } catch (error) {
    console.error(`   ❌ Migration failed:`, error);
    throw error;
  }
}

/**
 * Generate a unique document ID
 */
function generateDocumentId(record: ImportRecord, sheetName: string, index: number): string {
  // Try to use existing ID fields
  if (record.id) return String(record.id);
  if (record.ID) return String(record.ID);
  if (record.Invoice_Number) return `invoice_${record.Invoice_Number}`;
  if (record.Contract_Number) return `contract_${record.Contract_Number}`;
  if (record.Supplier_Code) return `supplier_${record.Supplier_Code}_${index}`;

  // Generate ID from sheet name and index
  const cleanSheetName = sheetName.toLowerCase().replace(/\s+/g, '_');
  return `${cleanSheetName}_${record._rowIndex || index}`;
}

/**
 * Prepare document data for Firestore
 */
function prepareDocumentData(record: ImportRecord): any {
  const docData: any = { ...record };

  // Convert date strings to Firestore Timestamps
  for (const [key, value] of Object.entries(docData)) {
    if (typeof value === 'string' && isISODateString(value)) {
      docData[key] = Timestamp.fromDate(new Date(value));
    }
  }

  // Add server timestamp for migration
  docData._migratedAt = Timestamp.now();

  // Remove null values
  Object.keys(docData).forEach(key => {
    if (docData[key] === null || docData[key] === undefined || docData[key] === '') {
      delete docData[key];
    }
  });

  return docData;
}

/**
 * Check if a string is an ISO date string
 */
function isISODateString(str: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
  return isoDateRegex.test(str);
}

/**
 * Main migration function
 */
async function main() {
  console.log('🚀 Starting Firestore Migration');
  console.log('================================');

  const migrations: MigrationConfig[] = [
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
  ];

  try {
    // Check if JSON files exist
    console.log('\n🔍 Checking JSON files...');
    for (const config of migrations) {
      const jsonPath = path.join(__dirname, 'public', 'firestore', config.jsonFile);
      if (!fs.existsSync(jsonPath)) {
        console.error(`   ❌ File not found: ${config.jsonFile}`);
        console.log(`   ℹ️ Please run 'python3 convert_excel_to_json.py' first`);
        return;
      } else {
        console.log(`   ✅ Found: ${config.jsonFile}`);
      }
    }

    // Run migrations
    for (const config of migrations) {
      await migrateToFirestore(config);
    }

    console.log('\n✅ All migrations completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Check Firestore console to verify data');
    console.log('   2. Set up appropriate security rules');
    console.log('   3. Create indexes if needed for queries');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this is the main module
if (require.main === module) {
  main().catch(console.error);
}

export { migrateToFirestore, MigrationConfig };