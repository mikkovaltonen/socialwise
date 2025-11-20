/**
 * Decisions Component
 * Displays legal decisions made in the case
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Scale, ChevronRight, Calendar, FileText, X, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Decision } from '@/data/ls-types';
import MarkdownDocumentEditor from '../MarkdownDocumentEditor';
import { preprocessMarkdownForDisplay } from '@/lib/utils';

// Custom components for ReactMarkdown to preserve line breaks
const markdownComponents = {
  p: ({ children }: any) => <p style={{ whiteSpace: 'pre-line' }}>{children}</p>,
};

interface DecisionsProps {
  decisions: Decision[];
  clientId?: string;
  onRefresh?: () => void;
}

const decisionTypeLabels: Record<Decision['decisionType'], string> = {
  asiakkuuden_avaaminen: 'Asiakkuuden avaaminen',
  asiakkuuden_paattyminen: 'Asiakkuus päättyy',
  selvitys_aloitetaan: 'Selvitys aloitetaan',
  kiireellinen_sijoitus: 'Kiireellinen sijoitus',
  avohuollon_tukitoimi: 'Avohuollon tukitoimi',
  muu: '',
};

const decisionTypeColors: Record<Decision['decisionType'], string> = {
  asiakkuuden_avaaminen: 'bg-blue-100 text-blue-800 border-blue-300',
  asiakkuuden_paattyminen: 'bg-orange-100 text-orange-800 border-orange-300',
  selvitys_aloitetaan: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  kiireellinen_sijoitus: 'bg-red-100 text-red-800 border-red-300',
  avohuollon_tukitoimi: 'bg-green-100 text-green-800 border-green-300',
  muu: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const Decisions: React.FC<DecisionsProps> = ({ decisions, clientId = 'malliasiakas', onRefresh }) => {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  const handleEdit = () => {
    console.log('🔵 [Decisions] handleEdit called - opening editor');
    console.log('  - selectedDecision.filename:', selectedDecision?.filename);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    console.log('🔵 [Decisions] handleEditorClose called');
    setShowEditor(false);
    // Refresh data even if editor was closed without saving
    if (onRefresh) {
      console.log('🔄 [Decisions] Calling onRefresh from handleEditorClose');
      onRefresh();
    }
  };

  const handleEditorSaved = () => {
    console.log('🔵 [Decisions] handleEditorSaved called from MarkdownDocumentEditor');
    console.log('  - closing editor');
    setShowEditor(false);
    console.log('  - closing decision dialog');
    setSelectedDecision(null);
    if (onRefresh) {
      console.log('🔄 [Decisions] Calling onRefresh from handleEditorSaved');
      onRefresh();
    }
  };

  const handleDecisionDialogClose = () => {
    console.log('🔵 [Decisions] handleDecisionDialogClose called');
    setSelectedDecision(null);
    // Refresh data when decision dialog is closed
    if (onRefresh) {
      console.log('🔄 [Decisions] Calling onRefresh from handleDecisionDialogClose');
      onRefresh();
    }
  };

  // Sort by date descending
  const sortedDecisions = [...decisions].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            <CardTitle>Päätökset</CardTitle>
            <span className="ml-auto text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
              {decisions.length} kpl
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[220px] pr-4">
            {sortedDecisions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <Scale className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-2">Ei päätöksiä</p>
                <p className="text-xs text-gray-400">Luo uusi päätös "Luo uusi asiakirja" -painikkeesta</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedDecisions.map((decision, index) => {
                  const typeLabel = decisionTypeLabels[decision.decisionType];
                  const typeColor = decisionTypeColors[decision.decisionType];
                  // Use summary if typeLabel is empty
                  const displayText = typeLabel || decision.summary || 'Päätös';

                  return (
                    <div
                      key={`${decision.id}-${index}`}
                      className={`border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all ${typeColor}`}
                      onClick={() => setSelectedDecision(decision)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">
                            {formatDate(decision.date)}
                          </span>
                          {displayText && (
                            <>
                              <span className="text-sm">-</span>
                              <span className="text-sm font-bold line-clamp-1">
                                {displayText}
                              </span>
                            </>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Decision Dialog */}
      <Dialog
        open={selectedDecision !== null}
        onOpenChange={(open) => {
          if (!open) handleDecisionDialogClose();
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Scale className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    Päätös
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {selectedDecision && formatDate(selectedDecision.date)}
                    {selectedDecision && (
                      <Badge variant="secondary" className="ml-2">
                        {decisionTypeLabels[selectedDecision.decisionType]}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleDecisionDialogClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedDecision && (() => {
            console.log('🔍 [Decisions] Rendering decision dialog:', {
              id: selectedDecision.id,
              hasSummary: !!selectedDecision.summary,
              summaryLength: selectedDecision.summary?.length || 0,
              summaryPreview: selectedDecision.summary?.substring(0, 50) || '(empty)',
              hasHighlights: !!selectedDecision.highlights,
              highlightsCount: selectedDecision.highlights?.length || 0
            });
            return null;
          })()}

          {selectedDecision && (
            <div className="space-y-6 mt-4">
              {/* Summary Section */}
              {selectedDecision.summary && selectedDecision.summary.trim() !== '' && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Yhteenveto
                    </h3>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{selectedDecision.summary}</p>
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {selectedDecision.highlights && selectedDecision.highlights.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Scale className="h-4 w-4" />
                      Päätöksen perustelut
                    </h4>
                    <div className="space-y-2">
                      {selectedDecision.highlights.map((highlight, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 bg-white border border-blue-200 rounded-lg p-3"
                        >
                          <Scale className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-blue-800 italic">
                            {highlight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Full Document */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Täydellinen päätös
                </h3>
                <Card>
                  <CardContent className="pt-6">
             <div className="prose prose-sm max-w-none">
               <ReactMarkdown components={markdownComponents}>{selectedDecision.fullText}</ReactMarkdown>
             </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleEdit}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  MUOKKAA
                </Button>
                <Button variant="outline" onClick={() => setSelectedDecision(null)}>
                  Sulje
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      {selectedDecision && (
        <MarkdownDocumentEditor
          open={showEditor}
          onClose={handleEditorClose}
          documentType="päätös"
          clientId={clientId}
          existingContent={selectedDecision.fullText}
          existingFilename={selectedDecision.filename}
          onSaved={handleEditorSaved}
        />
      )}
    </>
  );
};
