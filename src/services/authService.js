import api from './api.js';

export const authService = {
  // 로그인
  async login(credentials) {
    const response = await api.post('/admin/v1/auth/login', credentials);
    
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

  // 로그아웃
  async logout() {
    try {
      const response = await api.post('/admin/v1/auth/logout');
      
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

  // 현재 사용자 정보 조회
  async getCurrentUser() {
    const response = await api.get('/admin/v1/auth/me');
    
    // ApiResponse<T> 구조에서 data 추출
    if (response.data.message === 'Success' && response.data.data) {
      const user = response.data.data;
      localStorage.setItem('user', JSON.stringify(user));
      return user;
    }
    
    // 에러 발생 시
    throw new Error(response.data.message || '사용자 정보를 불러올 수 없습니다.');
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