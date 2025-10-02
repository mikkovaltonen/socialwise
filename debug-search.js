/**
 * Debug the exact search that failed
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

async function debugSearch() {
  console.log('🔍 DEBUGGING THE EXACT SEARCH THAT FAILED:');
  console.log('Parameters from chat:');
  console.log('  deliveryCountry: "Finland"');
  console.log('  natureOfService: "Leadership, management and team development"');
  console.log('  trainingArea: "Leadership trainings"');
  console.log('');

  const snapshot = await getDocs(collection(db, 'training_suppliers'));
  let records = [];

  snapshot.forEach(doc => {
    records.push({ id: doc.id, ...doc.data() });
  });

  console.log('Starting with', records.length, 'total records\n');

  // Filter 1: Delivery Country
  const afterCountry = records.filter(r =>
    r.delivery_country && r.delivery_country.toLowerCase().includes('finland')
  );
  console.log('After deliveryCountry filter ("finland"):', afterCountry.length, 'records');

  // Filter 2: Nature of Service
  const afterNature = afterCountry.filter(r =>
    r.nature_of_service && r.nature_of_service.toLowerCase().includes('leadership, management and team development')
  );
  console.log('After natureOfService filter ("leadership, management..."):', afterNature.length, 'records');

  // Filter 3: Training Area
  const afterTraining = afterNature.filter(r =>
    r.training_area && r.training_area.toLowerCase().includes('leadership trainings')
  );
  console.log('After trainingArea filter ("leadership trainings"):', afterTraining.length, 'records');

  console.log('\n📊 ANALYSIS OF FILTERS:');

  // Show what's in the Finland + Leadership records
  if (afterNature.length > 0) {
    console.log('\nRecords that match Finland + Leadership:');
    afterNature.forEach(r => {
      console.log('\n  Company:', r.company_name);
      console.log('  Training Area:', r.training_area);
      console.log('  Does training_area include "leadership trainings"?',
        r.training_area && r.training_area.toLowerCase().includes('leadership trainings'));
    });
  }

  // Try different search term for training area
  console.log('\n🔍 TESTING ALTERNATIVE SEARCHES:');

  const alt1 = afterNature.filter(r =>
    r.training_area && r.training_area.toLowerCase().includes('leadership')
  );
  console.log('With trainingArea="leadership" (partial):', alt1.length, 'records');

  const alt2 = records.filter(r =>
    r.delivery_country && r.delivery_country.toLowerCase().includes('finland') &&
    r.nature_of_service && r.nature_of_service.toLowerCase().includes('leadership')
  );
  console.log('With just Finland + "leadership" in nature:', alt2.length, 'records');

  // Show all training areas that contain "leadership"
  const leadershipTrainingAreas = new Set();
  records.forEach(r => {
    if (r.training_area && r.training_area.toLowerCase().includes('leadership')) {
      leadershipTrainingAreas.add(r.training_area);
    }
  });

  console.log('\n📋 All training_area values containing "leadership":');
  Array.from(leadershipTrainingAreas).forEach(area => {
    console.log('  -', area);
  });

  process.exit(0);
}

debugSearch().catch(console.error);