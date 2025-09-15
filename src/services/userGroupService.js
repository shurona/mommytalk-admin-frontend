import api from './api.js';

const userGroupService = {
  // 채널의 사용자 그룹 목록 조회
  getUserGroups: async (channelId) => {
    const response = await api.get(`/v1/channels/${channelId}/user-groups`);
    return response.data.data.content; // 페이징된 데이터에서 content 추출
  },

  // 사용자 그룹 상세 조회 (멤버 포함)
  getUserGroupDetail: async (channelId, groupId) => {
    const response = await api.get(`/v1/channels/${channelId}/user-groups/${groupId}`);
    return response.data.data;
  },

  // 커스텀 그룹 생성
  createCustomGroup: async (channelId, title) => {
    const response = await api.post(`/v1/channels/${channelId}/user-groups`, {
      title,
      type: 'CUSTOM'
    });
    return response.data.data;
  },

  // 그룹 제목 수정 (커스텀 그룹만)
  updateGroupTitle: async (channelId, groupId, title) => {
    const response = await api.put(`/v1/channels/${channelId}/user-groups/${groupId}`, {
      title
    });
    return response.data.data;
  },

  // 그룹에 사용자 추가 (다중)
  addUsersToGroup: async (channelId, groupId, phoneNumbers) => {
    const response = await api.post(`/v1/channels/${channelId}/user-groups/${groupId}/members`, {
      phoneNumbers
    });
    return response.data.data;
  },

  // 그룹에서 사용자 제거
  removeUserFromGroup: async (channelId, groupId, userId) => {
    const response = await api.delete(`/v1/channels/${channelId}/user-groups/${groupId}/members/${userId}`);
    return response.data;
  },

  // 커스텀 그룹 삭제
  deleteCustomGroup: async (channelId, groupId) => {
    const response = await api.delete(`/v1/channels/${channelId}/user-groups/${groupId}`);
    return response.data;
  }
};

export { userGroupService };