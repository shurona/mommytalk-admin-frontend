import api from './api';
import {
  ChannelUser,
  UserDetail,
  UserSubscription,
  UserListFilter,
  ChannelId,
  UserId,
  ApiResponse,
  PageResponseDto
} from '../types';

// 사용자 수정 요청 타입
export interface UpdateUserRequest {
  phoneNumber: string;
  userLevel: number;
  childLevel: number;
  childName: string;
}

// 이용권 수정 요청 타입
export interface UpdateEntitlementsRequest {
  entitlements: UserSubscription[];
}

/**
 * 사용자 관련 API 서비스
 */
export const userService = {
  /**
   * 채널별 사용자 목록 조회
   * @param {ChannelId} channelId - 채널 ID
   * @param {UserListFilter} params - 쿼리 파라미터
   * @returns {Promise<PageResponseDto<ChannelUser>>} 페이징된 사용자 목록
   */
  async getUsers(channelId: ChannelId, params: UserListFilter = {}): Promise<PageResponseDto<ChannelUser>> {
    const { searchTerm, page = 0, size = 50, status } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (searchTerm && searchTerm.trim()) {
      queryParams.append('search', searchTerm.trim());
    }

    if (status) {
      queryParams.append('status', status);
    }

    const response = await api.get<ApiResponse<PageResponseDto<ChannelUser>>>(
      `/v1/channels/${channelId}/users?${queryParams}`
    );

    // ApiResponse<T> 구조에서 data 추출
    if (response.data.message === 'Success' && response.data.data) {
      return response.data.data;
    }

    // 에러 발생 시
    throw new Error(response.data.message || '사용자 목록을 불러올 수 없습니다.');
  },

  /**
   * 채널별 사용자 상세 정보 조회 (이용권 정보 포함)
   * @param {ChannelId} channelId - 채널 ID
   * @param {UserId} userId - 사용자 ID
   * @returns {Promise<UserDetail>} 사용자 상세 정보
   */
  async getUserById(channelId: ChannelId, userId: UserId): Promise<UserDetail> {
    const response = await api.get<ApiResponse<UserDetail>>(
      `/v1/channels/${channelId}/users/${userId}`
    );

    // ApiResponse<T> 구조에서 data 추출
    if (response.data.message === 'Success' && response.data.data) {
      return response.data.data;
    }

    // 에러 발생 시
    throw new Error(response.data.message || '사용자 정보를 불러올 수 없습니다.');
  },

  /**
   * 사용자 정보 수정
   * @param {ChannelId} channelId - 채널 ID
   * @param {UserId} userId - 사용자 ID
   * @param {UpdateUserRequest} userData - 수정할 사용자 데이터
   * @returns {Promise<any>} 수정 결과
   */
  async updateUser(channelId: ChannelId, userId: UserId, userData: UpdateUserRequest): Promise<any> {
    const response = await api.put<ApiResponse<any>>(
      `/v1/channels/${channelId}/users/${userId}`,
      userData
    );

    // ApiResponse<T> 구조 처리
    if (response.data.message === 'Success') {
      return response.data.data || { success: true };
    }

    // 에러 발생 시
    throw new Error(response.data.message || '사용자 정보 수정에 실패했습니다.');
  },

  /**
   * 사용자 이용권 목록 전체 수정
   * @param {ChannelId} channelId - 채널 ID
   * @param {UserId} userId - 사용자 ID
   * @param {UserSubscription[]} entitlements - 이용권 목록
   * @returns {Promise<any>} 수정 결과
   */
  async updateUserEntitlements(
    channelId: ChannelId,
    userId: UserId,
    entitlements: UserSubscription[]
  ): Promise<any> {
    const response = await api.put<ApiResponse<any>>(
      `/v1/channels/${channelId}/users/${userId}/entitlements`,
      { entitlements }
    );

    // ApiResponse<T> 구조 처리
    if (response.data.message === 'Success') {
      return response.data.data || { success: true };
    }

    // 에러 발생 시
    throw new Error(response.data.message || '이용권 수정에 실패했습니다.');
  },

  /**
   * 사용자 이용권 삭제
   * @param {ChannelId} channelId - 채널 ID
   * @param {UserId} userId - 사용자 ID
   * @param {number} entitlementId - 이용권 ID
   * @returns {Promise<any>} 삭제 결과
   */
  async deleteUserEntitlement(channelId: ChannelId, userId: UserId, entitlementId: number): Promise<any> {
    const response = await api.delete<ApiResponse<any>>(
      `/v1/channels/${channelId}/users/${userId}/entitlements/${entitlementId}`
    );

    // ApiResponse<T> 구조 처리
    if (response.data.message === 'Success') {
      return response.data.data || { success: true };
    }

    // 에러 발생 시
    throw new Error(response.data.message || '이용권 삭제에 실패했습니다.');
  }
};

export default userService;