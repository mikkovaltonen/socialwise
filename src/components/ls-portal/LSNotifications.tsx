/**
 * LSNotifications Component
 * Displays list of child welfare notifications (Lastensuojeluilmoitukset)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { FileText, ChevronDown, ChevronUp, AlertTriangle, Plus, Loader2, ChevronRight, Calendar, User, Users, Phone, Mail, MapPin, X, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { LSNotification } from '@/data/ls-types';
import MarkdownDocumentEditor from '../MarkdownDocumentEditor';
import { generateIlmoitusSummaries } from '@/lib/aineistoParser';
import { preprocessMarkdownForDisplay } from '@/lib/utils';

// Custom components for ReactMarkdown to preserve line breaks
const markdownComponents = {
  p: ({ children }: any) => <p style={{ whiteSpace: 'pre-line' }}>{children}</p>,
};
import { deleteMarkdownFile } from '@/lib/aineistoStorageService';

interface LSNotificationsProps {
  notifications: LSNotification[];
}

export const LSNotifications: React.FC<LSNotificationsProps> = ({ notifications }) => {
  const [selectedNotification, setSelectedNotification] = useState<LSNotification | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [processedNotifications, setProcessedNotifications] = useState<LSNotification[]>([]);
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<LSNotification | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Generoi yhteenvetoja ilmoituksille kun ne muuttuvat
  useEffect(() => {
    const generateSummaries = async () => {
      if (notifications.length === 0) return;

      // Tarkista onko yhteenvetoja jo generoitu
      const needsSummaryGeneration = notifications.some(n => n.summary === 'Ladataan yhteenvetoa...' || !n.summary);

      if (!needsSummaryGeneration) {
        setProcessedNotifications(notifications);
        return;
      }

      setIsGeneratingSummaries(true);
      try {
        // Aseta placeholder yhteenveto ilmoituksille jotka tarvitsevat sitä
        const notificationsWithPlaceholders = notifications.map(n => ({
          ...n,
          summary: n.summary || 'Ladataan yhteenvetoa...'
        }));

        setProcessedNotifications(notificationsWithPlaceholders);

        // Generoi yhteenvetoja LLM:llä
        const updatedNotifications = await generateIlmoitusSummaries(notificationsWithPlaceholders);
        setProcessedNotifications(updatedNotifications);
      } catch (error) {
        console.error('Error generating notification summaries:', error);
        // Fallback: käytä alkuperäisiä ilmoituksia
        setProcessedNotifications(notifications);
      } finally {
        setIsGeneratingSummaries(false);
      }
    };

    generateSummaries();
  }, [notifications]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fi-FI');
  };

  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'kriittinen':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'kiireellinen':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normaali':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ei_kiireellinen':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'kriittinen':
        return 'Kriittinen';
      case 'kiireellinen':
        return 'Kiireellinen';
      case 'normaali':
        return 'Normaali';
      case 'ei_kiireellinen':
        return 'Ei kiireellinen';
      default:
        return '';
    }
  };

  const handleDeleteNotification = async () => {
    if (!notificationToDelete) return;

    setIsDeleting(true);
    try {
      // Poista tiedosto Firebase Storagesta
      const filename = notificationToDelete.filename;
      const success = await deleteMarkdownFile(`LS-ilmoitukset/${filename}`);

      if (success) {
        // Päivitä lista poistamalla ilmoitus
        setProcessedNotifications(prev =>
          prev.filter(n => n.id !== notificationToDelete.id)
        );
        setSelectedNotification(null);
        setShowDeleteDialog(false);
        setNotificationToDelete(null);
      } else {
        console.error('Failed to delete notification file');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Lastensuojeluilmoitukset</CardTitle>
            {isGeneratingSummaries && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-2" />
            )}
            <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {processedNotifications.length} kpl
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
              {processedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedNotification(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {formatDate(notification.date)}
                        </span>
                        {notification.urgency && (
                          <span
                            className={`text-xs px-2 py-0.5 rounded border ${getUrgencyColor(notification.urgency)}`}
                          >
                            {getUrgencyLabel(notification.urgency)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">
                        Ilmoittaja: {notification.reporter.profession}
                      </div>
                      <p className="text-sm text-gray-800 line-clamp-2">
                        {notification.summary === 'Ladataan yhteenvetoa...' && (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-600 flex-shrink-0 inline mr-1" />
                        )}
                        <span className={notification.summary === 'Ladataan yhteenvetoa...' ? 'text-blue-600 italic' : ''}>
                          {notification.summary}
                        </span>
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Full Notification Dialog */}
      <Dialog
        open={selectedNotification !== null}
        onOpenChange={(open) => !open && setSelectedNotification(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <DialogTitle className="text-2xl">
                    Lastensuojeluilmoitus
                  </DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4" />
                    {selectedNotification && formatDate(selectedNotification.date)}
                    {selectedNotification?.urgency && (
                      <Badge
                        variant="secondary"
                        className={`ml-2 ${getUrgencyColor(selectedNotification.urgency)}`}
                      >
                        {getUrgencyLabel(selectedNotification.urgency)}
                      </Badge>
                    )}
                  </DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedNotification(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-6 mt-4">
              {/* Summary Section */}
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Yhteenveto
                  </h3>
                  <p className="text-sm text-orange-800">{selectedNotification.summary}</p>
                </CardContent>
              </Card>

              {/* Reporter Info */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Ilmoittaja
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Nimi:</span>
                      <p className="text-gray-900">{selectedNotification.reporter.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Ammatti:</span>
                      <p className="text-gray-900">{selectedNotification.reporter.profession}</p>
                    </div>
                    {selectedNotification.reporter.isOfficial && (
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-xs">
                          Viranomainen
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Child Info */}
              <Card>
                <CardContent className="pt-6">
                  <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Lapsi
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Nimi:</span>
                      <p className="text-gray-900">{selectedNotification.child.name}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Henkilötunnus:</span>
                      <p className="text-gray-900">{selectedNotification.child.socialSecurityNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Osoite:</span>
                      <p className="text-gray-900">{selectedNotification.child.address}</p>
                    </div>
                    {selectedNotification.child.school && (
                      <div>
                        <span className="font-medium text-gray-600">Koulu:</span>
                        <p className="text-gray-900">{selectedNotification.child.school}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Guardians Info */}
              {(selectedNotification.guardians.mother || selectedNotification.guardians.father) && (
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Huoltajat
                    </h4>
                    <div className="space-y-4">
                      {selectedNotification.guardians.mother && (
                        <div className="border-l-2 border-blue-200 pl-4">
                          <h5 className="font-medium text-blue-900 mb-2">Äiti</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Nimi:</span>
                              <p className="text-gray-900">{selectedNotification.guardians.mother.name}</p>
                            </div>
                            {selectedNotification.guardians.mother.socialSecurityNumber && (
                              <div>
                                <span className="font-medium text-gray-600">Henkilötunnus:</span>
                                <p className="text-gray-900">{selectedNotification.guardians.mother.socialSecurityNumber}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {selectedNotification.guardians.father && (
                        <div className="border-l-2 border-green-200 pl-4">
                          <h5 className="font-medium text-green-900 mb-2">Isä</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-600">Nimi:</span>
                              <p className="text-gray-900">{selectedNotification.guardians.father.name}</p>
                            </div>
                            {selectedNotification.guardians.father.socialSecurityNumber && (
                              <div>
                                <span className="font-medium text-gray-600">Henkilötunnus:</span>
                                <p className="text-gray-900">{selectedNotification.guardians.father.socialSecurityNumber}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Highlights */}
              {selectedNotification.highlights && selectedNotification.highlights.length > 0 && (
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="pt-6">
                    <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Keskeiset huolet
                    </h4>
                    <div className="space-y-2">
                      {selectedNotification.highlights.map((highlight, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 bg-white border border-orange-200 rounded-lg p-3"
                        >
                          <AlertTriangle className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-orange-800 italic">
                            {highlight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Separator />

              {/* Full Document */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Täydellinen ilmoitus
                </h3>
                <Card>
                  <CardContent className="pt-6">
             <div className="prose prose-sm max-w-none">
               <ReactMarkdown components={markdownComponents}>{selectedNotification.fullText}</ReactMarkdown>
             </div>
                  </CardContent>
                </Card>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setNotificationToDelete(selectedNotification);
                    setShowDeleteDialog(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Poista ilmoitus
                </Button>
                <Button variant="outline" onClick={() => setSelectedNotification(null)}>
                  Sulje
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Poista lastensuojeluilmoitus</AlertDialogTitle>
            <AlertDialogDescription>
              Oletko varma että haluat poistaa tämän ilmoituksen? Tätä toimintoa ei voi peruuttaa.
              {notificationToDelete && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">
                    {formatDate(notificationToDelete.date)} - {notificationToDelete.reporter.profession}
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Peruuta
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteNotification}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Poistetaan...' : 'Poista'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
