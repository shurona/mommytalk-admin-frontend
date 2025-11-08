import api from './api';
import {
  ChannelId,
  ApiResponse,
  Message,
  MessagesByDateResponse,
  ContentDeliveryRequest,
  ContentDeliveryResponse,
  DeliveryStatusResponse,
  AvailableDateResponse,
  TimeConfig,
  UTCTimeConverter,
  EstimateRecipientsRequest,
  EstimateRecipientsResponse
} from '../types';

// ZonedDateTime 생성 유틸리티
const createZonedDateTime = (date: string, time: string, timezone: string = 'Asia/Seoul'): string => {
  // date: "2024-03-22", time: "09:30"
  // 결과: "2024-03-22T09:30:00+09:00[Asia/Seoul]"
  if (!date || !time) {
    throw new Error(`Invalid input for ZonedDateTime: date=${date}, time=${time}`);
  }

  const timeParts = time.split(':');
  if (timeParts.length !== 2) {
    throw new Error(`Invalid time format: ${time}. Expected HH:MM`);
  }

  const [hour, minute] = timeParts;
  return `${date}T${hour.padStart(2, '0')}:${minute.padStart(2, '0')}:00+09:00[${timezone}]`;
};

const contentDeliveryService = {
  /**
   * 콘텐츠 발송 설정 및 예약
   * @param channelId - 채널 ID
   * @param request - 발송 설정 요청
   * @returns Promise<void> - 반환값 없음
   */
  scheduleContentDelivery: async (channelId: ChannelId, request: Omit<ContentDeliveryRequest, 'channelId'>): Promise<void> => {
    // 날짜 + 시간을 ZonedDateTime으로 결합
    const zonedDateTime = createZonedDateTime(request.deliveryDate, request.deliveryTime);

    const payload = {
      deliveryDate: request.deliveryDate,
      deliveryTime: zonedDateTime, // ZonedDateTime 형태로 전송
      messageTarget: request.messageTarget,
      includeGroupId: request.includeGroupId,
      includeCustomGroup: request.includeCustomGroup,
      excludeGroup: request.excludeGroup
    };

    console.log('contentDeliveryService payload:', payload);

    try {
      await api.post<ApiResponse<void>>(
        `/v1/channels/${channelId}/messages/schedule`,
        payload
      );
    } catch (error: any) {
      // HTTP 에러 처리
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || 'Unknown error';
        throw new Error(`서버 오류 발생 (${status}): ${message}`);
      }

      // 기타 에러 처리
      throw error;
    }
  },

  /**
   * 발송 가능한 날짜와 메시지 개수 조회
   * @param channelId - 채널 ID
   * @returns Promise<AvailableDateResponse[]> - 날짜와 메시지 개수 목록
   */
  getAvailableDeliveryDates: async (channelId: ChannelId): Promise<AvailableDateResponse[]> => {
    const response = await api.get<ApiResponse<AvailableDateResponse[]>>(
      `/v1/channels/${channelId}/messages/available-dates`
    );
    return response.data.data;
  },

  /**
   * 특정 날짜의 메시지 목록 조회 (임시 mock - 콘텐츠 목록에서 구현 예정)
   * @param channelId - 채널 ID
   * @param date - 조회할 날짜 (YYYY-MM-DD)
   * @returns Promise<Message[]>
   */
  getMessagesByDate: async (channelId: ChannelId, date: string): Promise<Message[]> => {
    // TODO: 콘텐츠 목록 구현 시 실제 API 연동
    return [
      {
        id: 1,
        name: `마미톡 365 - ${date}`,
        text: `Good day! 오늘(${date})의 메시지입니다.`,
        localDateTime: `${date}T09:00:00`
      },
      {
        id: 2,
        name: `마미톡 365+마미보카 - ${date}`,
        text: `Good morning! 오늘(${date})의 메시지+보카입니다.`,
        localDateTime: `${date}T09:00:00`
      }
    ];
  },

  /**
   * 예상 발송 대상 수 계산 (중복 제거)
   * @param channelId - 채널 ID
   * @param request - 메시지 타겟 설정
   * @returns Promise<EstimateRecipientsResponse> - 발송 대상 통계
   */
  estimateRecipients: async (channelId: ChannelId, request: EstimateRecipientsRequest): Promise<EstimateRecipientsResponse> => {
    const response = await api.post<ApiResponse<EstimateRecipientsResponse>>(
      `/v1/channels/${channelId}/user-groups/members/count`,
      request
    );
    return response.data.data;
  },

  /**
   * ZonedDateTime 생성 유틸리티 노출
   */
  createZonedDateTime
};

export { contentDeliveryService };
export default contentDeliveryService;