import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/authService.js';

const AuthContext = createContext();

// 인증 상태 액션 타입
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
};

// 초기 상태
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// 리듀서
function authReducer(state, action) {
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
export function AuthProvider({ children }) {
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
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const { user } = await authService.login(credentials);
      dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: user });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || '로그인에 실패했습니다.';
      dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // 관리자 권한 확인 (단일 Admin 역할)
  const isAdmin = () => {
    return state.user?.role === 'ADMIN' || state.user?.roles?.includes('ADMIN');
  };

  const value = {
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
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}