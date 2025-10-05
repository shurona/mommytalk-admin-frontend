import api from './api';
import {
  UserGroup,
  UserGroupDetail,
  CreateUserGroupRequest,
  UpdateGroupTitleRequest,
  AddUsersRequest,
  UserGroupType,
  ChannelId,
  GroupId,
  UserId,
  PhoneNumber,
  ApiResponse,
  PageResponseDto,
  GroupMember,
  GroupMemberFilter
} from '../types';

const userGroupService = {
  /**
   * 채널의 사용자 그룹 목록 조회
   * @param {ChannelId} channelId - 채널 ID
   * @returns {Promise<UserGroup[]>} 그룹 목록
   */
  getUserGroups: async (channelId: ChannelId): Promise<UserGroup[]> => {
    const response = await api.get<ApiResponse<PageResponseDto<UserGroup>>>(
      `/v1/channels/${channelId}/user-groups`
    );
    return response.data.data.content; // 페이징된 데이터에서 content 추출
  },

  /**
   * 사용자 그룹 상세 조회 (멤버 제외)
   * @param {ChannelId} channelId - 채널 ID
   * @param {GroupId} groupId - 그룹 ID
   * @returns {Promise<UserGroupDetail>} 그룹 상세 정보
   */
  getUserGroupDetail: async (channelId: ChannelId, groupId: GroupId): Promise<UserGroupDetail> => {
    const response = await api.get<ApiResponse<UserGroupDetail>>(
      `/v1/channels/${channelId}/user-groups/${groupId}`
    );
    return response.data.data;
  },

  /**
   * 그룹 멤버 목록 페이징 조회
   * @param {ChannelId} channelId - 채널 ID
   * @param {GroupId} groupId - 그룹 ID
   * @param {GroupMemberFilter} params - 필터 파라미터
   * @returns {Promise<PageResponseDto<GroupMember>>} 페이징된 멤버 목록
   */
  getGroupMembers: async (
    channelId: ChannelId,
    groupId: GroupId,
    params: GroupMemberFilter = {}
  ): Promise<PageResponseDto<GroupMember>> => {
    const { page = 0, size = 20, search, isFriend } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });

    if (search && search.trim()) {
      queryParams.append('search', search.trim());
    }

    if (isFriend !== undefined) {
      queryParams.append('isFriend', isFriend.toString());
    }

    const response = await api.get<ApiResponse<PageResponseDto<GroupMember>>>(
      `/v1/channels/${channelId}/user-groups/${groupId}/members?${queryParams}`
    );
    return response.data.data;
  },

  /**
   * 커스텀 그룹 생성
   * @param {ChannelId} channelId - 채널 ID
   * @param {string} title - 그룹 제목
   * @returns {Promise<UserGroup>} 생성된 그룹 정보
   */
  createCustomGroup: async (channelId: ChannelId, title: string): Promise<UserGroup> => {
    const request: CreateUserGroupRequest = {
      title,
      type: UserGroupType.CUSTOM
    };

    const response = await api.post<ApiResponse<UserGroup>>(
      `/v1/channels/${channelId}/user-groups`,
      request
    );
    return response.data.data;
  },

  /**
   * 그룹 제목 수정 (커스텀 그룹만)
   * @param {ChannelId} channelId - 채널 ID
   * @param {GroupId} groupId - 그룹 ID
   * @param {string} title - 새 제목
   * @returns {Promise<UserGroup>} 수정된 그룹 정보
   */
  updateGroupTitle: async (channelId: ChannelId, groupId: GroupId, title: string): Promise<UserGroup> => {
    const request: UpdateGroupTitleRequest = { title };

    const response = await api.put<ApiResponse<UserGroup>>(
      `/v1/channels/${channelId}/user-groups/${groupId}`,
      request
    );
    return response.data.data;
  },

  /**
   * 그룹에 사용자 다중 추가
   * @param {ChannelId} channelId - 채널 ID
   * @param {GroupId} groupId - 그룹 ID
   * @param {PhoneNumber[]} phoneNumbers - 전화번호 목록
   * @returns {Promise<any>} 추가 결과
   */
  addUsersToGroup: async (
    channelId: ChannelId,
    groupId: GroupId,
    phoneNumbers: PhoneNumber[]
  ): Promise<any> => {
    const request: AddUsersRequest = { phoneNumbers };

    const response = await api.post<ApiResponse<any>>(
      `/v1/channels/${channelId}/user-groups/${groupId}/members`,
      request
    );
    return response.data.data;
  },

  /**
   * 그룹에서 사용자 제거
   * @param {ChannelId} channelId - 채널 ID
   * @param {GroupId} groupId - 그룹 ID
   * @param {UserId} userId - 사용자 ID
   * @returns {Promise<any>} 제거 결과
   */
  removeUserFromGroup: async (channelId: ChannelId, groupId: GroupId, userId: UserId): Promise<any> => {
    const response = await api.delete<ApiResponse<any>>(
      `/v1/channels/${channelId}/user-groups/${groupId}/members/${userId}`
    );
    return response.data;
  },

  /**
   * 커스텀 그룹 삭제
   * @param {ChannelId} channelId - 채널 ID
   * @param {GroupId} groupId - 그룹 ID
   * @returns {Promise<any>} 삭제 결과
   */
  deleteCustomGroup: async (channelId: ChannelId, groupId: GroupId): Promise<any> => {
    const response = await api.delete<ApiResponse<any>>(
      `/v1/channels/${channelId}/user-groups/${groupId}`
    );
    return response.data;
  }
};

export { userGroupService };
export default userGroupService;