/**
 * PTA Component
 * Displays PTA (Palvelutarpeen Arviointi) records
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ClipboardList, ChevronRight, Lightbulb, Loader2, Plus } from 'lucide-react';
import { PTADocumentDialog } from '@/components/PTADocumentDialog';
import MarkdownDocumentEditor from '../MarkdownDocumentEditor';
import type { PTARecord } from '@/data/ls-types';

interface PTAProps {
  ptaRecords: PTARecord[];
}

const eventTypeLabels: Record<PTARecord['eventType'], string> = {
  kotikäynti: 'Kotikäynti',
  puhelu: 'Puhelu',
  tapaaminen: 'Tapaaminen',
  neuvottelu: 'Neuvottelu',
  päätös: 'Päätös',
  muu: 'Muu',
};

const eventTypeColors: Record<PTARecord['eventType'], string> = {
  kotikäynti: 'bg-green-50 text-green-700 border-green-200',
  puhelu: 'bg-blue-50 text-blue-700 border-blue-200',
  tapaaminen: 'bg-purple-50 text-purple-700 border-purple-200',
  neuvottelu: 'bg-orange-50 text-orange-700 border-orange-200',
  päätös: 'bg-red-50 text-red-700 border-red-200',
  muu: 'bg-gray-50 text-gray-700 border-gray-200',
};

export const PTA: React.FC<PTAProps> = ({ ptaRecords }) => {
  const [selectedRecord, setSelectedRecord] = useState<PTARecord | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  // Sort by date descending and take recent 10
  const recentRecords = [...ptaRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  // Check if any summaries are still loading
  const isLoadingSummaries = ptaRecords.some(r => r.summary === 'Ladataan yhteenvetoa...');

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            <CardTitle>Palveluntarvearviointi</CardTitle>
            {isLoadingSummaries && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-2" />
            )}
            <span className="ml-auto text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
              {ptaRecords.length} kirjausta
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
          <ScrollArea className="h-[280px] pr-4">
            <div className="space-y-2">
              {recentRecords.map((record, index) => {
                const typeLabel = eventTypeLabels[record.eventType];
                const typeColor = eventTypeColors[record.eventType];

                return (
                  <div
                    key={`${record.id}-${index}`}
                    className="border border-gray-200 rounded-lg p-3 hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-gray-700">
                            {formatDate(record.date)}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${typeColor}`}
                          >
                            {typeLabel}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2 flex items-center gap-2">
                          {record.summary === 'Ladataan yhteenvetoa...' && (
                            <Loader2 className="h-3 w-3 animate-spin text-blue-600 flex-shrink-0" />
                          )}
                          <span className={record.summary === 'Ladataan yhteenvetoa...' ? 'text-blue-600 italic' : ''}>
                            {record.summary}
                          </span>
                        </p>

                        {/* Highlights */}
                        {record.highlights && record.highlights.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {record.highlights.slice(0, 2).map((highlight, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-1 bg-blue-50 border border-blue-200 rounded px-2 py-1"
                              >
                                <Lightbulb className="h-3 w-3 text-blue-600 flex-shrink-0 mt-0.5" />
                                <span className="text-xs text-blue-800 italic line-clamp-1">
                                  {highlight}
                                </span>
                              </div>
                            ))}
                            {record.highlights.length > 2 && (
                              <p className="text-xs text-gray-500 italic">
                                +{record.highlights.length - 2} muuta korostusta...
                              </p>
                            )}
                          </div>
                        )}

                        {/* AI Guidance Indicator */}
                        {record.aiGuidance && (
                          <div className="flex items-center gap-1 mt-2">
                            <Lightbulb className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs text-yellow-700">
                              Sisältää AI-ohjausta
                            </span>
                          </div>
                        )}

                        {/* Actions Preview */}
                        {record.actions.length > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            {record.actions.length} toimenpidettä
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full PTA Document Dialog */}
      <PTADocumentDialog
        open={selectedRecord !== null}
        onClose={() => setSelectedRecord(null)}
        document={selectedRecord}
      />

      {/* Document Editor */}
      <MarkdownDocumentEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        documentType="pta"
        onSaved={() => {
          setShowEditor(false);
          // TODO: Refresh PTA records list
        }}
      />
    </>
  );
};
