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
  createdAt: string;        // 등록일 (ISO 8601)
  deliveryDate: string;    // 발송 예정일
}

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