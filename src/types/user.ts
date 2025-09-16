// 사용자 관련 타입 정의
import { UserId, ChannelId, PhoneNumber, DateString } from './common';

// 기본 사용자 정보
export interface User {
  id: UserId;
  username: string;
  name: string;
  email: string;
  role: 'ADMIN';
}

// 채널 사용자 정보 (회원 관리용)
export interface ChannelUser {
  userId: UserId;
  phoneNumber: PhoneNumber;
  name?: string;
  email?: string;
  registeredAt: DateString;
  lastLoginAt?: DateString;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// 사용자 상세 정보
export interface UserDetail extends ChannelUser {
  subscriptions: UserSubscription[];
  groups: string[]; // 속해있는 그룹 ID들
}

// 사용자 이용권 정보
export interface UserSubscription {
  id: string;
  productName: string;
  startDate: DateString;
  endDate: DateString;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  autoRenewal: boolean;
}

// 사용자 목록 필터
export interface UserListFilter {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  searchTerm?: string;
  productName?: string;
  page?: number;
  size?: number;
}

// 사용자 목록 응답
export interface UserListResponse {
  users: ChannelUser[];
  totalCount: number;
}