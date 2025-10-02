/**
 * Check actual values in training_suppliers collection
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

async function checkValues() {
  const snapshot = await getDocs(collection(db, 'training_suppliers'));
  const natureOfServiceValues = new Set();
  const deliveryCountries = new Set();
  const trainingAreas = new Set();
  let finlandLeadershipCount = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    if (data.nature_of_service) {
      natureOfServiceValues.add(data.nature_of_service);
    }
    if (data.delivery_country) {
      deliveryCountries.add(data.delivery_country);
    }
    if (data.training_area) {
      trainingAreas.add(data.training_area);
    }

    // Check specifically for Finland + Leadership combination
    if (data.delivery_country && data.delivery_country.toLowerCase().includes('finland') &&
        data.nature_of_service && data.nature_of_service.toLowerCase().includes('leadership')) {
      finlandLeadershipCount++;
      console.log('\n🎯 Found Finland + Leadership match:');
      console.log('  Company:', data.company_name);
      console.log('  Delivery Country:', data.delivery_country);
      console.log('  Nature of Service:', data.nature_of_service);
      console.log('  Training Area:', data.training_area);
    }
  });

  console.log('\n📊 UNIQUE VALUES IN DATABASE:');
  console.log('\n=== Nature of Service (', natureOfServiceValues.size, 'unique) ===');
  Array.from(natureOfServiceValues).sort().forEach(v => console.log('  -', v));

  console.log('\n=== Delivery Countries (', deliveryCountries.size, 'unique) ===');
  Array.from(deliveryCountries).sort().forEach(v => console.log('  -', v));

  console.log('\n=== Training Areas (first 20 of', trainingAreas.size, 'unique) ===');
  Array.from(trainingAreas).sort().slice(0, 20).forEach(v => console.log('  -', v));

  console.log('\n📊 SUMMARY:');
  console.log('Total documents:', snapshot.size);
  console.log('Finland + Leadership combinations:', finlandLeadershipCount);

  process.exit(0);
}

checkValues().catch(console.error);