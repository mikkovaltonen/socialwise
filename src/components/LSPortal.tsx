/**
 * LS-portaali (Lastensuojelu Portal)
 *
 * Main component for displaying child welfare case information
 * Displays a single demo client (Lapsi 1) with all related data
 * New layout: Three-column design with left nav, main content, and AI chat
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import * as AineistoParser from '@/lib/aineistoParser';
import { generateClientSummary } from '@/lib/generateClientSummary';
import type { LSClientData } from '@/data/ls-types';
import { logger } from '@/lib/logger';
import { getAllClientsBasicInfo } from '@/lib/clientService';
import type { ClientBasicInfo } from '@/types/client';

// Import layout components
import { LSPortalLayout } from './ls-portal/LSPortalLayout';
import { LeftSidebar } from './ls-portal/Sidebar/LeftSidebar';
import { ContentArea } from './ls-portal/MainContent/ContentArea';

// Import content sub-components
import { LSNotifications } from './ls-portal/LSNotifications';
import { CaseNotes } from './ls-portal/CaseNotes';
import { Decisions } from './ls-portal/Decisions';
import { ContactInfo } from './ls-portal/ContactInfo';
import { PTA } from './ls-portal/PTA';
import { ServicePlans } from './ls-portal/ServicePlans';

// ============================================================================
// Types
// ============================================================================

export interface LSPortalProps {
  onClientLoad?: (clientData: LSClientData) => void;
  className?: string;
}

export interface LSPortalRef {
  loadClient: () => void;
  getClientData: () => LSClientData;
}

// ============================================================================
// Main Component
// ============================================================================

export const LSPortal = forwardRef<LSPortalRef, LSPortalProps>(
  ({ onClientLoad, className = '' }, ref) => {
    // Client selection state
    const [availableClients, setAvailableClients] = useState<ClientBasicInfo[]>([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [clientData, setClientData] = useState<LSClientData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState<'child-view' | 'all-children' | 'settings'>('child-view');

    // Client summary state
    const [clientSummary, setClientSummary] = useState<{
      mainProblems: string;
      timePeriod: string;
      isLoading: boolean;
      error?: string;
    }>({
      mainProblems: '',
      timePeriod: '',
      isLoading: false,
    });

    // Panel visibility state
    const [isLeftVisible, setIsLeftVisible] = useState(true);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      loadClient: () => {
        loadClientData();
      },
      getClientData: () => clientData!,
    }));

    // Load available clients from Firestore
    const loadAvailableClients = async () => {
      try {
        setIsLoadingClients(true);
        const clients = await getAllClientsBasicInfo();
        setAvailableClients(clients);

        // Set first client as default (only on initial load)
        if (clients.length > 0 && !selectedClientId) {
          setSelectedClientId(clients[0].clientId);
          logger.debug(`Auto-selected first client: ${clients[0].clientId}`);
        } else if (clients.length === 0) {
          logger.warn('No clients found in ASIAKAS_PERUSTIEDOT');
        }
      } catch (error) {
        logger.error('Error loading clients:', error);
      } finally {
        setIsLoadingClients(false);
      }
    };

    // Load client data dynamically from Aineisto files
    const loadClientData = async () => {
      if (!selectedClientId) {
        logger.warn('No client selected');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Load data from markdown files using runtime parser
        const data = await AineistoParser.loadClientData(selectedClientId);

        // ROBUSTNESS: Always set data even if null/partial
        // UI components should handle missing data gracefully
        if (data) {
          setClientData(data);

          // Stop main loading - show the page
          setIsLoading(false);

          // Notify parent component
          if (onClientLoad) {
            onClientLoad(data);
          }

          // Generate client summary using LLM (non-blocking)
          setClientSummary(prev => ({ ...prev, isLoading: true }));
          try {
            const summary = await generateClientSummary(data);
            setClientSummary(summary);
          } catch (summaryError) {
            logger.error('Error generating summary:', summaryError);
            setClientSummary({
              mainProblems: '',
              timePeriod: '',
              isLoading: false,
              error: 'Tiivistelmän generointi epäonnistui',
            });
          }

          // Generate PTA summaries using LLM (non-blocking)
          // PTA records are already loaded with placeholder summaries
          // Now we generate real summaries in the background
          if (data.ptaRecords && data.ptaRecords.length > 0) {
            try {
              // CRITICAL: Wait 3 seconds before starting PTA summaries
              // This prevents rate limiting when client summary is still processing
              await new Promise(resolve => setTimeout(resolve, 3000));

              const updatedRecords = await AineistoParser.generatePTASummaries(data.ptaRecords);

              // Update clientData with new summaries
              setClientData(prevData => {
                if (!prevData) return prevData;
                return {
                  ...prevData,
                  ptaRecords: updatedRecords,
                };
              });
            } catch (ptaError) {
              logger.error('PTA-yhteenvetojen generointi epäonnistui:', ptaError);
            }
          }
        } else {
          // No data found - show empty state but don't crash
          setClientData({
            clientId: selectedClientId,
            clientName: selectedClientId,
            notifications: [],
            caseNotes: [],
            decisions: [],
            ptaRecords: [],
            servicePlans: [],
            timeline: [],
          });
          setIsLoading(false);
        }
      } catch (error) {
        logger.error('Error loading client data:', error);
        // Set minimal valid data structure so UI doesn't crash
        setClientData({
          clientId: selectedClientId,
          clientName: selectedClientId,
          notifications: [],
          caseNotes: [],
          decisions: [],
          ptaRecords: [],
          servicePlans: [],
          timeline: [],
        });
        setIsLoading(false);
      }
    };

    // Auto-load available clients on mount
    useEffect(() => {
      loadAvailableClients();
    }, []);

    // Load client data when selected client changes
    useEffect(() => {
      if (selectedClientId) {
        loadClientData();
      }
    }, [selectedClientId]);

    // Show loading state
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ladataan asiakastietoja...</p>
          </div>
        </div>
      );
    }

    // Show error state if no data
    if (!clientData) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Asiakastietoja ei löytynyt</p>
            <button
              onClick={loadClientData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Yritä uudelleen
            </button>
          </div>
        </div>
      );
    }

    return (
      <LSPortalLayout
        isLeftVisible={isLeftVisible}
        onToggleLeft={() => setIsLeftVisible(!isLeftVisible)}
        leftSidebar={
          <LeftSidebar
            currentView={currentView}
            onNavigate={setCurrentView}
            onToggle={() => setIsLeftVisible(false)}
            clientName={clientData?.clientName}
            clientSummary={clientSummary}
          />
        }
        mainContent={
          <ContentArea
            clientName={clientData?.clientName}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
            onClientCreated={loadAvailableClients}
            availableClients={availableClients}
            isLoadingClients={isLoadingClients}
            clientSummary={clientSummary}
          >
            {/* Lastensuojeluilmoitukset + Asiakaskirjaukset (side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LSNotifications notifications={clientData.notifications} />
              <CaseNotes caseNotes={clientData.caseNotes} />
            </div>

            {/* Päätökset + Yhteystiedot (side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Decisions decisions={clientData.decisions} />
              <ContactInfo
                contactInfo={clientData.contactInfo}
                clientId={selectedClientId}
                onUpdate={loadClientData}
              />
            </div>

            {/* PTA + Asiakassuunnitelmat (side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PTA ptaRecords={clientData.ptaRecords} />
              <ServicePlans servicePlans={clientData.servicePlans} />
            </div>
          </ContentArea>
        }
      />
    );
  }
);

LSPortal.displayName = 'LSPortal';

export default LSPortal;
