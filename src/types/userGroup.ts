// 사용자 그룹 관련 타입 정의
import { GroupId, ChannelId, UserId, PhoneNumber, DateString } from './common';

// 그룹 타입 enum
export enum UserGroupType {
  CUSTOM = 'CUSTOM',
  AUTO_ACTIVE = 'AUTO_ACTIVE',
  AUTO_ENDED = 'AUTO_ENDED'
}

// 기본 그룹 정보
export interface UserGroup {
  id: GroupId;
  title: string;
  type: UserGroupType;
  product?: string; // 자동 그룹의 경우에만 존재
  createdAt: DateString;
  updatedAt: DateString;
  memberCount: number;
  friendCount: number;
}

// 그룹 상세 정보 (멤버 포함)
export interface UserGroupDetail extends UserGroup {
  members: GroupMember[];
}

// 그룹 멤버 정보
export interface GroupMember {
  userId: UserId;
  phoneNumber: PhoneNumber;
  name?: string;
  isFriend: boolean;
  registeredAt: DateString;
}

// 그룹 생성 요청
export interface CreateUserGroupRequest {
  title: string;
  type: UserGroupType;
}

// 그룹 제목 수정 요청
export interface UpdateGroupTitleRequest {
  title: string;
}

// 사용자 추가 요청 (단일)
export interface AddUserRequest {
  phoneNumber: PhoneNumber;
}

// 사용자 다중 추가 요청
export interface AddUsersRequest {
  phoneNumbers: PhoneNumber[];
}

// 그룹 목록 응답
export type UserGroupListResponse = UserGroup[];

// 그룹 상세 응답
export type UserGroupDetailResponse = UserGroupDetail;

// 상품별 자동 그룹 맵
export interface ProductAutoGroupMap {
  [productName: string]: {
    active: UserGroup[];
    ended: UserGroup[];
  };
}

// 그룹 관리 뷰 상태
export interface GroupViewState {
  mode: 'list' | 'detail';
  id: GroupId | null;
}

// 그룹 관리 컴포넌트 Props
export interface ServiceGroupsProps {
  selectedChannel: import('./channel').Channel | null;
}