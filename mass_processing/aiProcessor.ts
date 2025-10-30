/**
 * AI Processing Module
 * Handles OpenRouter API calls and response parsing
 */

import fetch from 'node-fetch';
import { readFile, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { StockMaterial, MaterialResult, DEFAULT_LLM_MODEL } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OPENROUTER_API_KEY = process.env.VITE_OPEN_ROUTER_API_KEY || '';
const SYSTEM_PROMPT_PATH = resolve(__dirname, '../public/system_prompt.md');

/**
 * Load system prompt from /public/system_prompt.md
 */
export async function loadSystemPrompt(): Promise<string> {
  try {
    const prompt = await readFile(SYSTEM_PROMPT_PATH, 'utf-8');
    console.log(`📄 Loaded system prompt (${prompt.length} chars)`);
    return prompt;
  } catch (error) {
    console.error('❌ Failed to load system prompt:', error);
    throw new Error('Could not load system_prompt.md');
  }
}

/**
 * Build context JSON from stock materials
 */
export function buildStockContext(materials: StockMaterial[]): string {
  const context = materials.map(m => ({
    material_id: m.material_id,
    supplier_keyword: m.supplier_keyword,
    keyword: m.keyword,
    width: m.width,
    length: m.length,
    ref_at_supplier: m.ref_at_supplier,
    description: m.description,
    lead_time: m.lead_time,
    safety_stock: m.safety_stock,
    total_stock: m.total_stock,
    reservations: m.reservations,
    final_stock: m.final_stock,
    expected_date: m.expected_date,
    historical_slit: m.historical_slit
  }));

  return JSON.stringify(context, null, 2);
}

/**
 * Call OpenRouter API with retry logic
 */
export async function callOpenRouterAPI(
  systemPrompt: string,
  userMessage: string,
  model: string = DEFAULT_LLM_MODEL,
  retryCount: number = 0,
  maxRetries: number = 3
): Promise<string> {
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://demandmanager-f3efd.firebaseapp.com',
        'X-Title': 'DemandManager Batch Processor'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Retry on 503 or 429 errors
      if ((response.status === 503 || response.status === 429) && retryCount < maxRetries) {
        const delay = 2000 * (retryCount + 1);
        console.log(`⏳ API error ${response.status}, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
        await sleep(delay);
        return callOpenRouterAPI(systemPrompt, userMessage, model, retryCount + 1, maxRetries);
      }

      throw new Error(`OpenRouter API error ${response.status}: ${errorText}`);
    }

    const data: any = await response.json();

    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      throw new Error('Invalid API response structure');
    }

    const content = data.choices[0].message?.content;
    if (!content) {
      throw new Error('No content in API response');
    }

    return content;
  } catch (error: any) {
    // Retry on network errors
    if (retryCount < maxRetries && error.message.includes('fetch')) {
      const delay = 2000 * (retryCount + 1);
      console.log(`⏳ Network error, retrying in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
      await sleep(delay);
      return callOpenRouterAPI(systemPrompt, userMessage, model, retryCount + 1, maxRetries);
    }

    throw error;
  }
}

/**
 * Strip JSON blocks from text and replace with "..."
 */
export function stripJSONFromText(text: string): string {
  // Remove JSON code blocks (```json ... ```)
  let cleaned = text.replace(/```json\s*[\s\S]*?\s*```/g, '...');

  // Remove standalone JSON blocks (```... ```) as fallback
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '...');

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n\n+/g, '\n\n').trim();

  return cleaned;
}

/**
 * Parse AI response to extract Conclusion field and full text
 */
