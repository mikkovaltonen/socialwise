/**
 * Inline API Test for Valmet Buyer
 *
 * This test file can be imported and run directly in the browser console
 * or through a test component.
 */

import {
  searchSuppliersForChat,
  getMainCategoriesForChat
} from './lib/supplierSearchFunction';

import {
  searchTrainingInvoicesForChat,
  searchContractsForChat,
  searchTrainingSuppliersForChat
} from './lib/firestoreSearchFunctions';

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
  duration?: number;
}

export class ApiTester {
  private results: TestResult[] = [];
  private totalTests = 0;
  private passedTests = 0;
  private failedTests = 0;

  async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    this.totalTests++;
    const startTime = Date.now();
    const result: TestResult = { name, passed: false };

    try {
      console.log(`🧪 Running: ${name}`);
      const response = await testFn();
      const duration = Date.now() - startTime;
      result.duration = duration;

      if (response && response.success !== false) {
        this.passedTests++;
        result.passed = true;
        result.details = JSON.stringify(response).substring(0, 200);
        console.log(`✅ PASSED (${duration}ms)`);
      } else {
        this.failedTests++;
        result.error = response?.error || 'Test failed';
        console.error(`❌ FAILED: ${result.error}`);
      }
    } catch (error) {
      this.failedTests++;
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ EXCEPTION: ${result.error}`);
    }

    this.results.push(result);
    return result;
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Valmet Buyer API Tests');
    console.log('===================================');

    // Test 1: External Labour Suppliers - Basic search
    await this.runTest('External Labour Suppliers - Basic', async () => {
      return await searchSuppliersForChat({ limit: 3 });
    });

    // Test 2: External Labour Suppliers - Category search
    await this.runTest('External Labour Suppliers - Business Consulting', async () => {
      return await searchSuppliersForChat({
        mainCategory: 'Indirect procurement iPRO, Professional services, Business consulting',
        limit: 3
      });
    });

    // Test 3: External Labour Suppliers - Leased workforce
    await this.runTest('External Labour Suppliers - Leased Workforce', async () => {
      return await searchSuppliersForChat({
        mainCategory: 'Indirect procurement iPRO, Personnel, Leased workforce',
        limit: 3
      });
    });

    // Test 4: External Labour Suppliers - Country search
    await this.runTest('External Labour Suppliers - Finland', async () => {
      return await searchSuppliersForChat({
        country: 'Finland',
        limit: 5
      });
    });

    // Test 5: External Labour Suppliers - Vendor search
    await this.runTest('External Labour Suppliers - Vendor Name', async () => {
      return await searchSuppliersForChat({
        vendorName: 'Consulting',
        limit: 5
      });
    });

    // Test 6: Training Invoices - Basic
    await this.runTest('Training Invoices - Basic', async () => {
      const result = await searchTrainingInvoicesForChat({ limit: 3 });
      if (!result.tableData) throw new Error('No table data returned');
      return result;
    });

    // Test 7: Training Invoices - Business Partner
    await this.runTest('Training Invoices - Partner Search', async () => {
      const result = await searchTrainingInvoicesForChat({
        businessPartner: 'Training',
        limit: 3
      });
      return result;
    });

    // Test 8: Training Invoices - Amount Range
    await this.runTest('Training Invoices - Amount Range', async () => {
      const result = await searchTrainingInvoicesForChat({
        minAmount: 5000,
        maxAmount: 20000,
        limit: 3
      });
      return result;
    });

    // Test 9: iPRO Contracts - Basic
    await this.runTest('iPRO Contracts - Basic', async () => {
      const result = await searchContractsForChat({ limit: 3 });
      if (!result.tableData) throw new Error('No table data returned');
      return result;
    });

    // Test 10: iPRO Contracts - Active Only
    await this.runTest('iPRO Contracts - Active', async () => {
      const result = await searchContractsForChat({
        activeOnly: true,
        limit: 3
      });
      return result;
    });

    // Test 11: Training Suppliers - Basic
    await this.runTest('Training Suppliers - Basic', async () => {
      const result = await searchTrainingSuppliersForChat({ limit: 3 });
      if (!result.tableData) throw new Error('No table data returned');
      return result;
    });

    // Test 12: Training Suppliers - Preferred
    await this.runTest('Training Suppliers - Preferred', async () => {
      const result = await searchTrainingSuppliersForChat({
        preferredOnly: true,
        limit: 3
      });
      return result;
    });

    // Test 13: Training Suppliers - With Contract
    await this.runTest('Training Suppliers - With Contract', async () => {
      const result = await searchTrainingSuppliersForChat({
        hasContract: true,
        limit: 3
      });
      return result;
    });

    // Test 14: Get Main Categories
    await this.runTest('Get Main Categories', async () => {
      const result = getMainCategoriesForChat();
      if (!result.includes('Business consulting')) {
        throw new Error('Categories not returned correctly');
      }
      return { success: true, categories: result };
    });

    // Test 16: Table Data Validation
    await this.runTest('Table Data Structure', async () => {
      const result = await searchTrainingInvoicesForChat({ limit: 1 });
      if (!result.tableData?.columns || !result.tableData?.rows) {
        throw new Error('Invalid table structure');
      }
      return {
        success: true,
        columns: result.tableData.columns.length,
        rows: result.tableData.rows.length
      };
    });

    // Test 17: Error Handling - Invalid Category
    await this.runTest('Error Handling - Invalid Category', async () => {
      const result = await searchSuppliersForChat({
        mainCategory: 'Invalid Category XYZ',
        limit: 3
      });
      if (result.success !== false) {
        throw new Error('Should have failed for invalid category');
      }
      return { success: true, handled: true };
    });

    // Test 18: Empty Results
    await this.runTest('Empty Results - Non-existent Vendor', async () => {
      const result = await searchSuppliersForChat({
        vendorName: 'XYZ123NonExistent',
        limit: 3
      });
      if (result.totalFound !== 0) {
        throw new Error('Should return 0 results');
      }
      return result;
    });

    this.printSummary();
  }

  printSummary(): void {
    console.log('\n===================================');
    console.log('📊 TEST SUMMARY');
    console.log('===================================');
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`✅ Passed: ${this.passedTests}`);
    console.log(`❌ Failed: ${this.failedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    if (this.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
    }

    console.log('\n📄 Full results available in apiTester.getResults()');
  }

  getResults(): TestResult[] {
    return this.results;
  }

  getSummary(): any {
    return {
      totalTests: this.totalTests,
      passedTests: this.passedTests,
      failedTests: this.failedTests,
      successRate: ((this.passedTests / this.totalTests) * 100).toFixed(1),
      results: this.results
    };
  }
}

// Export a singleton instance
export const apiTester = new ApiTester();

// Function to run tests immediately
export async function runApiTests(): Promise<void> {
  await apiTester.runAllTests();
  return apiTester.getSummary();
}

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).apiTester = apiTester;
  (window as any).runApiTests = runApiTests;
  console.log('💡 API Tester loaded. Run tests with: runApiTests()');
}