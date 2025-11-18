/**
 * ContentArea
 *
 * Main content wrapper with scrollable area for case information cards
 * Demo version: Single client (Lapsi 1) - no client selection
 */

import React from 'react';
import { PageHeader } from './PageHeader';
import { ClientSummary } from '../Sidebar/ClientSummary';
import type { ClientBasicInfo } from '@/types/client';

interface ContentAreaProps {
  children: React.ReactNode;
  clientName?: string;
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  onClientCreated?: () => void;
  availableClients: ClientBasicInfo[];
  isLoadingClients?: boolean;
  clientSummary?: {
    mainProblems: string;
    timePeriod: string;
    isLoading: boolean;
    error?: string;
  };
}

export const ContentArea: React.FC<ContentAreaProps> = ({
  children,
  clientName,
  selectedClientId,
  onClientChange,
  onClientCreated,
  availableClients,
  isLoadingClients = false,
  clientSummary,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-10 space-y-8">
        {/* Page Header */}
        <PageHeader
          clientName={clientName}
          selectedClientId={selectedClientId}
          onClientChange={onClientChange}
          onClientCreated={onClientCreated}
          availableClients={availableClients}
          isLoadingClients={isLoadingClients}
        />

        {/* Client Summary below header */}
        {clientName && clientSummary && (
          <ClientSummary
            clientName={clientName}
            mainProblems={clientSummary.mainProblems}
            timePeriod={clientSummary.timePeriod}
            isLoading={clientSummary.isLoading}
            error={clientSummary.error}
          />
        )}

        {/* Content Cards */}
        <div className="space-y-8">{children}</div>
      </div>
    </div>
  );
};

export default ContentArea;
