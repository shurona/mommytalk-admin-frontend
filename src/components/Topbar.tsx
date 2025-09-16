import React from "react";
import { Settings, Bell, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Channel } from "../types";

interface TopbarProps {
  channels: Channel[];
  selectedChannel: Channel | null;
  setSelectedChannel: (channel: Channel | null) => void;
  loadingChannels: boolean;
}

export default function Topbar({
  channels,
  selectedChannel,
  setSelectedChannel,
  loadingChannels
}: TopbarProps) {
  const { user, logout } = useAuth();

  const handleLogout = async (): Promise<void> => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      await logout();
    }
  };

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const channelId = e.target.value;
    const channel = channels.find(ch => ch.channelId === channelId) || null;
    setSelectedChannel(channel);
  };

  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Settings className="h-5 w-5 text-gray-400" />
          {loadingChannels ? (
            <div className="text-sm text-gray-500">채널 로드 중...</div>
          ) : (
            <select
              value={selectedChannel?.channelId || ''}
              onChange={handleChannelChange}
              className="border-0 text-sm font-medium text-gray-700"
              disabled={!channels.length}
            >
              {channels.map((channel) => (
                <option key={channel.channelId} value={channel.channelId}>
                  📺 {channel.name}
                </option>
              ))}
              {!channels.length && (
                <option value="" disabled>채널이 없습니다</option>
              )}
            </select>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Bell className="h-5 w-5 text-gray-400" />
          <div className="text-sm text-gray-600">{new Date().toLocaleDateString("ko-KR")}</div>

          {/* 사용자 정보 및 로그아웃 */}
          <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-200">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 font-medium">
                {user?.name || user?.email || '관리자'}
              </span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Admin
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}