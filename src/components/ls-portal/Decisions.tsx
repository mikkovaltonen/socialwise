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
import { Scale, ChevronRight, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Decision } from '@/data/ls-types';
import MarkdownDocumentEditor from '../MarkdownDocumentEditor';

interface DecisionsProps {
  decisions: Decision[];
}

const decisionTypeLabels: Record<Decision['decisionType'], string> = {
  asiakkuuden_avaaminen: 'Asiakkuuden avaaminen',
  asiakkuuden_paattyminen: 'Asiakkuus päättyy',
  selvitys_aloitetaan: 'Selvitys aloitetaan',
  kiireellinen_sijoitus: 'Kiireellinen sijoitus',
  avohuollon_tukitoimi: 'Avohuollon tukitoimi',
  muu: 'Muu päätös',
};

const decisionTypeColors: Record<Decision['decisionType'], string> = {
  asiakkuuden_avaaminen: 'bg-blue-100 text-blue-800 border-blue-300',
  asiakkuuden_paattyminen: 'bg-orange-100 text-orange-800 border-orange-300',
  selvitys_aloitetaan: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  kiireellinen_sijoitus: 'bg-red-100 text-red-800 border-red-300',
  avohuollon_tukitoimi: 'bg-green-100 text-green-800 border-green-300',
  muu: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const Decisions: React.FC<DecisionsProps> = ({ decisions }) => {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditor(true)}
              className="ml-2"
            >
              <Plus className="h-4 w-4 mr-1" />
              Lisää uusi
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[220px] pr-4">
            <div className="space-y-2">
              {sortedDecisions.map((decision, index) => {
                const typeLabel = decisionTypeLabels[decision.decisionType];
                const typeColor = decisionTypeColors[decision.decisionType];

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
                        <span className="text-sm">-</span>
                        <span className="text-sm font-bold">
                          {typeLabel}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 opacity-50 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Decision Dialog */}
      <Dialog
        open={selectedDecision !== null}
        onOpenChange={(open) => !open && setSelectedDecision(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDecision && decisionTypeLabels[selectedDecision.decisionType]} -{' '}
              {selectedDecision && formatDate(selectedDecision.date)}
            </DialogTitle>
          </DialogHeader>
          {selectedDecision && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{selectedDecision.fullText}</ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      <MarkdownDocumentEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        documentType="päätös"
        onSaved={() => {
          setShowEditor(false);
          // TODO: Refresh decisions list
        }}
      />
    </>
  );
};
