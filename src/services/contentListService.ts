import api from './api';
import type {
  ApiResponse,
  ContentListParams,
  ContentListResponse
} from '../types';

export const contentListService = {
  // 콘텐츠 목록 조회 (페이지네이션, 필터링 지원)
  getContentList: async (channelId: string, params?: ContentListParams): Promise<ContentListResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.theme) queryParams.append('theme', params.theme);
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    const url = `/v1/channels/${channelId}/messages${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<ApiResponse<ContentListResponse>>(url);
    return response.data.data;
  }
};