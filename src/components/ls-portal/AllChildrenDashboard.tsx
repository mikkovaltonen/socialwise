/**
 * AllChildrenDashboard - Kaikki lapset yhteenvetonäkymä
 *
 * Näyttää taulukon kaikista lapsista ja heidän tiedoistaan:
 * - Lapsen nimi
 * - Lapsen oma sosiaalityöntekijä
 * - Vastuutyöntekijä
 * - Tiimin esimies
 * - Yhteenveto (AI-generoitu)
 */

import React, { useState, useEffect } from 'react';
import { getAllClientsBasicInfo } from '@/lib/clientService';
import type { ClientBasicInfo } from '@/types/client';
import { generateNotificationSummaryForClient } from '@/lib/notificationSummaryService';
import { logger } from '@/lib/logger';
import { Loader2, Search, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface ChildDashboardRow {
  clientId: string;
  childName: string;
  socialWorker: string; // Lapsen oma sosiaalityöntekijä
  responsibleWorker: string; // Vastuutyöntekijä
  supervisor: string; // Tiimin esimies
  summary: string; // AI-generoitu yhteenveto
  isLoadingSummary: boolean;
  summaryError?: string;
}

// ============================================================================
// Component
// ============================================================================

export const AllChildrenDashboard: React.FC = () => {
  const [children, setChildren] = useState<ChildDashboardRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Lataa kaikki lapset ja generoi yhteenvedot
  useEffect(() => {
    loadAllChildren();
  }, []);

  const loadAllChildren = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Hae kaikki asiakkaiden perustiedot
      const allClients = await getAllClientsBasicInfo();
      logger.debug(`Loaded ${allClients.length} clients from ASIAKAS_PERUSTIEDOT`);

      if (allClients.length === 0) {
        setError('Asiakastietoja ei löytynyt');
        setIsLoading(false);
        return;
      }

      // Muunna ClientBasicInfo -> ChildDashboardRow
      const rows: ChildDashboardRow[] = allClients.map((client) => ({
        clientId: client.clientId,
        childName: client.child?.nimi || 'Ei nimeä',
        socialWorker: extractProfessionalByRole(client, ['oma sosiaalityöntekijä', 'oma työntekijä']),
        responsibleWorker: extractProfessionalByRole(client, ['vastuutyöntekijä', 'vastuullinen']),
        supervisor: extractProfessionalByRole(client, ['esimies', 'tiimin esimies', 'sosiaalipalvelun esimies']),
        summary: 'Ladataan...',
        isLoadingSummary: true,
      }));

      setChildren(rows);
      setIsLoading(false);

      // Generoi yhteenvedot taustalla (yksi kerrallaan rajoitusten välttämiseksi)
      generateSummariesSequentially(rows);
    } catch (err) {
      logger.error('Error loading all children:', err);
      setError('Virhe ladattaessa asiakastietoja');
      setIsLoading(false);
    }
  };

  /**
   * Poimii ammattilaisen nimen roolin perusteella
   */
  const extractProfessionalByRole = (client: ClientBasicInfo, roleKeywords: string[]): string => {
    if (!client.professionals || client.professionals.length === 0) {
      return '-';
    }

    for (const professional of client.professionals) {
      const roleLower = professional.rooli.toLowerCase();
      for (const keyword of roleKeywords) {
        if (roleLower.includes(keyword.toLowerCase())) {
          return professional.nimi;
        }
      }
    }

    return '-';
  };

  /**
   * Generoi yhteenvedot lapsille yksi kerrallaan
   */
  const generateSummariesSequentially = async (rows: ChildDashboardRow[]) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Generoi yhteenveto tälle lapselle
        const summary = await generateNotificationSummaryForClient(row.clientId);

        // Päivitä tila
        setChildren((prev) =>
          prev.map((child) =>
            child.clientId === row.clientId
              ? {
                  ...child,
                  summary: summary || 'Ei yhteenvetoa saatavilla',
                  isLoadingSummary: false,
                }
              : child
          )
        );

        // Odota 2 sekuntia ennen seuraavaa API-kutsua (rate limiting)
        if (i < rows.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (err) {
        logger.error(`Error generating summary for ${row.clientId}:`, err);

        // Päivitä tila virheellä
        setChildren((prev) =>
          prev.map((child) =>
            child.clientId === row.clientId
              ? {
                  ...child,
                  summary: 'Yhteenvedon generointi epäonnistui',
                  isLoadingSummary: false,
                  summaryError: String(err),
                }
              : child
          )
        );
      }
    }
  };

  // Suodata lapset hakutermin mukaan
  const filteredChildren = children.filter((child) => {
    const query = searchQuery.toLowerCase();
    return (
      child.childName.toLowerCase().includes(query) ||
      child.socialWorker.toLowerCase().includes(query) ||
      child.responsibleWorker.toLowerCase().includes(query) ||
      child.supervisor.toLowerCase().includes(query)
    );
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-ls-blue mx-auto mb-4" />
          <p className="text-gray-600">Ladataan lasten tietoja...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800 font-semibold mb-2">{error}</p>
          <button
            onClick={loadAllChildren}
            className="px-4 py-2 bg-ls-blue text-white rounded hover:bg-ls-blue-dark transition-colors"
          >
            Yritä uudelleen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50 p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Kaikki lapset</h1>
        <p className="text-gray-600">Yhteenveto kaikista asiakkaista</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Hae lapsen nimellä tai työntekijällä..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ls-blue"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-ls-blue text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Lapsen nimi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Oma sosiaalityöntekijä
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Vastuutyöntekijä
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Tiimin esimies
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider min-w-[300px]">
                  Yhteenveto
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChildren.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'Ei hakutuloksia' : 'Ei asiakastietoja'}
                  </td>
                </tr>
              ) : (
                filteredChildren.map((child) => (
                  <tr key={child.clientId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{child.childName}</div>
                      <div className="text-xs text-gray-500">{child.clientId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{child.socialWorker}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{child.responsibleWorker}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{child.supervisor}</div>
                    </td>
                    <td className="px-6 py-4">
                      {child.isLoadingSummary ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Generoidaan...
                        </div>
                      ) : child.summaryError ? (
                        <div className="text-sm text-red-600">{child.summary}</div>
                      ) : (
                        <div className="text-sm text-gray-700">{child.summary}</div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
        <div>
          Yhteensä <span className="font-semibold">{children.length}</span> lasta
        </div>
        <div>
          {searchQuery && (
            <>
              Näytetään <span className="font-semibold">{filteredChildren.length}</span> hakutulosta
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllChildrenDashboard;
