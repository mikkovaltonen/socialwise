/**
 * Batch Processor for Substrate Family AI Analysis
 *
 * This script processes all substrate families in the stock_management collection
 * and updates each material with AI-generated conclusions.
 *
 * Usage:
 *   npm run process                      # Process all families
 *   npm run dry-run                      # Test without writing to database
 *   npm run resume                       # Resume from last saved progress
 *   npm run process _MAD_GR_0209         # Process only specific substrate family
 *   npm run dry-run _MAD_GR_0209         # Dry run for specific family
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { authenticateAndGetFirestore, getDb } from './firebaseClient.js';
import { loadSystemPrompt, processSubstrateFamily } from './aiProcessor.js';
import { Firestore, collection, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import {
  StockMaterial,
  ProcessingResult,
  ProgressState,
  DEFAULT_BATCH_CONFIG,
  MaterialResult,
  DEFAULT_LLM_MODEL
} from './config.js';
import { writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

const PROGRESS_FILE = resolve(__dirname, './progress.json');
const DRY_RUN = process.argv.includes('--dry-run');
const RESUME = process.argv.includes('--resume');

// Extract substrate family filter from actual command-line arguments (skip node and script path)
// process.argv = [node, script, ...actualArgs]
const actualArgs = process.argv.slice(2);
const SUBSTRATE_FILTER = actualArgs.find(arg => !arg.startsWith('--'));

/**
 * Main batch processing function
 */
