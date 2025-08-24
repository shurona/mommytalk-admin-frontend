import React, { useState } from "react";
import { AlertCircle, PlusCircle, Trash2, ToggleLeft, ToggleRight, Check } from "lucide-react";

const FRIEND_GROUPS = [
  { id: "all", label: "전체 친구", count: 3456 },
  { id: "new", label: "신규 가입자", count: 120 },
  { id: "buyers", label: "구매자", count: 987 },
  { id: "trial", label: "체험판", count: 543 },
  { id: "inactive", label: "비활성 사용자", count: 200 },
];

export default function ContentGroupSettings() {
  const [groups, setGroups] = useState([
    {
      id: 1,
      name: "그룹1",
      disabled: false,
      mode: "all",
      include: [],
      exclude: [],
      date: "",
      time: "",
      estimated: 3456,
      editing: true,
    },
  ]);
  const maxGroups = 10;

  const estimate = (g) => {
    if (g.disabled) return 0;
    if (g.mode === "all") return FRIEND_GROUPS.find((x) => x.id === "all")?.count || 0;
    const inc = g.include.reduce((sum, id) => sum + (FRIEND_GROUPS.find((x) => x.id === id)?.count || 0), 0);
    const exc = g.exclude.reduce((sum, id) => sum + (FRIEND_GROUPS.find((x) => x.id === id)?.count || 0), 0);
    return Math.max(0, Math.floor((inc - Math.min(inc, exc)) * 0.85));
  };

  const update = (id, patch) =>
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const next = { ...g, ...patch };
        return { ...next, estimated: estimate(next) };
      })
    );

  const add = () => {
    if (groups.length >= maxGroups) return;
    const id = Math.max(...groups.map((g) => g.id)) + 1;
    setGroups((p) => [
      ...p,
      {
        id,
        name: `그룹${id}`,
        disabled: false,
        mode: "all",
        include: [],
        exclude: [],
        date: "",
        time: "",
        estimated: FRIEND_GROUPS.find((x) => x.id === "all")?.count || 0,
        editing: true,
      },
    ]);
  };

  const remove = (id) => setGroups((p) => p.filter((g) => g.id !== id));

  return (
    <div className="p-6">
      {/* ✅ 타이틀만 변경 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">콘텐츠 발송 설정</h1>

      <div className="flex items-start bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-4">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
        <p className="text-sm">
          당일 서비스 사용자 테이블에 자동 추가되는 고객은 <b>다음날 발송 스케줄</b>에 자동 반영됩니다.
        </p>
      </div>

      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.id} className="bg-white border rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <input
                  className="text-lg font-semibold border-b border-transparent focus:border-gray-300 focus:outline-none"
                  value={g.name}
                  onChange={(e) => update(g.id, { name: e.target.value })}
                />
                {g.editing ? (
                  <span className="text-xs text-gray-500">편집중</span>
                ) : (
                  <span className="text-xs text-green-600 flex items-center">
                    <Check className="w-3 h-3 mr-1" />
                    완료
                  </span>
                )}
              </div>
              <button
                onClick={() => update(g.id, { disabled: !g.disabled })}
                className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                  g.disabled ? "bg-gray-100 text-gray-600" : "bg-emerald-50 text-emerald-700"
                }`}
                title="그룹 비활성화 토글"
              >
                {g.disabled ? <ToggleLeft className="w-4 h-4 mr-1" /> : <ToggleRight className="w-4 h-4 mr-1" />}
                {g.disabled ? "비활성" : "활성"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">대상 선택</label>
                  <div className="mt-2 space-y-1">
                    <label className="flex items-center space-x-2 text-sm">
                      <input
                        type="radio"
                        checked={g.mode === "all"}
                        onChange={() => update(g.id, { mode: "all", include: [], exclude: [] })}
                      />
                      <span>전체 친구 발송</span>
                    </label>
                    <label className="flex items-center space-x-2 text-sm">
                      <input type="radio" checked={g.mode === "target"} onChange={() => update(g.id, { mode: "target" })} />
                      <span>친구 그룹 타겟팅</span>
                    </label>
                  </div>
                </div>

                {g.mode === "target" && (
                  <>
                    <div>
                      <label className="text-sm font-medium">포함할 친구 그룹</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {FRIEND_GROUPS.filter((o) => o.id !== "all").map((opt) => (
                          <label key={opt.id} className="flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={g.include.includes(opt.id)}
                              onChange={(e) => {
                                const next = e.target.checked ? [...g.include, opt.id] : g.include.filter((x) => x !== opt.id);
                                update(g.id, { include: next });
                              }}
                            />
                            <span>
                              {opt.label} <span className="text-gray-400">({opt.count.toLocaleString()})</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">제외할 친구 그룹</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {FRIEND_GROUPS.filter((o) => o.id !== "all").map((opt) => (
                          <label key={opt.id} className="flex items-center space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={g.exclude.includes(opt.id)}
                              onChange={(e) => {
                                const next = e.target.checked ? [...g.exclude, opt.id] : g.exclude.filter((x) => x !== opt.id);
                                update(g.id, { exclude: next });
                              }}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">발송 날짜</label>
                  <input type="date" className="w-full mt-1 p-2 border rounded" value={g.date} onChange={(e) => update(g.id, { date: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">발송 시간</label>
                  <input type="time" className="w-full mt-1 p-2 border rounded" value={g.time} onChange={(e) => update(g.id, { time: e.target.value })} />
                </div>
                <div className="bg-gray-50 border rounded p-3">
                  <div className="text-sm text-gray-600">총 예상 발송 대상</div>
                  <div className="text-xl font-semibold">{g.estimated.toLocaleString()} 명</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex space-x-2">
                  {g.editing ? (
                    <button onClick={() => update(g.id, { editing: false })} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm">
                      완료
                    </button>
                  ) : (
                    <button onClick={() => update(g.id, { editing: true })} className="flex-1 bg-gray-100 text-gray-800 py-2 rounded text-sm">
                      수정
                    </button>
                  )}
                  {groups.length > 1 && (
                    <button onClick={() => remove(g.id)} className="px-3 bg-red-50 text-red-600 rounded text-sm" title="그룹 삭제">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-gray-500">지정한 일시로 예약 발송됩니다. 비활성 상태면 발송되지 않습니다.</div>
              </div>
            </div>
          </div>
        ))}

        {groups.length < maxGroups ? (
          <button onClick={add} className="inline-flex items-center px-3 py-2 bg-white border rounded-lg text-sm hover:bg-gray-50">
            <PlusCircle className="w-4 h-4 mr-2" /> 새 그룹 만들기
          </button>
        ) : (
          <div className="text-sm text-gray-500">그룹은 최대 {maxGroups}개까지 생성 가능합니다.</div>
        )}
      </div>
    </div>
  );
}
