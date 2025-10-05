// 공통 타입 정의

// API 응답 공통 구조
export interface ApiResponse<T = any> {
  message: string;
  data: T;
}

// 페이징 응답 구조
export interface PageResponseDto<T> {
  content: T[];
  page: number;          // 현재 페이지
  size: number;          // 현재 사이즈
  totalElements: number; // 총 갯수
  totalPages: number;    // 총 페이지
  number?: number;        // 현재 페이지 (page와 동일, Spring 호환용 옵션)
  hasPrevious?: boolean;  // 이전 페이지 존재 여부 (계산 가능)
  hasNext?: boolean;      // 다음 페이지 존재 여부 (계산 가능)
}

// 날짜 문자열 타입 (ISO 8601 형식)
export type DateString = string; // "2024-03-22T09:00:00Z"

// ID 타입들
export type UserId = number;
export type GroupId = number; // Long 타입 (Java)
export type ChannelId = string;

// 전화번호 타입
export type PhoneNumber = string; // "010-1234-5678"