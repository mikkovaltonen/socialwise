/**
 * CaseNotes Component
 * Displays case notes with notification grounds and keywords
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import MarkdownDocumentEditor from '../MarkdownDocumentEditor';
import type { CaseNote } from '@/data/ls-types';

interface CaseNotesProps {
  caseNotes: CaseNote[];
}

export const CaseNotes: React.FC<CaseNotesProps> = ({ caseNotes }) => {
  const [showEditor, setShowEditor] = useState(false);

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
            <FileText className="h-5 w-5" />
            <CardTitle>Asiakaskirjaukset</CardTitle>
            <span className="ml-auto text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {caseNotes.length} kpl
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

    {/* Document Editor */}
    <MarkdownDocumentEditor
      open={showEditor}
      onClose={() => setShowEditor(false)}
      documentType="asiakaskirjaus"
      onSaved={() => {
        setShowEditor(false);
        // TODO: Refresh case notes list
      }}
    />
    </>
  );
};
