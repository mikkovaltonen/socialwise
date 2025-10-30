# Demand Manager - Mass Processing

Batch processing system for analyzing all substrate families in the `stock_management` collection using AI and rule-based logic.

## Overview

This tool processes substrate families through the same AI logic used in the Chat UI, extracting conclusions and storing them back into Firestore. It's designed to handle 1000+ substrate families efficiently with retry logic, progress tracking, and resume capability.

## Features

✅ **Intelligent Processing**
- Single-material families: Rule-based decision (final_stock vs safety_stock)
- Multi-material families: AI analysis via OpenRouter API

✅ **Robust Error Handling**
- Automatic retry on API failures (3 attempts)
- Resume from last saved progress
- Detailed error logging

✅ **Progress Tracking**
- Real-time progress updates
- Saved progress state (every 10 batches)
- Duration tracking and ETA

✅ **Shared Business Logic**
- Uses same `/public/system_prompt.md` as Chat UI
- Identical AI processing logic
- Consistent results across UI and batch processing

## Installation

```bash
cd mass_processing
npm install
```

## Configuration

The system uses credentials from the parent `.env` file:

```env
# Required
VITE_OPEN_ROUTER_API_KEY=sk-or-v1-...
VITE_FIREBASE_PROJECT_ID=your-project-id
FIRESTORE_USER=your-email@domain.com
FIRESTORE_PW=your-password
```

### LLM Model Selection

The LLM model is configured in `/mass_processing/config.ts`:

```typescript
export const DEFAULT_LLM_MODEL: LLMModel = 'x-ai/grok-4-fast';
```

**Available Models:**
- `x-ai/grok-4-fast` (Grok 4 Fast - **default**, fast and cost-effective)
- `google/gemini-2.5-flash` (Gemini 2.5 Flash)
- `google/gemini-2.5-pro` (Gemini 2.5 Pro - highest quality)

**To change the model:** Edit `config.ts` and change the `DEFAULT_LLM_MODEL` value.

### Processing Settings

Default configuration in `config.ts`:

```typescript
{
  concurrentRequests: 5,        // Process 5 families at once
  retryAttempts: 3,              // Retry failed requests 3 times
  retryDelay: 2000,              // 2 seconds between retries
  requestTimeout: 30000,         // 30 second timeout per request
  saveProgressInterval: 10       // Save progress every 10 batches
}
```

## Usage

### 1. Dry Run (Recommended First Step)

Test without writing to the database:

```bash
npm run dry-run
```

This will:
- Load all substrate families
- Process through AI/rule-based logic
- Show what would be written
- **Not update Firestore**

**Filter by specific substrate family:**

```bash
npm run dry-run _MAD_GR_0209
```

This processes only the specified substrate family in dry-run mode.

### 2. Production Run

Process all families and update Firestore:

```bash
npm run process
```

**Process only a specific substrate family:**

```bash
npm run process _MAD_GR_0209
```

This is useful for:
- Testing AI logic on a single family before full batch run
- Reprocessing a family after prompt changes
- Debugging specific substrate families

### 3. Resume from Failure

If the process is interrupted, resume from last saved state:

```bash
npm run resume
```

**Note:** The resume command does not support substrate family filtering, as it continues from saved progress.

### Command Quick Reference

```bash
# Process everything
npm run process

# Dry run everything
npm run dry-run

# Process single substrate family
npm run process _MAD_GR_0209

# Dry run single substrate family
npm run dry-run _3M_ADH_1102

# Resume from interruption
npm run resume
```

**Filter Validation:**
If you specify a substrate family that doesn't exist, the script will:
- Show an error message
- List the first 20 available substrate families
- Exit without processing

## How It Works

### Processing Logic

```
For each substrate family:
  │
  ├─ Load materials from stock_management collection
  │
  ├─ Check material count:
  │  │
  │  ├─ Case 1: Single Material (1 material)
  │  │   │
  │  │   └─ Rule-based decision
  │  │       ├─ final_stock < safety_stock → YES (replenishment needed)
  │  │       └─ final_stock >= safety_stock → NO (stock sufficient)
  │  │
  │  └─ Case 2: Multiple Materials (2+ materials)
  │      │
  │      ├─ Check stock status for ALL materials:
  │      │   │
  │      │   ├─ All materials: final_stock >= safety_stock?
  │      │   │   │
  │      │   │   └─ YES → Rule-based: Mark ALL as NO (no action needed)
  │      │   │             ⚡ Skip AI processing (optimization)
  │      │   │
  │      │   └─ NO (at least one material with final_stock < safety_stock)
  │      │       │
  │      │       └─ AI Analysis (SKU conversion planning)
  │      │           ├─ Load system_prompt.md
  │      │           ├─ Build JSON context with all materials
  │      │           ├─ Call OpenRouter API (Grok 4 Fast)
  │      │           └─ Parse Conclusion: YES / NO / SLIT
  │
  └─ Update Firestore with results
```

