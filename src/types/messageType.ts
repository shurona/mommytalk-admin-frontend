// MessageType 관련 타입 정의

// MessageType 응답
export interface MessageTypeResponse {
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