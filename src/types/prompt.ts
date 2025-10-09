// 프롬프트 관련 타입 정의

// 프롬프트 타입
export enum PromptType {
  BASIC = 'BASIC',
  ADVANCE = 'ADVANCE'
}

// 프롬프트 목록 항목
export interface Prompt {
  id: number;
  prompt: string;
  type: PromptType;
  createdAt: string;
}

// 프롬프트 히스토리 항목
export interface PromptHistoryItem {
  id: number;
  label: string;
  selected: boolean;
  createdAt: string;
}

// 프롬프트 히스토리 응답
export interface PromptHistoryResponse {
  basicPrompt: PromptHistoryItem[];
  advancePrompt: PromptHistoryItem[];
}

// 프롬프트 생성 요청
export interface InsertPromptRequest {
  label: string;
  prompt: string;
  type: PromptType;
}

// 프롬프트 수정 요청
export interface UpdatePromptRequest {
  label: string;
  prompt: string;
}
