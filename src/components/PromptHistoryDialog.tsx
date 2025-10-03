/**
 * Prompt History Dialog Component
 * Displays version history and allows reverting to previous versions
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  getPromptHistory,
  getHistoryEntry,
  revertToHistoryVersion,
  formatHistoryDate,
  PromptHistoryEntry
} from '@/lib/promptHistoryService';
import { useAuth } from '@/hooks/useAuth';
import { Clock, User, MessageSquare, RotateCcw, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface PromptHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  version: 'production' | 'testing';
  onRevert?: () => void;
}

export function PromptHistoryDialog({
  open,
  onOpenChange,
  version,
  onRevert
}: PromptHistoryDialogProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<PromptHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PromptHistoryEntry | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [showRevertConfirm, setShowRevertConfirm] = useState(false);
  const [revertTarget, setRevertTarget] = useState<PromptHistoryEntry | null>(null);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, version]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const entries = await getPromptHistory(version);
      setHistory(entries);
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load version history');
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async () => {
    if (!revertTarget || !user) return;

    try {
      const success = await revertToHistoryVersion(
        revertTarget.id!,
        user.uid,
        user.email || ''
      );

      if (success) {
        toast.success('Successfully reverted to previous version');
        setShowRevertConfirm(false);
        setRevertTarget(null);
        onOpenChange(false);
        onRevert?.();
      } else {
        toast.error('Failed to revert to previous version');
      }
    } catch (error) {
      console.error('Error reverting:', error);
      toast.error('An error occurred while reverting');
    }
  };

  const toggleExpanded = (entryId: string) => {
    setExpandedEntry(expandedEntry === entryId ? null : entryId);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Version History - {version === 'production' ? 'Production' : 'Testing'}</DialogTitle>
            <DialogDescription>
              View and restore previous versions of the system prompt
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">Loading history...</div>
              </div>
            ) : history.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-gray-500">No version history available</div>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-4 space-y-3 hover:bg-gray-50 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm font-medium">
                            {formatHistoryDate(entry.createdOn)}
                          </span>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {entry.savedByEmail || 'Unknown user'}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                          <span className="text-sm text-gray-700">
                            {entry.versionComment}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleExpanded(entry.id!)}
                        >
                          {expandedEntry === entry.id ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Preview
                            </>
                          )}
                        </Button>
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRevertTarget(entry);
                              setShowRevertConfirm(true);
                            }}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Revert
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Content Preview */}
                    {expandedEntry === entry.id && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="bg-gray-50 rounded-md p-3">
                          <pre className="text-xs whitespace-pre-wrap font-mono text-gray-700 max-h-64 overflow-y-auto">
                            {entry.content}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Revert Confirmation Dialog */}
      <AlertDialog open={showRevertConfirm} onOpenChange={setShowRevertConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert to Previous Version?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace the current production prompt with the version from{' '}
              {revertTarget && formatHistoryDate(revertTarget.createdOn)}.
              <br /><br />
              <strong>Version comment:</strong> {revertTarget?.versionComment}
              <br /><br />
              The current version will be saved to history before reverting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert}>
              Revert to This Version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}