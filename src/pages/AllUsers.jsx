import React, { useState, useEffect } from "react";
import { userService } from '../services/userService';
import { Trash2, Plus, Edit, X } from 'lucide-react';

export default function AllUsers({ selectedChannel }) {
  const [usersData, setUsersData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    number: 0,
    totalPages: 0,
    hasPrevious: false,
    hasNext: false
  });

  const [q, setQ] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = 50;

  // API 호출 함수들
  const loadUsers = async (page = 0, search = '') => {
    if (!selectedChannel?.channelId) {
      setUsersData([]);
      setPagination({ number: 0, totalPages: 0, hasPrevious: false, hasNext: false });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const response = await userService.getUsers(selectedChannel.channelId, {
        page,
        size: pageSize,
        search: search.trim() || undefined
      });
      
      setUsersData(response.content);
      setPagination({
        number: response.number,
        totalPages: response.totalPages,
        hasPrevious: response.hasPrevious,
        hasNext: response.hasNext
      });
    } catch (err) {
      setError(err.response?.data?.message || '사용자 목록을 불러오는데 실패했습니다.');
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터 로드 및 채널 변경 시 새로고침
  useEffect(() => {
    if (selectedChannel?.channelId) {
      setCurrentPage(0); // 채널 변경 시 페이지 초기화
      setSelectedUserId(null); // 선택된 사용자 초기화
      setSelectedUser(null);
      loadUsers(0, q);
    }
  }, [selectedChannel?.channelId]);
  
  useEffect(() => {
    loadUsers(currentPage, q);
  }, [currentPage]);

  // 검색어 변경 시 첫 페이지로 이동하여 검색
  const handleSearch = (searchQuery) => {
    setQ(searchQuery);
    setCurrentPage(0);
    loadUsers(0, searchQuery);
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setCurrentPage(newPage);
    }
  };

  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // 사용자 상세 정보 로드
  const loadUserDetail = async (userId) => {
    if (!selectedChannel?.channelId) return;
    
    try {
      setLoadingDetail(true);
      const user = await userService.getUserById(selectedChannel.channelId, userId);
      setSelectedUser(user);
    } catch (err) {
      setError(err.response?.data?.message || '사용자 상세 정보를 불러오는데 실패했습니다.');
      console.error('Failed to load user detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 사용자 선택
  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    if (userId) {
      loadUserDetail(userId);
    } else {
      setSelectedUser(null);
    }
  };

  // 사용자 편집
  const [userEdit, setUserEdit] = useState(null);
  const [savingUser, setSavingUser] = useState(false);

  const startUserEdit = (user) => {
    setUserEdit({
      userId: user.key || user.id,
      phone: user.phone || '',
      userLevel: user.userLevel ?? 1,
      child: {
        level: user.child?.level ?? 0,
        name: user.child?.name || ''
      }
    });
  };

  const saveUserEdit = async () => {
    if (!userEdit) return;
    
    try {
      setSavingUser(true);
      await userService.updateUser(userEdit.userId, {
        phone: userEdit.phone,
        userLevel: userEdit.userLevel,
        child: userEdit.child
      });
      
      // 목록 및 상세정보 새로고침
      await loadUsers(currentPage, q);
      if (selectedUserId) {
        await loadUserDetail(selectedUserId);
      }
      
      setUserEdit(null);
    } catch (err) {
      setError(err.response?.data?.message || '사용자 정보 수정에 실패했습니다.');
      console.error('Failed to update user:', err);
    } finally {
      setSavingUser(false);
    }
  };

  // 이용권 편집
  const [entitlementEdit, setEntitlementEdit] = useState(null);
  const [savingEntitlements, setSavingEntitlements] = useState(false);

  const startEntitlementEdit = (user) => {
    setEntitlementEdit({
      userId: user.key || user.id,
      entitlements: (user.entitlements || []).map(ent => ({
        id: ent.id,
        productName: ent.productName,
        serviceStart: ent.serviceStart,
        serviceEnd: ent.serviceEnd,
        status: ent.status
      }))
    });
  };

  const updateEntitlement = (index, field, value) => {
    setEntitlementEdit(prev => ({
      ...prev,
      entitlements: prev.entitlements.map((ent, i) => 
        i === index ? { ...ent, [field]: value } : ent
      )
    }));
  };

  const addEntitlement = () => {
    setEntitlementEdit(prev => ({
      ...prev,
      entitlements: [...prev.entitlements, {
        productName: '',
        serviceStart: '',
        serviceEnd: '',
        status: 'active'
      }]
    }));
  };

  const removeEntitlement = (index) => {
    setEntitlementEdit(prev => ({
      ...prev,
      entitlements: prev.entitlements.filter((_, i) => i !== index)
    }));
  };

  const saveEntitlements = async () => {
    if (!entitlementEdit) return;
    
    try {
      setSavingEntitlements(true);
      await userService.updateUserEntitlements(entitlementEdit.userId, entitlementEdit.entitlements);
      
      // 목록 및 상세정보 새로고침
      await loadUsers(currentPage, q);
      if (selectedUserId) {
        await loadUserDetail(selectedUserId);
      }
      
      setEntitlementEdit(null);
    } catch (err) {
      setError(err.response?.data?.message || '이용권 정보 수정에 실패했습니다.');
      console.error('Failed to update entitlements:', err);
    } finally {
      setSavingEntitlements(false);
    }
  };

  const deleteEntitlement = async (entitlementId) => {
    if (!selectedUserId || !entitlementId) return;
    
    if (!confirm('이용권을 삭제하시겠습니까?')) return;
    
    try {
      await userService.deleteUserEntitlement(selectedUserId, entitlementId);
      
      // 목록 및 상세정보 새로고침
      await loadUsers(currentPage, q);
      if (selectedUserId) {
        await loadUserDetail(selectedUserId);
      }
    } catch (err) {
      setError(err.response?.data?.message || '이용권 삭제에 실패했습니다.');
      console.error('Failed to delete entitlement:', err);
    }
  };

  // 에러 표시 컴포넌트
  const ErrorAlert = ({ message, onClose }) => (
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
  const Pagination = () => (
    <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
      <div className="text-sm text-gray-700">
        페이지 {pagination.number + 1} / {pagination.totalPages}
      </div>
      <div className="flex space-x-2">
        <button
          onClick={() => handlePageChange(pagination.number - 1)}
          disabled={!pagination.hasPrevious}
          className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          이전
        </button>
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
            placeholder="검색 (이름/이메일/전화/ID/상품명)"
            value={q}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={loading}
          />
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
                  "고유키",
                  "이메일",
                  "회원 그룹",
                  "이름",
                  "연락처",
                  "가입일",
                  "서비스 구매일(최신)",
                  "구매 상품명(최신)",
                  "총 구매금액",
                  "LINE ID",
                  "KAKAO ID",
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
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    데이터를 불러오는 중...
                  </td>
                </tr>
              ) : !selectedChannel ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    채널을 선택해주세요.
                  </td>
                </tr>
              ) : usersData.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                usersData.map((u) => {
                  const userId = u.key || u.id;
                  return (
                    <tr
                      key={userId}
                      className={`border-t hover:bg-gray-50 cursor-pointer ${
                        selectedUserId === userId ? "bg-blue-50" : ""
                      }`}
                      onClick={() => handleUserSelect(userId)}
                    >
                      <td className="px-4 py-2 text-sm">{userId}</td>
                      <td className="px-4 py-2 text-sm">{u.email}</td>
                      <td className="px-4 py-2 text-sm">{u.adminFlag}</td>
                      <td className="px-4 py-2 text-sm">{u.name}</td>
                      <td className="px-4 py-2 text-sm">{u.phone}</td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        {u.signupAt ? new Date(u.signupAt).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm whitespace-nowrap">
                        {u.latestPurchaseAt ? new Date(u.latestPurchaseAt).toLocaleString('ko-KR') : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">{u.latestProductName || '-'}</td>
                      <td className="px-4 py-2 text-sm">
                        {u.totalAmount ? `${u.totalAmount.toLocaleString()}원` : '-'}
                      </td>
                      <td className="px-4 py-2 text-sm">{u.lineId || '-'}</td>
                      <td className="px-4 py-2 text-sm">{u.kakaoId || '-'}</td>
                      <td className="px-4 py-2 text-sm">Lv{u.userLevel}</td>
                      <td className="px-4 py-2 text-sm">
                        {u.child ? `Lv${u.child.level} / ${u.child.name}` : "-"}
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
                    <div className="font-semibold">{selectedUser.name}</div>
                    <div className="text-xs text-gray-500">
                      가입일 {selectedUser.signupAt ? new Date(selectedUser.signupAt).toLocaleDateString('ko-KR') : '-'}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {selectedUser.email} · {selectedUser.phone}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>회원 그룹: <b>{selectedUser.adminFlag}</b> (1=어드민, 0=일반)</div>
                    <div>서비스 구매일(최신): <b>
                      {selectedUser.latestPurchaseAt ? new Date(selectedUser.latestPurchaseAt).toLocaleDateString('ko-KR') : '-'}
                    </b></div>
                    <div>구매 상품명(최신): <b>{selectedUser.latestProductName || '-'}</b></div>
                    <div>총 구매금액: <b>{selectedUser.totalAmount ? `${selectedUser.totalAmount.toLocaleString()}원` : '-'}</b> · 구매횟수: <b>{selectedUser.purchaseCount || 0}</b></div>
                    <div>LINE ID: <b>{selectedUser.lineId || '-'}</b> · KAKAO ID: <b>{selectedUser.kakaoId || '-'}</b></div>
                    <div>사용자 레벨: <b>Lv{selectedUser.userLevel}</b></div>
                    <div>자녀: <b>{selectedUser.child ? `Lv${selectedUser.child.level} / ${selectedUser.child.name}` : "-"}</b></div>
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
                                    onClick={() => deleteEntitlement(e.id)}
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
                            value={userEdit.phone} 
                            onChange={(e) => setUserEdit(p => ({ ...p, phone: e.target.value }))} 
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">사용자 레벨</label>
                          <select 
                            className="w-full border rounded p-2 text-sm" 
                            value={userEdit.userLevel} 
                            onChange={(e) => setUserEdit(p => ({ ...p, userLevel: Number(e.target.value) }))}
                          >
                            <option value={0}>Lv0</option>
                            <option value={1}>Lv1</option>
                            <option value={2}>Lv2</option>
                            <option value={3}>Lv3</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">자녀 레벨</label>
                          <select 
                            className="w-full border rounded p-2 text-sm" 
                            value={userEdit.child.level} 
                            onChange={(e) => setUserEdit(p => ({ 
                              ...p, 
                              child: { ...p.child, level: Number(e.target.value) } 
                            }))}
                          >
                            <option value={0}>Lv0</option>
                            <option value={1}>Lv1</option>
                            <option value={2}>Lv2</option>
                            <option value={3}>Lv3</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">자녀 이름</label>
                          <input 
                            className="w-full border rounded p-2 text-sm" 
                            value={userEdit.child.name} 
                            onChange={(e) => setUserEdit(p => ({ 
                              ...p, 
                              child: { ...p.child, name: e.target.value } 
                            }))} 
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