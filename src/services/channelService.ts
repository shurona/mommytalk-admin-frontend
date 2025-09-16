import api from './api';
import { Channel, ChannelListResponse, ApiResponse } from '../types';

/**
 * 채널 관련 API 서비스
 */
export const channelService = {
  /**
   * 채널 목록 조회
   * @returns {Promise<Channel[]>} 채널 목록
   */
  async getChannels(): Promise<Channel[]> {
    const response = await api.get<ApiResponse<Channel[]>>('/v1/channels');

    // ApiResponse<T> 구조에서 data 추출
    if (response.data.message === 'Success' && response.data.data) {
      return response.data.data;
    }

    // 에러 발생 시
    throw new Error(response.data.message || '채널 목록을 불러올 수 없습니다.');
  }
};

export default channelService;