import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from 'sonner';
import MarketingPlannerChat, { MarketingPlannerChatRef } from "@/components/MarketingPlannerChat";
import LSPortal, { LSPortalRef } from "@/components/LSPortal";
import type { LSClientData } from "@/data/ls-types";

const Workbench = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [chatVisible, setChatVisible] = React.useState(false);
  const chatRef = React.useRef<MarketingPlannerChatRef>(null);
  const lsPortalRef = React.useRef<LSPortalRef>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Handle LS client data loading
  // Note: Substrate family functionality removed - client data is static in demo
  const handleClientLoad = React.useCallback(async (clientData: LSClientData) => {
    // Client data is loaded on mount - no dynamic loading needed for single-client demo
    console.log('Client data loaded:', clientData.clientName);
  }, []);

  return (
    <div className="min-h-screen bg-[#1A2332]">
      <MarketingPlannerChat
        ref={chatRef}
        onLogout={handleLogout}
        leftPanelVisible={true}
        chatVisible={chatVisible}
        onChatVisibleChange={setChatVisible}
        leftPanel={
          <div className="h-full overflow-y-auto">
            <LSPortal ref={lsPortalRef} onClientLoad={handleClientLoad} />
          </div>
        }
      />
    </div>
  );
};

export default Workbench;