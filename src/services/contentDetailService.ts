import api from './api';
import type { ApiResponse, PageResponseDto, ChannelId } from '../types/common';
import type { ContentDetail, MessageLogDetail } from '../types/contentList';

/**
 * 콘텐츠 상세 조회
 * GET /v1/channels/{channelId}/messages/{messageId}
 */
export const getContentDetail = async (
  channelId: ChannelId,
  messageId: number
): Promise<ContentDetail> => {
  const response = await api.get<ApiResponse<ContentDetail>>(
    `/v1/channels/${channelId}/messages/${messageId}`
  );
  return response.data.data;
};

/**
 * 메시지 발송 상세 목록 조회 (페이징)
 * GET /v1/channels/{channelId}/messages/{messageId}/details
 */
export const getMessageDetails = async (
  channelId: ChannelId,
  messageId: number,
  page: number = 0,
  size: number = 20
): Promise<PageResponseDto<MessageLogDetail>> => {
  const response = await api.get<ApiResponse<PageResponseDto<MessageLogDetail>>>(
    `/v1/channels/${channelId}/messages/${messageId}/details`,
    {
      params: { page, size }
    }
  );
  return response.data.data;
};

/**
 * 콘텐츠 수정
 * PUT /v1/channels/{channelId}/messages/{messageId}
 */
export const updateContent = async (
  channelId: ChannelId,
  messageId: number,
  data: Partial<ContentDetail>
): Promise<ContentDetail> => {
  const response = await api.put<ApiResponse<ContentDetail>>(
    `/v1/channels/${channelId}/messages/${messageId}`,
    data
  );
  return response.data.data;
};

/**
 * 콘텐츠 삭제
 * DELETE /v1/channels/{channelId}/messages/{messageId}
 */
export const deleteContent = async (
  channelId: ChannelId,
  messageId: number
): Promise<void> => {
  await api.delete(`/v1/channels/${channelId}/messages/${messageId}`);
};

/**
 * 콘텐츠 테스트 발송
 * POST /v1/channels/{channelId}/messages/{messageId}/test
 */
export const testSendContent = async (
  channelId: ChannelId,
  messageId: number
): Promise<void> => {
  await api.post(`/v1/channels/${channelId}/messages/${messageId}/test`);
};
