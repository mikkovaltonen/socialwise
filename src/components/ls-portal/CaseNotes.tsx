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
          <div className="space-y-2">
            {sortedNotes.map((note) => (
              <div
                key={note.id}
                className="flex gap-2 text-sm text-gray-800 leading-relaxed"
              >
                <span className="text-purple-600 font-bold">•</span>
                <span>
                  <span className="font-semibold">{formatDate(note.date)}</span>
                  {' - '}
                  {note.notificationGround}
                </span>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
