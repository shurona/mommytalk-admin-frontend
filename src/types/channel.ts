// 채널 관련 타입 정의
import { ChannelId } from './common';

// 채널 정보
export interface Channel {
  channelId: ChannelId;
  channelName: string; // 서버에서 channelName으로 전달
  description?: string;
}

// 채널 목록 응답
export type ChannelListResponse = Channel[];

// 채널 선택 상태
export interface ChannelState {
  channels: Channel[];
  selectedChannel: Channel | null;
  loadingChannels: boolean;
}