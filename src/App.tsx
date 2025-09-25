import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import { channelService } from "./services/channelService";
import { Channel } from "./types";

// 페이지 컴포넌트 imports
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

function AdminApp(): JSX.Element {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(true);

  // 채널 목록 로드
  useEffect(() => {
    const loadChannels = async (): Promise<void> => {
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
        const mockChannels: Channel[] = [
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

  const NotFoundPage = (): JSX.Element => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">페이지 준비중</h1>
      <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
        <p>해당 페이지는 준비중입니다.</p>
      </div>
    </div>
  );

  const LoadingPage = ({ title }: { title: string }): JSX.Element => (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      <div className="bg-white border rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500">채널 정보를 불러오는 중...</p>
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
            <Route path="/prompt-management" element={<PromptManagement />} />

            {/* 콘텐츠 발송 설정 - 채널 필요 */}
            <Route path="/content-group-settings" element={
              loadingChannels ? (
                <LoadingPage title="📬 콘텐츠 발송 및 그룹 설정" />
              ) : (
                <ContentGroupSettings selectedChannel={selectedChannel} />
              )
            } />

            {/* 채널이 필요한 페이지들 */}
            <Route path="/all-users" element={
              loadingChannels ? (
                <LoadingPage title="👥 전체 회원" />
              ) : (
                <AllUsers selectedChannel={selectedChannel} />
              )
            } />

            <Route path="/service-groups" element={
              loadingChannels ? (
                <LoadingPage title="👥 회원 그룹 관리" />
              ) : (
                <ServiceGroups selectedChannel={selectedChannel} />
              )
            } />

            {/* 나머지 페이지들 */}
            <Route path="/purchasers" element={<Purchasers />} />
            <Route path="/order-list" element={<OrderList />} />
            <Route path="/order-management" element={<OrderManagement />} />
            <Route path="/purchase-event-settings" element={<PurchaseEventSettings />} />

            {/* LINE 관련 테스트 페이지들 */}
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

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AdminApp />
      </ProtectedRoute>
    </AuthProvider>
  );
}