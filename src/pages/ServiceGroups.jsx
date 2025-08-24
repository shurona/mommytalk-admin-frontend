import React, { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";

const PRODUCTS = ["마미톡365", "마미톡365+마미보카"];
const nowStr = () => new Date().toISOString().slice(0, 16).replace("T", " ");

/** 초기 데이터: 상품별 자동 그룹 2종(서비스 이용자/종료자) */
const initialAutoGroups = [
  {
    id: "active_365",
    product: "마미톡365",
    title: "서비스 이용자 그룹(마미톡365)",
    type: "auto-active",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-22",
    members: [
      { phone: "010-1234-5678", friend: true, registeredAt: "2024-03-22 09:00" },
      { phone: "010-2222-3333", friend: true, registeredAt: "2024-03-22 09:05" },
      { phone: "010-9999-0000", friend: false, registeredAt: "2024-03-22 10:10" },
    ],
  },
  {
    id: "ended_365",
    product: "마미톡365",
    title: "종료 이용자 그룹(마미톡365)",
    type: "auto-ended",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-22",
    members: [{ phone: "010-4444-5555", friend: true, registeredAt: "2024-03-22 00:10" }],
  },
  {
    id: "active_combo",
    product: "마미톡365+마미보카",
    title: "서비스 이용자 그룹(365+보카)",
    type: "auto-active",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-22",
    members: [
      { phone: "010-7777-8888", friend: true, registeredAt: "2024-03-22 08:50" },
      { phone: "010-5555-6666", friend: true, registeredAt: "2024-03-22 09:20" },
    ],
  },
  {
    id: "ended_combo",
    product: "마미톡365+마미보카",
    title: "종료 이용자 그룹(365+보카)",
    type: "auto-ended",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-22",
    members: [{ phone: "010-1212-3434", friend: true, registeredAt: "2024-03-22 00:10" }],
  },
];

/** 커스텀 그룹은 상품과 독립적으로 존재 (product 없음) */
const initialCustomGroups = [
  {
    id: "custom_001",
    title: "리텐션 캠페인 A",
    type: "custom",
    createdAt: "2024-03-10",
    updatedAt: "2024-03-20",
    members: [{ phone: "010-3333-4444", friend: true, registeredAt: "2024-03-20 11:00" }],
  },
];

export default function ServiceGroups() {
  const [autoGroups, setAutoGroups] = useState(initialAutoGroups);
  const [customGroups, setCustomGroups] = useState(initialCustomGroups);
  const [view, setView] = useState({ mode: "list", id: null });
  const [newTitle, setNewTitle] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [editTitle, setEditTitle] = useState("");       // ← 제목 편집 상태
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const allGroups = useMemo(() => [...autoGroups, ...customGroups], [autoGroups, customGroups]);
  const byId = (id) => allGroups.find((g) => g.id === id) || null;

  /** 상품별 자동 그룹 묶음 (한 화면에 모두 표시) */
  const productAutoMap = useMemo(() => {
    const map = {};
    PRODUCTS.forEach((p) => (map[p] = { active: [], ended: [] }));
    autoGroups.forEach((g) => {
      if (!map[g.product]) return;
      if (g.type === "auto-active") map[g.product].active.push(g);
      else if (g.type === "auto-ended") map[g.product].ended.push(g);
    });
    return map;
  }, [autoGroups]);

  const stats = (g) => {
    const registered = g.members.length;
    const friendCount = g.members.filter((m) => m.friend).length;
    return { registered, friendCount };
  };

  const openDetail = (id) => {
    setView({ mode: "detail", id });
    const g = byId(id);
    if (g && g.type === "custom") {
      setEditTitle(g.title);
      setIsEditingTitle(false);
    } else {
      setEditTitle("");
      setIsEditingTitle(false);
    }
  };
  const backToList = () => setView({ mode: "list", id: null });

  /** 커스텀 그룹 생성 (상품과 무관) */
  const createCustomGroup = () => {
    const t = newTitle.trim();
    if (!t) return;
    const id = `custom_${Date.now()}`;
    setCustomGroups((p) => [
      ...p,
      {
        id,
        title: t,
        type: "custom",
        createdAt: nowStr().slice(0, 10),
        updatedAt: nowStr().slice(0, 10),
        members: [],
      },
    ]);
    setNewTitle("");
  };

  /** 공통: 특정 그룹 업데이트 */
  const updateGroup = (groupId, updater) => {
    setAutoGroups((prev) => prev.map((g) => (g.id === groupId ? updater(g) : g)));
    setCustomGroups((prev) => prev.map((g) => (g.id === groupId ? updater(g) : g)));
  };

  /** 커스텀 그룹 제목 저장 */
  const saveTitle = (groupId) => {
    const t = editTitle.trim();
    if (!t) return;
    updateGroup(groupId, (g) => ({ ...g, title: t, updatedAt: nowStr().slice(0, 10) }));
    setIsEditingTitle(false);
  };

  /** 사용자 추가: 채널 친구만 활성 등록, 미친구는 보류 */
  const addUserToGroup = (groupId) => {
    const phone = addPhone.trim();
    if (!phone) return;
    const isFriend = phone.startsWith("010"); // 데모 규칙
    const entry = { phone, friend: isFriend, registeredAt: nowStr() };
    updateGroup(groupId, (g) => ({
      ...g,
      members: [entry, ...g.members],
      updatedAt: nowStr().slice(0, 10),
    }));
    setAddPhone("");
  };

  const removeFromGroup = (groupId, phone) => {
    updateGroup(groupId, (g) => ({
      ...g,
      members: g.members.filter((m) => m.phone !== phone),
      updatedAt: nowStr().slice(0, 10),
    }));
  };

  /** 리스트 화면 */
  if (view.mode === "list") {
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
          {PRODUCTS.map((product) => (
            <div key={product} className="bg-white border rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">{product} · 자동 업데이트 그룹</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">서비스 이용자</div>
                  <ul className="space-y-2">
                    {autoGroups.filter(g => g.product===product && g.type==="auto-active").map((g) => {
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
                    {autoGroups.filter(g => g.product===product && g.type==="auto-active").length === 0 && (
                      <li className="text-xs text-gray-500">서비스 이용자 그룹이 없습니다.</li>
                    )}
                  </ul>
                </div>

                <div>
                  <div className="text-xs text-gray-500 mb-1">종료 이용자</div>
                  <ul className="space-y-2">
                    {autoGroups.filter(g => g.product===product && g.type==="auto-ended").map((g) => {
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
                    {autoGroups.filter(g => g.product===product && g.type==="auto-ended").length === 0 && (
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
        </div>
      </div>
    );
  }

  /** 상세 화면 */
  const g = byId(view.id);
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

  const s = stats(g);

  const TitleBlock = () => {
    if (g.type !== "custom") {
      return (
        <>
          <h1 className="inline text-2xl font-bold text-gray-900">{g.title}</h1>
          <span className="ml-3 text-xs text-gray-500">상품: {g.product}</span>
        </>
      );
    }
    return (
      <>
        {isEditingTitle ? (
          <div className="flex items-center space-x-2">
            <input
              className="border rounded px-3 py-2 text-sm"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <button onClick={() => saveTitle(g.id)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
              저장
            </button>
            <button onClick={() => { setIsEditingTitle(false); setEditTitle(g.title); }} className="px-3 py-2 bg-gray-100 rounded text-sm">
              취소
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <h1 className="inline text-2xl font-bold text-gray-900">{g.title}</h1>
            <button onClick={() => setIsEditingTitle(true)} className="px-2 py-1 bg-white border rounded text-xs">
              제목 편집
            </button>
            <span className="ml-2 text-xs text-gray-500">커스텀 그룹</span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <button onClick={backToList} className="mr-2 px-3 py-2 bg-white border rounded text-sm">
            ← 목록으로
          </button>
          <TitleBlock />
        </div>
        {/* 그룹에 사용자 추가 (우측 상단) */}
        <div className="flex space-x-2">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="전화번호 입력 (예: 010-1234-5678)"
            value={addPhone}
            onChange={(e) => setAddPhone(e.target.value)}
          />
          <button onClick={() => addUserToGroup(g.id)} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
            그룹에 사용자 추가
          </button>
        </div>
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
            <div className="font-medium">{g.createdAt}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">그룹 업데이트 일시</div>
            <div className="font-medium">{g.updatedAt}</div>
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
            {g.members.map((m) => (
              <tr key={`${g.id}-${m.phone}-${m.registeredAt}`} className="border-t">
                <td className="px-4 py-2 text-sm">
                  <input type="checkbox" />
                </td>
                <td className="px-4 py-2 text-sm">{m.phone}</td>
                <td className="px-4 py-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${m.friend ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                    {m.friend ? "친구" : "미친구(보류)"}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm whitespace-nowrap">{m.registeredAt}</td>
                <td className="px-4 py-2 text-sm">
                  {/* 데모에서는 auto/custom 모두 제거 허용. 운영시 auto 그룹 제거 비활성 권장 */}
                  <button onClick={() => removeFromGroup(g.id, m.phone)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs">
                    제거
                  </button>
                </td>
              </tr>
            ))}
            {g.members.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                  아직 등록된 사용자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-500 mt-3">
        * 자동 그룹은 백엔드 배치/웹훅 결과를 표시합니다. 재구매 발생 시 종료 그룹에서 자동 제외됩니다. 커스텀 그룹은 상품과 무관하게 운영되며, 제목 수정이 가능합니다.
      </div>
    </div>
  );
}
