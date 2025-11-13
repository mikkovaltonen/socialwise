/**
 * LSNotifications Component
 * Displays list of child welfare notifications (Lastensuojeluilmoitukset)
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
import { FileText, ChevronDown, ChevronUp, AlertTriangle, Plus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { LSNotification } from '@/data/ls-types';
import MarkdownDocumentEditor from '../MarkdownDocumentEditor';

interface LSNotificationsProps {
  notifications: LSNotification[];
}

export const LSNotifications: React.FC<LSNotificationsProps> = ({ notifications }) => {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<LSNotification | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Lastensuojeluilmoitukset</CardTitle>
            <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {notifications.length} kpl
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
            <div className="space-y-3">
              {notifications.map((notification) => {
                const isExpanded = expanded === notification.id;

                return (
                  <div
                    key={notification.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Notification Header */}
                    <div
                      className="cursor-pointer"
                      onClick={() => setExpanded(isExpanded ? null : notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">
                              {formatDate(notification.date)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">
                            Ilmoittaja: {notification.reporter.profession}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700">
                            Keskeiset huolet:
                          </p>
                          {notification.highlights.length > 0 ? (
                            <ul className="mt-1 space-y-1">
                              {notification.highlights.map((highlight, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs text-gray-600 flex items-start gap-1"
                                >
                                  <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                  <span>{highlight}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-600 mt-1">
                              {notification.summary}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotification(notification);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Näytä koko ilmoitus →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Notification Dialog */}
      <Dialog
        open={selectedNotification !== null}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Lastensuojeluilmoitus -{' '}
              {selectedNotification && formatDate(selectedNotification.date)}
            </DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{selectedNotification.fullText}</ReactMarkdown>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Editor */}
      <MarkdownDocumentEditor
        open={showEditor}
        onClose={() => setShowEditor(false)}
        documentType="ls-ilmoitus"
        onSaved={() => {
          setShowEditor(false);
          // TODO: Refresh notifications list
        }}
      />
    </>
  );
};
