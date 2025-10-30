/**
 * Quick test script to verify setup
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
config({ path: resolve(__dirname, '../.env') });

console.log('🧪 Testing configuration...\n');

// Check environment variables
const requiredVars = [
  'VITE_OPEN_ROUTER_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'FIRESTORE_USER',
  'FIRESTORE_PW'
];

let allPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT FOUND`);
    allPresent = false;
  }
});

console.log('');

if (allPresent) {
  console.log('✨ All required environment variables are present!');
  console.log('\nNext steps:');
  console.log('  1. npm run dry-run    # Test without database writes');
  console.log('  2. npm run process    # Process all families');
  console.log('  3. npm run resume     # Resume from last saved state');
} else {
  console.log('⚠️  Some environment variables are missing!');
  console.log('Please check your .env file in the parent directory.');
  process.exit(1);
}