### Database Updates

The batch processor updates documents with AI fields at two levels:

**Header Level (Substrate Family Document):**
```typescript
{
  ai_conclusion: "YES" | "NO" | "SLIT",  // Overall decision (priority: YES > SLIT > NO)
  ai_output_text: string,                 // AI reasoning text only (JSON blocks replaced with "...")
  ai_processed_at: "2025-10-30T...",     // ISO timestamp
  ai_model: string,                       // Model name or "rule-based"
  processing_method: "ai" | "rule-based" // How it was processed
}
```

**Note:** The `ai_output_text` field contains only the AI's reasoning text. All JSON code blocks are automatically stripped and replaced with "..." to save storage space and improve readability.

**Material Level (Individual Materials):**
```typescript
{
  ai_conclusion: "YES" | "NO" | "SLIT"   // Individual material decision
}
```

The header-level `ai_conclusion` is determined by priority:
- **YES** if any material needs replenishment
- **SLIT** if any material needs SKU conversion (and none need replenishment)
- **NO** if all materials have sufficient stock

### Data Structure Support

The system handles both old and new Firestore structures:

**New Structure (Recommended):**
```javascript
{
  // Document ID = substrate family keyword (e.g., "_MAD_GR_0209")

  // Header-level AI fields
  ai_conclusion: "YES",              // Overall family conclusion
  ai_output_text: "Analyzed 3 materials in substrate family _MAD_GR_0209...\n\nRecommendations: Material 100906 requires replenishment due to low stock. Materials 100907 and 100908 can be converted via slitting.\n\n...",
  ai_processed_at: "2025-10-30T12:34:56.789Z",
  ai_model: "x-ai/grok-4-fast",
  processing_method: "ai",

  // Materials array
  materials: [
    {
      material_id: "100906",
      width: "50 mm",
      final_stock: 1200,
      safety_stock: 1000,
      ai_conclusion: "YES",          // Individual material conclusion
      // ... other material fields
    },
    {
      material_id: "100907",
      width: "75 mm",
      final_stock: 800,
      safety_stock: 500,
      ai_conclusion: "NO",
      // ... other material fields
    }
    // ... more materials
  ]
}
```

**Old Structure (Legacy):**
```javascript
{
  // Each document is a single material
  material_id: "100906",
  keyword: "_MAD_GR_0209",
  width: "50 mm",
  ai_conclusion: "YES",
  ai_output_text: "Rule-based decision for 100906:\n- Final Stock: 800\n- Safety Stock: 1000\n- Decision: YES (Replenishment needed)",
  ai_processed_at: "2025-10-30T12:34:56.789Z",
  ai_model: "rule-based",
  processing_method: "rule-based",
  // ... other fields
}
```

**Note:** In the new structure, AI metadata is stored at the header level for efficiency, while each material gets its individual `ai_conclusion`.

## Output

### Console Output

```
🚀 Demand Manager Batch Processor
=====================================
Mode: PRODUCTION
Resume: No

🔌 Connecting to Firestore...
✅ Connected to Firestore

📄 Loading system prompt...
✅ System prompt loaded

🤖 LLM Model: x-ai/grok-4-fast

🔍 Loading substrate families...
✅ Found 1000 unique substrate families
📊 Total materials: 3500

📋 Processing 1000 substrate families...

📦 Processing batch 1/200 (5 families)
────────────────────────────────────────────────────────

🔄 Processing _MAD_GR_0209 (3 materials)...
  🤖 Multiple materials (3), calling AI with model: x-ai/grok-4-fast
  💾 Updated Firestore
  ⏱️  Completed in 2341ms
  ✅ _MAD_GR_0209: 3 materials processed

🔄 Processing _3M_ADH_1102 (1 materials)...
  📊 Single material detected, using rule-based decision
  💾 Updated Firestore
  ⏱️  Completed in 142ms
  ✅ _3M_ADH_1102: 1 materials processed

...

💾 Progress saved: 50/1000 completed, 2 failed

============================================================
📊 PROCESSING SUMMARY
============================================================
Total substrate families: 1000
✅ Successfully processed: 998
❌ Failed: 2
⏱️  Duration: 2h 15m

📈 CONCLUSION BREAKDOWN:
   ✅ YES (replenishment needed): 450
   ⚪ NO (stock sufficient): 320
   🔀 SLIT (SKU conversion): 228

🤖 PROCESSING METHOD:
   🤖 AI-processed families: 650
   📊 Rule-based families: 348

⚠️  Failed keywords:
   - _FAILED_FAMILY_1
   - _FAILED_FAMILY_2

✨ Batch processing complete!
```

