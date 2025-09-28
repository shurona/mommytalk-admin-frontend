import api from './api';
import type {
  ApiResponse,
  ContentGenerationRequest,
  ContentGenerationResponse,
  ContentListResponse,
  ContentUpdateRequest,
  ContentTestRequest,
  ContentApprovalRequest,
  ContentActionResponse
} from '../types';

export const contentGenerationService = {
  // 특정 날짜의 콘텐츠 목록 조회
  getContentsByDate: async (channelId: string, date: string): Promise<ContentListResponse> => {
    const response = await api.get<ApiResponse<ContentListResponse>>(
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

  // 콘텐츠 내용 수정
  updateContent: async (channelId: string, contentId: number, request: ContentUpdateRequest): Promise<ContentActionResponse> => {
    const response = await api.put<ApiResponse<ContentActionResponse>>(
      `/v1/channels/${channelId}/contents/${contentId}`,
      request
    );
    return response.data.data;
  },

  // 테스트 발송
  testContent: async (channelId: string, contentId: number): Promise<ContentActionResponse> => {
    const response = await api.post<ApiResponse<ContentActionResponse>>(
      `/v1/channels/${channelId}/contents/${contentId}/test`
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