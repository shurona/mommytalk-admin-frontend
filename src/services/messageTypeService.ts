import api from './api';
import type {
  ApiResponse,
  MessageTypeResponse,
  MessageTypeRequest
} from '../types';

export const messageTypeService = {
  // MessageType 조회
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