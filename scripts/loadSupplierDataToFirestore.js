import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBx0E0byB4_dMLkJBZiZ5TOQUVaboRBbss",
  authDomain: "valmet-buyer.firebaseapp.com",
  projectId: "valmet-buyer",
  storageBucket: "valmet-buyer.firebasestorage.app",
  messagingSenderId: "737944042802",
  appId: "1:737944042802:web:cd09524e44ea1cb0e02b2b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadSupplierData() {
  try {
    console.log('🚀 Starting Firestore data load...\n');
    
    // Read JSON file
    const jsonPath = path.join(__dirname, '../public/chat_init_contect/valmet-supplier-spend-data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log('📊 Data Summary:');
    console.log(`   - Spend Export records: ${jsonData.spend_export.length}`);
    console.log(`   - Supplier Data records: ${jsonData.supplier_data.length}`);
    console.log(`   - FI Data Cleaned records: ${jsonData.fi_data_cleaned.length}\n`);
    
    // Collection names
    const collections = {
      metadata: 'supplier_metadata',
      spend_export: 'supplier_spend',
      supplier_data: 'supplier_details',
      fi_data_cleaned: 'supplier_training_data'
    };
    
    // 1. Load metadata
    console.log('📝 Loading metadata...');
    await setDoc(doc(db, collections.metadata, 'summary'), {
      ...jsonData.metadata,
      ...jsonData.spend_summary,
      loadedAt: new Date().toISOString()
    });
    console.log('✅ Metadata loaded\n');
    
    // 2. Load spend_export data in batches
    console.log('💰 Loading spend export data...');
    await loadCollectionInBatches(
      jsonData.spend_export, 
      collections.spend_export,
      'Business Partner Company Name'
    );
    
    // 3. Load supplier_data in batches
    console.log('🏢 Loading supplier details data...');
    await loadCollectionInBatches(
      jsonData.supplier_data, 
      collections.supplier_data,
      'Business Partner Company Name'
    );
    
    // 4. Load fi_data_cleaned in batches
    console.log('📚 Loading training data...');
    await loadCollectionInBatches(
      jsonData.fi_data_cleaned, 
      collections.fi_data_cleaned,
      null // Use auto-generated IDs
    );
    
    console.log('\n✨ All data successfully loaded to Firestore!');
    console.log('\n📍 Collections created:');
    Object.entries(collections).forEach(([key, name]) => {
      console.log(`   - ${name}`);
    });
    
    // Create indexes summary
    console.log('\n🔍 Searchable fields:');
    console.log('   - Main Category');
    console.log('   - Sub Category');
    console.log('   - Business Partner Company Name');
    console.log('   - Spend (numeric range queries)');
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    process.exit(1);
  }
}

async function loadCollectionInBatches(data, collectionName, idField) {
  const BATCH_SIZE = 500; // Firestore batch write limit
  let totalProcessed = 0;
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const batchData = data.slice(i, i + BATCH_SIZE);
    
    for (let j = 0; j < batchData.length; j++) {
      const record = batchData[j];
      
      // Clean and prepare the document
      const cleanedRecord = cleanDocument(record);
      
      // Generate document ID
      let docId;
      if (idField && record[idField]) {
        // Use company name as ID (sanitized)
        docId = sanitizeDocId(record[idField]);
      } else {
        // Use auto-generated ID
        docId = `doc_${i + j + 1}`;
      }
      
      // Add to batch
      const docRef = doc(db, collectionName, docId);
      batch.set(docRef, {
        ...cleanedRecord,
        _id: docId,
        _loadedAt: new Date().toISOString()
      });
    }
    
    // Commit the batch
    await batch.commit();
    totalProcessed += batchData.length;
    
    console.log(`   Processed ${totalProcessed}/${data.length} documents...`);
  }
  
  console.log(`✅ Loaded ${totalProcessed} documents to ${collectionName}\n`);
}

function cleanDocument(doc) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(doc)) {
    // Convert numeric strings to numbers
    if (typeof value === 'string' && !isNaN(value) && value !== '') {
      cleaned[key] = parseFloat(value);
    } 
    // Keep strings and other types as is
    else {
      cleaned[key] = value;
    }
    
    // Handle special fields
    if (key === 'Spend' || key === 'Count of Invoice Receipts') {
      cleaned[key] = parseFloat(value) || 0;
    }
  }
  
  return cleaned;
}

function sanitizeDocId(id) {
  // Firestore document IDs cannot contain: /, ., #, $, [, ]
  return id
    .replace(/[\/\.\#\$\[\]]/g, '_')
    .substring(0, 100); // Limit length
}

// Run the loader
console.log('🔧 Valmet Supplier Data Firestore Loader\n');
console.log('========================================\n');

loadSupplierData()
  .then(() => {
    console.log('\n✅ Process completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });