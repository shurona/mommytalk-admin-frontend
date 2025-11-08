// 콘텐츠 목록 관련 타입 정의

// 콘텐츠 상태 enum
export enum ContentStatus {
  PREPARE = 'PREPARE',    // 대기중
  FAIL = 'FAIL',         // 실패
  COMPLETE = 'COMPLETE', // 완료
  CANCEL = 'CANCEL'      // 취소됨
}

// 콘텐츠 아이템
export interface ContentItem {
  id: number;
  theme: string;
  status: ContentStatus;
  createdAt: string;        // 등록일 (LocalDateTime)
  deliveryDate: string;     // 발송일 (LocalDateTime)
  totalCount: number;       // 메시지 전체 건수
  successCount: number;     // 성공 메시지 건수
  failCount: number;        // 실패 메시지 건수
}

// 콘텐츠 정보 (레벨별 메시지)
export interface ContentInfo {
  '1_1': string;
  '1_2': string;
  '1_3': string;
  '2_1': string;
  '2_2': string;
  '2_3': string;
  '3_1': string;
  '3_2': string;
  '3_3': string;
}

// 콘텐츠 상세 정보
export interface ContentDetail {
  id: number;
  theme: string;
  context: string;
  deliveryDate: string;
  status: ContentStatus;
  contentInfo: ContentInfo;
  createdAt: string;
  updatedAt: string;
}

// 메시지 발송 상태 (ContentStatus와 동일)
export enum MessageSendStatus {
  PREPARE = 'PREPARE',     // 대기중
  FAIL = 'FAIL',          // 실패
  COMPLETE = 'COMPLETE',  // 완료
  CANCEL = 'CANCEL'       // 취소됨
}

// 메시지 로그 상세 정보
export interface MessageLogDetail {
  id: number;
  snsId: string;           // SNS ID (LINE ID 등)
  userLevel: number;       // 사용자 레벨 (1-3)
  childLevel: number;      // 자녀 레벨 (1-3)
  sendStatus: MessageSendStatus;  // 발송 상태
  sentAt?: string;         // 발송 시간 (ISO 8601)
}

// 메시지 로그 목록 응답
export interface MessageLogListResponse {
  content: MessageLogDetail[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

// 메시지 발송 상태 한글 매핑
export const sendStatusLabels: Record<MessageSendStatus, string> = {
  [MessageSendStatus.PREPARE]: '대기중',
  [MessageSendStatus.FAIL]: '실패',
  [MessageSendStatus.COMPLETE]: '완료',
  [MessageSendStatus.CANCEL]: '취소됨'
};

// 메시지 발송 상태별 스타일 매핑
export const sendStatusStyles: Record<MessageSendStatus, string> = {
  [MessageSendStatus.PREPARE]: 'bg-blue-100 text-blue-800',
  [MessageSendStatus.FAIL]: 'bg-red-100 text-red-800',
  [MessageSendStatus.COMPLETE]: 'bg-green-100 text-green-800',
  [MessageSendStatus.CANCEL]: 'bg-gray-100 text-gray-800'
};

// 콘텐츠 목록 조회 파라미터
export interface ContentListParams {
  page?: number;        // 페이지 번호 (0부터 시작)
  size?: number;        // 페이지 크기 (기본값: 20)
  theme?: string;       // 주제 필터링
  status?: ContentStatus; // 상태 필터링
}

// 콘텐츠 목록 응답
export interface ContentListResponse {
  content: ContentItem[];
  page: number;           // 현재 페이지
  size: number;           // 페이지 크기
  totalElements: number;  // 총 개수
  totalPages: number;     // 총 페이지 수
}

// 상태 한글 매핑
export const statusLabels: Record<ContentStatus, string> = {
  [ContentStatus.PREPARE]: '대기중',
  [ContentStatus.FAIL]: '실패',
  [ContentStatus.COMPLETE]: '완료',
  [ContentStatus.CANCEL]: '취소됨'
};

// 상태별 스타일 매핑
export const statusStyles: Record<ContentStatus, string> = {
  [ContentStatus.PREPARE]: 'bg-blue-100 text-blue-800',
  [ContentStatus.FAIL]: 'bg-red-100 text-red-800',
  [ContentStatus.COMPLETE]: 'bg-green-100 text-green-800',
  [ContentStatus.CANCEL]: 'bg-gray-100 text-gray-800'
};