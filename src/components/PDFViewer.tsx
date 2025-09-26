import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Download, ExternalLink, AlertCircle } from 'lucide-react';

interface PDFViewerProps {
  pdfPath: string;
  title?: string;
  description?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({
  pdfPath,
  title = 'PDF Document',
  description
}) => {
  const [loadError, setLoadError] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfPath;
    link.download = pdfPath.split('/').pop() || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfPath, '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
        </CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>

          {/* PDF Embed */}
          {!loadError ? (
            <div className="w-full border rounded-lg overflow-hidden">
              <embed
                src={pdfPath}
                type="application/pdf"
                className="w-full"
                style={{ height: '600px' }}
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to display PDF in browser. Please use the buttons above to open or download the document.
              </AlertDescription>
            </Alert>
          )}

          {/* Fallback message for browsers that don't support embed */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If the PDF doesn't display properly, you can open it in a new tab or download it using the buttons above.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};