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
  onRefresh?: () => void;
  clientId?: string;
}

export const PTA: React.FC<PTAProps> = ({ ptaRecords, onRefresh, clientId = 'malliasiakas' }) => {
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
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px] pr-4">
            {recentRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-2">Ei PTA-kirjauksia</p>
                <p className="text-xs text-gray-400">Luo uusi PTA "Luo uusi asiakirja" -painikkeesta</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentRecords.map((record, index) => {
                // Parse status from markdown content
                const statusMatch = record.fullText?.match(/<!--\s*STATUS:\s*(Kesken|Tulostettu)\s*-->/);
                const status = statusMatch ? statusMatch[1] : 'Kesken';
                const statusColor = status === 'Tulostettu'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-yellow-50 text-yellow-700 border-yellow-200';

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
                            className={`text-xs px-2 py-0.5 rounded border ${statusColor}`}
                          >
                            {status}
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
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full PTA Document Dialog */}
      <PTADocumentDialog
        open={selectedRecord !== null}
        onClose={() => {
          console.log('🔵 [PTA] PTADocumentDialog onClose called');
          setSelectedRecord(null);
        }}
        document={selectedRecord}
        clientId={clientId}
        onSaved={() => {
          console.log('🔵 [PTA] PTADocumentDialog onSaved called');
          console.log('  - clearing selectedRecord');
          setSelectedRecord(null);
          if (onRefresh) {
            console.log('🔄 [PTA] Calling onRefresh (loadClientData in LSPortal)');
            onRefresh();
          }
        }}
      />

      {/* Document Editor */}
      <MarkdownDocumentEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        documentType="pta"
        clientId={clientId}
        onSaved={() => {
          setShowEditor(false);
          if (onRefresh) onRefresh();
        }}
      />
    </>
  );
};
