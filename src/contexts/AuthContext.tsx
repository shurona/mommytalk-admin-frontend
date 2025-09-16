import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { User, LoginRequest } from '../types';

// 인증 상태 타입
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 인증 액션 타입
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean };

// 로그인 결과 타입
interface LoginResult {
  success: boolean;
  error?: string;
}

// 컨텍스트 값 타입
interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

// AuthProvider Props 타입
interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// 인증 상태 액션 타입 상수
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START' as const,
  LOGIN_SUCCESS: 'LOGIN_SUCCESS' as const,
  LOGIN_FAILURE: 'LOGIN_FAILURE' as const,
  LOGOUT: 'LOGOUT' as const,
  SET_USER: 'SET_USER' as const,
  SET_LOADING: 'SET_LOADING' as const,
};

// 초기 상태
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// 리듀서
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
}

// AuthProvider 컴포넌트
export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 앱 시작 시 토큰 확인 및 사용자 정보 복원
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.hasValidToken()) {
          // 저장된 사용자 정보 먼저 복원
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: storedUser });
          }

          // 서버에서 최신 사용자 정보 가져오기 (옵션)
          try {
            const currentUser = await authService.getCurrentUser();
            dispatch({ type: AUTH_ACTIONS.SET_USER, payload: currentUser });
          } catch (error) {
            // 서버 요청 실패 시 저장된 정보 유지
            console.warn('Failed to fetch current user:', error);
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // 로그인 함수
  const login = async (credentials: LoginRequest): Promise<LoginResult> => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const { user } = await authService.login(credentials);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || '로그인에 실패했습니다.';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // 로그아웃 함수
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // 관리자 권한 확인 (단일 Admin 역할)
  const isAdmin = (): boolean => {
    return state.user?.role === 'ADMIN';
  };

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth 커스텀 훅
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}