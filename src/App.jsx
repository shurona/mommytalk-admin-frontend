import React, { useState, useEffect } from "react";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { channelService } from "./services/channelService";
import ContentGeneration from "./pages/ContentGeneration";
import ContentList from "./pages/ContentList";
import ContentGroupSettings from "./pages/ContentGroupSettings";
import PromptManagement from "./pages/PromptManagement";
import AllUsers from "./pages/AllUsers";
import Purchasers from "./pages/Purchasers";
import ServiceGroups from "./pages/ServiceGroups";
import OrderList from "./pages/OrderList";
import OrderManagement from "./pages/OrderManagement";
import PurchaseEventSettings from "./pages/PurchaseEventSettings";

function AdminApp() {
  const [activeTab, setActiveTab] = useState("content-generation");
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [loadingChannels, setLoadingChannels] = useState(true);

  // 채널 목록 로드
  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoadingChannels(true);
        const channelList = await channelService.getChannels();
        setChannels(channelList);
        
        // 첫 번째 채널을 기본 선택
        if (channelList && channelList.length > 0) {
          setSelectedChannel(channelList[0]);
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
      } finally {
        setLoadingChannels(false);
      }
    };
    
    loadChannels();
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case "content-generation":
        return <ContentGeneration />;
      case "content-list":
        return <ContentList />;
      case "content-group-settings":
        return <ContentGroupSettings />;
      case "prompt-management":
        return <PromptManagement />;
      case "all-users":
        return <AllUsers selectedChannel={selectedChannel} />;
      case "purchasers":
        return <Purchasers />;
      case "service-groups":
        return <ServiceGroups />;
      case "order-list":
        return <OrderList />;
      case "order-management":
        return <OrderManagement />;
      case "purchase-event-settings":
        return <PurchaseEventSettings />;
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">페이지 준비중</h1>
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <p>해당 페이지는 준비중입니다.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        <Topbar 
          channels={channels}
          selectedChannel={selectedChannel} 
          setSelectedChannel={setSelectedChannel}
          loadingChannels={loadingChannels}
        />
        {renderContent()}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}
