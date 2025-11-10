/**
 * PTA Component
 * Displays PTA (Palvelusuunnitelma/Service Plan) records
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
import { ClipboardList, ChevronRight, Lightbulb } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  // Sort by date descending and take recent 10
  const recentRecords = [...ptaRecords]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            <CardTitle>PTA</CardTitle>
            <span className="ml-auto text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">
              {ptaRecords.length} kirjausta
            </span>
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
                        <p className="text-sm text-gray-800 line-clamp-2">
                          {record.summary}
                        </p>

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

      {/* Full Record Dialog */}
      <Dialog
        open={selectedRecord !== null}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRecord && eventTypeLabels[selectedRecord.eventType]} -{' '}
              {selectedRecord && formatDate(selectedRecord.date)}
            </DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              {/* AI Guidance */}
              {selectedRecord.aiGuidance && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-yellow-700" />
                    <span className="text-sm font-semibold text-yellow-900">
                      AI-ohjaus
                    </span>
                  </div>
                  <p className="text-sm text-yellow-800">
                    {selectedRecord.aiGuidance}
                  </p>
                </div>
              )}

              {/* Actions */}
              {selectedRecord.actions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Toimenpiteet:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedRecord.actions.map((action, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Full Text */}
              <div className="prose prose-sm max-w-none">
                <h4 className="text-sm font-semibold mb-2">Täysi kirjaus:</h4>
                <ReactMarkdown>{selectedRecord.fullText}</ReactMarkdown>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
