/**
 * CaseNotes Component
 * Displays case notes with notification grounds and keywords
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import type { CaseNote } from '@/data/ls-types';

interface CaseNotesProps {
  caseNotes: CaseNote[];
}

export const CaseNotes: React.FC<CaseNotesProps> = ({ caseNotes }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  // Sort by date descending
  const sortedNotes = [...caseNotes].sort((a, b) =>
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <CardTitle>Asiakaskirjaukset</CardTitle>
          <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
            {caseNotes.length} kpl
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] pr-4">
          <div className="space-y-3">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
              >
                {/* Date */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    {formatDate(note.date)}
                  </span>
                </div>

                {/* Notification Ground */}
                <div className="mb-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Ilmoitusperuste:
                  </p>
                  <p className="text-sm text-gray-800">{note.notificationGround}</p>
                </div>

                {/* Keywords */}
                {note.keywords.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Avainsanat:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {note.keywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
