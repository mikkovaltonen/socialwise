/**
 * Test script to inspect actual contract document structure
 */

import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from './lib/firebase';

export async function inspectContractStructure() {
  console.log('🔍 Inspecting iPRO Contracts structure...');

  try {
    const q = query(collection(db, 'ipro_contracts'), limit(3));
    const snapshot = await getDocs(q);

    console.log(`Found ${snapshot.size} contracts to inspect`);

    snapshot.forEach((doc) => {
      console.log('\n📄 Contract ID:', doc.id);
      const data = doc.data();

      // Show all fields and their values
      console.log('Fields in document:');
      Object.entries(data).forEach(([key, value]) => {
        const valuePreview = typeof value === 'string'
          ? value.substring(0, 50) + (value.length > 50 ? '...' : '')
          : value;
        console.log(`  - ${key}: ${valuePreview} (${typeof value})`);
      });

      console.log('---');
    });

    // Try to find common field patterns
    const allDocs = await getDocs(collection(db, 'ipro_contracts'));
    const fieldFrequency: Record<string, number> = {};

    allDocs.forEach((doc) => {
      const data = doc.data();
      Object.keys(data).forEach(key => {
        fieldFrequency[key] = (fieldFrequency[key] || 0) + 1;
      });
    });

    console.log('\n📊 Field frequency across all contracts:');
    const sortedFields = Object.entries(fieldFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    sortedFields.forEach(([field, count]) => {
      console.log(`  ${field}: appears in ${count}/${allDocs.size} documents`);
    });

    return { success: true };
  } catch (error) {
    console.error('Error inspecting contracts:', error);
    return { success: false, error };
  }
}

// Auto-run if imported in browser
if (typeof window !== 'undefined') {
  (window as any).inspectContractStructure = inspectContractStructure;
  console.log('💡 Run inspectContractStructure() to see contract field structure');
}