import api from './api';

/**
 * 채널 관련 API 서비스
 */
export const channelService = {
  /**
   * 채널 목록 조회
   * @returns {Promise} API 응답
   */
  async getChannels() {
    const response = await api.get('/v1/channels');
    return response.data;
  }
};

export default channelService;