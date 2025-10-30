/**
 * Configuration and Type Definitions for Batch Processing
 */

export type LLMModel = 'x-ai/grok-4-fast' | 'google/gemini-2.5-flash' | 'google/gemini-2.5-pro';

/**
 * LLM Model to use for AI processing
 * Change this to use a different model
 */
export const DEFAULT_LLM_MODEL: LLMModel = 'x-ai/grok-4-fast';

export interface StockMaterial {
  id: string;
  docId?: string;  // Firestore document ID (optional, added during loading)
  material_id: string;
  supplier_keyword: string;
  keyword: string;
  width: string;
  length: string;
  ref_at_supplier: string;
  description: string;
  lead_time: string;
  safety_stock: number;
  total_stock: number;
  reservations: number;
  final_stock: number;
  expected_date: string;
  historical_slit: string;
}

export interface ProcessingResult {
  keyword: string;
  materialCount: number;
  success: boolean;
  error?: string;
  processedMaterials: MaterialResult[];
  timestamp: string;
  processingMethod: 'ai' | 'rule-based';
}

export interface MaterialResult {
  material_id: string;
  ai_conclusion: 'YES' | 'NO' | 'SLIT';
  ai_output_text: string;
  ai_processed_at: string;
  ai_model: string;
  processing_method: 'ai' | 'rule-based';
}

export interface BatchConfig {
  concurrentRequests: number;
  retryAttempts: number;
  retryDelay: number;
  requestTimeout: number;
  saveProgressInterval: number;
}

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  concurrentRequests: 5, // Process 5 substrate families at once
  retryAttempts: 3,
  retryDelay: 2000, // 2 seconds
  requestTimeout: 30000, // 30 seconds
  saveProgressInterval: 10 // Save progress every 10 families
};

export interface ProgressState {
  processedKeywords: string[];
  failedKeywords: string[];
  totalKeywords: number;
  startTime: string;
  lastUpdateTime: string;
  completedCount: number;
  failedCount: number;
}
