import api from './api';
import type {
  ApiResponse,
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentCountResponse,
  ContentUpdateRequest,
  ContentTestRequest,
  ContentActionResponse
} from '../types';

export const contentGenerationService = {
  // 특정 날짜의 콘텐츠 카운트 조회
  getContentsByDate: async (channelId: string, date: string): Promise<ContentCountResponse> => {
    const response = await api.get<ApiResponse<ContentCountResponse>>(
      `/v1/channels/${channelId}/contents/status?date=${date}`
    );
    return response.data.data;
  },

  // AI 콘텐츠 생성
  generateContent: async (channelId: string, request: ContentGenerationRequest): Promise<ContentGenerationResponse> => {
    const response = await api.post<ApiResponse<ContentGenerationResponse>>(
      `/v1/channels/${channelId}/contents/generate`,
      request
    );
    return response.data.data;
  },

  // 콘텐츠 내용 수정 (upsert)
  updateContent: async (channelId: string, request: ContentUpdateRequest): Promise<ContentActionResponse> => {
    const response = await api.post<ApiResponse<ContentActionResponse>>(
      `/v1/channels/${channelId}/contents`,
      request
    );
    return response.data.data;
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
  }
};