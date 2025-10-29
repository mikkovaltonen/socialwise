import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ProfessionalBuyerChat from "@/components/ProfessionalBuyerChat";
import { StockManagementTable } from "@/components/StockManagementTable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Workbench = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [stockManagementVisible, setStockManagementVisible] = React.useState(false);
  const [chatVisible, setChatVisible] = React.useState(true);

  // Smart toggle handlers - if closing the only visible panel, show the other one
  const handleChatToggle = (newChatVisible: boolean) => {
    if (!newChatVisible && !stockManagementVisible) {
      // If hiding chat and stock panel is also hidden, show stock panel
      setStockManagementVisible(true);
    }
    setChatVisible(newChatVisible);
  };

  const handleStockManagementToggle = (newStockVisible: boolean) => {
    if (!newStockVisible && !chatVisible) {
      // If hiding stock panel and chat is also hidden, show chat
      setChatVisible(true);
    }
    setStockManagementVisible(newStockVisible);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalBuyerChat
        onLogout={handleLogout}
        leftPanelVisible={stockManagementVisible}
        chatVisible={chatVisible}
        onChatVisibleChange={handleChatToggle}
        leftPanel={
          <div className="h-full overflow-y-auto p-4">
            <StockManagementTable />
          </div>
        }
        topRightControls={
          <div className="flex items-center gap-2">
            <Label htmlFor="stock-toggle" className="text-xs text-gray-500">Show stock management</Label>
            <Switch id="stock-toggle" checked={stockManagementVisible} onCheckedChange={handleStockManagementToggle} />
          </div>
        }
      />
    </div>
  );
};

export default Workbench;