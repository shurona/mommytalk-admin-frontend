import api from './api';
import {
  LoginRequest,
  LoginResponse,
  User,
  MeResponse,
  ApiResponse
} from '../types';

export const authService = {
  /**
   * 로그인
   * @param {LoginRequest} credentials - 로그인 자격 증명
   * @returns {Promise<LoginResponse>} 로그인 응답 (토큰 + 사용자 정보)
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/admin/v1/auth/login', credentials);

    // ApiResponse<T> 구조 처리
    if (response.data.message === 'Success' && response.data.data) {
      const { accessToken, user } = response.data.data;

      // 토큰 및 사용자 정보 저장
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      return { accessToken, user };
    }

    // 에러 발생 시
    throw new Error(response.data.message || '로그인에 실패했습니다.');
  },

  /**
   * 로그아웃
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    try {
      const response = await api.post<ApiResponse<any>>('/admin/v1/auth/logout');

      // ApiResponse<T> 구조 처리 (로그아웃 성공 여부 관계없이 로컬 스토리지 정리)
      if (response.data.message !== 'Success') {
        console.warn('Logout API warning:', response.data.message);
      }
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // 로컬 스토리지 정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * 현재 사용자 정보 조회
   * @returns {Promise<User>} 현재 사용자 정보
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<MeResponse>>('/admin/v1/auth/me');

    // ApiResponse<T> 구조에서 data 추출
    if (response.data.message === 'Success' && response.data.data) {
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }

    // 에러 발생 시
    throw new Error(response.data.message || '사용자 정보를 불러올 수 없습니다.');
  },

  /**
   * 로컬 스토리지에서 사용자 정보 가져오기
   * @returns {User | null} 저장된 사용자 정보
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) as User : null;
  },

  /**
   * 토큰 존재 여부 확인
   * @returns {boolean} 토큰 유효성
   */
  hasValidToken(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  },

  /**
   * 관리자 권한 확인 (Admin 역할 하나만 확인)
   * @returns {boolean} 관리자 여부
   */
  isAdmin(): boolean {
    const user = this.getStoredUser();
    return user?.role === 'ADMIN';
  }
};

export default authService;