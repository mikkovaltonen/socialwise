/**
 * LSPortalLayout
 *
 * Three-column layout for LS-portaali:
 * - Left sidebar: Navigation and user profile
 * - Main content: Case information cards
 * - Right sidebar: AI chat assistant
 */

import React from 'react';
import { ToggleButton } from './ToggleButton';

interface LSPortalLayoutProps {
  leftSidebar: React.ReactNode;
  mainContent: React.ReactNode;
  rightSidebar: React.ReactNode;
  isChatVisible?: boolean;
  isLeftVisible?: boolean;
  onToggleLeft?: () => void;
  onToggleChat?: () => void;
}

export const LSPortalLayout: React.FC<LSPortalLayoutProps> = ({
  leftSidebar,
  mainContent,
  rightSidebar,
  isChatVisible = false,
  isLeftVisible = true,
  onToggleLeft,
  onToggleChat,
}) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Sidebar - Fixed Navigation */}
      {isLeftVisible && (
        <aside className="fixed left-0 top-0 h-full w-60 z-50">
          {leftSidebar}
        </aside>
      )}

      {/* Left Panel Toggle (when hidden) */}
      {onToggleLeft && (
        <ToggleButton
          position="left"
          isVisible={isLeftVisible}
          onToggle={onToggleLeft}
          label="Näytä valikko"
        />
      )}

      {/* Main Content Area - Scrollable */}
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
        isLeftVisible ? 'ml-60' : 'ml-0'
      } ${
        isChatVisible ? 'mr-[400px]' : 'mr-0'
      }`}>
        {mainContent}
      </main>

      {/* Right Sidebar - Fixed AI Chat */}
      {isChatVisible && (
        <aside className="fixed right-0 top-0 h-full w-[400px] z-40 border-l border-gray-200 bg-white">
          <div className="relative h-full">
            {/* Right Panel Toggle (inside panel) */}
            {onToggleChat && (
              <ToggleButton
                position="right"
                isVisible={isChatVisible}
                onToggle={onToggleChat}
                label="Piilota AI-chat"
              />
            )}
            {rightSidebar}
          </div>
        </aside>
      )}
    </div>
  );
};

export default LSPortalLayout;
