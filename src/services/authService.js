import api from './api.js';

export const authService = {
  // 로그인
  async login(credentials) {
    const response = await api.post('/admin/v1/auth/login', credentials);
    const { accessToken, user } = response.data;

    // 토큰 및 사용자 정보 저장
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));

    return { accessToken, user };
  },

  // 로그아웃
  async logout() {
    try {
      await api.post('/admin/v1/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // 로컬 스토리지 정리
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
    }
  },

  // 현재 사용자 정보 조회
  async getCurrentUser() {
    const response = await api.get('/admin/v1/auth/me');
    const user = response.data;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  },

  // 로컬 스토리지에서 사용자 정보 가져오기
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // 토큰 존재 여부 확인
  hasValidToken() {
    const token = localStorage.getItem('accessToken');
    return !!token;
  },

  // 관리자 권한 확인 (Admin 역할 하나만 확인)
  isAdmin() {
    const user = this.getStoredUser();
    return user?.role === 'ADMIN' || user?.roles?.includes('ADMIN');
  },
};