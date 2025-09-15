import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import LineLoginTest from "./pages/LineLoginTest";
import LineOAuth from "./pages/LineOAuth";
import LineSDKTest from "./pages/LineSDKTest";
import LineServerCallback from "./pages/LineServerCallback";

function AdminApp() {
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

        // 임시 mock 데이터로 대체
        const mockChannels = [
          {
            channelId: 'KOR',
            name: '마미톡잉글리시 KOR',
            description: '한국 채널'
          },
          {
            channelId: 'JP',
            name: '마미톡잉글리시 JP',
            description: '일본 채널'
          }
        ];
        setChannels(mockChannels);
        setSelectedChannel(mockChannels[0]);
      } finally {
        setLoadingChannels(false);
      }
    };

    loadChannels();
  }, []);

  const NotFoundPage = () => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">페이지 준비중</h1>
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <p>해당 페이지는 준비중입니다.</p>
      </div>
    </div>
  );

  return (
    <Router>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 overflow-auto">
          <Topbar 
            channels={channels}
            selectedChannel={selectedChannel} 
            setSelectedChannel={setSelectedChannel}
            loadingChannels={loadingChannels}
          />
          <Routes>
            <Route path="/" element={<Navigate to="/content-generation" replace />} />
            <Route path="/content-generation" element={<ContentGeneration />} />
            <Route path="/content-list" element={<ContentList />} />
            <Route path="/content-group-settings" element={<ContentGroupSettings />} />
            <Route path="/prompt-management" element={<PromptManagement />} />
            <Route path="/all-users" element={
              loadingChannels ? (
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 전체 회원</h1>
                  <div className="bg-white border rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">채널 정보를 불러오는 중...</p>
                  </div>
                </div>
              ) : (
                <AllUsers selectedChannel={selectedChannel} />
              )
            } />
            <Route path="/purchasers" element={<Purchasers />} />
            <Route path="/service-groups" element={
              loadingChannels ? (
                <div className="p-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 회원 그룹 관리</h1>
                  <div className="bg-white border rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500">채널 정보를 불러오는 중...</p>
                  </div>
                </div>
              ) : (
                <ServiceGroups selectedChannel={selectedChannel} />
              )
            } />
            <Route path="/order-list" element={<OrderList />} />
            <Route path="/order-management" element={<OrderManagement />} />
            <Route path="/purchase-event-settings" element={<PurchaseEventSettings />} />
            <Route path="/line-login-test" element={<LineLoginTest />} />
            <Route path="/line-oauth" element={<LineOAuth />} />
            <Route path="/line-sdk-test" element={<LineSDKTest />} />
            <Route path="/line-server-callback" element={<LineServerCallback />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </Router>
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
