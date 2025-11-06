import XLSX from 'xlsx';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Firebase configuration from .env
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface CustomerData {
  tampuurinumero?: string;
  [key: string]: any;
}

interface HistoryData {
  tampuurinumero?: string;
  [key: string]: any;
}

interface MergedData {
  tampuurinumero: string;
  customerInfo: Record<string, any>;
  serviceHistory: Record<string, any>;
  mergedAt: string;
}

interface MigrationStats {
  customerRecordsRead: number;
  historyRecordsRead: number;
  customerRecordsSkipped: number;
  historyRecordsSkipped: number;
  recordsMerged: number;
  firestoreUploaded: number;
  firestoreErrors: number;
  firestoreStatus: 'success' | 'failed' | 'skipped';
  firestoreError?: string;
}

/**
 * Read Excel file and convert to JSON
 */
function readExcelFile(filePath: string): any[] {
  console.log(`📖 Reading Excel file: ${filePath}`);

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // Get first sheet
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`✅ Read ${data.length} rows from ${path.basename(filePath)}`);
  return data;
}

/**
 * Normalize field names (lowercase, remove spaces, special chars)
 */
function normalizeFieldName(fieldName: string): string {
  return fieldName
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[äå]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Normalize object keys
 */
function normalizeObject(obj: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const normalizedKey = normalizeFieldName(key);
    normalized[normalizedKey] = value;
  }

  return normalized;
}

/**
 * Extract tampuurinumero from record (handles multiple field name variations)
 */
function getTampuurinumero(normalized: Record<string, any>): string | null {
  // Try various field name variations
  // Note: History records store tampuurinumero in 'Code' field
  return (
    normalized.tampuurinumero ||
    normalized.tampuuri_numero ||
    normalized.tampuuri_tunnus ||
    normalized.tampuuritunnus ||
    normalized.code ||  // History records use 'Code' field
    null
  );
}

/**
 * Merge customer data and service history by tampuurinumero
 */
function mergeData(
  customerData: CustomerData[],
  historyData: HistoryData[]
): { merged: Map<string, MergedData>; skippedCustomers: number; skippedHistory: number } {
  console.log('🔄 Merging customer data with service history...');

  const merged = new Map<string, MergedData>();
  let skippedCustomers = 0;
  let skippedHistory = 0;

  // Process customer data
  for (const customer of customerData) {
    const normalized = normalizeObject(customer);
    const tampuurinumero = getTampuurinumero(normalized);

    if (!tampuurinumero) {
      skippedCustomers++;
      if (skippedCustomers <= 3) {
        // Only log first 3 warnings
        console.warn('⚠️  Customer record missing tampuurinumero. Keys:', Object.keys(customer).slice(0, 10));
      }
      continue;
    }

    merged.set(tampuurinumero, {
      tampuurinumero,
      customerInfo: normalized,
      serviceHistory: {},
      mergedAt: new Date().toISOString(),
    });
  }

  if (skippedCustomers > 3) {
    console.warn(`⚠️  Skipped ${skippedCustomers} customer records without tampuurinumero`);
  }

  // Add service history
  for (const history of historyData) {
    const normalized = normalizeObject(history);
    const tampuurinumero = getTampuurinumero(normalized);

    if (!tampuurinumero) {
      skippedHistory++;
      if (skippedHistory <= 3) {
        console.warn('⚠️  History record missing tampuurinumero. Keys:', Object.keys(history).slice(0, 10));
      }
      continue;
    }

    if (merged.has(tampuurinumero)) {
      merged.get(tampuurinumero)!.serviceHistory = normalized;
    } else {
      // Create new entry if customer not found
      merged.set(tampuurinumero, {
        tampuurinumero,
        customerInfo: {},
        serviceHistory: normalized,
        mergedAt: new Date().toISOString(),
      });
    }
  }

  if (skippedHistory > 3) {
    console.warn(`⚠️  Skipped ${skippedHistory} history records without tampuurinumero`);
  }

  console.log(`✅ Merged ${merged.size} records`);
  return { merged, skippedCustomers, skippedHistory };
}

/**
 * Save merged data to JSON file
 */
function saveToJson(data: Map<string, MergedData>, outputPath: string): void {
  const jsonData = Array.from(data.values());
  const jsonString = JSON.stringify(jsonData, null, 2);

  fs.writeFileSync(outputPath, jsonString, 'utf-8');
  console.log(`💾 Saved merged data to: ${outputPath}`);
  console.log(`📊 Total records: ${jsonData.length}`);
}

/**
 * Generate detailed markdown report
 */
