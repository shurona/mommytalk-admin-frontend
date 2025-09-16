// API 관련 타입 정의
import { ApiResponse, PageResponseDto } from './common';

// Axios 설정 타입
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// API 에러 타입
export interface ApiError {
  message: string;
  status?: number;
  data?: any;
}

// 공통 API 응답 타입들
export type ApiSuccessResponse<T> = ApiResponse<T>;
export type ApiPagedResponse<T> = ApiResponse<PageResponseDto<T>>;
export type ApiErrorResponse = ApiResponse<null>;

// HTTP 메소드 타입
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API 요청 옵션
export interface RequestOptions {
  params?: Record<string, any>;
  timeout?: number;
  headers?: Record<string, string>;
}