export function parseAIResponse(response: string, materials: StockMaterial[], model?: string): MaterialResult[] {
  const results: MaterialResult[] = [];
  const now = new Date().toISOString();
  const usedModel = model || DEFAULT_LLM_MODEL;

  try {
    // Extract JSON from markdown code block
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);

    if (!jsonMatch) {
      console.warn('⚠️  No JSON block found in response');
      console.warn('   Response preview:', response.substring(0, 200) + '...');
      // Fallback: return NO for all materials
      return materials.map(m => ({
        material_id: m.material_id,
        ai_conclusion: 'NO' as const,
        ai_output_text: stripJSONFromText(response),
        ai_processed_at: now,
        ai_model: usedModel,
        processing_method: 'ai' as const
      }));
    }

    const jsonText = jsonMatch[1];
    let parsed;

    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.error('❌ JSON Parse Error:', parseError.message);
      console.error('   Failed JSON (first 500 chars):', jsonText.substring(0, 500));
      console.error('   Error position:', parseError.message.match(/position (\d+)/)?.[1] || 'unknown');

      // Save to debug file
      const debugFile = resolve(__dirname, `debug_json_${Date.now()}.txt`);
      writeFile(debugFile, `Error: ${parseError.message}\n\nFull Response:\n${response}\n\nExtracted JSON:\n${jsonText}`)
        .then(() => console.error(`   💾 Full response saved to: ${debugFile}`))
        .catch(err => console.error(`   ⚠️  Could not save debug file:`, err.message));

      // Fallback: return NO for all materials
      return materials.map(m => ({
        material_id: m.material_id,
        ai_conclusion: 'NO' as const,
        ai_output_text: `JSON Parse Error: ${parseError.message}\n\n${stripJSONFromText(response)}`,
        ai_processed_at: now,
        ai_model: usedModel,
        processing_method: 'ai' as const
      }));
    }

    // Handle array of materials
    const materialsArray = Array.isArray(parsed) ? parsed : [parsed];

    materialsArray.forEach((item: any) => {
      const materialId = item['Material ID']?.['example value'] || item['Material ID']?.value || '';
      const conclusion = (item['Conclusion']?.['example value'] || item['Conclusion']?.value || 'NO').toUpperCase();

      // Validate conclusion
      const validConclusion = ['YES', 'NO', 'SLIT'].includes(conclusion) ? conclusion : 'NO';

      results.push({
        material_id: materialId,
        ai_conclusion: validConclusion as 'YES' | 'NO' | 'SLIT',
        ai_output_text: stripJSONFromText(response),
        ai_processed_at: now,
        ai_model: usedModel,
        processing_method: 'ai'
      });
    });

    return results;
  } catch (error) {
    console.error('❌ Failed to parse AI response:', error);
    // Fallback: return NO for all materials
    return materials.map(m => ({
      material_id: m.material_id,
      ai_conclusion: 'NO' as const,
      ai_output_text: stripJSONFromText(response),
      ai_processed_at: now,
      ai_model: usedModel,
      processing_method: 'ai' as const
    }));
  }
}

/**
 * Simple rule-based decision for single-material families
 * If final_stock < safety_stock, conclusion is YES, otherwise NO
 */
export function makeRuleBasedDecision(material: StockMaterial): MaterialResult {
  const now = new Date().toISOString();
  const conclusion = material.final_stock < material.safety_stock ? 'YES' : 'NO';

  const outputText = `Rule-based decision for ${material.material_id}:
- Final Stock: ${material.final_stock}
- Safety Stock: ${material.safety_stock}
- Decision: ${conclusion} (${conclusion === 'YES' ? 'Replenishment needed' : 'Stock sufficient'})`;

  return {
    material_id: material.material_id,
    ai_conclusion: conclusion,
    ai_output_text: outputText,
    ai_processed_at: now,
    ai_model: 'rule-based',
    processing_method: 'rule-based'
  };
}

/**
 * Process a substrate family through AI or rule-based logic
 */
export async function processSubstrateFamily(
  keyword: string,
  materials: StockMaterial[],
  systemPrompt: string,
  model?: string
): Promise<MaterialResult[]> {
  const selectedModel = model || DEFAULT_LLM_MODEL;

  // Rule 1: If only 1 material, use simple rule-based decision
  if (materials.length === 1) {
    console.log(`  📊 Single material detected, using rule-based decision`);
    return [makeRuleBasedDecision(materials[0])];
  }

  // Rule 2: If ALL materials have sufficient stock, skip AI processing
  const allStockSufficient = materials.every(m => m.final_stock >= m.safety_stock);

  if (allStockSufficient) {
    console.log(`  ⚡ All materials have sufficient stock (final >= safety), skipping AI`);
    const now = new Date().toISOString();

    return materials.map(m => ({
      material_id: m.material_id,
      ai_conclusion: 'NO' as const,
      ai_output_text: `Rule-based decision (multi-material optimization):\n- All ${materials.length} materials in family have sufficient stock\n- Material ${m.material_id}: Final Stock (${m.final_stock}) >= Safety Stock (${m.safety_stock})\n- Decision: NO action needed`,
      ai_processed_at: now,
      ai_model: 'rule-based',
      processing_method: 'rule-based'
    }));
  }

  // Rule 3: Multiple materials with potential stockouts, use AI
  console.log(`  🤖 Multiple materials (${materials.length}) with potential stockouts, calling AI with model: ${selectedModel}`);

  const contextJSON = buildStockContext(materials);
  const response = await callOpenRouterAPI(systemPrompt, contextJSON, selectedModel);

  return parseAIResponse(response, materials, selectedModel);
}

/**
 * Sleep helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
