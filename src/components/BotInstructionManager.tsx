/**
 * Bot Instruction Manager
 *
 * Admin-komponenti chatbotin PDF-ohjeiden hallintaan:
 * - Lataa PDF-tiedostoja
 * - Parsii tekstiksi ja konvertoi markdown-muotoon
 * - Näyttää token-laskurin ja % of 1M context
 * - Toggle active/inactive
 * - Poista dokumentteja
 */

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Eye, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  uploadPDFInstruction,
  getAllInstructions,
  toggleInstructionActive,
  deleteInstruction,
  calculateTokenCount,
  calculatePercentOfContext,
  getTotalActiveTokens,
  type InstructionDocument,
} from '@/lib/pdfInstructionService';

export const BotInstructionManager: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<InstructionDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<InstructionDocument | null>(null);
  const [totalStats, setTotalStats] = useState({
    totalTokens: 0,
    percentOfContext: 0,
    activeCount: 0,
  });

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [parsedText, setParsedText] = useState('');
  const [tokenCount, setTokenCount] = useState(0);
  const [percentOfContext, setPercentOfContext] = useState(0);

  // Load documents on mount
  useEffect(() => {
    loadDocuments();
    loadTotalStats();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await getAllInstructions();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Virhe ladattaessa dokumentteja');
    } finally {
      setLoading(false);
    }
  };

  const loadTotalStats = async () => {
    try {
      const stats = await getTotalActiveTokens();
      setTotalStats(stats);
    } catch (error) {
      console.error('Error loading total stats:', error);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Vain PDF-tiedostot sallittu');
      return;
    }

    setSelectedFile(file);

    // Show file size
    const sizeMB = (file.size / 1024 / 1024).toFixed(2);
    toast.info(`Tiedosto valittu: ${file.name} (${sizeMB} MB)`);

    // Parse PDF immediately to show preview
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const cleanText = text.substring(0, 5000); // Preview first 5000 chars
        setParsedText(cleanText);

        const tokens = calculateTokenCount(cleanText);
        const percent = calculatePercentOfContext(tokens);
        setTokenCount(tokens);
        setPercentOfContext(percent);
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Error previewing PDF:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) {
      toast.error('Valitse tiedosto ensin');
      return;
    }

    setLoading(true);
    try {
      const result = await uploadPDFInstruction(
        selectedFile,
        user.uid,
        user.email || undefined,
        description
      );

      if (result.success) {
        toast.success('Dokumentti ladattu onnistuneesti!');
        setUploadDialogOpen(false);
        resetUploadForm();
        loadDocuments();
        loadTotalStats();
      } else {
        toast.error(`Lataus epäonnistui: ${result.error}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Lataus epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedFile(null);
    setDescription('');
    setParsedText('');
    setTokenCount(0);
    setPercentOfContext(0);
  };

  const handleToggleActive = async (docId: string, currentActive: boolean) => {
    try {
      const success = await toggleInstructionActive(docId, !currentActive);
      if (success) {
        toast.success(`Dokumentti ${!currentActive ? 'aktivoitu' : 'deaktivoitu'}`);
        loadDocuments();
        loadTotalStats();
      } else {
        toast.error('Tilan vaihto epäonnistui');
      }
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Tilan vaihto epäonnistui');
    }
  };

  const handleDelete = async (docId: string, storagePath: string, filename: string) => {
    if (!confirm(`Haluatko varmasti poistaa dokumentin "${filename}"?`)) {
      return;
    }

    try {
      const result = await deleteInstruction(docId, storagePath);
      if (result.success) {
        toast.success('Dokumentti poistettu');
        loadDocuments();
        loadTotalStats();
      } else {
        toast.error(`Poisto epäonnistui: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Poisto epäonnistui');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Chatbotin Lisäohjeet</h2>
          <p className="text-sm text-gray-600">
            Lataa PDF-dokumentteja chatbotin kontekstiin (esim. lainsäädäntö, politiikat)
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Lataa PDF
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lataa PDF-ohje</DialogTitle>
              <DialogDescription>
                Lataa PDF-tiedosto, joka parsitaan tekstiksi ja lisätään chatbotin kontekstiin.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* File Input */}
              <div className="space-y-2">
                <Label htmlFor="pdf-file">PDF-tiedosto</Label>
                <Input
                  id="pdf-file"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  disabled={loading}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Kuvaus (valinnainen)</Label>
                <Textarea
                  id="description"
                  placeholder="Esim. Lastensuojelulaki 2007"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  rows={2}
                />
              </div>

              {/* Token Counter */}
              {selectedFile && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div><strong>Tiedosto:</strong> {selectedFile.name}</div>
                      <div><strong>Tokenit:</strong> ~{tokenCount.toLocaleString()}</div>
                      <div>
                        <strong>Konteksti-ikkuna:</strong>{' '}
                        <span className={percentOfContext > 50 ? 'text-red-600 font-bold' : 'text-green-600'}>
                          {percentOfContext}%
                        </span>
                        {' '}of 1M tokens
                      </div>
                      {percentOfContext > 50 && (
                        <div className="text-red-600 text-sm mt-2">
                          ⚠️ Varoitus: Dokumentti käyttää yli 50% konteksti-ikkunasta!
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    resetUploadForm();
                  }}
                  disabled={loading}
                >
                  Peruuta
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || loading}>
                  {loading ? 'Ladataan...' : 'Lataa'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Aktiivisten Ohjeiden Tilasto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Aktiivisia dokumentteja</div>
              <div className="text-2xl font-bold">{totalStats.activeCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Tokenien määrä</div>
              <div className="text-2xl font-bold">{totalStats.totalTokens.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Konteksti-ikkunasta</div>
              <div className={`text-2xl font-bold ${totalStats.percentOfContext > 50 ? 'text-red-600' : 'text-green-600'}`}>
                {totalStats.percentOfContext}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumentit ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Ladataan dokumentteja...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Ei dokumentteja. Lataa ensimmäinen PDF yllä.</div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-4 ${doc.active ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold">{doc.originalFilename}</h3>
                        {doc.active && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                            Aktiivinen
                          </span>
                        )}
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>{doc.tokenCount.toLocaleString()} tokensia</span>
                        <span>{doc.percentOfContext}% of 1M</span>
                        <span>
                          {doc.createdAt && typeof doc.createdAt.toDate === 'function'
                            ? doc.createdAt.toDate().toLocaleDateString('fi-FI')
                            : 'N/A'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Preview Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewDoc(doc)}
                        title="Esikatsele"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      {/* Toggle Active */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(doc.id!, doc.active)}
                        title={doc.active ? 'Deaktivoi' : 'Aktivoi'}
                      >
                        {doc.active ? (
                          <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(doc.id!, doc.storagePath, doc.originalFilename)}
                        title="Poista"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewDoc?.originalFilename}</DialogTitle>
            <DialogDescription>
              {previewDoc?.tokenCount.toLocaleString()} tokensia ({previewDoc?.percentOfContext}% of 1M)
            </DialogDescription>
          </DialogHeader>
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
              {previewDoc?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BotInstructionManager;
