// 콘텐츠 발송 설정 관련 타입 정의
import { ChannelId, GroupId, DateString } from './common';
import { UserGroup, UserGroupType } from './userGroup';

// 메시지 정보 (백엔드 Message 테이블)
export interface Message {
  id: number;
  name: string;
  text: string;
  localDateTime: string; // ISO datetime string
}

// 메시지 로그 (백엔드 MessageLog 테이블)
export interface MessageLog {
  id: number;
  messageId: number;
  groupId: number;
  status: MessageLogStatus;
  reserveTime: string; // ISO datetime string (UTC)
  sentTime?: string; // ISO datetime string (UTC)
  content: string;
}

// 메시지 로그 상태
export enum MessageLogStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

// 콘텐츠 발송 설정 요청
export interface ContentDeliveryRequest {
  deliveryDate: string; // YYYY-MM-DD format
  deliveryTime: string; // ZonedDateTime으로 변환됨 (2024-03-22T09:00:00+09:00[Asia/Seoul])
  messageTarget: 'all' | 'group';
  includeGroupId: GroupId | null; // 포함할 AUTO_ACTIVE 그룹 ID (단일, nullable)
  includeCustomGroup: GroupId[]; // 포함할 CUSTOM 그룹 ID들 (배열)
  excludeGroup: GroupId[]; // 제외할 그룹 ID들
}

// 메시지 타겟 설정
export interface MessageTargetConfig {
  type: 'all' | 'group';
  includedGroups: UserGroup[];
  excludedGroups: UserGroup[];
}

// 그룹 선택 옵션 (UI용)
export interface GroupOption {
  group: UserGroup;
  memberCount: number;
  friendCount: number;
  canInclude: boolean; // AUTO_ACTIVE, CUSTOM
  canExclude: boolean; // AUTO_ENDED, CUSTOM
}

// 시간 설정 (로컬 시간대)
export interface TimeConfig {
  hour: string; // "09"
  minute: string; // "30"
  timezone: string; // "Asia/Seoul"
}

// 발송 날짜별 메시지 조회 응답
export interface MessagesByDateResponse {
  date: string; // YYYY-MM-DD
  messages: Message[];
}

// 발송 가능한 날짜와 메시지 개수 응답
export interface AvailableDateResponse {
  date: string; // YYYY-MM-DD
  messageCount: number; // 메시지 개수
  theme?: string; // 주제 (optional)
}

// 콘텐츠 발송 설정 응답
export interface ContentDeliveryResponse {
  success: boolean;
  messageLogIds: number[];
  scheduledCount: number;
  estimatedRecipients: number;
}

// 발송 상태 조회 응답
export interface DeliveryStatusResponse {
  date: string;
  totalScheduled: number;
  totalSent: number;
  totalFailed: number;
  logs: MessageLog[];
}

// 예상 발송 대상 계산 요청
export interface EstimateRecipientsRequest {
  messageTarget: 'all' | 'group';
  includeGroupIds: GroupId[];  // 포함할 그룹 ID들 (AUTO_ACTIVE + CUSTOM)
  excludeGroupIds: GroupId[];  // 제외할 그룹 ID들
}

// 예상 발송 대상 계산 응답
export interface EstimateRecipientsResponse {
  totalRecipients: number;  // 중복 제거된 실제 발송 대상 수
  includedCount: number;    // 포함 그룹의 총 친구 수 (중복 포함)
  excludedCount: number;    // 제외 그룹의 총 친구 수 (중복 포함)
}

// UTC 시간 변환 유틸 타입
export interface UTCTimeConverter {
  localToUTC: (localTime: string, timezone: string) => string;
  utcToLocal: (utcTime: string, timezone: string) => string;
}