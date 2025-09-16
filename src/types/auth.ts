// 인증 관련 타입 정의
import { User } from './user';

// 로그인 요청
export interface LoginRequest {
  username: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse {
  accessToken: string;
  user: User;
}

// 현재 사용자 정보 응답
export type MeResponse = User;

// 인증 컨텍스트 상태
export interface AuthContextState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// 인증 컨텍스트 액션들
export interface AuthContextActions {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<User>;
}

// 인증 컨텍스트 타입
export interface AuthContextType extends AuthContextState, AuthContextActions {}

// JWT 토큰 payload (참고용)
export interface JWTPayload {
  sub: string; // user ID
  username: string;
  role: string;
  iat: number; // issued at
  exp: number; // expires at
}