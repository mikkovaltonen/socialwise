/**
 * LeftSidebar
 *
 * Left navigation sidebar with:
 * - LS-portaali logo and branding
 * - Navigation menu
 * - User profile at bottom
 */

import React from 'react';
import { PanelLeftClose } from 'lucide-react';
import { NavigationMenu } from './NavigationMenu';
import { UserProfile } from './UserProfile';

interface LeftSidebarProps {
  currentView?: 'child-view' | 'all-children' | 'settings';
  onNavigate?: (view: 'child-view' | 'all-children' | 'settings') => void;
  onToggle?: () => void;
  clientName?: string;
  clientSummary?: {
    mainProblems: string;
    timePeriod: string;
    isLoading: boolean;
    error?: string;
  };
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  currentView = 'child-view',
  onNavigate,
  onToggle,
  clientName,
  clientSummary,
}) => {
  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-ls-blue to-ls-blue-dark text-white relative">
      {/* Toggle Button (VS Code style) */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute right-2 top-2 z-10
                     bg-white/10 hover:bg-white/20
                     text-white p-1.5 rounded
                     transition-colors duration-200"
          title="Piilota valikko"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      )}

      {/* Logo Section */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center overflow-hidden">
            <img
              src="/logo.png"
              alt="LS-portaali"
              className="w-12 h-12 object-contain"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold">LS-portaali</h1>
            <p className="text-xs text-white/70 mt-0.5">Autetaan yhdessä 2025</p>
          </div>
        </div>

        {/* Client Name */}
        {clientName && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Asiakkaana:</p>
            <p className="text-sm font-medium text-white">{clientName}</p>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 py-4">
        <NavigationMenu currentView={currentView} onNavigate={onNavigate} />
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-white/20">
        <UserProfile />
      </div>
    </div>
  );
};

export default LeftSidebar;
