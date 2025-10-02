/**
 * Check training nature of service data in suppliers_complete collection
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkTrainingData() {
  console.log('🔍 Checking training nature of service data in suppliers_complete...\n');

  const snapshot = await getDocs(collection(db, 'suppliers_complete'));
  const trainingNatureValues = new Map();
  const trainingSuppliers = [];
  let totalDocs = 0;
  let docsWithTrainingNature = 0;

  snapshot.forEach(doc => {
    totalDocs++;
    const data = doc.data();

    // Check all possible fields where training nature of service might be stored
    const fields = [
      'trainingNatureOfService',
      'natureOfService',
      'Training Nature of Service',
      'Nature of Service',
      'nature_of_service',
      'training_nature_of_service'
    ];

    let foundValue = null;
    let foundField = null;

    // Check root level
    for (const field of fields) {
      if (data[field]) {
        foundValue = data[field];
        foundField = field;
        break;
      }
    }

    // Check in original object
    if (!foundValue && data.original) {
      for (const field of fields) {
        if (data.original[field]) {
          foundValue = data.original[field];
          foundField = `original.${field}`;
          break;
        }
      }
    }

    if (foundValue) {
      docsWithTrainingNature++;
      if (!trainingNatureValues.has(foundValue)) {
        trainingNatureValues.set(foundValue, { count: 0, field: foundField, examples: [] });
      }
      const entry = trainingNatureValues.get(foundValue);
      entry.count++;
      if (entry.examples.length < 2) {
        entry.examples.push({
          company: data.company || data.original?.['Company'] || 'Unknown',
          id: doc.id
        });
      }

      // Collect training suppliers
      if (trainingSuppliers.length < 5) {
        trainingSuppliers.push({
          id: doc.id,
          company: data.company || data.original?.['Company'],
          field: foundField,
          value: foundValue,
          mainCategory: data.mainCategory || data.original?.['Supplier Main Category']
        });
      }
    }
  });

  console.log('📊 SUMMARY:');
  console.log(`Total documents: ${totalDocs}`);
  console.log(`Documents with training nature of service: ${docsWithTrainingNature}`);
  console.log(`Unique training nature values: ${trainingNatureValues.size}`);

  if (trainingNatureValues.size > 0) {
    console.log('\n🏷️ TRAINING NATURE OF SERVICE VALUES:');
    const sorted = Array.from(trainingNatureValues.entries())
      .sort((a, b) => b[1].count - a[1].count);

    sorted.forEach(([value, info]) => {
      console.log(`\n"${value}"`);
      console.log(`  Count: ${info.count}`);
      console.log(`  Field: ${info.field}`);
      console.log(`  Examples:`);
      info.examples.forEach(ex => {
        console.log(`    - ${ex.company} (${ex.id})`);
      });
    });

    console.log('\n📝 SAMPLE TRAINING SUPPLIERS:');
    trainingSuppliers.forEach((supplier, index) => {
      console.log(`\n${index + 1}. ${supplier.company}`);
      console.log(`   ID: ${supplier.id}`);
      console.log(`   Field: ${supplier.field}`);
      console.log(`   Value: ${supplier.value}`);
      console.log(`   Category: ${supplier.mainCategory}`);
    });
  } else {
    console.log('\n❌ No training nature of service data found in any field!');
    console.log('Checked fields:', [
      'trainingNatureOfService',
      'natureOfService',
      'Training Nature of Service',
      'Nature of Service',
      'nature_of_service',
      'training_nature_of_service'
    ].join(', '));
  }

  // Check for Communication Skills Training specifically
  console.log('\n🔍 SEARCHING FOR "Communication Skills Training":');
  let foundCommunication = false;
  snapshot.forEach(doc => {
    const data = doc.data();
    const searchText = 'Communication Skills Training';

    // Check all text fields that might contain this value
    const textToCheck = [
      data.trainingNatureOfService,
      data.natureOfService,
      data.original?.['Training Nature of Service'],
      data.original?.['Nature of Service'],
      data.categories,
      data.original?.['Supplier Categories']
    ].filter(Boolean).join(' ');

    if (textToCheck.toLowerCase().includes('communication')) {
      if (!foundCommunication) {
        foundCommunication = true;
        console.log('Found documents containing "communication":');
      }
      console.log(`  - ${data.company || data.original?.['Company']} (${doc.id})`);
      if (textToCheck.includes(searchText)) {
        console.log(`    ✅ Exact match for "${searchText}"`);
      }
    }
  });

  if (!foundCommunication) {
    console.log('❌ No documents found containing "communication" in any training-related field');
  }

  process.exit(0);
}

checkTrainingData().catch(console.error);