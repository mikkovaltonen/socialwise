/**
 * CaseNotes Component
 * Displays case notes with notification grounds and keywords
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { StickyNote, Plus, ChevronRight } from 'lucide-react';
import { DocumentViewDialog } from '../DocumentViewDialog';
import type { CaseNote } from '@/data/ls-types';

interface CaseNotesProps {
  caseNotes: CaseNote[];
  clientId?: string;
  onRefresh?: () => void;
}

export const CaseNotes: React.FC<CaseNotesProps> = ({ caseNotes, clientId = 'malliasiakas', onRefresh }) => {
  const [selectedNote, setSelectedNote] = useState<CaseNote | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  // Sort by date descending
  const sortedNotes = [...caseNotes].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            <CardTitle>Asiakaskirjaukset</CardTitle>
            <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {caseNotes.length} kpl
            </span>
          </div>
        </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          {sortedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <StickyNote className="h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm text-gray-500 mb-2">Ei asiakaskirjauksia</p>
              <p className="text-xs text-gray-400">Luo uusi asiakaskirjaus "Luo uusi asiakirja" -painikkeesta</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedNotes.map((note) => (
                <div
                  key={note.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedNote(note)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {formatDate(note.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-800">
                        {note.summary || 'Ei yhteenvetoa'}
                      </p>
                      {note.keywords && note.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {note.keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-800"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>

    {/* Document View Dialog */}
    <DocumentViewDialog
      open={selectedNote !== null}
      onClose={() => setSelectedNote(null)}
      documentType="asiakaskirjaus"
      document={selectedNote ? {
        fullText: selectedNote.fullText,
        filename: (selectedNote as any).filename, // CaseNote might have optional filename
        date: selectedNote.date,
        updatedBy: selectedNote.updatedBy,
        updatedAt: selectedNote.updatedAt,
      } : null}
      clientId={clientId}
      onSaved={() => {
        setSelectedNote(null);
        if (onRefresh) {
          onRefresh();
        }
      }}
    />
    </>
  );
};
