import { useState, useEffect } from "react";
import { userService } from '../services/userService';
import { Trash2, Plus, Edit, X, Search } from 'lucide-react';
import {
  ChannelUser,
  UserDetail,
  Channel,
  PageResponseDto
} from '../types';

interface AllUsersProps {
  selectedChannel: Channel | null;
}

interface PaginationState {
  number: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

interface UserEditState {
  userId: number;
  phoneNumber: string;
  userLevel: number;
  childLevel: number;
  childName: string;
}

interface EntitlementEditState {
  userId: number;
  entitlements: {
    id?: number;
    productName: string;
    serviceStart: string;
    serviceEnd: string;
    status: string;
  }[];
}

interface ErrorAlertProps {
  message: string;
  onClose: () => void;
}

export default function AllUsers({ selectedChannel }: AllUsersProps) {
  const [usersData, setUsersData] = useState<ChannelUser[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    number: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false
  });

  const [q, setQ] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const pageSize = 20;

  // 상세 정보 관련 상태
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // 편집 관련 상태
  const [userEdit, setUserEdit] = useState<UserEditState | null>(null);
  const [savingUser, setSavingUser] = useState<boolean>(false);
  const [entitlementEdit, setEntitlementEdit] = useState<EntitlementEditState | null>(null);
  const [savingEntitlements, setSavingEntitlements] = useState<boolean>(false);

  // API 호출 함수들
  const loadUsers = async (page = 0, search = ''): Promise<void> => {
    if (!selectedChannel?.channelId) {
      setUsersData([]);
      setPagination({ number: 0, totalPages: 0, hasPrevious: false, hasNext: false });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response: PageResponseDto<ChannelUser> = await userService.getUsers(selectedChannel.channelId, {
        page,
        size: pageSize,
        searchTerm: search.trim() || undefined
      });

      console.log('API Response:', response);
      setUsersData(response.content);

      const currentPage = response.page ?? 0;
      const total = response.totalPages ?? 1;

      setPagination({
        number: currentPage,
        totalPages: total,
        hasPrevious: currentPage > 0,
        hasNext: currentPage < total - 1
      });
    } catch (err: any) {
      setError(err.response?.data?.message || '사용자 목록을 불러오는데 실패했습니다.');
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (selectedChannel?.channelId) {
      setCurrentPage(0);
      setSelectedUserId(null);
      setSelectedUser(null);
      loadUsers(0, q);
    }
  }, [selectedChannel?.channelId]);

  // 페이지 변경 시에만 로드 (채널이 있고, 페이지가 0이 아닌 경우만)
  useEffect(() => {
    if (selectedChannel?.channelId && currentPage > 0) {
      loadUsers(currentPage, q);
    }
  }, [currentPage]);

  // 검색 실행
  const handleSearch = (): void => {
    if (currentPage === 0) {
      // 이미 0페이지면 직접 호출
      loadUsers(0, q);
    } else {
      // 0이 아니면 setCurrentPage(0)으로 useEffect 트리거
      setCurrentPage(0);
    }
  };

