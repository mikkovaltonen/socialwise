/**
 * Anonymize Stock Management Data v2.1
 *
 * Creates public_stock_management collection with identical structure to stock_management
 * but with anonymized sensitive fields.
 *
 * Masking rules:
 * - keyword → SF_XXXXX (random 5-digit number)
 * - material_id → MAT_TEST_XXXX (sequential)
 * - supplier_keyword → SUPPLIER_XXX (sequential)
 * - description → "masked" (constant)
 * - ref_at_supplier → Keep "Slit by Gravic" and empty, randomize others to REF_XXXXXXXX
 * - ai_output_text → Parse and replace material IDs with masked versions
 *
 * Preserved fields:
 * - All numeric data (stock levels, dimensions, dates)
 * - All AI analysis fields (ai_conclusion, ai_model, etc.)
 * - Document structure (materials array)
 *
 * Usage:
 *   node scripts/anonymize-stock-data.js
 *
 * Authentication:
 *   Uses email/password from Data_preparation/.env
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module equivalents of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../Data_preparation/.env') });

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Credentials
const FIRESTORE_USER = process.env.FIRESTORE_USER;
const FIRESTORE_PASSWORD = process.env.FIRESTORE_PASSWORD;

// Validate environment variables
if (!FIRESTORE_USER || !FIRESTORE_PASSWORD) {
  console.error('❌ Missing credentials in .env file');
  console.error('   Required: FIRESTORE_USER, FIRESTORE_PASSWORD');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Mapping storage for consistent conversions
const supplierMap = new Map(); // supplier_keyword -> SUPPLIER_XXX
const substrateMap = new Map(); // keyword -> SF_XXXXX
const materialMap = new Map(); // material_id -> MAT_TEST_XXX

// Counters for generating IDs
let supplierCounter = 1;
let substrateCounter = 1;
let materialCounter = 1;

/**
 * Generate a consistent supplier mask
 */
function maskSupplier(supplierKeyword) {
  if (!supplierKeyword || supplierKeyword === 'n/a' || supplierKeyword === '—' || supplierKeyword === '') {
    return supplierKeyword || '';
  }

  if (!supplierMap.has(supplierKeyword)) {
    const masked = `SUPPLIER_${String(supplierCounter).padStart(3, '0')}`;
    supplierMap.set(supplierKeyword, masked);
    supplierCounter++;
  }

  return supplierMap.get(supplierKeyword);
}

/**
 * Generate a random number string for substrate family
 */
function maskSubstrateFamily(keyword) {
  if (!keyword || keyword === '') {
    return keyword || '';
  }

  if (!substrateMap.has(keyword)) {
    // Generate random 5-digit number string with SF_ prefix
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const masked = `SF_${randomNum}`;
    substrateMap.set(keyword, masked);
  }

  return substrateMap.get(keyword);
}

/**
 * Convert material ID to test string
 */
function maskMaterialId(materialId) {
  if (!materialId || materialId === 'n/a' || materialId === '—' || materialId === '') {
    return materialId || '';
  }

  if (!materialMap.has(materialId)) {
    const masked = `MAT_TEST_${String(materialCounter).padStart(4, '0')}`;
    materialMap.set(materialId, masked);
    materialCounter++;
  }

  return materialMap.get(materialId);
}

/**
 * Parse AI output text and replace material IDs with masked versions
 * Example: "Material 104048: Final Stock" -> "Material MAT_TEST_0001: Final Stock"
 */
function maskAIOutputText(text) {
  if (!text || text === '') {
    return text || '';
  }

  let maskedText = text;

  // Replace all material IDs in the text with their masked versions
  materialMap.forEach((maskedId, originalId) => {
    // Use word boundaries to match whole material IDs only
    const regex = new RegExp(`\\b${originalId}\\b`, 'g');
    maskedText = maskedText.replace(regex, maskedId);
  });

  return maskedText;
}

/**
 * Mask reference at supplier field
 * Keep "Slit by Gravic" and empty values, randomize everything else
 */
