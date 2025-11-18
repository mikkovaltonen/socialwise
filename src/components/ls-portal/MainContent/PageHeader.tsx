/**
 * PageHeader
 *
 * Page header with dynamic client selection and new client creation
 */

import React, { useState } from 'react';
import { ClientSelector } from '../ClientSelector';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import ContactInfoEditor from '@/components/ContactInfoEditor';
import type { ClientBasicInfo } from '@/types/client';

interface PageHeaderProps {
  clientName?: string;
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  onClientCreated?: () => void;
  availableClients: ClientBasicInfo[];
  isLoadingClients?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  clientName,
  selectedClientId,
  onClientChange,
  onClientCreated,
  availableClients,
  isLoadingClients = false,
}) => {
  const [showNewClientDialog, setShowNewClientDialog] = useState(false);
  const [newClientId, setNewClientId] = useState('');

  const handleCreateNewClient = () => {
    // Generoi uusi clientId aikaleimalla
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const clientId = `client_${timestamp}_${randomSuffix}`;

    setNewClientId(clientId);
    setShowNewClientDialog(true);
  };

  const handleClientCreated = () => {
    setShowNewClientDialog(false);

    // Valitse juuri luotu asiakas
    if (newClientId) {
      onClientChange(newClientId);
    }

    // Päivitä asiakasvalinta
    if (onClientCreated) {
      onClientCreated();
    }
  };

  return (
    <>
      <div className="space-y-5">
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-900">
          Lastensuojelu ja perheiden palvelut
        </h1>

        {/* Client Selector + New Client Button */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Asiakas:</span>
          <ClientSelector
            selectedClientId={selectedClientId}
            onClientChange={onClientChange}
            clients={availableClients}
            isLoading={isLoadingClients}
          />
          <Button
            size="sm"
            variant="default"
            onClick={handleCreateNewClient}
            className="ml-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Uusi asiakas
          </Button>
        </div>
      </div>

      {/* New Client Dialog */}
      <ContactInfoEditor
        open={showNewClientDialog}
        onClose={() => setShowNewClientDialog(false)}
        clientId={newClientId}
        existingData={undefined}
        onSaved={handleClientCreated}
      />
    </>
  );
};

export default PageHeader;
