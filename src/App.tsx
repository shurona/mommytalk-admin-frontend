import { useState, useEffect } from "react";
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
import ContentDetail from "./pages/ContentDetail";
import ContentGroupSettings from "./pages/ContentGroupSettings";
import PromptManagement from "./pages/PromptManagement";
import TestUserManagement from "./pages/TestUserManagement";
import AllUsers from "./pages/AllUsers";
import ServiceGroups from "./pages/ServiceGroups";
import OrderList from "./pages/OrderList";

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

        // localStorage에서 마지막 선택한 채널 ID 가져오기
        const savedChannelId = localStorage.getItem('selectedChannelId');

        if (savedChannelId) {
          // 저장된 채널 ID가 있으면 해당 채널 선택
          const savedChannel = channelList.find(
            ch => ch.channelId.toString() === savedChannelId
          );
          if (savedChannel) {
            setSelectedChannel(savedChannel);
            return;
          }
        }

        // 저장된 채널이 없거나 찾지 못하면 첫 번째 채널 선택
        if (channelList && channelList.length > 0) {
          setSelectedChannel(channelList[1]);
          // 첫 번째 채널도 localStorage에 저장
          localStorage.setItem('selectedChannelId', channelList[0].channelId.toString());
        }
      } catch (error) {
        console.error('Failed to load channels:', error);
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
            <Route path="/content-generation" element={
              loadingChannels ? (
                <LoadingPage title="🤖 AI 콘텐츠 생성" />
              ) : (
                <ContentGeneration selectedChannel={selectedChannel} />
              )
            } />
            <Route path="/content-list" element={
              loadingChannels ? (
                <LoadingPage title="📋 콘텐츠 목록" />
              ) : (
                <ContentList selectedChannel={selectedChannel} />
              )
            } />
            <Route path="/content-detail/:id" element={
              loadingChannels ? (
                <LoadingPage title="📄 콘텐츠 상세" />
              ) : (
                <ContentDetail selectedChannel={selectedChannel} />
              )
            } />
            <Route path="/prompt-management" element={
              loadingChannels ? (
                <LoadingPage title="🔧 프롬프트 관리" />
              ) : (
                <PromptManagement selectedChannel={selectedChannel} />
              )
            } />
            <Route path="/test-user-management" element={
              loadingChannels ? (
                <LoadingPage title="🧪 테스트 유저 관리" />
              ) : (
                <TestUserManagement selectedChannel={selectedChannel} />
              )
            } />

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
            <Route path="/service-groups/:groupId" element={
              loadingChannels ? (
                <LoadingPage title="👥 회원 그룹 관리" />
              ) : (
                <ServiceGroups selectedChannel={selectedChannel} />
              )
            } />

            {/* 나머지 페이지들 */}
            <Route path="/order-list" element={<OrderList />} />

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