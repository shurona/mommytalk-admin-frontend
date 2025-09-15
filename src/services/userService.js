import api from './api';

/**
 * 사용자 관련 API 서비스
 */
export const userService = {
  /**
   * 채널별 사용자 목록 조회
   * @param {number} channelId - 채널 ID
   * @param {Object} params - 쿼리 파라미터
   * @param {string} params.search - 검색어 (선택사항)
   * @param {number} params.page - 페이지 번호 (기본값: 0)
   * @param {number} params.size - 페이지 크기 (기본값: 50)
   * @returns {Promise} API 응답 - ApiResponse<PageResponse<User[]>> 구조
   */
  async getUsers(channelId, params = {}) {
    const { search, page = 0, size = 50 } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (search && search.trim()) {
      queryParams.append('search', search.trim());
    }
    
    const response = await api.get(`/v1/channels/${channelId}/users?${queryParams}`);
    
    // ApiResponse<T> 구조에서 data 추출
    if (response.data.message === 'Success' && response.data.data) {
      return response.data.data;
    }
    
    // 에러 발생 시
    throw new Error(response.data.message || '사용자 목록을 불러올 수 없습니다.');
  },

  /**
   * 채널별 사용자 상세 정보 조회 (이용권 정보 포함)
   * @param {number} channelId - 채널 ID
   * @param {number} userId - 사용자 ID
   * @returns {Promise} API 응답 - ApiResponse<UserDetail> 구조
   */
  async getUserById(channelId, userId) {
    const response = await api.get(`/v1/channels/${channelId}/users/${userId}`);
    
    // ApiResponse<T> 구조에서 data 추출
    if (response.data.message === 'Success' && response.data.data) {
      return response.data.data;
    }
    
    // 에러 발생 시
    throw new Error(response.data.message || '사용자 정보를 불러올 수 없습니다.');
  },

  /**
   * 사용자 정보 수정
   * @param {number} channelId - 채널 ID
   * @param {number} userId - 사용자 ID
   * @param {Object} userData - 수정할 사용자 데이터
   * @param {string} userData.phoneNumber - 연락처
   * @param {number} userData.userLevel - 사용자 레벨
   * @param {number} userData.childLevel - 자녀 레벨
   * @param {string} userData.childName - 자녀 이름
   * @returns {Promise} API 응답 - ApiResponse<any> 구조
   */
  async updateUser(channelId, userId, userData) {
    const response = await api.put(`/v1/channels/${channelId}/users/${userId}`, userData);
    
    // ApiResponse<T> 구조 처리
    if (response.data.message === 'Success') {
      return response.data.data || { success: true };
    }
    
    // 에러 발생 시
    throw new Error(response.data.message || '사용자 정보 수정에 실패했습니다.');
  },

  /**
   * 사용자 이용권 목록 전체 수정
   * @param {number} channelId - 채널 ID
   * @param {number} userId - 사용자 ID
   * @param {Array} entitlements - 이용권 목록
   * @param {string} entitlements[].id - 이용권 ID (선택사항, 신규 생성시 제외)
   * @param {string} entitlements[].productName - 상품명
   * @param {string} entitlements[].serviceStart - 시작일 (YYYY-MM-DD)
   * @param {string} entitlements[].serviceEnd - 종료일 (YYYY-MM-DD)
   * @param {string} entitlements[].status - 상태 (active, inactive, expired)
   * @returns {Promise} API 응답 - ApiResponse<any> 구조
   */
  async updateUserEntitlements(channelId, userId, entitlements) {
    const response = await api.put(`/v1/channels/${channelId}/users/${userId}/entitlements`, {
      entitlements
    });
    
    // ApiResponse<T> 구조 처리
    if (response.data.message === 'Success') {
      return response.data.data || { success: true };
    }
    
    // 에러 발생 시
    throw new Error(response.data.message || '이용권 수정에 실패했습니다.');
  },

  /**
   * 사용자 이용권 삭제
   * @param {number} channelId - 채널 ID
   * @param {number} userId - 사용자 ID
   * @param {string} entitlementId - 이용권 ID
   * @returns {Promise} API 응답 - ApiResponse<any> 구조
   */
  async deleteUserEntitlement(channelId, userId, entitlementId) {
    const response = await api.delete(`/v1/channels/${channelId}/users/${userId}/entitlements/${entitlementId}`);
    
    // ApiResponse<T> 구조 처리
    if (response.data.message === 'Success') {
      return response.data.data || { success: true };
    }
    
    // 에러 발생 시
    throw new Error(response.data.message || '이용권 삭제에 실패했습니다.');
  }
};

export default userService;