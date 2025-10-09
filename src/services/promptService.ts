import api from './api';
import { ApiResponse, ChannelId } from '../types';
import {
  Prompt,
  PromptHistoryResponse,
  InsertPromptRequest,
  UpdatePromptRequest
} from '../types/prompt';

/**
 * 프롬프트 관련 API 서비스
 */
export const promptService = {
  /**
   * 채널의 프롬프트 목록 조회
   * @param {ChannelId} channelId - 채널 ID
   * @returns {Promise<Prompt[]>} 프롬프트 목록 (BASIC, ADVANCE)
   */
  async getPrompts(channelId: ChannelId): Promise<Prompt[]> {
    const response = await api.get<ApiResponse<Prompt[]>>(
      `/v1/channels/${channelId}/prompt`
    );
    return response.data.data;
  },

  /**
   * 프롬프트 단일 조회
   * @param {ChannelId} channelId - 채널 ID
   * @param {number} promptId - 프롬프트 ID
   * @returns {Promise<Prompt>} 프롬프트 상세 정보
   */
  async getPromptById(channelId: ChannelId, promptId: number): Promise<Prompt> {
    const response = await api.get<ApiResponse<Prompt>>(
      `/v1/channels/${channelId}/prompt/${promptId}`
    );
    return response.data.data;
  },

  /**
   * 채널의 프롬프트 히스토리 조회
   * @param {ChannelId} channelId - 채널 ID
   * @returns {Promise<PromptHistoryResponse>} 프롬프트 히스토리 (BASIC, ADVANCE 분리)
   */
  async getPromptHistory(channelId: ChannelId): Promise<PromptHistoryResponse> {
    const response = await api.get<ApiResponse<PromptHistoryResponse>>(
      `/v1/channels/${channelId}/prompt/history`
    );
    return response.data.data;
  },

  /**
   * 프롬프트 생성
   * @param {ChannelId} channelId - 채널 ID
   * @param {InsertPromptRequest} request - 프롬프트 생성 요청
   * @returns {Promise<number>} 생성된 프롬프트 ID
   */
  async insertPrompt(channelId: ChannelId, request: InsertPromptRequest): Promise<number> {
    const response = await api.post<ApiResponse<number>>(
      `/v1/channels/${channelId}/prompt`,
      request
    );
    return response.data.data;
  },

  /**
   * 프롬프트 수정
   * @param {ChannelId} channelId - 채널 ID
   * @param {number} promptId - 프롬프트 ID
   * @param {UpdatePromptRequest} request - 프롬프트 수정 요청
   * @returns {Promise<number>} 수정된 프롬프트 ID
   */
  async updatePrompt(
    channelId: ChannelId,
    promptId: number,
    request: UpdatePromptRequest
  ): Promise<number> {
    const response = await api.put<ApiResponse<number>>(
      `/v1/channels/${channelId}/prompt/${promptId}`,
      request
    );
    return response.data.data;
  },

  /**
   * 프롬프트 등록 (선택/활성화)
   * @param {ChannelId} channelId - 채널 ID
   * @param {number} promptId - 프롬프트 ID
   * @returns {Promise<number>} 등록된 프롬프트 ID
   */
  async registerPrompt(channelId: ChannelId, promptId: number): Promise<number> {
    const response = await api.patch<ApiResponse<number>>(
      `/v1/channels/${channelId}/prompt/${promptId}/register`
    );
    return response.data.data;
  }
};

export default promptService;