  // 엔터 키 입력 시 검색
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 페이지 변경
  const handlePageChange = (newPage: number): void => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 사용자 상세 정보 로드
  const loadUserDetail = async (userId: number): Promise<void> => {
    if (!selectedChannel?.channelId) return;

    try {
      setLoadingDetail(true);
      const user = await userService.getUserById(selectedChannel.channelId, userId);
      setSelectedUser(user);
    } catch (err: any) {
      setError(err.response?.data?.message || '사용자 상세 정보를 불러오는데 실패했습니다.');
      console.error('Failed to load user detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 사용자 선택
  const handleUserSelect = (userId: number): void => {
    setSelectedUserId(userId);
    if (userId) {
      loadUserDetail(userId);
    } else {
      setSelectedUser(null);
    }
  };

  // 사용자 편집
  const startUserEdit = (user: UserDetail): void => {
    setUserEdit({
      userId: user.userId,
      phoneNumber: user.phoneNumber || '',
      userLevel: user.userLevel ?? 1,
      childLevel: user.childLevel ?? 1,
      childName: user.childName || ''
    });
  };

  const saveUserEdit = async (): Promise<void> => {
    if (!userEdit) return;

    try {
      setSavingUser(true);
      await userService.updateUser(selectedChannel!.channelId, userEdit.userId, {
        phoneNumber: userEdit.phoneNumber,
        userLevel: userEdit.userLevel,
        childLevel: userEdit.childLevel,
        childName: userEdit.childName
      });

      // 목록 및 상세정보 새로고침
      await loadUsers(currentPage, q);
      if (selectedUserId) {
        await loadUserDetail(selectedUserId);
      }

      setUserEdit(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '사용자 정보 수정에 실패했습니다.');
      console.error('Failed to update user:', err);
    } finally {
      setSavingUser(false);
    }
  };

  // 이용권 편집
  const startEntitlementEdit = (user: UserDetail): void => {
    setEntitlementEdit({
      userId: user.userId,
      entitlements: (user.entitlements || []).map(ent => ({
        id: ent.id,
        productName: ent.productName,
        serviceStart: ent.serviceStart,
        serviceEnd: ent.serviceEnd,
        status: ent.status
      }))
    });
  };

  const updateEntitlement = (index: number, field: string, value: string): void => {
    setEntitlementEdit(prev => prev ? ({
      ...prev,
      entitlements: prev.entitlements.map((ent, i) =>
        i === index ? { ...ent, [field]: value } : ent
      )
    }) : null);
  };

  const addEntitlement = (): void => {
    setEntitlementEdit(prev => prev ? ({
      ...prev,
      entitlements: [...prev.entitlements, {
        productName: '',
        serviceStart: '',
        serviceEnd: '',
        status: 'active'
      }]
    }) : null);
  };

  const removeEntitlement = (index: number): void => {
    setEntitlementEdit(prev => prev ? ({
      ...prev,
      entitlements: prev.entitlements.filter((_, i) => i !== index)
    }) : null);
  };

  const saveEntitlements = async (): Promise<void> => {
    if (!entitlementEdit) return;

    try {
      setSavingEntitlements(true);
      await userService.updateUserEntitlements(selectedChannel!.channelId, entitlementEdit.userId, entitlementEdit.entitlements);

      // 목록 및 상세정보 새로고침
      await loadUsers(currentPage, q);
      if (selectedUserId) {
        await loadUserDetail(selectedUserId);
      }

      setEntitlementEdit(null);
    } catch (err: any) {
      setError(err.response?.data?.message || '이용권 정보 수정에 실패했습니다.');
      console.error('Failed to update entitlements:', err);
    } finally {
      setSavingEntitlements(false);
    }
  };

  const deleteEntitlement = async (entitlementId: number): Promise<void> => {
    if (!selectedUserId || !entitlementId) return;

    if (!confirm('이용권을 삭제하시겠습니까?')) return;

    try {
      await userService.deleteUserEntitlement(selectedChannel!.channelId, selectedUserId, entitlementId);

      // 목록 및 상세정보 새로고침
      await loadUsers(currentPage, q);
      if (selectedUserId) {
        await loadUserDetail(selectedUserId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '이용권 삭제에 실패했습니다.');
      console.error('Failed to delete entitlement:', err);
    }
  };

  // 에러 표시 컴포넌트
  const ErrorAlert = ({ message, onClose }: ErrorAlertProps) => (
    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
      <div className="flex justify-between items-center">
        <p className="text-red-800 text-sm">{message}</p>
        <button onClick={onClose} className="text-red-600 hover:text-red-800">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  // 페이지네이션 컴포넌트
  const Pagination = () => {
    const maxPageButtons = 10;
    const startPage = Math.floor(pagination.number / maxPageButtons) * maxPageButtons;
    const endPage = Math.min(startPage + maxPageButtons, pagination.totalPages);

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
        <div className="text-sm text-gray-700">
          페이지 {pagination.number} / {pagination.totalPages}
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(pagination.number - 1)}
            disabled={!pagination.hasPrevious}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            이전
          </button>

          {Array.from({ length: endPage - startPage }, (_, i) => startPage + i).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={`px-3 py-1 text-sm border rounded hover:bg-gray-100 ${
                pagination.number === pageNum ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
              }`}
            >
              {pageNum + 1}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(pagination.number + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            다음
          </button>
        </div>
      </div>
    );
  };

  // 채널이 선택되지 않은 경우
  if (!selectedChannel) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 전체 회원</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">채널을 선택해주세요.</p>
        </div>
      </div>
    );
  }

  // 로딩 중
  if (loading && usersData.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 전체 회원</h1>
        <div className="bg-white border rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">사용자 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 발생
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 전체 회원</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => loadUsers(currentPage, q)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">👤 전체 회원</h1>
          {selectedChannel && (
            <p className="text-sm text-gray-500 mt-1">채널: {selectedChannel.channelName}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <input
            className="w-64 border rounded px-3 py-2 text-sm"
            placeholder="검색 (이름/이메일/전화)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
          >
            <Search className="h-4 w-4" />
            <span>검색</span>
          </button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 테이블 */}
        <div className="xl:col-span-2 bg-white border rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full min-w-[1300px]">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "사용자 ID",
                  "이메일",
                  "이름",
                  "연락처",
                  "가입일",
                  "서비스 구매일(최신)",
                  "구매 상품명(최신)",
                  "소셜 ID",
                  "사용자 레벨",
                  "자녀정보(레벨/이름)",
                  "구매횟수",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : !selectedChannel ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    채널을 선택해주세요.
                  </td>
                </tr>
              ) : usersData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                usersData.map((u) => {
                  const userId = u.userId;
                  return (
                    <tr
                      key={userId}
                      className={`border-t hover:bg-gray-50 cursor-pointer ${
                        selectedUserId === userId ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleUserSelect(userId)}
                    >
                      <td className="px-4 py-2 text-sm">{userId}</td>
                      <td className="px-4 py-2 text-sm">{u.email || '-'}</td>
                      <td className="px-4 py-2 text-sm">{u.name || '-'}</td>
                      <td className="px-4 py-2 text-sm">{u.phoneNumber || '-'}</td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        {u.signupAt ? new Date(u.signupAt).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        {u.latestPurchaseAt ? new Date(u.latestPurchaseAt).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">{u.latestProductName || '-'}</td>
                      <td className="px-4 py-2 text-sm">{u.socialId || '-'}</td>
                      <td className="px-4 py-2 text-sm">Lv{u.userLevel ?? 0}</td>
                      <td className="px-4 py-2 text-sm">
                        {u.childLevel && u.childName ? `Lv${u.childLevel} / ${u.childName}` : "-"}
                      </td>
                      <td className="px-4 py-2 text-sm">{u.purchaseCount || 0}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <Pagination />
        </div>

        {/* 상세/편집 패널 */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          {selectedUserId ? (
            <>
              {loadingDetail ? (
                <div className="text-center py-8 text-gray-500">사용자 정보를 불러오는 중...</div>
              ) : selectedUser ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold">{selectedUser.name || '이름 없음'}</div>
                    <div className="text-xs text-gray-500">
                      가입일 {selectedUser.signupAt ? new Date(selectedUser.signupAt).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {selectedUser.email || '-'} · {selectedUser.phoneNumber || '-'}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>서비스 구매일(최신): <b>
                      {selectedUser.latestPurchaseAt ? new Date(selectedUser.latestPurchaseAt).toLocaleDateString('ko-KR') : '-'}
                    </b></div>
                    <div>구매 상품명(최신): <b>{selectedUser.latestProductName || '-'}</b></div>
                    <div>구매횟수: <b>{selectedUser.purchaseCount || 0}</b></div>
                    <div>소셜 ID: <b>{selectedUser.socialId || '-'}</b></div>
                    <div>사용자 레벨: <b>Lv{selectedUser.userLevel ?? 0}</b></div>
                    <div>자녀: <b>{selectedUser.childLevel && selectedUser.childName ? `Lv${selectedUser.childLevel} / ${selectedUser.childName}` : "-"}</b></div>
                  </div>

                  {/* 상품별 이용권 리스트 */}
                  <div className="border-t my-3" />
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">상품별 이용권</div>
                    <button
                      onClick={() => startEntitlementEdit(selectedUser)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <Edit className="h-3 w-3" />
                      <span>편집</span>
                    </button>
                  </div>

                  {entitlementEdit?.userId === selectedUserId ? (
                    // 이용권 편집 모드
                    <div className="space-y-3">
                      {entitlementEdit.entitlements.map((ent, index) => (
                        <div key={index} className="border rounded p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-sm font-medium">이용권 #{index + 1}</span>
                            <button
                              onClick={() => removeEntitlement(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-500">상품명</label>
                              <input
                                className="w-full border rounded p-2 text-sm"
                                value={ent.productName}
                                onChange={(e) => updateEntitlement(index, 'productName', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">상태</label>
                              <select
                                className="w-full border rounded p-2 text-sm"
                                value={ent.status}
                                onChange={(e) => updateEntitlement(index, 'status', e.target.value)}
                              >
                                <option value="active">활성</option>
                                <option value="inactive">비활성</option>
                                <option value="expired">만료</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">시작일</label>
                              <input
                                type="date"
                                className="w-full border rounded p-2 text-sm"
                                value={ent.serviceStart}
                                onChange={(e) => updateEntitlement(index, 'serviceStart', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">종료일</label>
                              <input
                                type="date"
                                className="w-full border rounded p-2 text-sm"
                                value={ent.serviceEnd}
                                onChange={(e) => updateEntitlement(index, 'serviceEnd', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex space-x-2">
                        <button
                          onClick={addEntitlement}
                          className="flex items-center space-x-1 px-3 py-2 border border-dashed border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50"
                        >
                          <Plus className="h-4 w-4" />
                          <span>이용권 추가</span>
                        </button>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={saveEntitlements}
                          disabled={savingEntitlements}
                          className="flex-1 bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50"
                        >
                          {savingEntitlements ? '저장 중...' : '저장'}
                        </button>
                        <button
                          onClick={() => setEntitlementEdit(null)}
                          className="px-3 bg-gray-100 text-gray-800 rounded text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 이용권 조회 모드
                    <div className="bg-gray-50 rounded border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 bg-gray-100">
                            <th className="px-3 py-2 text-left">상품명</th>
                            <th className="px-3 py-2 text-left">시작일</th>
                            <th className="px-3 py-2 text-left">종료일</th>
                            <th className="px-3 py-2 text-left">상태</th>
                            <th className="px-3 py-2 text-left">관리</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(selectedUser.entitlements || []).map((e, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-3 py-2">{e.productName}</td>
                              <td className="px-3 py-2">{e.serviceStart}</td>
                              <td className="px-3 py-2">{e.serviceEnd}</td>
                              <td className="px-3 py-2">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  e.status === 'active' ? 'bg-green-100 text-green-700' :
                                  e.status === 'expired' ? 'bg-red-100 text-red-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {e.status === 'active' ? '활성' : e.status === 'expired' ? '만료' : '비활성'}
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                {e.id && (
                                  <button
                                    onClick={() => deleteEntitlement(e.id!)}
                                    className="text-red-600 hover:text-red-800"
                                    title="삭제"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                          {(!selectedUser.entitlements || selectedUser.entitlements.length === 0) && (
                            <tr>
                              <td className="px-3 py-6 text-center text-gray-500" colSpan={5}>
                                이용권 정보가 없습니다.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="border-t my-3" />
                  {userEdit?.userId === selectedUserId ? (
                    <div className="space-y-3">
                      <div className="text-sm font-medium">사용자 정보 편집</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500">연락처</label>
                          <input
                            className="w-full border rounded p-2 text-sm"
                            value={userEdit.phoneNumber}
                            onChange={(e) => setUserEdit(p => p ? ({ ...p, phoneNumber: e.target.value }) : null)}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">사용자 레벨</label>
                          <select
                            className="w-full border rounded p-2 text-sm"
                            value={userEdit.userLevel}
                            onChange={(e) => setUserEdit(p => p ? ({ ...p, userLevel: Number(e.target.value) }) : null)}
                          >
                            <option value={1}>Lv1</option>
                            <option value={2}>Lv2</option>
                            <option value={3}>Lv3</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">자녀 레벨</label>
                          <select
                            className="w-full border rounded p-2 text-sm"
                            value={userEdit.childLevel}
                            onChange={(e) => setUserEdit(p => p ? ({
                              ...p,
                              childLevel: Number(e.target.value)
                            }) : null)}
                          >
                            <option value={1}>Lv1</option>
                            <option value={2}>Lv2</option>
                            <option value={3}>Lv3</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">자녀 이름</label>
                          <input
                            className="w-full border rounded p-2 text-sm"
                            value={userEdit.childName}
                            onChange={(e) => setUserEdit(p => p ? ({
                              ...p,
                              childName: e.target.value
                            }) : null)}
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={saveUserEdit}
                          disabled={savingUser}
                          className="flex-1 bg-blue-600 text-white py-2 rounded text-sm disabled:opacity-50"
                        >
                          {savingUser ? '저장 중...' : '저장'}
                        </button>
                        <button
                          onClick={() => setUserEdit(null)}
                          className="px-3 bg-gray-100 text-gray-800 rounded text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startUserEdit(selectedUser)}
                      className="w-full bg-gray-100 text-gray-800 py-2 rounded text-sm"
                    >
                      사용자 정보 편집
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">사용자 정보를 불러올 수 없습니다.</div>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500">왼쪽 테이블에서 회원을 선택하세요.</div>
          )}
        </div>
      </div>
    </div>
  );
}