async function main() {
  console.log('🚀 Demand Manager Batch Processor');
  console.log('=====================================');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no database writes)' : 'PRODUCTION'}`);
  console.log(`Resume: ${RESUME ? 'Yes' : 'No'}`);
  if (SUBSTRATE_FILTER) {
    console.log(`🔍 Filter: ${SUBSTRATE_FILTER}`);
  }
  console.log('');

  try {
    // Initialize Firebase
    console.log('🔌 Connecting to Firestore...');
    const db = await authenticateAndGetFirestore();
    console.log('✅ Connected to Firestore\n');

    // Load system prompt
    console.log('📄 Loading system prompt...');
    const systemPrompt = await loadSystemPrompt();
    console.log('✅ System prompt loaded\n');

    // Use configured LLM model
    const selectedModel = DEFAULT_LLM_MODEL;
    console.log(`🤖 LLM Model: ${selectedModel}\n`);

    // Load or initialize progress
    let progress: ProgressState;
    if (RESUME && existsSync(PROGRESS_FILE)) {
      const data = await readFile(PROGRESS_FILE, 'utf-8');
      progress = JSON.parse(data);
      console.log(`📂 Resumed from progress: ${progress.completedCount}/${progress.totalKeywords} completed\n`);
    } else {
      progress = {
        processedKeywords: [],
        failedKeywords: [],
        totalKeywords: 0,
        startTime: new Date().toISOString(),
        lastUpdateTime: new Date().toISOString(),
        completedCount: 0,
        failedCount: 0
      };
    }

    // Get all unique substrate families
    console.log('🔍 Loading substrate families...');
    const stockRef = collection(db, 'stock_management');
    const snapshot = await getDocs(stockRef);

    const keywordMap = new Map<string, any[]>();

    // Group materials by keyword
    snapshot.forEach((doc) => {
      const data = doc.data();

      if (data.materials && Array.isArray(data.materials)) {
        // New structure: document ID is keyword, materials is array
        const keyword = doc.id.trim(); // Trim whitespace
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, []);
        }
        data.materials.forEach((material: any, index: number) => {
          keywordMap.get(keyword)!.push({
            id: `${doc.id}_${index}`,
            docId: doc.id,
            keyword: keyword,
            ...material
          });
        });
      } else if (data.keyword) {
        // Old structure: each document is a material
        const keyword = String(data.keyword).trim(); // Trim whitespace
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, []);
        }
        keywordMap.get(keyword)!.push({
          id: doc.id,
          docId: doc.id,
          ...data
        });
      }
    });

    let allKeywords = Array.from(keywordMap.keys()).sort();

    // Apply substrate family filter if provided
    if (SUBSTRATE_FILTER) {
      const filterTrimmed = SUBSTRATE_FILTER.trim();
      const matchingKeywords = allKeywords.filter(k => k === filterTrimmed);
      if (matchingKeywords.length === 0) {
        console.error(`❌ Error: Substrate family "${filterTrimmed}" not found in database`);
        console.log(`\n💡 Available substrate families (first 20):`);
        allKeywords.slice(0, 20).forEach(k => console.log(`   - ${k}`));
        if (allKeywords.length > 20) {
          console.log(`   ... and ${allKeywords.length - 20} more`);
        }
        process.exit(1);
      }
      allKeywords = matchingKeywords;
      console.log(`🎯 Filtered to substrate family: ${filterTrimmed}\n`);
    }

    progress.totalKeywords = allKeywords.length;

    console.log(`✅ Found ${allKeywords.length} unique substrate families`);
    console.log(`📊 Total materials: ${snapshot.size}\n`);

    // Filter out already processed keywords if resuming
    const keywordsToProcess = RESUME
      ? allKeywords.filter(k => !progress.processedKeywords.includes(k))
      : allKeywords;

    console.log(`📋 Processing ${keywordsToProcess.length} substrate families...\n`);

    // Process in batches with concurrency control
    const batchSize = DEFAULT_BATCH_CONFIG.concurrentRequests;
    const results: ProcessingResult[] = [];

    for (let i = 0; i < keywordsToProcess.length; i += batchSize) {
      const batch = keywordsToProcess.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(keywordsToProcess.length / batchSize);

      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} families)`);
      console.log('─'.repeat(60));

      // Process batch concurrently
      const batchPromises = batch.map(keyword =>
        processKeyword(keyword, keywordMap.get(keyword)!, systemPrompt, selectedModel, db)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      // Collect results
      batchResults.forEach((result, index) => {
        const keyword = batch[index];

        if (result.status === 'fulfilled') {
          results.push(result.value);
          progress.processedKeywords.push(keyword);
          progress.completedCount++;
          console.log(`  ✅ ${keyword}: ${result.value.materialCount} materials processed`);
        } else {
          const errorResult: ProcessingResult = {
            keyword,
            materialCount: keywordMap.get(keyword)?.length || 0,
            success: false,
            error: result.reason?.message || 'Unknown error',
            processedMaterials: [],
            timestamp: new Date().toISOString(),
            processingMethod: 'ai'
          };
          results.push(errorResult);
          progress.failedKeywords.push(keyword);
          progress.failedCount++;
          console.log(`  ❌ ${keyword}: ${result.reason?.message}`);
        }
      });

      // Save progress periodically
      if ((i + batchSize) % (batchSize * DEFAULT_BATCH_CONFIG.saveProgressInterval) === 0 ||
          i + batchSize >= keywordsToProcess.length) {
        progress.lastUpdateTime = new Date().toISOString();
        await saveProgress(progress);
        console.log(`\n💾 Progress saved: ${progress.completedCount}/${progress.totalKeywords} completed, ${progress.failedCount} failed`);
      }

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < keywordsToProcess.length) {
        await sleep(1000);
      }
    }

    // Calculate overall statistics
    const allMaterialResults = results.flatMap(r => r.processedMaterials);
    const overallCounts = {
      YES: allMaterialResults.filter(r => r.ai_conclusion === 'YES').length,
      NO: allMaterialResults.filter(r => r.ai_conclusion === 'NO').length,
      SLIT: allMaterialResults.filter(r => r.ai_conclusion === 'SLIT').length
    };
    const aiProcessed = results.filter(r => r.processingMethod === 'ai').length;
    const ruleProcessed = results.filter(r => r.processingMethod === 'rule-based').length;

    // Print summary
    console.log('\n');
    console.log('='.repeat(60));
    console.log('📊 PROCESSING SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total substrate families: ${progress.totalKeywords}`);
    console.log(`✅ Successfully processed: ${progress.completedCount}`);
    console.log(`❌ Failed: ${progress.failedCount}`);
    console.log(`⏱️  Duration: ${calculateDuration(progress.startTime)}`);
    console.log('');
    console.log('📈 CONCLUSION BREAKDOWN:');
    console.log(`   ✅ YES (replenishment needed): ${overallCounts.YES}`);
    console.log(`   ⚪ NO (stock sufficient): ${overallCounts.NO}`);
    console.log(`   🔀 SLIT (SKU conversion): ${overallCounts.SLIT}`);
    console.log('');
    console.log('🤖 PROCESSING METHOD:');
    console.log(`   🤖 AI-processed families: ${aiProcessed}`);
    console.log(`   📊 Rule-based families: ${ruleProcessed}`);

    if (progress.failedKeywords.length > 0) {
      console.log('');
      console.log(`\n⚠️  Failed keywords:`);
      progress.failedKeywords.forEach(k => console.log(`   - ${k}`));
    }

    console.log('\n✨ Batch processing complete!');

    // Exit cleanly
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Process a single substrate family
 */
