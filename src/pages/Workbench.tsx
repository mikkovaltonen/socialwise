import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';
import { MessageSquare } from 'lucide-react';
import SocialWorkChat, { SocialWorkChatRef } from "@/components/SocialWorkChat";
import LSPortal, { LSPortalRef } from "@/components/LSPortal";
import type { LSClientData } from "@/data/ls-types";

const Workbench = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [chatVisible, setChatVisible] = React.useState(false);
  const [clientData, setClientData] = React.useState<LSClientData | null>(null);
  const chatRef = React.useRef<SocialWorkChatRef>(null);
  const lsPortalRef = React.useRef<LSPortalRef>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle LS client data loading
  // When LSPortal loads client data, store it in state and pass to chat
  const handleClientLoad = React.useCallback(async (loadedClientData: LSClientData) => {
    console.log('Client data loaded:', loadedClientData.clientName);
    setClientData(loadedClientData);
  }, []);

  const handleShowChat = () => {
    console.log('🔵 SHOW CHAT CLICKED - Setting chatVisible to true');
    setChatVisible(true);
  };

  // Debug logging
  console.log('🔵 WORKBENCH RENDER: chatVisible =', chatVisible);

  return (
    <div className="min-h-screen bg-[#1A2332]">
      <div className="flex h-screen overflow-hidden">
        {/* LSPortal - Always mounted at the same location */}
        <div
          className={`transition-all duration-300 ${
            chatVisible ? 'w-[75%]' : 'w-full'
          }`}
        >
          <div className="h-full overflow-y-auto">
            <LSPortal
              ref={lsPortalRef}
              onClientLoad={handleClientLoad}
            />
          </div>
        </div>

        {/* Floating Action Button - Bottom Right (only when chat is closed) */}
        {!chatVisible && (
          <button
            onClick={handleShowChat}
            className="fixed bottom-8 right-8 z-50
                       flex items-center gap-3 px-6 py-4
                       bg-gradient-to-r from-ls-blue to-ls-blue-dark
                       hover:from-ls-blue-dark hover:to-ls-blue
                       text-white rounded-full shadow-2xl
                       transition-all duration-300
                       hover:scale-110 hover:shadow-3xl
                       font-semibold text-base
                       animate-pulse hover:animate-none"
            title="Avaa AI-chat-avustaja"
          >
            <MessageSquare className="w-6 h-6" />
            <span>Kysy AI:lta</span>
          </button>
        )}

        {/* Chat Panel - Slides in from right */}
        {chatVisible && (
          <div
            className="w-[25%] border-l border-gray-700"
            style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', zIndex: 9999 }}
          >
            <SocialWorkChat
              ref={chatRef}
              onLogout={handleLogout}
              chatVisible={chatVisible}
              onChatVisibleChange={setChatVisible}
              clientData={clientData}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Workbench;