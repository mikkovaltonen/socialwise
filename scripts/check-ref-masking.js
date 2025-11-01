import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query, where } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../Data_preparation/.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function checkRefMasking() {
  try {
    await signInWithEmailAndPassword(auth, process.env.FIRESTORE_USER, process.env.FIRESTORE_PASSWORD);
    console.log('✅ Authenticated\n');

    const publicRef = collection(db, 'public_stock_management');
    const publicQuery = query(publicRef, limit(10));
    const snapshot = await getDocs(publicQuery);

    const refTypes = {
      'Slit by Gravic': [],
      'REF_': [],
      'Empty': [],
      'Other': []
    };

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.materials && Array.isArray(data.materials)) {
        data.materials.forEach(material => {
          const ref = material.ref_at_supplier;
          if (ref === 'Slit by Gravic') {
            refTypes['Slit by Gravic'].push(ref);
          } else if (ref && ref.startsWith('REF_')) {
            refTypes['REF_'].push(ref);
          } else if (!ref || ref === '') {
            refTypes['Empty'].push('(empty)');
          } else {
            refTypes['Other'].push(ref);
          }
        });
      }
    });

    console.log('📊 ref_at_supplier Masking Verification:\n');
    console.log(`✅ "Slit by Gravic" preserved: ${refTypes['Slit by Gravic'].length} instances`);
    console.log(`   Examples: ${refTypes['Slit by Gravic'].slice(0, 3).join(', ')}`);

    console.log(`\n✅ Randomized to REF_XXXXXXXX: ${refTypes['REF_'].length} instances`);
    console.log(`   Examples: ${refTypes['REF_'].slice(0, 3).join(', ')}`);

    console.log(`\n✅ Empty/null preserved: ${refTypes['Empty'].length} instances`);

    if (refTypes['Other'].length > 0) {
      console.log(`\n❌ Unexpected values: ${refTypes['Other'].length} instances`);
      console.log(`   Examples: ${refTypes['Other'].slice(0, 3).join(', ')}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRefMasking();