**Note:** All results are saved directly to the `stock_management` collection in Firestore. Each material document is updated with AI conclusions and metadata fields.

### Progress File

Location: `./progress.json`

```json
{
  "processedKeywords": ["_MAD_GR_0209", "_3M_ADH_1102", ...],
  "failedKeywords": ["_FAILED_FAMILY_1"],
  "totalKeywords": 1000,
  "startTime": "2025-10-30T10:00:00.000Z",
  "lastUpdateTime": "2025-10-30T12:34:56.789Z",
  "completedCount": 998,
  "failedCount": 2
}
```

## Performance Estimates

Based on typical API response times:

| Scenario | Materials | Time per Family | 1000 Families |
|----------|-----------|-----------------|---------------|
| Rule-based (1 material) | 1 | ~100ms | ~2 minutes |
| AI analysis (2-5 materials) | 2-5 | ~2-4s | ~45-75 minutes |
| AI analysis (6+ materials) | 6+ | ~5-10s | ~90-180 minutes |

**Mixed workload estimate:** 1.5 - 3 hours for 1000 families

## Troubleshooting

### API Rate Limiting

**Error:** `429 Too Many Requests`

**Solution:** The system automatically retries with exponential backoff. If persistent:
1. Reduce `concurrentRequests` in `config.ts` (e.g., from 5 to 3)
2. Increase `retryDelay` (e.g., from 2000 to 5000)

### Permission Errors

**Error:** `Permission denied` or `Firestore security rules`

**Solution:**
1. Verify FIRESTORE_USER has admin permissions
2. Consider using service account: Set `GOOGLE_APPLICATION_CREDENTIALS` in .env

### Out of Memory

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run process
```

### Resume Not Working

**Solution:**
1. Check `progress.json` exists
2. Manually edit to remove problematic keywords
3. Run `npm run resume`

## Architecture

```
mass_processing/
├── config.ts              # Types and configuration
├── firebaseAdmin.ts       # Firestore connection
├── aiProcessor.ts         # AI logic (shared with UI)
├── batchProcessor.ts      # Main orchestration
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── progress.json          # Resume state (generated)
```

## Integration with Chat UI

The batch processor uses the **exact same business logic** as the Chat UI:

| Component | Chat UI | Batch Processor |
|-----------|---------|-----------------|
| System Prompt | `/public/system_prompt.md` | `/public/system_prompt.md` |
| Context Builder | `buildStockContext()` | `buildStockContext()` |
| API Call | OpenRouter API | OpenRouter API |
| Response Parser | `parseAIResponse()` | `parseAIResponse()` |
| Single Material Logic | N/A | Rule-based (new) |

**Result:** Identical conclusions whether processed through UI or batch script.

## Development

### Build TypeScript

```bash
npm run build
```

### Run with ts-node

```bash
npm run start
```

### Test Changes

1. Modify code
2. Run dry-run to verify
3. Test with small subset (edit batchProcessor.ts line ~167)

```typescript
// Process only first 10 families for testing
const keywordsToProcess = allKeywords.slice(0, 10);
```

## Next Steps

After batch processing completes:

1. **Verify Results**
   ```sql
   -- Check distribution of conclusions
   SELECT ai_conclusion, COUNT(*)
   FROM stock_management
   GROUP BY ai_conclusion;
   ```

2. **Analyze Failed Families**
   - Check `progress.json` for `failedKeywords`
   - Review error logs
   - Manually process if needed

3. **Update UI**
   - Chat UI will now show `ai_conclusion` badges
   - Add filtering by conclusion (YES/NO/SLIT)
   - Display `ai_output_text` in tooltips

4. **Schedule Regular Updates**
   - Set up cron job (e.g., weekly)
   - Only process new/changed families
   - Send notification on completion

## License

MIT
