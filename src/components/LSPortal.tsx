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

// Import layout components
import { LSPortalLayout } from './ls-portal/LSPortalLayout';
import { LeftSidebar } from './ls-portal/Sidebar/LeftSidebar';
import { ContentArea } from './ls-portal/MainContent/ContentArea';
import { RightSidebar } from './ls-portal/AIChat/RightSidebar';

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
    // Demo: Only one client (lapsi-1) - no client selection needed
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
    const [isChatVisible, setIsChatVisible] = useState(false);

    // AI Chat state
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isChatLoading, setIsChatLoading] = useState(false);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      loadClient: () => {
        loadClientData();
      },
      getClientData: () => clientData!,
    }));

    // Load client data dynamically from Aineisto files
    const loadClientData = async () => {
      try {
        setIsLoading(true);
        // Load data from markdown files using runtime parser
        const data = await AineistoParser.loadClientData('lapsi-1');

        if (data) {
          setClientData(data);

          // Notify parent component
          if (onClientLoad) {
            onClientLoad(data);
          }

          // Generate client summary using LLM
          setClientSummary(prev => ({ ...prev, isLoading: true }));
          const summary = await generateClientSummary(data);
          setClientSummary(summary);
        } else {
          console.warn('No client data found');
        }
      } catch (error) {
        console.error('Error loading client data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Auto-load client data on mount
    useEffect(() => {
      loadClientData();
    }, []); // Only run once on mount - single client demo

    // Handle AI chat messages
    const handleSendMessage = async (message: string) => {
      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        role: 'user' as const,
        content: message,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, userMessage]);
      setIsChatLoading(true);

      // TODO: Integrate with OpenRouter API
      // For now, just simulate a response
      setTimeout(() => {
        const assistantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant' as const,
          content: 'Tämä on demo-vastaus. AI-integraatio toteutetaan seuraavassa vaiheessa.',
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
        setIsChatLoading(false);
      }, 1000);
    };

    const handleQuickQuestion = (question: string) => {
      handleSendMessage(question);
    };

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
        isChatVisible={isChatVisible}
        onToggleLeft={() => setIsLeftVisible(!isLeftVisible)}
        onToggleChat={() => setIsChatVisible(!isChatVisible)}
        leftSidebar={
          <LeftSidebar
            currentView={currentView}
            onNavigate={setCurrentView}
            onShowChat={() => setIsChatVisible(true)}
            isChatVisible={isChatVisible}
            onToggle={() => setIsLeftVisible(false)}
            clientName={clientData?.clientName}
            clientSummary={clientSummary}
          />
        }
        mainContent={
          <ContentArea
            clientName={clientData?.clientName}
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
              <ContactInfo contactInfo={clientData.contactInfo} />
            </div>

            {/* PTA + Asiakassuunnitelmat (side by side) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PTA ptaRecords={clientData.ptaRecords} />
              <ServicePlans servicePlans={clientData.servicePlans} />
            </div>
          </ContentArea>
        }
        rightSidebar={
          <RightSidebar
            messages={chatMessages}
            onSendMessage={handleSendMessage}
            onQuickQuestionClick={handleQuickQuestion}
            isLoading={isChatLoading}
          />
        }
      />
    );
  }
);

LSPortal.displayName = 'LSPortal';

export default LSPortal;
