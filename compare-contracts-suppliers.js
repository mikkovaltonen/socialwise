#!/usr/bin/env node

/**
 * Script to compare ipro_contracts.json with ext_labour_suppliers collection
 * Identifies unique data in contracts that's not in suppliers
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyATbO93-0j6Gfvux3kBUykRaJ_HXdPE5Fo",
  authDomain: "valmet-buyer.firebaseapp.com",
  projectId: "valmet-buyer",
  storageBucket: "valmet-buyer.firebasestorage.app",
  messagingSenderId: "737944042802",
  appId: "1:737944042802:web:c1c6d74ce03a1c64ae4797"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function analyzeData() {
  console.log('🔍 Comparing iPRO Contracts with External Labour Suppliers...\n');

  try {
    // 1. Load contracts from JSON file
    const contractsPath = join(__dirname, 'public', 'firestore', 'ipro_contracts.json');
    const contractsJson = JSON.parse(readFileSync(contractsPath, 'utf8'));
    const contractsData = contractsJson['IPRO contracts'] || [];
    console.log(`📋 Loaded ${contractsData.length} contracts from JSON\n`);

    // 2. Load suppliers from Firestore
    const suppliersRef = collection(db, 'ext_labour_suppliers');
    const suppliersSnapshot = await getDocs(suppliersRef);
    const suppliers = [];
    suppliersSnapshot.forEach(doc => {
      suppliers.push({ id: doc.id, ...doc.data() });
    });
    console.log(`📦 Loaded ${suppliers.length} suppliers from Firestore\n`);

    // 3. Create lookup maps
    const suppliersByName = new Map();
    const suppliersByCode = new Map();

    suppliers.forEach(supplier => {
      const orig = supplier.original || {};

      // Add by various name fields
      if (orig['Company']) {
        suppliersByName.set(orig['Company'].toLowerCase(), supplier);
      }
      if (orig['Corporation']) {
        suppliersByName.set(orig['Corporation'].toLowerCase(), supplier);
      }
      if (orig['Branch']) {
        suppliersByName.set(orig['Branch'].toLowerCase(), supplier);
      }

      // Add by supplier code
      if (orig['Supplier']) {
        suppliersByCode.set(orig['Supplier'], supplier);
      }
    });

    // 4. Analyze unique contract data
    const uniqueContractFields = new Set();
    const contractsWithUniqueData = [];
    const matchedContracts = [];
    const unmatchedContracts = [];

    contractsData.forEach(contract => {
      // Check if supplier exists in ext_labour_suppliers
      // Extract company name from Contract_Party_Branch field
      const contractParty = contract['Contract_Party_Branch'] || '';
      const companyName = contractParty.split('/')[0].trim().toLowerCase();

      const matchFound = suppliersByName.has(companyName);

      if (matchFound) {
        matchedContracts.push(contract);
      } else {
        unmatchedContracts.push(contract);
      }

      // Identify unique fields in contracts
      Object.keys(contract).forEach(field => {
        uniqueContractFields.add(field);
      });
    });

    // 5. Get sample supplier fields for comparison
    const sampleSupplierFields = new Set();
    if (suppliers.length > 0) {
      const sampleSupplier = suppliers[0].original || {};
      Object.keys(sampleSupplier).forEach(field => {
        sampleSupplierFields.add(field);
      });
    }

    // 6. Find fields unique to contracts
    const contractOnlyFields = [];
    uniqueContractFields.forEach(field => {
      if (!sampleSupplierFields.has(field)) {
        contractOnlyFields.push(field);
      }
    });

    // 7. Print analysis results
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ANALYSIS RESULTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📈 SUMMARY:');
    console.log(`- Total contracts: ${contractsData.length}`);
    console.log(`- Matched contracts (found in suppliers): ${matchedContracts.length}`);
    console.log(`- Unmatched contracts (NOT in suppliers): ${unmatchedContracts.length}`);
    console.log(`- Match rate: ${((matchedContracts.length / contractsData.length) * 100).toFixed(1)}%\n`);

    console.log('🔑 UNIQUE FIELDS IN CONTRACTS (not in suppliers):');
    console.log('─────────────────────────────────────────────────');
    contractOnlyFields.forEach(field => {
      // Count how many contracts have this field with data
      const withData = contractsData.filter(c => c[field] && c[field] !== '').length;
      console.log(`- ${field} (${withData} contracts have data)`);
    });

    console.log('\n📝 CONTRACT-SPECIFIC DATA EXAMPLES:');
    console.log('─────────────────────────────────────────────────');

    // Show examples of contract-specific data
    const exampleContracts = contractsData.slice(0, 3);
    exampleContracts.forEach((contract, index) => {
      console.log(`\n Example ${index + 1}: ${contract['Contract_Party_Branch'] || 'Unknown'}`);
      console.log(`  - Title: ${contract['Name_or_title'] || 'N/A'}`);
      console.log(`  - State: ${contract['State'] || 'N/A'}`);
      console.log(`  - Terms: ${contract['Terms_of_Validity'] || 'N/A'}`);
      console.log(`  - Type: ${contract['Contract_type'] || 'N/A'}`);
      console.log(`  - Valmet Contact: ${contract['Valmet_Contact'] || 'N/A'}`);
      console.log(`  - VCS Category: ${contract['VCS_Category'] || 'N/A'}`);
      console.log(`  - Legal Company: ${contract['Legal_company'] || 'N/A'}`);
    });

    console.log('\n🔴 SUPPLIERS IN CONTRACTS BUT NOT IN ext_labour_suppliers:');
    console.log('─────────────────────────────────────────────────────────');

    // Show unmatched suppliers
    const uniqueUnmatchedSuppliers = new Set();
    unmatchedContracts.forEach(contract => {
      const contractParty = contract['Contract_Party_Branch'] || '';
      const companyName = contractParty.split('/')[0].trim();
      if (companyName) {
        uniqueUnmatchedSuppliers.add(companyName);
      }
    });

    const unmatchedList = Array.from(uniqueUnmatchedSuppliers).slice(0, 10);
    unmatchedList.forEach((supplier, index) => {
      const contract = unmatchedContracts.find(c => {
        const party = c['Contract_Party_Branch'] || '';
        return party.includes(supplier);
      });
      console.log(`${index + 1}. ${supplier}`);
      if (contract) {
        console.log(`   - Contract: ${contract['Name_or_title'] || 'N/A'}`);
        console.log(`   - State: ${contract['State'] || 'N/A'}`);
        console.log(`   - Type: ${contract['Contract_type'] || 'N/A'}`);
        console.log(`   - Contact: ${contract['Valmet_Contact'] || 'N/A'}`);
      }
    });

    console.log('\n🟢 VALUE ANALYSIS:');
    console.log('─────────────────────────────────────────────────');

    // Analyze contract values
    console.log('\n📊 CONTRACT STATE DISTRIBUTION:');
    console.log('─────────────────────────────────────────────────');

    const stateCount = {};
    const categoryCount = {};
    contractsData.forEach(contract => {
      const state = contract['State'] || 'Unknown';
      stateCount[state] = (stateCount[state] || 0) + 1;

      const category = contract['VCS_Category'] || 'Unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    Object.entries(stateCount).forEach(([state, count]) => {
      const percentage = ((count / contractsData.length) * 100).toFixed(1);
      console.log(`${state}: ${count} contracts (${percentage}%)`);
    });

    console.log('\n📦 VCS CATEGORY DISTRIBUTION:');
    console.log('─────────────────────────────────────────────────');
    Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([category, count]) => {
        const percentage = ((count / contractsData.length) * 100).toFixed(1);
        console.log(`${category}: ${count} contracts (${percentage}%)`);
      });

    console.log('\n✅ Analysis complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }

  process.exit(0);
}

// Run the analysis
analyzeData();