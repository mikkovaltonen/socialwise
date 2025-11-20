/**
 * LSNotifications Component
 * Displays list of child welfare notifications (Lastensuojeluhakemukset)
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileText, Loader2, ChevronRight } from 'lucide-react';
import type { LSNotification } from '@/data/ls-types';
import LSNotificationDialog from '../LSNotificationDialog';
import { generateIlmoitusSummaries } from '@/lib/aineistoParser';
import { preprocessMarkdownForDisplay } from '@/lib/utils';

interface LSNotificationsProps {
  notifications: LSNotification[];
  clientId?: string;
  onRefresh?: () => void;
}

export const LSNotifications: React.FC<LSNotificationsProps> = ({ notifications, clientId = 'malliasiakas', onRefresh }) => {
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [processedNotifications, setProcessedNotifications] = useState<LSNotification[]>([]);
  const [isGeneratingSummaries, setIsGeneratingSummaries] = useState(false);

  // Get current notification from processedNotifications (always fresh)
  const selectedNotification = selectedNotificationId
    ? processedNotifications.find(n => n.id === selectedNotificationId) || null
    : null;

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
    // Jos päivämäärä on placeholder ja LLM on vielä analysoimassa, näytä "Ladataan..."
    if (dateStr === '1900-01-01') {
      return isGeneratingSummaries ? 'Ladataan...' : 'Ei päivämäärää';
    }
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

  const handleNotificationDialogSaved = () => {
    console.log('🔄 [LSNotifications] handleNotificationDialogSaved - closing dialog and refreshing');
    setSelectedNotificationId(null);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Lastensuojeluhakemukset</CardTitle>
            {isGeneratingSummaries && (
              <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-2" />
            )}
            <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {processedNotifications.length} kpl
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[280px] pr-4">
            {processedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <FileText className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500 mb-2">Ei lastensuojeluilmoituksia</p>
                <p className="text-xs text-gray-400">Luo uusi ilmoitus "Luo uusi asiakirja" -painikkeesta</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedNotificationId(notification.id)}
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
                          Ilmoittaja: {notification.reporterSummary || notification.reporter.profession}
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
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* LS Notification Dialog */}
      <LSNotificationDialog
        open={selectedNotification !== null}
        onClose={() => setSelectedNotificationId(null)}
        document={selectedNotification}
        clientId={clientId}
        onSaved={handleNotificationDialogSaved}
      />
    </>
  );
};
