/**
 * ClientSelector Component
 *
 * Dropdown-valinta asiakkaille ASIAKAS_PERUSTIEDOT-kokoelmasta
 * Näyttää child.nimi kentän
 */

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ClientBasicInfo } from '@/types/client';
import { Loader2, Users } from 'lucide-react';

interface ClientSelectorProps {
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  clients: ClientBasicInfo[];
  isLoading?: boolean;
  className?: string;
}

export const ClientSelector: React.FC<ClientSelectorProps> = ({
  selectedClientId,
  onClientChange,
  clients,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Ladataan asiakkaita...</span>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Users className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Ei asiakkaita</span>
      </div>
    );
  }

  return (
    <Select value={selectedClientId} onValueChange={onClientChange}>
      <SelectTrigger className={`w-[280px] ${className}`}>
        <SelectValue placeholder="Valitse asiakas">
          {clients.find(c => c.clientId === selectedClientId)?.child?.nimi || selectedClientId}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {clients.map((client) => (
          <SelectItem key={client.clientId} value={client.clientId}>
            {client.child?.nimi || client.clientId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
