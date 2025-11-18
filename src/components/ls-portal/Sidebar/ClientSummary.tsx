/**
 * ClientSummary
 *
 * Displays a concise summary of the client's situation:
 * - Client name
 * - Main problems
 * - Time period
 */

import React from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface ClientSummaryProps {
  clientName: string;
  mainProblems?: string;
  timePeriod?: string;
  isLoading?: boolean;
  error?: string;
}

export const ClientSummary: React.FC<ClientSummaryProps> = ({
  clientName,
  mainProblems,
  timePeriod,
  isLoading = false,
  error,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Generoidaan tiivistelmää...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Virhe tiivistelmässä</span>
        </div>
      )}

      {/* Summary Content */}
      {!isLoading && !error && mainProblems && (
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium text-gray-700 shrink-0">
              {clientName ? `${clientName} - Tiivistelmä:` : 'Tiivistelmä:'}
            </span>
            <p className="text-sm text-gray-900 leading-relaxed">
              {mainProblems}
            </p>
          </div>
          {timePeriod && (
            <p className="text-sm text-gray-500 pl-[82px]">
              {timePeriod}
            </p>
          )}
        </div>
      )}

      {/* Placeholder when no data yet */}
      {!isLoading && !error && !mainProblems && (
        <p className="text-sm text-gray-500">
          Ladataan tiivistelmää...
        </p>
      )}
    </div>
  );
};

export default ClientSummary;
