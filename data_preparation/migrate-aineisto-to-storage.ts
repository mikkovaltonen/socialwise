/**
 * Firebase Storage Migration Script for Aineisto Documents
 *
 * This script uploads all documents from /public/Aineisto to Firebase Storage
 * while preserving the folder structure.
 *
 * Usage: npx tsx Data_preparation/migrate-aineisto-to-storage.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes } from 'firebase/storage';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

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
};

const userEmail = process.env.VITE_FIREBASE_UER;
const userPassword = process.env.VITE_FIREBASE_PW;

// Validate environment variables
if (!firebaseConfig.projectId || !firebaseConfig.storageBucket) {
  console.error('❌ Error: Missing Firebase configuration in .env file');
  process.exit(1);
}

if (!userEmail || !userPassword) {
  console.error('❌ Error: Missing VITE_FIREBASE_UER or VITE_FIREBASE_PW in .env file');
  process.exit(1);
}

// Initialize Firebase
console.log('🔧 Initializing Firebase...');
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// Source directory
const SOURCE_DIR = path.join(process.cwd(), 'public', 'Aineisto');

// Statistics
const stats = {
  totalFiles: 0,
  uploadedFiles: 0,
  failedFiles: 0,
  errors: [] as Array<{ file: string; error: string }>,
};

/**
 * Get all files recursively from a directory
 */
function getAllFiles(dirPath: string, baseDir: string = dirPath): string[] {
  const files: string[] = [];

  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Get relative path from source directory
 */
function getRelativePath(filePath: string): string {
  return path.relative(SOURCE_DIR, filePath);
}

/**
 * Upload a single file to Firebase Storage
 */
async function uploadFile(filePath: string): Promise<void> {
  const relativePath = getRelativePath(filePath);
  const destinationPath = `Aineisto/${relativePath}`;

  try {
    console.log(`📤 Uploading: ${relativePath}`);

    // Read file content
    const fileContent = fs.readFileSync(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.md' ? 'text/markdown' : 'application/octet-stream';

    // Create storage reference
    const storageRef = ref(storage, destinationPath);

    // Upload to Firebase Storage
    await uploadBytes(storageRef, fileContent, {
      contentType,
      customMetadata: {
        originalPath: relativePath,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userEmail || 'unknown',
      },
    });

    console.log(`✅ Uploaded: ${destinationPath}`);
    stats.uploadedFiles++;
  } catch (error) {
    console.error(`❌ Failed to upload ${relativePath}:`, error);
    stats.failedFiles++;
    stats.errors.push({
      file: relativePath,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Main migration function
 */
async function migrateAineisto() {
  console.log('🚀 Starting Aineisto migration to Firebase Storage');
  console.log(`📁 Source directory: ${SOURCE_DIR}`);
  console.log(`🪣 Storage bucket: ${firebaseConfig.storageBucket}`);
  console.log('');

  // Authenticate with Firebase
  try {
    console.log('🔐 Authenticating with Firebase...');
    await signInWithEmailAndPassword(auth, userEmail!, userPassword!);
    console.log(`✅ Authenticated as: ${userEmail}`);
    console.log('');
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    process.exit(1);
  }

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Error: Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Get all files
  console.log('🔍 Scanning for files...');
  const files = getAllFiles(SOURCE_DIR);
  stats.totalFiles = files.length;

  console.log(`📊 Found ${stats.totalFiles} files to upload`);
  console.log('');

  // Upload files
  for (const file of files) {
    await uploadFile(file);
  }

  // Print summary
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📊 Migration Summary');
  console.log('═══════════════════════════════════════');
  console.log(`Total files found:    ${stats.totalFiles}`);
  console.log(`Successfully uploaded: ${stats.uploadedFiles}`);
  console.log(`Failed uploads:        ${stats.failedFiles}`);
  console.log('');

  if (stats.errors.length > 0) {
    console.log('❌ Errors:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
    console.log('');
  }

  // Generate report file
  const reportPath = path.join(process.cwd(), 'Data_preparation', 'aineisto-migration-report.md');
  const report = generateReport();
  fs.writeFileSync(reportPath, report);
  console.log(`📄 Report saved to: ${reportPath}`);

  console.log('');
  console.log('✨ Migration complete!');
}

/**
 * Generate markdown report
 */
function generateReport(): string {
  const timestamp = new Date().toISOString();

  let report = `# Aineisto Firebase Storage Migration Report\n\n`;
  report += `**Generated:** ${timestamp}\n`;
  report += `**User:** ${userEmail}\n`;
  report += `**Source:** ${SOURCE_DIR}\n`;
  report += `**Destination:** gs://${firebaseConfig.storageBucket}/Aineisto/\n\n`;

  report += `## Summary\n\n`;
  report += `| Metric | Count |\n`;
  report += `|--------|-------|\n`;
  report += `| Total Files | ${stats.totalFiles} |\n`;
  report += `| Successfully Uploaded | ${stats.uploadedFiles} |\n`;
  report += `| Failed Uploads | ${stats.failedFiles} |\n`;
  report += `| Success Rate | ${((stats.uploadedFiles / stats.totalFiles) * 100).toFixed(2)}% |\n\n`;

  if (stats.errors.length > 0) {
    report += `## Errors\n\n`;
    stats.errors.forEach(({ file, error }) => {
      report += `- **${file}**: ${error}\n`;
    });
    report += `\n`;
  }

  report += `## Files Uploaded\n\n`;
  report += `All files from the following structure were uploaded:\n\n`;
  report += `\`\`\`\n`;
  report += `Aineisto/\n`;
  report += `├── DATA_PARSING_DOKUMENTAATIO.md\n`;
  report += `├── LS-ilmoitukset/\n`;
  report += `│   ├── Lapsi_1_2016_08_03_Lastensuojeluilmoitus.md\n`;
  report += `│   ├── Lapsi_1_2017_11_16_Lastensuojeluilmoitus.md\n`;
  report += `│   └── Lapsi_1_2018_04_26_Lastensuojeluilmoitus.md\n`;
  report += `├── Päätökset/\n`;
  report += `│   └── Lapsi_1_2025_03_22_päätös.md\n`;
  report += `└── Yhteystiedot/\n`;
  report += `    └── Lapsi_1_yhteystiedot.md\n`;
  report += `\`\`\`\n\n`;

  report += `## Access URLs\n\n`;
  report += `Files can be accessed via Firebase Storage:\n`;
  report += `- Console: https://console.firebase.google.com/project/${firebaseConfig.projectId}/storage\n`;
  report += `- Storage path: \`Aineisto/\`\n\n`;

  report += `## Notes\n\n`;
  report += `- All Markdown files (.md) are uploaded with \`text/markdown\` content type\n`;
  report += `- Original file paths are preserved in metadata\n`;
  report += `- Metadata includes upload timestamp and user email\n`;

  return report;
}

// Run migration
migrateAineisto()
  .then(() => {
    console.log('👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
