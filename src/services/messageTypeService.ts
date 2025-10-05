import api from './api';
import type {
  ApiResponse,
  MessageTypeResponse,
  MessageTypeRequest,
  MessageTypeInfoResponse
} from '../types';

export const messageTypeService = {
  // MessageType 조회 (기존 - 주제/맥락만)
  getMessageType: async (channelId: string, date: string): Promise<MessageTypeResponse | null> => {
    try {
      const response = await api.get<ApiResponse<MessageTypeResponse>>(
        `/v1/channels/${channelId}/messages/types?date=${date}`
      );
      return response.data.data;
    } catch (error: any) {
      // 404는 데이터가 없다는 뜻이므로 null 반환
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // MessageType 날짜별 상세 조회 (9개 레벨 contentInfo 포함)
  getMessageTypeByDate: async (channelId: string, dateInfo: string): Promise<MessageTypeInfoResponse | null> => {
    // dateInfo: "20250930" (yyyyMMdd 형식)
    const response = await api.get<ApiResponse<MessageTypeInfoResponse | null>>(
      `/v1/channels/${channelId}/messages/types/dates?dateInfo=${dateInfo}`
    );
    // 백엔드에서 데이터가 없으면 data: null 반환
    return response.data.data;
  },

  // MessageType 생성
  createMessageType: async (channelId: string, request: MessageTypeRequest): Promise<MessageTypeResponse> => {
    const response = await api.post<ApiResponse<MessageTypeResponse>>(
      `/v1/channels/${channelId}/messages/types`,
      request
    );
    return response.data.data;
  },

  // MessageType 수정
  updateMessageType: async (channelId: string, request: MessageTypeRequest): Promise<MessageTypeResponse> => {
    const response = await api.put<ApiResponse<MessageTypeResponse>>(
      `/v1/channels/${channelId}/messages/types`,
      request
    );
    return response.data.data;
  }
};