async function processKeyword(
  keyword: string,
  materials: StockMaterial[],
  systemPrompt: string,
  selectedModel: string,
  db: Firestore
): Promise<ProcessingResult> {
  const startTime = Date.now();

  try {
    console.log(`\n🔄 Processing ${keyword} (${materials.length} materials)...`);

    // Process through AI or rule-based logic
    const materialResults = await processSubstrateFamily(keyword, materials, systemPrompt, selectedModel);

    // Show AI reasoning (first 300 chars of free text from first material)
    if (materialResults.length > 0 && materialResults[0].ai_output_text) {
      const reasoning = extractAIReasoning(materialResults[0].ai_output_text);
      if (reasoning) {
        console.log(`  💭 AI Reasoning: ${reasoning}`);
      }
    }

    // Show results
    const conclusionCounts = {
      YES: materialResults.filter(r => r.ai_conclusion === 'YES').length,
      NO: materialResults.filter(r => r.ai_conclusion === 'NO').length,
      SLIT: materialResults.filter(r => r.ai_conclusion === 'SLIT').length
    };

    console.log(`  📊 Results: YES=${conclusionCounts.YES}, NO=${conclusionCounts.NO}, SLIT=${conclusionCounts.SLIT}`);

    // Show individual material results if small number
    if (materialResults.length <= 5) {
      materialResults.forEach(result => {
        const icon = result.ai_conclusion === 'YES' ? '✅' : result.ai_conclusion === 'SLIT' ? '🔀' : '⚪';
        console.log(`     ${icon} ${result.material_id}: ${result.ai_conclusion}`);
      });
    }

    // Update Firestore (unless dry run)
    if (!DRY_RUN) {
      await updateFirestore(materials, materialResults, db);
      console.log(`  💾 Updated Firestore`);
    } else {
      console.log(`  🔍 DRY RUN - Skipped Firestore update`);
    }

    const duration = Date.now() - startTime;
    console.log(`  ⏱️  Completed in ${duration}ms`);

    return {
      keyword,
      materialCount: materials.length,
      success: true,
      processedMaterials: materialResults,
      timestamp: new Date().toISOString(),
      processingMethod: materialResults[0]?.processing_method || 'ai'
    };
  } catch (error: any) {
    console.error(`  ❌ Error processing ${keyword}:`, error.message);
    throw error;
  }
}

/**
 * Update Firestore with AI results
 * - Material level: ai_conclusion only
 * - Header level: ai_conclusion, ai_output_text, ai_processed_at, ai_model, processing_method
 */
async function updateFirestore(
  materials: StockMaterial[],
  results: MaterialResult[],
  db: Firestore
): Promise<void> {
  const batch = writeBatch(db);
  let updateCount = 0;

  // Determine header-level conclusion (priority: YES > SLIT > NO)
  const hasYes = results.some(r => r.ai_conclusion === 'YES');
  const hasSlit = results.some(r => r.ai_conclusion === 'SLIT');
  const headerConclusion = hasYes ? 'YES' : hasSlit ? 'SLIT' : 'NO';

  // Get header-level metadata from first result (all should be the same)
  const firstResult = results[0];
  if (!firstResult) {
    console.warn('  ⚠️  No results to update');
    return;
  }

  // Group results by docId to batch updates per document
  const resultsByDoc = new Map<string, MaterialResult[]>();
  for (const result of results) {
    const material = materials.find(m => m.material_id === result.material_id);
    if (!material || !material.docId) {
      console.warn(`  ⚠️  Material ${result.material_id} not found or missing docId`);
      continue;
    }

    if (!resultsByDoc.has(material.docId)) {
      resultsByDoc.set(material.docId, []);
    }
    resultsByDoc.get(material.docId)!.push(result);
  }

  // Update each document
  for (const [docId, docResults] of resultsByDoc.entries()) {
    const docRef = doc(db, 'stock_management', docId);
    const docSnapshot = await getDoc(docRef);
    const docData = docSnapshot.data();

    if (docData?.materials && Array.isArray(docData.materials)) {
      // New structure: update materials array and add header-level fields
      const updatedMaterials = docData.materials.map((material: any) => {
        const result = docResults.find(r => r.material_id === material.material_id);
        if (result) {
          // Add only ai_conclusion at material level
          return {
            ...material,
            ai_conclusion: result.ai_conclusion
          };
        }
        return material;
      });

      // Update document with both material-level and header-level data
      batch.update(docRef, {
        materials: updatedMaterials,
        // Header-level AI fields
        ai_conclusion: headerConclusion,
        ai_output_text: firstResult.ai_output_text,
        ai_processed_at: firstResult.ai_processed_at,
        ai_model: firstResult.ai_model,
        processing_method: firstResult.processing_method
      });
      updateCount++;
    } else {
      // Old structure: update document directly with all fields
      // (no header/material distinction in old structure)
      for (const result of docResults) {
        batch.update(docRef, {
          ai_conclusion: result.ai_conclusion,
          ai_output_text: result.ai_output_text,
          ai_processed_at: result.ai_processed_at,
          ai_model: result.ai_model,
          processing_method: result.processing_method
        });
        updateCount++;
      }
    }
  }

  if (updateCount > 0) {
    await batch.commit();
  }
}

/**
 * Save progress to file
 */
async function saveProgress(progress: ProgressState): Promise<void> {
  await writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

/**
 * Calculate duration in human-readable format
 */
function calculateDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const duration = now - start;

  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Extract AI reasoning text from output (before JSON block)
 */
function extractAIReasoning(outputText: string): string | null {
  // Extract text before the JSON code block
  const beforeJson = outputText.split('```json')[0];

  if (!beforeJson || beforeJson.trim().length < 10) {
    return null;
  }

  // Clean up and truncate
  const cleaned = beforeJson
    .trim()
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .substring(0, 300);

  return cleaned + (beforeJson.length > 300 ? '...' : '');
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the batch processor
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
