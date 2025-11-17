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
  signupAt?: DateString;
  registeredAt?: DateString;
  lastLoginAt?: DateString;
  latestPurchaseAt?: DateString;
  latestProductName?: string;
  socialId?: string;
  userLevel?: number;
  childLevel?: number;
  childName?: string;
  purchaseCount?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// 사용자 상세 정보
export interface UserDetail extends ChannelUser {
  entitlements?: UserSubscription[];
  subscriptions?: UserSubscription[];
  groups?: string[]; // 속해있는 그룹 ID들
}

// 사용자 이용권 정보 (기존 - UserDetail에서 사용)
export interface UserSubscription {
  userEntitlementId: number;       // UserEntitlement ID (관계 ID)
  entitlementId: number;            // Entitlement ID (상품 ID)
  entitlementName: string;          // 상품명
  serviceStart: string;             // 시작일 (YYYY-MM-DD)
  serviceEnd: string;               // 종료일 (YYYY-MM-DD)
  status: 'active' | 'inactive' | 'expired';  // 소문자 상태값
}

// 상품권 (Entitlement) - 마스터 데이터
export interface Entitlement {
  id: number;
  name: string;
  type: 'MOMMYTALK' | 'MOMMYVOCA';
}

// 유저 상품권 (UserEntitlement)
export interface UserEntitlement {
  userEntitlementId: number;  // UserEntitlement ID (관계 ID)
  userId: UserId;
  userGroupId?: number | null;  // UserGroup ID (nullable)
  groupId?: number | null;      // Group ID (nullable)
  entitlementId: number;        // Entitlement ID
  entitlementName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

// 유저 상품권 추가 요청
export interface AddUserEntitlementRequest {
  userId: UserId;
  channelId: ChannelId;
  entitlementId: number;
  status: 'ACTIVE' | 'INACTIVE';
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}

// 유저 상품권 수정 요청
export interface UpdateUserEntitlementRequest {
  status?: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  endDate: string;  // YYYY-MM-DD (필수, 과거 날짜 불가)
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