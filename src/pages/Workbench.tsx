import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import MarketingPlannerChat, { MarketingPlannerChatRef } from "@/components/MarketingPlannerChat";
import { StockManagementTable } from "@/components/StockManagementTable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Workbench = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stockManagementVisible, setStockManagementVisible] = React.useState(true);
  const [chatVisible, setChatVisible] = React.useState(false);
  const chatRef = React.useRef<MarketingPlannerChatRef>(null);

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

  const handleCustomerClick = async (tampuurinumero: string) => {
    try {
      // Show chat panel if it's hidden
      if (!chatVisible) {
        setChatVisible(true);
      }

      // Fetch customer data from Firestore
      const collectionName = 'crm_asikkaat_ja_palveluhistoria';
      console.log(`📊 Workbench - Loading customer '${tampuurinumero}' from collection: ${collectionName}`);
      const crmRef = collection(db, collectionName);
      const q = query(crmRef, where('tampuurinumero', '==', tampuurinumero));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast.error(`No customer found with tampuurinumero ${tampuurinumero}`);
        return;
      }

      const customerDoc = snapshot.docs[0];
      const customerData = customerDoc.data();

      // Call the loadSubstrateFamily method on MarketingPlannerChat with customer data
      // Note: This uses the existing method but passes customer data instead
      if (chatRef.current) {
        const customerInfo = {
          tampuurinumero: customerData.tampuurinumero,
          ...customerData.customerInfo,
          serviceHistory: customerData.serviceHistory
        };
        await chatRef.current.loadSubstrateFamily(tampuurinumero, [customerInfo]);
        toast.success(`Loaded customer ${customerData.customerInfo?.account_name || tampuurinumero}`);
      }
    } catch (error) {
      console.error('Error loading customer:', error);
      toast.error('Failed to load customer data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketingPlannerChat
        ref={chatRef}
        onLogout={handleLogout}
        leftPanelVisible={stockManagementVisible}
        chatVisible={chatVisible}
        onChatVisibleChange={handleChatToggle}
        leftPanel={
          <div className="h-full overflow-y-auto px-2 py-2">
            <StockManagementTable onCustomerClick={handleCustomerClick} />
          </div>
        }
        topRightControls={
          <div className="flex items-center gap-2">
            <Label htmlFor="stock-toggle" className="text-xs text-gray-500">Show CRM customers</Label>
            <Switch id="stock-toggle" checked={stockManagementVisible} onCheckedChange={handleStockManagementToggle} />
          </div>
        }
      />
    </div>
  );
};

export default Workbench;