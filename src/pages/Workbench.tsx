import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, getStockManagementCollection } from '@/lib/firebase';
import { toast } from 'sonner';
import ProfessionalBuyerChat, { ProfessionalBuyerChatRef } from "@/components/ProfessionalBuyerChat";
import { StockManagementTable } from "@/components/StockManagementTable";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Workbench = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stockManagementVisible, setStockManagementVisible] = React.useState(true);
  const [chatVisible, setChatVisible] = React.useState(false);
  const chatRef = React.useRef<ProfessionalBuyerChatRef>(null);

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

  const handleSubstrateFamilyClick = async (keyword: string) => {
    try {
      // Show chat panel if it's hidden
      if (!chatVisible) {
        setChatVisible(true);
      }

      // Fetch substrate family data from Firestore
      // Use public_stock_management for public@viewer.com, stock_management for others
      const collectionName = getStockManagementCollection(user?.email);
      console.log(`📊 Workbench - Loading substrate family '${keyword}' from collection: ${collectionName} (user: ${user?.email})`);
      const stockRef = collection(db, collectionName);
      const q = query(stockRef, where('keyword', '==', keyword));
      const snapshot = await getDocs(q);

      const records: any[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        if (data.materials && Array.isArray(data.materials)) {
          // New structure: extract materials from the array
          data.materials.forEach((material: any, index: number) => {
            records.push({
              id: `${doc.id}_${index}`,
              keyword: keyword,
              ...material
            });
          });
        } else {
          // Fallback for old structure (flat documents)
          records.push({
            id: doc.id,
            ...data
          });
        }
      });

      if (records.length === 0) {
        toast.error(`No records found for ${keyword}`);
        return;
      }

      // Call the loadSubstrateFamily method on ProfessionalBuyerChat
      if (chatRef.current) {
        await chatRef.current.loadSubstrateFamily(keyword, records);
        toast.success(`Loaded ${records.length} material${records.length > 1 ? 's' : ''} for ${keyword}`);
      }
    } catch (error) {
      console.error('Error loading substrate family:', error);
      toast.error('Failed to load substrate family data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProfessionalBuyerChat
        ref={chatRef}
        onLogout={handleLogout}
        leftPanelVisible={stockManagementVisible}
        chatVisible={chatVisible}
        onChatVisibleChange={handleChatToggle}
        leftPanel={
          <div className="h-full overflow-y-auto px-2 py-2">
            <StockManagementTable onSubstrateFamilyClick={handleSubstrateFamilyClick} />
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