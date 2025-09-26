#!/usr/bin/env node

/**
 * API Test Script for Valmet Buyer Firestore Search Functions
 *
 * This script tests all search functions to ensure they work correctly.
 * Run with: node test-api-functions.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

if (!firebaseConfig.apiKey) {
  console.error(`${colors.red}❌ Error: Firebase configuration not found. Please check your .env file.${colors.reset}`);
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import the functions dynamically
async function importFunctions() {
  try {
    // Import from TypeScript files
    const supplierModule = await import('./src/lib/supplierSearchFunction.ts');
    const firestoreModule = await import('./src/lib/firestoreSearchFunctions.ts');

    return {
      searchSuppliersForChat: supplierModule.searchSuppliersForChat,
      searchTrainingInvoicesForChat: firestoreModule.searchTrainingInvoicesForChat,
      searchContractsForChat: firestoreModule.searchContractsForChat,
      searchTrainingSuppliersForChat: firestoreModule.searchTrainingSuppliersForChat
    };
  } catch (error) {
    console.error(`${colors.red}❌ Error importing functions:${colors.reset}`, error);
    console.log(`${colors.yellow}⚠️  Make sure to build the project first: npm run build${colors.reset}`);
    process.exit(1);
  }
}

// Test runner function
async function runTest(testName, testFn) {
  totalTests++;
  console.log(`\n${colors.cyan}Running: ${testName}${colors.reset}`);

  try {
    const startTime = Date.now();
    const result = await testFn();
    const duration = Date.now() - startTime;

    if (result.success) {
      passedTests++;
      console.log(`${colors.green}✅ PASSED${colors.reset} (${duration}ms)`);
      if (result.details) {
        console.log(`   ${colors.blue}Details: ${result.details}${colors.reset}`);
      }
      testResults.push({ name: testName, status: 'PASSED', duration, details: result.details });
    } else {
      failedTests++;
      console.log(`${colors.red}❌ FAILED${colors.reset} (${duration}ms)`);
      console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
      testResults.push({ name: testName, status: 'FAILED', duration, error: result.error });
    }
  } catch (error) {
    failedTests++;
    console.log(`${colors.red}❌ FAILED with exception${colors.reset}`);
    console.log(`   ${colors.red}Error: ${error.message}${colors.reset}`);
    testResults.push({ name: testName, status: 'FAILED', error: error.message });
  }
}

// Test functions
async function main() {
  console.log(`${colors.blue}🧪 Valmet Buyer API Test Suite${colors.reset}`);
  console.log(`${colors.blue}================================${colors.reset}`);

  const functions = await importFunctions();

  // Test 1: Search External Labour Suppliers - No filters
  await runTest('External Labour Suppliers - No filters', async () => {
    const result = await functions.searchSuppliersForChat({ limit: 5 });
    if (!result.success) return { success: false, error: result.error };
    if (result.totalFound === 0) return { success: false, error: 'No suppliers found' };
    return {
      success: true,
      details: `Found ${result.totalFound} suppliers, returned ${result.suppliers.length}`
    };
  });

  // Test 2: Search External Labour Suppliers - By category
  await runTest('External Labour Suppliers - Business consulting category', async () => {
    const result = await functions.searchSuppliersForChat({
      mainCategory: 'Indirect procurement iPRO, Professional services, Business consulting',
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} business consulting suppliers`
    };
  });

  // Test 3: Search External Labour Suppliers - By vendor name
  await runTest('External Labour Suppliers - Vendor name search', async () => {
    const result = await functions.searchSuppliersForChat({
      vendorName: 'Deloitte',
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} suppliers matching "Deloitte"`
    };
  });

  // Test 4: Search External Labour Suppliers - By country
  await runTest('External Labour Suppliers - Finland suppliers', async () => {
    const result = await functions.searchSuppliersForChat({
      country: 'Finland',
      limit: 10
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} suppliers in Finland`
    };
  });

  // Test 5: Search Training Invoices - No filters
  await runTest('Training Invoices - No filters', async () => {
    const result = await functions.searchTrainingInvoicesForChat({ limit: 5 });
    if (!result.success) return { success: false, error: result.error };
    if (!result.tableData) return { success: false, error: 'No table data returned' };
    return {
      success: true,
      details: `Found ${result.totalFound} invoices, total amount: €${result.summary?.totalAmount?.toLocaleString() || 0}`
    };
  });

  // Test 6: Search Training Invoices - By business partner
  await runTest('Training Invoices - Business partner search', async () => {
    const result = await functions.searchTrainingInvoicesForChat({
      businessPartner: 'Academic',
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} invoices for "Academic"`
    };
  });

  // Test 7: Search Training Invoices - By amount range
  await runTest('Training Invoices - Amount range filter', async () => {
    const result = await functions.searchTrainingInvoicesForChat({
      minAmount: 10000,
      maxAmount: 50000,
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} invoices between €10,000 and €50,000`
    };
  });

  // Test 8: Search iPRO Contracts - No filters
  await runTest('iPRO Contracts - No filters', async () => {
    const result = await functions.searchContractsForChat({ limit: 5 });
    if (!result.success) return { success: false, error: result.error };
    if (!result.tableData) return { success: false, error: 'No table data returned' };
    return {
      success: true,
      details: `Found ${result.totalFound} contracts, ${result.summary?.activeCount || 0} active`
    };
  });

  // Test 9: Search iPRO Contracts - Active only
  await runTest('iPRO Contracts - Active only', async () => {
    const result = await functions.searchContractsForChat({
      activeOnly: true,
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} active contracts`
    };
  });

  // Test 10: Search iPRO Contracts - By supplier
  await runTest('iPRO Contracts - Supplier search', async () => {
    const result = await functions.searchContractsForChat({
      supplier: 'IBM',
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} contracts for "IBM"`
    };
  });

  // Test 11: Search Training Suppliers - No filters
  await runTest('Training Suppliers - No filters', async () => {
    const result = await functions.searchTrainingSuppliersForChat({ limit: 5 });
    if (!result.success) return { success: false, error: result.error };
    if (!result.tableData) return { success: false, error: 'No table data returned' };
    return {
      success: true,
      details: `Found ${result.totalFound} training suppliers`
    };
  });

  // Test 12: Search Training Suppliers - Preferred only
  await runTest('Training Suppliers - Preferred only', async () => {
    const result = await functions.searchTrainingSuppliersForChat({
      preferredOnly: true,
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.summary?.preferredCount || 0} preferred suppliers`
    };
  });

  // Test 13: Search Training Suppliers - By classification
  await runTest('Training Suppliers - Classification A', async () => {
    const result = await functions.searchTrainingSuppliersForChat({
      classification: 'A',
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.totalFound} Class A suppliers`
    };
  });

  // Test 14: Search Training Suppliers - With contract
  await runTest('Training Suppliers - With contract', async () => {
    const result = await functions.searchTrainingSuppliersForChat({
      hasContract: true,
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    return {
      success: true,
      details: `Found ${result.summary?.withContract || 0} suppliers with contracts`
    };
  });

  // Test 15: Check table data format
  await runTest('Table Data Format Check', async () => {
    const result = await functions.searchTrainingInvoicesForChat({ limit: 2 });
    if (!result.success) return { success: false, error: result.error };
    if (!result.tableData) return { success: false, error: 'No table data' };
    if (!result.tableData.columns || !result.tableData.rows) {
      return { success: false, error: 'Invalid table data format' };
    }
    return {
      success: true,
      details: `Table has ${result.tableData.columns.length} columns and ${result.tableData.rows.length} rows`
    };
  });

  // Test 17: Error handling - Invalid category
  await runTest('Error Handling - Invalid category', async () => {
    const result = await functions.searchSuppliersForChat({
      mainCategory: 'Invalid Category Name',
      limit: 5
    });
    if (result.success) return { success: false, error: 'Should have failed for invalid category' };
    return {
      success: true,
      details: 'Correctly rejected invalid category'
    };
  });

  // Test 18: Empty results handling
  await runTest('Empty Results - Non-existent vendor', async () => {
    const result = await functions.searchSuppliersForChat({
      vendorName: 'NonExistentVendor123456',
      limit: 5
    });
    if (!result.success) return { success: false, error: result.error };
    if (result.totalFound !== 0) return { success: false, error: 'Should return 0 results' };
    return {
      success: true,
      details: 'Correctly handled empty results with helpful message'
    };
  });

  // Print summary
  console.log(`\n${colors.blue}================================${colors.reset}`);
  console.log(`${colors.blue}📊 Test Summary${colors.reset}`);
  console.log(`${colors.blue}================================${colors.reset}`);
  console.log(`Total Tests: ${totalTests}`);
  console.log(`${colors.green}Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedTests}${colors.reset}`);
  console.log(`Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

  // Write results to file
  const reportPath = join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      successRate: ((passedTests/totalTests) * 100).toFixed(1)
    },
    tests: testResults
  }, null, 2));
  console.log(`\n📄 Detailed results saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(failedTests > 0 ? 1 : 0);
}

// Run the tests
main().catch(error => {
  console.error(`${colors.red}❌ Fatal error:${colors.reset}`, error);
  process.exit(1);
});