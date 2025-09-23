import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ProfessionalBuyerChat from "@/components/ProfessionalBuyerChat";
import { PurchaseRequisitionPanel } from "@/components/PurchaseRequisitionPanel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [verificationVisible, setVerificationVisible] = React.useState(false);
  const [chatVisible, setChatVisible] = React.useState(true);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [refreshToken, setRefreshToken] = React.useState<number>(0);

  // Smart toggle handlers - if closing the only visible panel, show the other one
  const handleChatToggle = (newChatVisible: boolean) => {
    if (!newChatVisible && !verificationVisible) {
      // If hiding chat and ERP panel is also hidden, show ERP panel
      setVerificationVisible(true);
    }
    setChatVisible(newChatVisible);
  };

  const handleVerificationToggle = (newVerificationVisible: boolean) => {
    if (!newVerificationVisible && !chatVisible) {
      // If hiding ERP panel and chat is also hidden, show chat
      setChatVisible(true);
    }
    setVerificationVisible(newVerificationVisible);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalBuyerChat
        onLogout={handleLogout}
        leftPanelVisible={verificationVisible}
        chatVisible={chatVisible}
        onChatVisibleChange={handleChatToggle}
        leftPanel={
          <div className="h-full overflow-y-auto p-4">
            <PurchaseRequisitionPanel />
          </div>
        }
        topRightControls={
          <div className="flex items-center gap-2">
            <Label htmlFor="verify-toggle" className="text-xs text-gray-500">Show verification</Label>
            <Switch id="verify-toggle" checked={verificationVisible} onCheckedChange={handleVerificationToggle} />
          </div>
        }
      />
    </div>
  );
};

export default Workbench;