/**
 * Extract all unique Main Categories from supplier_spend collection
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBx0E0byB4_dMLkJBZiZ5TOQUVaboRBbss",
  authDomain: "valmet-buyer.firebaseapp.com",
  projectId: "valmet-buyer",
  storageBucket: "valmet-buyer.firebasestorage.app",
  messagingSenderId: "737944042802",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:737944042802:web:14e37f96a1ae5e98c93344"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function getMainCategories() {
  console.log('🔍 Fetching all Main Categories from supplier_spend collection...\n');
  
  try {
    const querySnapshot = await getDocs(collection(db, 'supplier_spend'));
    
    const mainCategories = new Map();
    const subCategoriesMap = new Map();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const original = data.original || {};
      
      const mainCat = original['Supplier Main Category'];
      const allCats = original['Supplier Categories'];
      
      if (mainCat) {
        mainCategories.set(mainCat, (mainCategories.get(mainCat) || 0) + 1);
        
        // Track sub-categories for each main category
        if (allCats && !subCategoriesMap.has(mainCat)) {
          subCategoriesMap.set(mainCat, allCats);
        }
      }
    });
    
    // Convert to sorted array
    const sortedCategories = Array.from(mainCategories.entries())
      .sort((a, b) => b[1] - a[1]);
    
    console.log('📊 MAIN CATEGORIES LOV (List of Values)');
    console.log('=' .repeat(80));
    console.log();
    
    sortedCategories.forEach(([category, count], index) => {
      console.log(`${index + 1}. ${category}`);
      console.log(`   Suppliers: ${count}`);
      
      // Show sub-categories if available
      const subCats = subCategoriesMap.get(category);
      if (subCats) {
        console.log(`   All Categories: ${subCats}`);
      }
      console.log();
    });
    
    console.log('=' .repeat(80));
    console.log(`\n📈 SUMMARY:`);
    console.log(`Total unique main categories: ${sortedCategories.length}`);
    console.log(`Total suppliers: ${querySnapshot.size}`);
    
    // Group by top-level category
    console.log('\n🏷️ GROUPED BY TOP-LEVEL CATEGORY:');
    const topLevel = new Map();
    
    sortedCategories.forEach(([category, count]) => {
      // Extract first part before comma
      const parts = category.split(',');
      if (parts.length >= 2) {
        const level1 = parts[0].trim();
        const level2 = parts[1].trim();
        
        if (!topLevel.has(level1)) {
          topLevel.set(level1, new Map());
        }
        topLevel.get(level1).set(level2, count);
      }
    });
    
    topLevel.forEach((subcats, mainCat) => {
      console.log(`\n${mainCat}:`);
      subcats.forEach((count, subcat) => {
        console.log(`  - ${subcat}: ${count} suppliers`);
      });
    });
    
    // Create dropdown-friendly format
    console.log('\n💾 DROPDOWN SELECT OPTIONS FORMAT:');
    console.log('const MAIN_CATEGORY_OPTIONS = [');
    sortedCategories.forEach(([category, count]) => {
      // Get the last part for display
      const displayName = category.split(',').pop()?.trim() || category;
      console.log(`  { value: '${category}', label: '${displayName} (${count})' },`);
    });
    console.log('];');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run
getMainCategories();