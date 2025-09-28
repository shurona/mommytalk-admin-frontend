// 콘텐츠 생성 관련 타입 정의

export interface ContentGenerationRequest {
  theme: string;
  context: string;
  deliveryDate: string; // YYYY-MM-DD 형식
  childLevel: number; // 1-3
  userLevel: number; // 1-3 (momLevel → userLevel)
  language: 'KOR' | 'JPN';
  regenerate?: boolean; // true: AI 재생성, false/undefined: 조회 및 생성
}

export interface GeneratedContent {
  id: number;
  theme: string;
  context: string;
  deliveryDate: string;
  childLevel: number;
  momLevel: number;
  language: 'KOR' | 'JPN';
  messageText: string;
  momAudioUrl?: string; // Mock URL
  childAudioUrl?: string; // Mock URL
  vocaUrl?: string;
  diaryUrl?: string;
  status: 'generated' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface ContentListResponse {
  generatedCount: number;
  approvedCount: number;
}

export interface ContentUpdateRequest {
  messageText?: string;
  vocaUrl?: string;
  diaryUrl?: string;
}

export interface ContentTestRequest {
  contentId: number;
}

export interface ContentApprovalRequest {
  contentId: number;
}

// API 응답 타입들
export interface ContentGenerationResponse {
  content: GeneratedContent;
}

export interface ContentActionResponse {
  success: boolean;
  message: string;
}