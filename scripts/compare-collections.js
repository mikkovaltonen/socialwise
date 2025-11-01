import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
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

async function compareCollections() {
  try {
    await signInWithEmailAndPassword(auth, process.env.FIRESTORE_USER, process.env.FIRESTORE_PASSWORD);
    console.log('✅ Authenticated\n');

    // Get sample from stock_management
    const stockRef = collection(db, 'stock_management');
    const stockQuery = query(stockRef, limit(1));
    const stockSnapshot = await getDocs(stockQuery);

    // Get sample from public_stock_management
    const publicRef = collection(db, 'public_stock_management');
    const publicQuery = query(publicRef, limit(1));
    const publicSnapshot = await getDocs(publicQuery);

    console.log('=== STOCK_MANAGEMENT SAMPLE ===');
    stockSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Document ID:', doc.id);
      console.log('Fields:', Object.keys(data).sort());
      console.log('Sample data:', JSON.stringify(data, null, 2));
    });

    console.log('\n=== PUBLIC_STOCK_MANAGEMENT SAMPLE ===');
    publicSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('Document ID:', doc.id);
      console.log('Fields:', Object.keys(data).sort());
      console.log('Sample data:', JSON.stringify(data, null, 2));
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

compareCollections();
