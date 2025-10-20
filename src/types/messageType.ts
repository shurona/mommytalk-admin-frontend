// MessageType 관련 타입 정의

// 9개 레벨별 콘텐츠 정보 (생성 및 승인 여부)
export interface MessageTypeContentInfo {
  '1_1'?: boolean; // true: 승인됨, false: 생성됨(미승인), undefined: 생성 안됨
  '1_2'?: boolean;
  '1_3'?: boolean;
  '2_1'?: boolean;
  '2_2'?: boolean;
  '2_3'?: boolean;
  '3_1'?: boolean;
  '3_2'?: boolean;
  '3_3'?: boolean;
}

// MessageType 날짜별 조회 응답
export interface MessageTypeInfoResponse {
  id: number;
  theme: string;
  context: string;
  contentInfo: MessageTypeContentInfo;
  createdAt: string;
  updatedAt: string;
}

// MessageType 응답 (기존 - 생성/수정용)
export interface MessageTypeResponse {
  id: number;            // messageType ID
  localDate: string;     // "2024-03-23"
  theme: string;         // "아침 인사"
  context: string;       // "아이가 일어나서 엄마와 인사하는 상황"
}

// MessageType 생성/수정 요청
export interface MessageTypeRequest {
  localDate: string;
  theme: string;
  context: string;
}