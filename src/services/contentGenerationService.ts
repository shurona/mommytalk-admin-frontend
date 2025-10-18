import api from './api';
import type {
  ApiResponse,
  ContentGenerationRequest,
  GeneratedContent,
  ContentCountResponse,
  ContentUpdateRequest,
  ContentTestRequest,
  ContentActionResponse,
  ContentAudioRequest,
  MessageContentAudioResponse
} from '../types';
import voiceModels from '../config/voiceModels.json';

export const contentGenerationService = {
  // 특정 날짜의 콘텐츠 카운트 조회
  getContentsByDate: async (channelId: string, date: string): Promise<ContentCountResponse> => {
    const response = await api.get<ApiResponse<ContentCountResponse>>(
      `/v1/channels/${channelId}/contents/status?date=${date}`
    );
    return response.data.data;
  },

  // AI 콘텐츠 생성
  generateContent: async (channelId: string, request: ContentGenerationRequest): Promise<number> => {
    const response = await api.post<ApiResponse<number>>(
      `/v1/channels/${channelId}/contents/generate`,
      request
    );
    return response.data.data; // contentId 숫자 반환
  },

  // 콘텐츠 단일 조회
  getContentDetail: async (channelId: string, contentId: number): Promise<GeneratedContent> => {
    const response = await api.get<ApiResponse<GeneratedContent>>(
      `/v1/channels/${channelId}/contents/${contentId}`
    );
    return response.data.data;
  },

  // 콘텐츠 내용 수정 (upsert)
  updateContent: async (channelId: string, request: ContentUpdateRequest): Promise<number> => {
    const response = await api.post<ApiResponse<number>>(
      `/v1/channels/${channelId}/contents`,
      request
    );
    return response.data.data; // contentId 숫자 반환
  },

  // 테스트 발송
  testContent: async (channelId: string, request: ContentTestRequest): Promise<ContentActionResponse> => {
    const response = await api.post<ApiResponse<ContentActionResponse>>(
      `/v1/channels/${channelId}/contents/test`,
      request
    );
    return response.data.data;
  },

  // 콘텐츠 승인
  approveContent: async (channelId: string, contentId: number): Promise<ContentActionResponse> => {
    const response = await api.patch<ApiResponse<ContentActionResponse>>(
      `/v1/channels/${channelId}/contents/${contentId}/approve`
    );
    return response.data.data;
  },

  // 오디오 생성
  generateAudio: async (
    channelId: string,
    contentId: number,
    voiceId: string,
    request: Omit<ContentAudioRequest, 'modelId'>
  ): Promise<MessageContentAudioResponse> => {
    // voiceModels에서 modelId 가져오기 (기본값: sarah_f)
    const modelId = (voiceModels as Record<string, string>)[voiceId] || voiceModels.sarah_f;

    const fullRequest: ContentAudioRequest = {
      ...request,
      modelId
    };

    const response = await api.post<ApiResponse<MessageContentAudioResponse>>(
      `/v1/channels/${channelId}/contents/${contentId}/audio`,
      fullRequest
    );
    return response.data.data;
  }
};