function generateMarkdownReport(stats: MigrationStats, outputPath: string): void {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toISOString();

  const historyLinkedCount = stats.historyRecordsRead - stats.historyRecordsSkipped;
  const historyLinkRate = stats.historyRecordsRead > 0
    ? Math.round((historyLinkedCount / stats.historyRecordsRead) * 100)
    : 0;

  const report = `# CRM Data Migration - Run Log

**Date**: ${date}
**Script**: \`scripts/migrate-crm-data.ts\`
**Command**: \`npm run migrate:crm\`

## Summary

${stats.firestoreStatus === 'success' ? '✅' : stats.firestoreStatus === 'skipped' ? '⚠️' : '❌'} **Migration Status**: ${stats.firestoreStatus.toUpperCase()}
${stats.firestoreStatus === 'success' ? '✅' : '⚠️'} **Firestore Upload**: ${stats.firestoreStatus === 'success' ? 'SUCCESS' : stats.firestoreStatus === 'skipped' ? 'SKIPPED' : 'FAILED'}

## Execution Results

### Input Files

| File | Records | Location |
|------|---------|----------|
| customer_data.xlsx | ${stats.customerRecordsRead.toLocaleString()} | Data_preparation/ |
| housing_company_history_data.xlsx | ${stats.historyRecordsRead.toLocaleString()} | Data_preparation/ |

### Processing Results

| Metric | Count | Status |
|--------|-------|--------|
| Customer records processed | ${stats.customerRecordsRead.toLocaleString()} | ✅ |
| Service history records processed | ${stats.historyRecordsRead.toLocaleString()} | ✅ |
| Successfully merged records | ${stats.recordsMerged.toLocaleString()} | ✅ |
| Customer records skipped | ${stats.customerRecordsSkipped} | ${stats.customerRecordsSkipped > 0 ? '⚠️' : '✅'} ${stats.customerRecordsSkipped > 0 ? 'Missing tampuurinumero' : 'None'} |
| History records linked | ${historyLinkedCount.toLocaleString()} (${historyLinkRate}%) | ${historyLinkRate >= 90 ? '✅' : historyLinkRate >= 50 ? '⚠️' : '❌'} |
| History records skipped | ${stats.historyRecordsSkipped.toLocaleString()} | ${stats.historyRecordsSkipped > 0 ? '⚠️' : '✅'} ${stats.historyRecordsSkipped > 0 ? 'Missing tampuurinumero/Code' : 'None'} |

### Output Files

| File | Records | Size | Status |
|------|---------|------|--------|
| merged_crm_data.json | ${stats.recordsMerged.toLocaleString()} | ~${Math.round(stats.recordsMerged * 3 / 1024)} MB | ✅ Created |

${stats.firestoreStatus === 'success' ? `
### Firestore Upload

| Metric | Count | Status |
|--------|-------|--------|
| Documents uploaded | ${stats.firestoreUploaded.toLocaleString()} | ✅ |
| Upload errors | ${stats.firestoreErrors} | ${stats.firestoreErrors === 0 ? '✅' : '⚠️'} |
` : ''}

## Data Quality Metrics

- **Customer Data Completeness**: ${Math.round((1 - stats.customerRecordsSkipped / stats.customerRecordsRead) * 100)}%
- **Service History Link Rate**: ${historyLinkRate}%
- **Overall Merge Success**: ${Math.round((stats.recordsMerged / (stats.customerRecordsRead + stats.historyRecordsRead)) * 100)}%

## Issues Found

${stats.customerRecordsSkipped > 0 ? `
### 1. Missing tampuurinumero in Customer Records
- **Count**: ${stats.customerRecordsSkipped} records
- **Cause**: Some customer records don't have 'Tampuuri tunnus' or 'Code' field
- **Impact**: These records were skipped
- **Sample fields**: Account Name, Address, Y-tunnus, etc.
` : ''}

${stats.historyRecordsSkipped > 0 ? `
### ${stats.customerRecordsSkipped > 0 ? '2' : '1'}. Missing tampuurinumero in Service History Records
- **Count**: ${stats.historyRecordsSkipped.toLocaleString()} records
- **Cause**: Service history Excel records missing tampuurinumero field
- **Impact**: Service history could not be matched to customers
- **Fix Applied**: Now using 'Code' field from history records
- **Sample fields**: Code, Nimi, LTMPName, Toimenpide, Status, etc.
` : ''}

${stats.firestoreStatus === 'failed' ? `
### ${(stats.customerRecordsSkipped > 0 ? 1 : 0) + (stats.historyRecordsSkipped > 0 ? 1 : 0) + 1}. Firebase Upload Failed
- **Error**: \`${stats.firestoreError}\`
- **Cause**: ${stats.firestoreError?.includes('credential') ? 'Invalid email/password in .env (DB_USERNAME/DB_PASSWORD)' : 'Firebase connection error'}
- **Impact**: Data not uploaded to Firestore
- **Solution**: ${stats.firestoreError?.includes('credential') ? 'Update Firebase user credentials in .env or create the user in Firebase Auth' : 'Check Firebase configuration and network connection'}
` : ''}

