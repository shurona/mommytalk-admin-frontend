import api from './api';
import { ApiResponse, ChannelId } from '../types';
import { TestUser, AddTestUserRequest } from '../types/testUser';

/**
 * 테스트 유저 관리 API 서비스
 */
export const testUserService = {
  /**
   * 테스트 유저 목록 조회
   * @param {ChannelId} channelId - 채널 ID
   * @returns {Promise<TestUser[]>} 테스트 유저 목록
   */
  async getTestUsers(channelId: ChannelId): Promise<TestUser[]> {
    const response = await api.get<ApiResponse<TestUser[]>>(
      `/v1/channels/${channelId}/test-users`
    );
    return response.data.data;
  },

  /**
   * 테스트 유저 추가
   * @param {ChannelId} channelId - 채널 ID
   * @param {AddTestUserRequest} request - 테스트 유저 추가 요청
   * @returns {Promise<TestUser>} 추가된 테스트 유저 정보
   */
  async addTestUser(channelId: ChannelId, request: AddTestUserRequest): Promise<TestUser> {
    const response = await api.post<ApiResponse<TestUser>>(
      `/v1/channels/${channelId}/test-users`,
      request
    );
    return response.data.data;
  },

  /**
   * 테스트 유저 삭제
   * @param {ChannelId} channelId - 채널 ID
   * @param {number} userId - 테스트 유저 ID
   * @returns {Promise<void>}
   */
  async deleteTestUser(channelId: ChannelId, userId: number): Promise<void> {
    await api.delete(`/v1/channels/${channelId}/test-users/${userId}`);
  }
};

export default testUserService;
