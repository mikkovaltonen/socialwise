import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubstrateFamilySelectorProps {
  onFamilySelected: (keyword: string, records: any[]) => void;
  disabled?: boolean;
}

export function SubstrateFamilySelector({ onFamilySelected, disabled }: SubstrateFamilySelectorProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('');
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    loadUniqueKeywords();
  }, []);

  const loadUniqueKeywords = async () => {
    setLoading(true);
    try {
      const stockRef = collection(db, 'stock_management');
      const snapshot = await getDocs(stockRef);

      const keywordSet = new Set<string>();

      // New structure: Each document ID is the keyword (substrate family)
      snapshot.forEach((doc) => {
        const data = doc.data();
        // In new structure, document ID is the keyword
        if (data.materials && Array.isArray(data.materials)) {
          keywordSet.add(doc.id);
        } else if (data.keyword) {
          // Fallback for old structure
          keywordSet.add(data.keyword);
        }
      });

      const sortedKeywords = Array.from(keywordSet).sort();
      setKeywords(sortedKeywords);

      if (sortedKeywords.length === 0) {
        toast.error('No substrate families found in database');
      }
    } catch (error) {
      console.error('Error loading keywords:', error);
      toast.error('Failed to load substrate families');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFamily = async () => {
    if (!selectedKeyword) {
      toast.error('Please select a substrate family');
      return;
    }

    setLoadingRecords(true);
    try {
      const stockRef = collection(db, 'stock_management');
      const q = query(stockRef, where('keyword', '==', selectedKeyword));
      const snapshot = await getDocs(q);

      const records: any[] = [];

      // New structure: Each document contains a materials array
      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.materials && Array.isArray(data.materials)) {
          // New structure: extract materials from the array
          data.materials.forEach((material: any, index: number) => {
            records.push({
              id: `${doc.id}_${index}`,
              keyword: selectedKeyword,
              ...material
            });
          });
        } else {
          // Fallback for old structure (flat documents)
          records.push({
            id: doc.id,
            ...data
          });
        }
      });

      if (records.length === 0) {
        toast.error(`No records found for ${selectedKeyword}`);
        return;
      }

      onFamilySelected(selectedKeyword, records);
      toast.success(`Loaded ${records.length} material${records.length > 1 ? 's' : ''} for ${selectedKeyword}`);
    } catch (error) {
      console.error('Error loading family records:', error);
      toast.error('Failed to load substrate family data');
    } finally {
      setLoadingRecords(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center space-y-2">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-blue-600" />
            <p className="text-sm text-gray-600">Loading substrate families...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Package className="h-5 w-5" />
          Select Substrate Family
        </CardTitle>
        <CardDescription className="text-blue-700">
          Choose a substrate family to analyze stock management data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Substrate Family ({keywords.length} available)
          </label>
          <Select
            value={selectedKeyword}
            onValueChange={setSelectedKeyword}
            disabled={disabled || loadingRecords}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue placeholder="Select a substrate family..." />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {keywords.map((keyword) => (
                <SelectItem key={keyword} value={keyword}>
                  {keyword}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleLoadFamily}
          disabled={!selectedKeyword || disabled || loadingRecords}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loadingRecords ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading Records...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Load Substrate Family
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