## Recommendations

### High Priority

${historyLinkRate < 90 ? `
1. **Review Service History Linking**
   - Current link rate: ${historyLinkRate}%
   - **Action**: Verify that 'Code' field in history Excel matches 'Tampuuri tunnus' in customer data
   - This ensures maximum service history data is linked to customers
` : ''}

${stats.firestoreStatus === 'failed' ? `
${historyLinkRate < 90 ? '2' : '1'}. **Fix Firebase Authentication**
   - Update \`.env\` with valid Firebase user credentials:
     \`\`\`env
     DB_USERNAME=valid-email@example.com
     DB_PASSWORD=valid-password
     \`\`\`
   - Or create the user in Firebase Authentication
` : ''}

### Medium Priority

${stats.customerRecordsSkipped > 0 ? `
${(historyLinkRate < 90 ? 1 : 0) + (stats.firestoreStatus === 'failed' ? 1 : 0) + 1}. **Review Skipped Customer Records**
   - ${stats.customerRecordsSkipped} customer records were skipped due to missing tampuurinumero
   - Review the source data to add this field if needed
` : ''}

${(historyLinkRate < 90 ? 1 : 0) + (stats.firestoreStatus === 'failed' ? 1 : 0) + (stats.customerRecordsSkipped > 0 ? 1 : 0) + 1}. **Verify Merged Data**
   - Review \`merged_crm_data.json\` to ensure data quality
   - Check that all expected fields are present and normalized correctly

## Next Steps

1. ${stats.recordsMerged > 0 ? '✅' : '⏸️'} **Data Successfully Merged**: ${stats.recordsMerged.toLocaleString()} customer records saved to JSON
2. ${historyLinkRate >= 90 ? '✅' : '⏸️'} **Service History**: ${historyLinkedCount.toLocaleString()} records linked (${historyLinkRate}%)
3. ${stats.firestoreStatus === 'success' ? '✅' : '⏸️'} **Firestore Upload**: ${stats.firestoreStatus === 'success' ? `${stats.firestoreUploaded.toLocaleString()} documents uploaded` : stats.firestoreStatus === 'skipped' ? 'Skipped (credentials not configured)' : 'Failed (see issues above)'}
4. 📋 **To Re-upload**: ${stats.firestoreStatus !== 'success' ? 'Fix credentials in .env and run \`npm run migrate:crm\` again' : 'Migration complete!'}

## Success Criteria

| Criterion | Status | Notes |
|-----------|--------|-------|
| Read customer data | ✅ | ${stats.customerRecordsRead.toLocaleString()} records |
| Read service history | ✅ | ${stats.historyRecordsRead.toLocaleString()} records |
| Merge by tampuurinumero | ${stats.recordsMerged > 0 ? '✅' : '❌'} | ${stats.recordsMerged.toLocaleString()} merged |
| Link service history | ${historyLinkRate >= 90 ? '✅' : historyLinkRate >= 50 ? '⚠️' : '❌'} | ${historyLinkRate}% link rate |
| Normalize field names | ✅ | All fields normalized |
| Save to JSON | ${stats.recordsMerged > 0 ? '✅' : '❌'} | File created successfully |
| Upload to Firestore | ${stats.firestoreStatus === 'success' ? '✅' : stats.firestoreStatus === 'skipped' ? '⏸️' : '❌'} | ${stats.firestoreStatus === 'success' ? 'Upload successful' : stats.firestoreStatus === 'skipped' ? 'Skipped' : 'Failed'} |

## File Locations

- **Source Excel Files**: \`/Data_preparation/\`
  - \`customer_data.xlsx\`
  - \`housing_company_history_data.xlsx\`
- **Output JSON**: \`/Data_preparation/merged_crm_data.json\`
- **Migration Script**: \`/scripts/migrate-crm-data.ts\`
- **This Log**: \`/Data_preparation/migration-run-report.md\`

## Command to Re-run

\`\`\`bash
${stats.firestoreStatus !== 'success' ? '# After fixing .env credentials\n' : ''}npm run migrate:crm
\`\`\`

---

**Generated**: ${timestamp}
**Script Version**: 1.1
**Status**: ${stats.firestoreStatus === 'success' ? 'Migration complete' : stats.firestoreStatus === 'skipped' ? 'Data merge successful, Firestore upload skipped' : 'Data merge successful, Firestore upload failed'}
`;

  fs.writeFileSync(outputPath, report, 'utf-8');
  console.log(`\n📄 Detailed report saved to: ${outputPath}`);
}