function maskRefAtSupplier(refValue) {
  // Keep these values as-is
  if (!refValue || refValue === '' || refValue === 'Slit by Gravic') {
    return refValue || '';
  }

  // Generate random reference for other values
  return 'REF_' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Anonymize a single material within a substrate family
 */
function anonymizeMaterial(material) {
  // Create a copy to avoid mutating original
  const anonymized = { ...material };

  // Mask sensitive fields
  if (material.material_id) {
    anonymized.material_id = maskMaterialId(material.material_id);
  }

  if (material.supplier_keyword) {
    anonymized.supplier_keyword = maskSupplier(material.supplier_keyword);
  }

  // Always set description to "masked"
  anonymized.description = 'masked';

  // Mask reference at supplier (keep "Slit by Gravic" and empty, randomize others)
  if (material.ref_at_supplier !== undefined) {
    anonymized.ref_at_supplier = maskRefAtSupplier(material.ref_at_supplier);
  }

  return anonymized;
}

/**
 * Anonymize a complete substrate family document
 */
function anonymizeDocument(docData, docId) {
  const anonymized = {
    // Keep AI analysis fields exactly as-is (will mask material IDs in text later)
    processing_method: docData.processing_method || '',
    ai_conclusion: docData.ai_conclusion || '',
    ai_output_text: docData.ai_output_text || '',
    ai_processed_at: docData.ai_processed_at || '',
    ai_model: docData.ai_model || '',

    // Mask the substrate family keyword
    keyword: maskSubstrateFamily(docData.keyword || docId),

    // Anonymize each material in the materials array
    materials: []
  };

  // Process materials array
  if (docData.materials && Array.isArray(docData.materials)) {
    anonymized.materials = docData.materials.map(material => anonymizeMaterial(material));
  }

  // After all materials are processed, mask material IDs in AI output text
  if (anonymized.ai_output_text) {
    anonymized.ai_output_text = maskAIOutputText(anonymized.ai_output_text);
  }

  // Add metadata
  anonymized.anonymized = true;
  anonymized.anonymized_at = new Date().toISOString();
  anonymized.original_keyword = docData.keyword || docId;

  return anonymized;
}

/**
 * Delete all documents in public_stock_management collection
 */
async function deleteExistingPublicData() {
  console.log('🗑️  Deleting existing public_stock_management data...');

  const publicRef = collection(db, 'public_stock_management');
  const snapshot = await getDocs(publicRef);

  if (snapshot.empty) {
    console.log('   No existing data to delete\n');
    return;
  }

  const batchSize = 500;
  let batch = writeBatch(db);
  let batchCount = 0;
  let totalDeleted = 0;

  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    batchCount++;
    totalDeleted++;

    if (batchCount >= batchSize) {
      await batch.commit();
      console.log(`   Deleted ${totalDeleted} documents...`);
      batch = writeBatch(db);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`✅ Deleted ${totalDeleted} documents\n`);
}

/**
 * Main execution function
 */
async function anonymizeStockData() {
  try {
    // Step 1: Authenticate
    console.log('🔐 Authenticating with Firebase...');
    console.log(`   User: ${FIRESTORE_USER}`);

    await signInWithEmailAndPassword(auth, FIRESTORE_USER, FIRESTORE_PASSWORD);
    console.log('✅ Authentication successful\n');

    // Step 2: Delete existing public data
    await deleteExistingPublicData();

    // Step 3: Read from stock_management
    console.log('🚀 Starting data anonymization process...\n');
    console.log('📖 Reading from stock_management collection...');

    const stockManagementRef = collection(db, 'stock_management');
    const snapshot = await getDocs(stockManagementRef);

    console.log(`✅ Found ${snapshot.size} substrate families\n`);

    if (snapshot.empty) {
      console.log('⚠️  No documents found in stock_management collection');
      return;
    }

    // Step 4: Process and anonymize documents
    console.log('🔄 Processing and anonymizing substrate families...');

    const publicStockRef = collection(db, 'public_stock_management');
    const allDocuments = [];

    snapshot.forEach((docSnap) => {
      const docData = docSnap.data();
      const anonymizedData = anonymizeDocument(docData, docSnap.id);

      // Use masked keyword as document ID
      allDocuments.push({
        id: anonymizedData.keyword,
        data: anonymizedData
      });
    });

    // Step 5: Upload in batches (Firestore limit: 500 operations per batch)
    const batchSize = 500;
    let totalProcessed = 0;

    for (let i = 0; i < allDocuments.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = allDocuments.slice(i, i + batchSize);

      batchDocs.forEach(({ id, data }) => {
        const docRef = doc(publicStockRef, id);
        batch.set(docRef, data);
      });

      await batch.commit();
      totalProcessed += batchDocs.length;
      console.log(`  ✓ Committed batch (${totalProcessed}/${allDocuments.length} families processed)`);
    }

    // Step 6: Save mapping files for reference
    console.log('\n💾 Saving mapping files...');
    const mappingsDir = path.join(__dirname, '../data-mappings');
    if (!fs.existsSync(mappingsDir)) {
      fs.mkdirSync(mappingsDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(mappingsDir, 'supplier-mappings.json'),
      JSON.stringify(Object.fromEntries(supplierMap), null, 2)
    );

    fs.writeFileSync(
      path.join(mappingsDir, 'substrate-mappings.json'),
      JSON.stringify(Object.fromEntries(substrateMap), null, 2)
    );

    fs.writeFileSync(
      path.join(mappingsDir, 'material-mappings.json'),
      JSON.stringify(Object.fromEntries(materialMap), null, 2)
    );

    // Step 7: Print summary
    console.log('\n✨ Anonymization complete!\n');
    console.log('📊 Summary:');
    console.log(`  • Total substrate families processed: ${totalProcessed}`);
    console.log(`  • Unique suppliers masked: ${supplierMap.size}`);
    console.log(`  • Unique substrate families masked: ${substrateMap.size}`);
    console.log(`  • Unique material IDs masked: ${materialMap.size}`);
    console.log(`  • Target collection: public_stock_management`);
    console.log(`  • Mapping files saved to: ${mappingsDir}`);

    console.log('\n⚠️  IMPORTANT:');
    console.log('  • Keep mapping files secure - they contain original to masked conversions');
    console.log('  • Review the public_stock_management collection before making it public');
    console.log('  • Original stock_management collection remains unchanged');
    console.log('  • Structure is now identical to stock_management (materials array preserved)\n');

  } catch (error) {
    console.error('❌ Error during anonymization:', error);
    if (error.code === 'auth/invalid-credential') {
      console.error('\n   Check your credentials in Data_preparation/.env:');
      console.error('   - FIRESTORE_USER');
      console.error('   - FIRESTORE_PASSWORD');
    }
    throw error;
  }
}

// Execute
anonymizeStockData()
  .then(() => {
    console.log('🎉 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
