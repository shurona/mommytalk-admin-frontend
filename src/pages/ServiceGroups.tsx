import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { userGroupService } from "../services/userGroupService";
import {
  UserGroup,
  UserGroupDetail,
  UserGroupType,
  GroupViewState,
  ServiceGroupsProps,
  GroupMember,
  ProductAutoGroupMap,
  GroupId
} from "../types";

export default function ServiceGroups({ selectedChannel }: ServiceGroupsProps) {
  const navigate = useNavigate();
  const { groupId } = useParams<{ groupId?: string }>();

  const [autoGroups, setAutoGroups] = useState<UserGroup[]>([]);
  const [customGroups, setCustomGroups] = useState<UserGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 커스텀 그룹 페이징 상태
  const [customPage, setCustomPage] = useState<number>(0);
  const [customTotalPages, setCustomTotalPages] = useState<number>(0);
  const [customPageSize, setCustomPageSize] = useState<number>(50);

  // URL 기반으로 view 상태 결정
  const view: GroupViewState = groupId
    ? { mode: "detail", id: Number(groupId) }
    : { mode: "list", id: null };
  const [newTitle, setNewTitle] = useState<string>("");
  const [editTitle, setEditTitle] = useState<string>("");
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);

  // 모달 상태
  const [showAddUsersModal, setShowAddUsersModal] = useState<boolean>(false);
  const [phoneNumbers, setPhoneNumbers] = useState<string>("");
  const [addingUsers, setAddingUsers] = useState<boolean>(false);

  // 자동 그룹 로드
  const loadAutoGroups = async (): Promise<void> => {
    if (!selectedChannel?.channelId) return;

    try {
      const groups = await userGroupService.getAutoGroups(selectedChannel.channelId);
      setAutoGroups(groups);
    } catch (error) {
      console.error('Failed to load auto groups:', error);
      setError('자동 그룹을 불러오는데 실패했습니다.');
    }
  };

  // 커스텀 그룹 로드 (페이징)
  const loadCustomGroups = async (page: number = 0, size: number = customPageSize): Promise<void> => {
    if (!selectedChannel?.channelId) return;

    try {
      const response = await userGroupService.getCustomGroups(selectedChannel.channelId, page, size);
      setCustomGroups(response.content);
      setCustomPage(response.page);
      setCustomTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load custom groups:', error);
      setError('커스텀 그룹을 불러오는데 실패했습니다.');
    }
  };

  // 그룹 목록 로드
  const loadUserGroups = async (): Promise<void> => {
    if (!selectedChannel?.channelId) return;

    try {
      setLoading(true);
      setError(null);

      // 자동 그룹과 커스텀 그룹 병렬 로드
      await Promise.all([
        loadAutoGroups(),
        loadCustomGroups(0, customPageSize)
      ]);
    } catch (error) {
      console.error('Failed to load user groups:', error);
      setError('그룹 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 채널 변경 시 그룹 목록 로드
  useEffect(() => {
    loadUserGroups();
  }, [selectedChannel?.channelId]);

  // URL의 groupId가 변경될 때 상세 정보 로드
  useEffect(() => {
    if (groupId && view.mode === 'detail') {
      const id = Number(groupId);
      loadGroupDetail(id);

      const g = byId(id);
      if (g && g.type === UserGroupType.CUSTOM) {
        setEditTitle(g.title);
        setIsEditingTitle(false);
      } else {
        setEditTitle("");
        setIsEditingTitle(false);
      }
    }
  }, [groupId, autoGroups, customGroups]);

  const allGroups = useMemo(() => [...autoGroups, ...customGroups], [autoGroups, customGroups]);
  const byId = (id: GroupId): UserGroup | null => allGroups.find((g) => g.id === id) || null;

  /** 상품별 자동 그룹 묶음 (한 화면에 모두 표시) */
  const productAutoMap = useMemo((): ProductAutoGroupMap => {
    const map: ProductAutoGroupMap = {};

    // 실제 API에서 받은 그룹들의 상품명을 기준으로 맵 생성
    autoGroups.forEach((g) => {
      if (!g.product) return;

      if (!map[g.product]) {
        map[g.product] = { active: [], ended: [] };
      }

      if (g.type === UserGroupType.AUTO_ACTIVE) map[g.product].active.push(g);
      else if (g.type === UserGroupType.AUTO_ENDED) map[g.product].ended.push(g);
    });

    return map;
  }, [autoGroups]);

  const stats = (g: UserGroup) => {
    const registered = g.memberCount ?? 0;
    const friendCount = g.friendCount ?? 0;
    return { registered, friendCount };
  };

  // 커스텀 그룹 페이지 변경 핸들러
  const handleCustomPageChange = (newPage: number): void => {
    if (newPage >= 0 && newPage < customTotalPages) {
      loadCustomGroups(newPage, customPageSize);
    }
  };

  const openDetail = async (id: GroupId): Promise<void> => {
    // URL을 변경하여 상세 페이지로 이동
    navigate(`/service-groups/${id}`);
  };

  const backToList = (): void => {
    // URL을 변경하여 목록 페이지로 이동
    navigate('/service-groups');
  };

  /** 커스텀 그룹 생성 (상품과 무관) */
  const createCustomGroup = async (): Promise<void> => {
    const t = newTitle.trim();
    if (!t || !selectedChannel?.channelId) return;

    try {
      await userGroupService.createCustomGroup(selectedChannel.channelId, t);
      // 커스텀 그룹 목록 첫 페이지로 새로고침
      await loadCustomGroups(0, customPageSize);
      setNewTitle("");
    } catch (error) {
      console.error('Failed to create custom group:', error);
      alert('커스텀 그룹 생성에 실패했습니다.');
    }
  };

  /** 공통: 특정 그룹 업데이트 */
  const updateGroup = (groupId: GroupId, updater: (group: UserGroup) => UserGroup): void => {
    setAutoGroups((prev) => prev.map((g) => (g.id === groupId ? updater(g) : g)));
    setCustomGroups((prev) => prev.map((g) => (g.id === groupId ? updater(g) : g)));
  };

  /** 커스텀 그룹 제목 저장 */
  const saveTitle = async (groupId: GroupId): Promise<void> => {
    const t = editTitle.trim();
    if (!t || !selectedChannel?.channelId) return;

    try {
      const updatedGroup = await userGroupService.updateGroupTitle(selectedChannel.channelId, groupId, t);
      updateGroup(groupId, () => updatedGroup);
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update group title:', error);
      alert('그룹 제목 수정에 실패했습니다.');
    }
  };

  /** 다중 사용자 추가 */
  const addMultipleUsersToGroup = async (groupId: GroupId): Promise<void> => {
    const phones = phoneNumbers.trim();
    if (!phones || !selectedChannel?.channelId) return;

    // 전화번호 목록 파싱 (한 줄에 하나씩)
    const phoneList = phones
      .split('\n')
      .map(phone => phone.trim())
      .filter(phone => phone.length > 0);

    if (phoneList.length === 0) {
      alert('유효한 전화번호를 입력해주세요.');
      return;
    }

    setAddingUsers(true);

    try {
      // List 형식으로 한 번에 전달
      await userGroupService.addUsersToGroup(selectedChannel.channelId, groupId, phoneList);

      // 성공 알림
      alert(`${phoneList.length}명의 사용자가 성공적으로 추가되었습니다.`);

      // 멤버 목록 첫 페이지로 다시 로드 (새로 추가된 사용자 확인)
      await loadGroupMembers(groupId, 0, memberSearch, memberPageSize);
      setMemberPage(0); // 페이지 상태도 0으로 초기화
      // 그룹 기본 정보도 업데이트 (멤버 수 갱신)
      const detail = await userGroupService.getUserGroupDetail(selectedChannel.channelId, groupId);
      setGroupDetail(detail);

      // 모달 닫고 초기화
      setShowAddUsersModal(false);
      setPhoneNumbers("");

    } catch (error) {
      console.error('Failed to add multiple users:', error);
      alert('사용자 추가에 실패했습니다.');
    } finally {
      setAddingUsers(false);
    }
  };

  /** 사용자 제거 */
  const removeFromGroup = async (groupId: GroupId, userId: number): Promise<void> => {
    if (!selectedChannel?.channelId) return;

    try {
      await userGroupService.removeUserFromGroup(selectedChannel.channelId, groupId, userId);

      // 그룹 기본 정보 업데이트 (멤버 수 갱신)
      const detail = await userGroupService.getUserGroupDetail(selectedChannel.channelId, groupId);
      setGroupDetail(detail);

      // 삭제 후 첫 페이지로 이동 (가장 안전한 방법)
      await loadGroupMembers(groupId, 0, memberSearch, memberPageSize);
    } catch (error) {
      console.error('Failed to remove user from group:', error);
      alert('사용자 제거에 실패했습니다.');
    }
  };

  /** 그룹 상세 정보 로드 (상세 화면용) */
  const [groupDetail, setGroupDetail] = useState<UserGroupDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  // 멤버 페이징 상태
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [memberPage, setMemberPage] = useState<number>(0);
  const [memberTotalPages, setMemberTotalPages] = useState<number>(0);
  const [memberPageSize, setMemberPageSize] = useState<number>(20);
  const [memberSearch, setMemberSearch] = useState<string>("");
  const [memberLoading, setMemberLoading] = useState<boolean>(false);

  const loadGroupDetail = async (groupId: GroupId): Promise<void> => {
    if (!selectedChannel?.channelId) return;

    try {
      setDetailLoading(true);
      const detail = await userGroupService.getUserGroupDetail(selectedChannel.channelId, groupId);
      setGroupDetail(detail);

      // 멤버 목록도 함께 로드
      await loadGroupMembers(groupId, 0, "");
    } catch (error) {
      console.error('Failed to load group detail:', error);
      setError('그룹 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const loadGroupMembers = async (groupId: GroupId, page = 0, search = "", size = memberPageSize): Promise<void> => {
    if (!selectedChannel?.channelId) return;

    try {
      setMemberLoading(true);
      const response = await userGroupService.getGroupMembers(selectedChannel.channelId, groupId, {
        page,
        size,
        search: search.trim() || undefined
      });

      console.log('loadGroupMembers response:', response); // 디버그 로그
      setMembers(response.content);
      setMemberPage(response.page);
      setMemberTotalPages(response.totalPages);
    } catch (error) {
      console.error('Failed to load group members:', error);
      setError('멤버 목록을 불러오는데 실패했습니다.');
    } finally {
      setMemberLoading(false);
    }
  };

  /** 리스트 화면 */
  if (view.mode === "list") {
    // 채널이 선택되지 않은 경우
    if (!selectedChannel) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 회원 그룹 관리</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">채널을 선택해주세요.</p>
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 회원 그룹 관리</h1>
          <div className="bg-white border rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">그룹 목록을 불러오는 중...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 회원 그룹 관리</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadUserGroups}
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">👥 회원 그룹 관리</h1>

        <div className="flex items-start bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-4">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div className="text-sm space-y-1">
            <p>• <b>서비스 이용자/종료 그룹</b>은 <b>상품별</b>로 분리 관리됩니다.</p>
            <p>• 구매 완료 + 친구추가 완료 사용자는 <b>익일</b> 서비스 이용자 그룹에 자동 반영됩니다.</p>
            <p>• 종료일 기준 <b>자정(00:00)</b>에 종료 그룹으로 자동 이동합니다.</p>
            <p>• <b>재구매 발생 시</b> 해당 상품의 종료 그룹에서 자동 제외됩니다.</p>
            <p>• <b>커스텀 그룹은 상품과 무관</b>하게 생성/운영되며, 제목 수정 가능합니다.</p>
          </div>
        </div>

        {/* 상품별 자동 그룹 전체 렌더링 */}
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
          {Object.keys(productAutoMap).map((product) => (
            <div key={product} className="bg-white border rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{product} · 자동 업데이트 그룹</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">서비스 이용자</div>
                  <ul className="space-y-2">
                    {productAutoMap[product].active.map((g) => {
                      const s = stats(g);
                      return (
                        <li key={g.id} className="border rounded p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{g.title}</div>
                              <div className="text-xs text-gray-500">
                                등록수 {s.registered} · 친구수 {s.friendCount} · 생성 {new Date(g.createdAt).toLocaleDateString()} · 업데이트 {new Date(g.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <button onClick={() => openDetail(g.id)} className="px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                              상세
                            </button>
                          </div>
                        </li>
                      );
                    })}
                    {productAutoMap[product].active.length === 0 && (
                      <li className="text-xs text-gray-500">서비스 이용자 그룹이 없습니다.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">종료 이용자</div>
                  <ul className="space-y-2">
                    {productAutoMap[product].ended.map((g) => {
                      const s = stats(g);
                      return (
                        <li key={g.id} className="border rounded p-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{g.title}</div>
                              <div className="text-xs text-gray-500">
                                등록수 {s.registered} · 친구수 {s.friendCount} · 생성 {new Date(g.createdAt).toLocaleDateString()} · 업데이트 {new Date(g.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <button onClick={() => openDetail(g.id)} className="px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                              상세
                            </button>
                          </div>
                        </li>
                      );
                    })}
                    {productAutoMap[product].ended.length === 0 && (
                      <li className="text-xs text-gray-500">종료 이용자 그룹이 없습니다.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 커스텀 그룹 (상품과 독립) */}
        <div className="mt-6 bg-white border rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">커스텀 그룹</h2>
            <div className="flex space-x-2">
              <input
                className="border rounded p-2 text-sm w-72"
                placeholder="커스텀 그룹 타이틀"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <button onClick={createCustomGroup} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
                그룹 추가
              </button>
            </div>
          </div>

          <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {customGroups.map((g) => {
              const s = stats(g);
              return (
                <li key={g.id} className="border rounded p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{g.title}</div>
                      <div className="text-xs text-gray-500">
                        등록수 {s.registered} · 친구수 {s.friendCount} · 생성 {g.createdAt} · 업데이트 {g.updatedAt}
                      </div>
                    </div>
                    <button onClick={() => openDetail(g.id)} className="px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                      상세
                    </button>
                  </div>
                </li>
              );
            })}
            {customGroups.length === 0 && (
              <div className="text-xs text-gray-500">등록된 커스텀 그룹이 없습니다.</div>
            )}
          </ul>

          {/* 커스텀 그룹 페이지네이션 */}
          {customTotalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="text-sm text-gray-700">
                페이지 {customPage + 1} / {customTotalPages}
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleCustomPageChange(customPage - 1)}
                  disabled={customPage === 0}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  이전
                </button>

                {Array.from({ length: Math.min(10, customTotalPages) }, (_, i) => {
                  const startPage = Math.floor(customPage / 10) * 10;
                  const pageNum = startPage + i;
                  if (pageNum >= customTotalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handleCustomPageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded hover:bg-gray-100 ${
                        customPage === pageNum ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => handleCustomPageChange(customPage + 1)}
                  disabled={customPage >= customTotalPages - 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /** 상세 화면 */
  const g = byId(view.id!);
  if (!g) {
    return (
      <div className="p-6">
        <button onClick={backToList} className="mb-3 px-3 py-2 bg-white border rounded text-sm">
          ← 목록으로
        </button>
        <div className="text-sm text-gray-500">그룹을 찾을 수 없습니다.</div>
      </div>
    );
  }

  if (detailLoading) {
    return (
      <div className="p-6">
        <button onClick={backToList} className="mb-3 px-3 py-2 bg-white border rounded text-sm">
          ← 목록으로
        </button>
        <div className="bg-white border rounded-lg shadow-sm p-12 text-center">
          <p className="text-gray-500">그룹 상세 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const s = stats(g);

  // 멤버 페이지 변경 핸들러
  const handleMemberPageChange = (newPage: number): void => {
    if (newPage >= 0 && newPage < memberTotalPages) {
      setMemberPage(newPage);
      loadGroupMembers(g.id, newPage, memberSearch, memberPageSize);
    }
  };

  // 멤버 검색 핸들러
  const handleMemberSearch = (search: string): void => {
    setMemberSearch(search);
    setMemberPage(0);
    loadGroupMembers(g.id, 0, search, memberPageSize);
  };

  // 페이지 사이즈 변경 핸들러
  const handlePageSizeChange = (size: number): void => {
    setMemberPageSize(size);
    setMemberPage(0);
    loadGroupMembers(g.id, 0, memberSearch, size);
  };

  // 제목 블록 렌더링 (조건부 렌더링을 위해 변수로 분리)
  let titleBlock: JSX.Element;
  if (g.type !== UserGroupType.CUSTOM) {
    titleBlock = (
      <>
        <h1 className="inline text-2xl font-bold text-gray-900">{g.title}</h1>
        <span className="ml-3 text-xs text-gray-500">상품: {g.product}</span>
      </>
    );
  } else if (isEditingTitle) {
    titleBlock = (
      <div className="flex items-center space-x-2">
        <input
          className="border rounded px-3 py-2 text-sm"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          autoFocus
        />
        <button onClick={() => saveTitle(g.id)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
          저장
        </button>
        <button onClick={() => { setIsEditingTitle(false); setEditTitle(g.title); }} className="px-3 py-2 bg-gray-100 rounded text-sm">
          취소
        </button>
      </div>
    );
  } else {
    titleBlock = (
      <div className="flex items-center space-x-2">
        <h1 className="inline text-2xl font-bold text-gray-900">{g.title}</h1>
        <button onClick={() => setIsEditingTitle(true)} className="px-2 py-1 bg-white border rounded text-xs">
          제목 편집
        </button>
        <span className="ml-2 text-xs text-gray-500">커스텀 그룹</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <button onClick={backToList} className="mr-2 px-3 py-2 bg-white border rounded text-sm">
            ← 목록으로
          </button>
          {titleBlock}
        </div>
        {/* 그룹에 사용자 추가 (우측 상단) - AUTO_ENDED 그룹에서는 숨김 */}
        {g.type !== UserGroupType.AUTO_ENDED && (
          <div className="flex space-x-2">
            <button onClick={() => setShowAddUsersModal(true)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
              그룹에 사용자 추가
            </button>
          </div>
        )}
      </div>

      {/* 그룹 정보 */}
      <div className="bg-white border rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <div className="text-xs text-gray-500">타이틀</div>
            <div className="font-medium">{g.title}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">등록수</div>
            <div className="font-medium">{s.registered}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">친구수</div>
            <div className="font-medium">{s.friendCount}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">그룹 생성일시</div>
            <div className="font-medium">{new Date(g.createdAt).toLocaleDateString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">그룹 업데이트 일시</div>
            <div className="font-medium">{new Date(g.updatedAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* 멤버 검색 및 필터 */}
      <div className="bg-white border rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center space-x-3">
          <input
            className="flex-1 border rounded px-3 py-2 text-sm"
            placeholder="전화번호 또는 이름으로 검색"
            value={memberSearch}
            onChange={(e) => handleMemberSearch(e.target.value)}
          />
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">페이지당</label>
            <select
              className="border rounded px-3 py-2 text-sm"
              value={memberPageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            >
              <option value={10}>10개</option>
              <option value={20}>20개</option>
              <option value={50}>50개</option>
              <option value={100}>100개</option>
            </select>
          </div>
        </div>
      </div>

      {/* 멤버 테이블 */}
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500">선택</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">전화번호</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">채널 친구</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">그룹에 등록한 시간</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody>
            {memberLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  멤버 목록을 불러오는 중...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  {memberSearch ? '검색 결과가 없습니다.' : '아직 등록된 사용자가 없습니다.'}
                </td>
              </tr>
            ) : (
              members.map((m: GroupMember) => (
                <tr key={`${g.id}-${m.userId}-${m.registeredAt}`} className="border-t">
                  <td className="px-4 py-2 text-sm">
                    <input type="checkbox" />
                  </td>
                  <td className="px-4 py-2 text-sm">{m.phoneNumber}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${m.isFriend ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                      {m.isFriend ? "친구" : "미친구(보류)"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm whitespace-nowrap">{new Date(m.registeredAt).toLocaleString()}</td>
                  <td className="px-4 py-2 text-sm">
                    {/* 자동 그룹(AUTO_ACTIVE, AUTO_ENDED)에서는 제거 버튼 숨김 */}
                    {g.type === UserGroupType.CUSTOM && (
                      <button onClick={() => removeFromGroup(g.id, m.userId)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                        제거
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        {memberTotalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="text-sm text-gray-700">
              페이지 {memberPage + 1} / {memberTotalPages}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleMemberPageChange(memberPage - 1)}
                disabled={memberPage === 0}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                이전
              </button>

              {Array.from({ length: Math.min(10, memberTotalPages) }, (_, i) => {
                const startPage = Math.floor(memberPage / 10) * 10;
                const pageNum = startPage + i;
                if (pageNum >= memberTotalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handleMemberPageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded hover:bg-gray-100 ${
                      memberPage === pageNum ? 'bg-blue-500 text-white hover:bg-blue-600' : ''
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}

              <button
                onClick={() => handleMemberPageChange(memberPage + 1)}
                disabled={memberPage >= memberTotalPages - 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 mt-3">
        * 자동 그룹은 백엔드 배치/웹훅 결과를 표시합니다. 재구매 발생 시 종료 그룹에서 자동 제외됩니다. 커스텀 그룹은 상품과 무관하게 운영되며, 제목 수정이 가능합니다.
      </div>

      {/* 다중 사용자 추가 모달 */}
      {showAddUsersModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">그룹에 사용자 다중 추가</h3>
                <button
                  onClick={() => setShowAddUsersModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 목록 (한 줄에 하나씩)
                </label>
                <textarea
                  className="w-full border rounded-lg px-3 py-2 text-sm h-40 resize-none"
                  placeholder="010-1234-5678&#10;010-2345-6789&#10;010-3456-7890"
                  value={phoneNumbers}
                  onChange={(e) => setPhoneNumbers(e.target.value)}
                />
                <div className="text-xs text-gray-500 mt-1">
                  • 한 줄에 하나씩 입력해주세요 (예: 010-2222-3333)
                  • 각 줄의 앞뒤 공백은 자동으로 제거됩니다
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowAddUsersModal(false)}
                  className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-50"
                  disabled={addingUsers}
                >
                  취소
                </button>
                <button
                  onClick={() => addMultipleUsersToGroup(g.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={addingUsers || !phoneNumbers.trim()}
                >
                  {addingUsers ? '추가 중...' : '사용자 추가'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}