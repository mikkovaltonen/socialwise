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
import { Scale, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Decision } from '@/data/ls-types';

interface DecisionsProps {
  decisions: Decision[];
}

const decisionTypeLabels: Record<Decision['decisionType'], string> = {
  asiakkuuden_avaaminen: 'Asiakkuuden avaaminen',
  kiireellinen_sijoitus: 'Kiireellinen sijoitus',
  avohuollon_tukitoimi: 'Avohuollon tukitoimi',
  muu: 'Muu päätös',
};

const decisionTypeColors: Record<Decision['decisionType'], string> = {
  asiakkuuden_avaaminen: 'bg-blue-100 text-blue-800 border-blue-300',
  kiireellinen_sijoitus: 'bg-red-100 text-red-800 border-red-300',
  avohuollon_tukitoimi: 'bg-green-100 text-green-800 border-green-300',
  muu: 'bg-gray-100 text-gray-800 border-gray-300',
};

export const Decisions: React.FC<DecisionsProps> = ({ decisions }) => {
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);

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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">
                            {formatDate(decision.date)}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-white/60 rounded border border-current">
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {decision.summary}
                        </p>
                        {decision.legalBasis && (
                          <p className="text-xs opacity-80">
                            {decision.legalBasis}
                          </p>
                        )}
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
    </>
  );
};
