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
  messageTarget: 'all' | 'groups';
  includeGroup: GroupId[]; // 포함할 그룹 ID들 (Long 배열)
  excludeGroup: GroupId[]; // 제외할 그룹 ID들 (Long 배열)
}

// 메시지 타겟 설정
export interface MessageTargetConfig {
  type: 'all' | 'groups';
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

// UTC 시간 변환 유틸 타입
export interface UTCTimeConverter {
  localToUTC: (localTime: string, timezone: string) => string;
  utcToLocal: (utcTime: string, timezone: string) => string;
}