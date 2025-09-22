import { useState, useCallback } from 'react';
import { 
  searchSupplierData, 
  searchForGemini, 
  getCategories, 
  getCategorySpendAnalysis,
  SearchFilters,
  SearchResult 
} from '../lib/supplierSearch';

export function useSupplierSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [summary, setSummary] = useState<any>(null);

  const search = useCallback(async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    try {
      const { results, summary } = await searchSupplierData(filters);
      setResults(results);
      setSummary(summary);
      return { results, summary };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchForLLM = useCallback(async (
    mainCategory?: string,
    subCategory?: string,
    topN: number = 10
  ) => {
    setLoading(true);
    setError(null);
    try {
      const formattedResults = await searchForGemini(mainCategory, subCategory, topN);
      return formattedResults;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const categories = await getCategories();
      return categories;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load categories';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeSpending = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await getCategorySpendAnalysis();
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    results,
    summary,
    search,
    searchForLLM,
    loadCategories,
    analyzeSpending
  };
}