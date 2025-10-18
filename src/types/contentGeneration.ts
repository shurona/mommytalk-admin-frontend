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
  language: string;
  messageText: string;
  momAudioUrl: string;
  momAudioText: string;
  childAudioUrl: string;
  childAudioText: string;
  vocaUrl: string | null;
  diaryUrl: string;
  status: 'generated' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface ContentCountResponse {
  generatedCount: number;
  approvedCount: number;
}

export interface ContentUpdateRequest {
  messageTypeId: number;
  userLevel: number; // 1-3
  childLevel: number; // 1-3
  content: string; // 메시지 내용
  diaryUrl: string; // 다이어리 URL
  // 추후 추가 예정: momAudioUrl, childAudioUrl, vocaUrl 등
}

export interface ContentTestRequest {
  content: string; // 메시지 내용
  // 추후 추가 예정: diary, momAudioUrl, childAudioUrl 등
}

export interface ContentApprovalRequest {
  contentId: number;
}

// API 응답 타입들
export interface ContentGenerationResponse {
  contentId: number; // 생성/수정 시 contentId만 반환
}

export interface ContentDetailResponse {
  content: GeneratedContent; // 단일 조회 시 전체 정보 반환
}

export interface ContentActionResponse {
  success: boolean;
  message: string;
}

// 오디오 역할 (엄마/아이)
export type AudioRole = 'MOMMY' | 'CHILD';

// 오디오 생성 요청
export interface ContentAudioRequest {
  text: string;
  modelId: string;
  messageContentId: number;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speed?: number;
  speakerBoost?: boolean;
  audioRole: AudioRole;
}

// 오디오 생성 응답
export interface MessageContentAudioResponse {
  fileUrl: string;
  fileName: string;
}