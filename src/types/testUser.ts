/**
 * 테스트 유저 관련 타입 정의
 */

/**
 * 테스트 유저 정보
 */
export interface TestUser {
  id: number;
  phoneNumber: string;
  socialId: string;
}

/**
 * 테스트 유저 추가 요청
 */
export interface AddTestUserRequest {
  phoneNumber: string;
}
