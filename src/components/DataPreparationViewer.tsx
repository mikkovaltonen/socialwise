import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileText, Activity, AlertCircle } from "lucide-react";
import MarkdownEditor from './MarkdownEditor';

const DataPreparationViewer = () => {
  const [specificationsContent, setSpecificationsContent] = useState<string>("");
  const [summaryContent, setSummaryContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch functional specifications
        const specsResponse = await fetch('/Data_preparation/data_prep.md');
        if (specsResponse.ok) {
          const specsText = await specsResponse.text();
          setSpecificationsContent(specsText);
        } else {
          console.warn('Specifications not found');
          setSpecificationsContent('# Functional Specifications\n\nDocument not found. Ensure `data_prep.md` is in the Data_preparation folder.');
        }

        // Fetch latest execution log
        const summaryResponse = await fetch('/Data_preparation/migration-run-report.md');
        if (summaryResponse.ok) {
          const summaryText = await summaryResponse.text();
          setSummaryContent(summaryText);
        } else {
          console.warn('Run log not found');
          setSummaryContent('# CRM Data Migration - Run Log\n\nNo execution log available yet. Run the migration script to generate this file.');
        }

      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documentation. Please check that the files exist in the Data_preparation folder.');
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-3 text-gray-600">Loading documentation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Error Loading Documentation</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Latest Execution
          </TabsTrigger>
          <TabsTrigger value="specifications" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Specifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={summaryContent}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="CRM Data Migration - Run Log"
                minHeight="600px"
                placeholder="No execution log available yet. Run the migration script to generate this file."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="specifications" className="mt-0">
          <Card>
            <CardContent className="p-6">
              <MarkdownEditor
                value={specificationsContent}
                onChange={() => {}} // Read-only
                readOnly={true}
                label="CRM Data Preparation - Functional Specifications"
                minHeight="600px"
                placeholder="Document not found. Ensure data_prep.md is in the Data_preparation folder."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataPreparationViewer;