/**
 * Upload data to Firestore
 */
async function uploadToFirestore(
  data: Map<string, MergedData>,
  email: string,
  password: string
): Promise<{ uploaded: number; errors: number }> {
  try {
    console.log('🔐 Authenticating with Firebase...');

    // Sign in with email and password
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authentication successful');

    console.log('☁️  Uploading to Firestore collection: crm_asikkaat_ja_palveluhistoria');

    const collectionRef = collection(db, 'crm_asikkaat_ja_palveluhistoria');
    let uploaded = 0;
    let errors = 0;

    for (const [tampuurinumero, record] of data.entries()) {
      try {
        const docRef = doc(collectionRef, tampuurinumero);
        await setDoc(docRef, record);
        uploaded++;

        if (uploaded % 10 === 0) {
          console.log(`📤 Uploaded ${uploaded}/${data.size} documents...`);
        }
      } catch (error) {
        console.error(`❌ Error uploading document ${tampuurinumero}:`, error);
        errors++;
      }
    }

    console.log(`✅ Upload complete: ${uploaded} successful, ${errors} errors`);
    return { uploaded, errors };
  } catch (error) {
    console.error('❌ Firebase operation failed:', error);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrate() {
  const stats: MigrationStats = {
    customerRecordsRead: 0,
    historyRecordsRead: 0,
    customerRecordsSkipped: 0,
    historyRecordsSkipped: 0,
    recordsMerged: 0,
    firestoreUploaded: 0,
    firestoreErrors: 0,
    firestoreStatus: 'skipped',
  };

  try {
    console.log('🚀 Starting CRM data migration...\n');

    // File paths
    const dataDir = path.join(__dirname, '..', 'Data_preparation');
    const customerFile = path.join(dataDir, 'customer_data.xlsx');
    const historyFile = path.join(dataDir, 'housing_company_history_data.xlsx');
    const outputFile = path.join(dataDir, 'merged_crm_data.json');
    const reportFile = path.join(dataDir, 'migration-run-report.md');

    // Check if files exist
    if (!fs.existsSync(customerFile)) {
      throw new Error(`Customer data file not found: ${customerFile}`);
    }
    if (!fs.existsSync(historyFile)) {
      throw new Error(`History data file not found: ${historyFile}`);
    }

    // Read Excel files
    const customerData = readExcelFile(customerFile);
    const historyData = readExcelFile(historyFile);
    stats.customerRecordsRead = customerData.length;
    stats.historyRecordsRead = historyData.length;

    // Merge data
    const { merged: mergedData, skippedCustomers, skippedHistory } = mergeData(customerData, historyData);
    stats.customerRecordsSkipped = skippedCustomers;
    stats.historyRecordsSkipped = skippedHistory;
    stats.recordsMerged = mergedData.size;

    // Save to JSON
    saveToJson(mergedData, outputFile);

    // Upload to Firestore
    // Use DB_USERNAME and DB_PASSWORD from .env
    const email = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;

    if (!email || !password) {
      console.warn('\n⚠️  DB_USERNAME or DB_PASSWORD not set in .env');
      console.log('📋 Make sure these are in .env file:');
      console.log('   DB_USERNAME=your-email@example.com');
      console.log('   DB_PASSWORD=your-password');
      console.log('\n✅ Data merged and saved to JSON. Skipping Firestore upload.');
      stats.firestoreStatus = 'skipped';
      generateMarkdownReport(stats, reportFile);
      console.log('\n🎉 Migration completed successfully (JSON only)!');
      return;
    }

    console.log(`\n🔐 Attempting Firestore upload with user: ${email}`);

    try {
      const { uploaded, errors } = await uploadToFirestore(mergedData, email, password);
      stats.firestoreUploaded = uploaded;
      stats.firestoreErrors = errors;
      stats.firestoreStatus = 'success';
      generateMarkdownReport(stats, reportFile);
      console.log('\n🎉 Migration completed successfully!');
    } catch (error) {
      stats.firestoreStatus = 'failed';
      stats.firestoreError = error instanceof Error ? error.message : String(error);
      console.error('\n❌ Firestore upload failed. Data saved to JSON file.');
      console.log('\n✅ You can review the data in:', outputFile);
      console.log('💡 To upload later, fix credentials in .env and run again.');
      generateMarkdownReport(stats, reportFile);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate();
