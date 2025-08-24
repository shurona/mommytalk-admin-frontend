import React, { useMemo, useState } from "react";

/** CSV 유틸 */
const toCSV = (rows, headers) => {
  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = headers.map((h) => esc(h.label)).join(",");
  const body = rows
    .map((r) =>
      headers
        .map((h) => {
          const val = typeof h.value === "function" ? h.value(r) : r[h.value];
          return esc(val);
        })
        .join(",")
    )
    .join("\n");
  return head + "\n" + body;
};

export default function AllUsers() {
  /** 데모 데이터: latestProductName 및 상품별 이용권(entitlements) 추가  */
  const [usersData, setUsersData] = useState([
    {
      key: "U20240301-0001",
      email: "jiyeon@example.com",
      adminFlag: 0, // 1: 어드민, 0: 일반
      name: "김지연",
      phone: "010-1234-5678",
      signupAt: "2024-03-12 10:21",
      latestPurchaseAt: "2024-03-21 09:00",
      /** 최신 구매 상품명 컬럼 */
      latestProductName: "마미톡365+마미보카",
      /** 상품별 이용권 리스트(시작/종료/상태) */
      entitlements: [
        {
          productName: "마미톡365",
          serviceStart: "2024-03-22",
          serviceEnd: "2025-03-21",
          status: "active",
        },
        {
          productName: "마미톡365+마미보카",
          serviceStart: "2024-06-01",
          serviceEnd: "2025-05-31",
          status: "active",
        },
      ],
      totalAmount: 129000,
      lineId: "line_778899",
      kakaoId: "kakao_112233",
      userLevel: 2,
      child: { level: 2, name: "민지" },
      channelFriend: true,
      purchaseCount: 3,
    },
    {
      key: "U20240315-0002",
      email: "aya@example.jp",
      adminFlag: 1,
      name: "Sato Aya",
      phone: "080-1111-2222",
      signupAt: "2024-03-15 14:05",
      latestPurchaseAt: "2024-03-15 14:06",
      latestProductName: "마미톡365",
      entitlements: [
        {
          productName: "마미톡365",
          serviceStart: "2024-03-16",
          serviceEnd: "2025-03-15",
          status: "active",
        },
      ],
      totalAmount: 59000,
      lineId: "line_556677",
      kakaoId: "-",
      userLevel: 1,
      child: { level: 1, name: "Haruto" },
      channelFriend: false,
      purchaseCount: 1,
    },
  ]);

  const [q, setQ] = useState("");

  /** CSV 헤더: 구매 상품명 추가 */
  const headers = [
    { label: "고유키", value: "key" },
    { label: "이메일", value: "email" },
    { label: "회원 그룹(어드민:1, 일반:0)", value: "adminFlag" },
    { label: "이름", value: "name" },
    { label: "연락처", value: "phone" },
    { label: "가입일", value: "signupAt" },
    { label: "서비스 구매일(최신)", value: "latestPurchaseAt" },
    { label: "구매 상품명(최신)", value: "latestProductName" },
    { label: "총 구매금액", value: (r) => r.totalAmount?.toLocaleString?.() || r.totalAmount },
    { label: "LINE ID", value: "lineId" },
    { label: "KAKAO ID", value: "kakaoId" },
    { label: "사용자 레벨", value: "userLevel" },
    { label: "자녀 레벨", value: (r) => r.child?.level ?? "" },
    { label: "자녀 이름", value: (r) => r.child?.name ?? "" },
    { label: "채널 친구추가 여부", value: (r) => (r.channelFriend ? "Y" : "N") },
    { label: "구매횟수", value: "purchaseCount" },
  ];

  /** 최신 가입순 정렬 + 검색(구매 상품명 포함) */
  const usersSorted = useMemo(() => {
    const copy = [...usersData].sort(
      (a, b) => new Date(b.signupAt.replace(" ", "T")) - new Date(a.signupAt.replace(" ", "T"))
    );
    const s = q.trim().toLowerCase();
    if (!s) return copy;
    const keys = ["key", "email", "name", "phone", "lineId", "kakaoId", "latestProductName"];
    return copy.filter((u) => keys.some((k) => String(u[k] ?? "").toLowerCase().includes(s)));
  }, [usersData, q]);

  const [selectedKey, setSelectedKey] = useState(null);
  const selected = usersData.find((u) => u.key === selectedKey) || null;

  /** 어드민 편집: 연락처 / (상품별) 서비스기간 / 사용자/자녀 레벨 */
  const [edit, setEdit] = useState(null);
  const startEdit = (u) =>
    setEdit({
      key: u.key,
      phone: u.phone || "",
      userLevel: u.userLevel ?? 1,
      childLevel: u.child?.level ?? 0,
      childName: u.child?.name || "",
      /** 상품별 기간 편집: 가장 최신 entitlement 1건만 예시 편집 */
      entProductName: u.entitlements?.[0]?.productName || "",
      entServiceStart: u.entitlements?.[0]?.serviceStart || "",
      entServiceEnd: u.entitlements?.[0]?.serviceEnd || "",
    });

  const apply = () => {
    setUsersData((prev) =>
      prev.map((u) => {
        if (u.key !== edit.key) return u;
        const ents = Array.isArray(u.entitlements) ? [...u.entitlements] : [];
        if (ents.length > 0) {
          ents[0] = {
            ...ents[0],
            productName: edit.entProductName || ents[0].productName,
            serviceStart: edit.entServiceStart || ents[0].serviceStart,
            serviceEnd: edit.entServiceEnd || ents[0].serviceEnd,
          };
        }
        return {
          ...u,
          phone: edit.phone,
          userLevel: Number(edit.userLevel),
          child: { level: Number(edit.childLevel), name: edit.childName },
          entitlements: ents,
          latestProductName: ents[0]?.productName || u.latestProductName,
        };
      })
    );
    setEdit(null);
  };

  const downloadCSV = () => {
    const csv = toCSV(usersSorted, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-users_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-2xl font-bold text-gray-900">👤 전체 회원</h1>
        <div className="flex items-center space-x-2">
          <input
            className="w-64 border rounded px-3 py-2 text-sm"
            placeholder="검색 (이름/이메일/전화/ID/상품명)"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button onClick={downloadCSV} className="px-3 py-2 bg-white border rounded text-sm hover:bg-gray-50">
            데이터 다운받기 (CSV)
          </button>
        </div>
      </div>

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
                  "채널 친구",
                  "구매횟수",
                ].map((h) => (
                  <th key={h} className="px-4 py-2 text-left text-xs text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usersSorted.map((u) => (
                <tr
                  key={u.key}
                  className={`border-t hover:bg-gray-50 cursor-pointer ${selectedKey === u.key ? "bg-blue-50" : ""}`}
                  onClick={() => setSelectedKey(u.key)}
                >
                  <td className="px-4 py-2 text-sm">{u.key}</td>
                  <td className="px-4 py-2 text-sm">{u.email}</td>
                  <td className="px-4 py-2 text-sm">{u.adminFlag}</td>
                  <td className="px-4 py-2 text-sm">{u.name}</td>
                  <td className="px-4 py-2 text-sm">{u.phone}</td>
                  <td className="px-4 py-2 text-sm whitespace-nowrap">{u.signupAt}</td>
                  <td className="px-4 py-2 text-sm whitespace-nowrap">{u.latestPurchaseAt}</td>
                  <td className="px-4 py-2 text-sm">{u.latestProductName}</td>
                  <td className="px-4 py-2 text-sm">{u.totalAmount.toLocaleString()}원</td>
                  <td className="px-4 py-2 text-sm">{u.lineId}</td>
                  <td className="px-4 py-2 text-sm">{u.kakaoId}</td>
                  <td className="px-4 py-2 text-sm">Lv{u.userLevel}</td>
                  <td className="px-4 py-2 text-sm">
                    {u.child ? `Lv${u.child.level} / ${u.child.name}` : "-"}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`px-2 py-1 rounded-full ${u.channelFriend ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"}`}>
                      {u.channelFriend ? "친구" : "미친구"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-sm">{u.purchaseCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 상세/편집 패널 */}
        <div className="bg-white border rounded-lg shadow-sm p-4">
          {selected ? (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold">{selected.name}</div>
                <div className="text-xs text-gray-500">가입일 {selected.signupAt}</div>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                {selected.email} · {selected.phone}
              </div>

              <div className="space-y-2 text-sm">
                <div>회원 그룹: <b>{selected.adminFlag}</b> (1=어드민, 0=일반)</div>
                <div>서비스 구매일(최신): <b>{selected.latestPurchaseAt}</b></div>
                <div>구매 상품명(최신): <b>{selected.latestProductName}</b></div>
                <div>총 구매금액: <b>{selected.totalAmount.toLocaleString()}원</b> · 구매횟수: <b>{selected.purchaseCount}</b></div>
                <div>LINE ID: <b>{selected.lineId}</b> · KAKAO ID: <b>{selected.kakaoId}</b></div>
                <div>사용자 레벨: <b>Lv{selected.userLevel}</b></div>
                <div>자녀: <b>{selected.child ? `Lv${selected.child.level} / ${selected.child.name}` : "-"}</b></div>
                <div>채널 친구추가: <b>{selected.channelFriend ? "Y" : "N"}</b></div>
              </div>

              {/* 상품별 이용권 리스트 */}
              <div className="border-t my-3" />
              <div className="mb-2 font-medium">상품별 이용권</div>
              <div className="bg-gray-50 rounded border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 bg-gray-100">
                      <th className="px-3 py-2 text-left">상품명</th>
                      <th className="px-3 py-2 text-left">시작일</th>
                      <th className="px-3 py-2 text-left">종료일</th>
                      <th className="px-3 py-2 text-left">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.entitlements || []).map((e, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">{e.productName}</td>
                        <td className="px-3 py-2">{e.serviceStart}</td>
                        <td className="px-3 py-2">{e.serviceEnd}</td>
                        <td className="px-3 py-2">{e.status}</td>
                      </tr>
                    ))}
                    {(!selected.entitlements || selected.entitlements.length === 0) && (
                      <tr>
                        <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>
                          이용권 정보가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t my-3" />
              {edit?.key === selected.key ? (
                <div className="space-y-3">
                  <div className="text-sm font-medium">어드민 편집</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500">연락처</label>
                      <input className="w-full border rounded p-2 text-sm" value={edit.phone} onChange={(e) => setEdit((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">사용자 레벨</label>
                      <select className="w-full border rounded p-2 text-sm" value={edit.userLevel} onChange={(e) => setEdit((p) => ({ ...p, userLevel: e.target.value }))}>
                        <option value={0}>Lv0</option>
                        <option value={1}>Lv1</option>
                        <option value={2}>Lv2</option>
                        <option value={3}>Lv3</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">자녀 레벨</label>
                      <select className="w-full border rounded p-2 text-sm" value={edit.childLevel} onChange={(e) => setEdit((p) => ({ ...p, childLevel: e.target.value }))}>
                        <option value={0}>Lv0</option>
                        <option value={1}>Lv1</option>
                        <option value={2}>Lv2</option>
                        <option value={3}>Lv3</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">자녀 이름</label>
                      <input className="w-full border rounded p-2 text-sm" value={edit.childName} onChange={(e) => setEdit((p) => ({ ...p, childName: e.target.value }))} />
                    </div>

                    {/* 상품별 이용권(대표 1건) 편집 */}
                    <div>
                      <label className="text-xs text-gray-500">[이용권] 상품명</label>
                      <input className="w-full border rounded p-2 text-sm" value={edit.entProductName} onChange={(e) => setEdit((p) => ({ ...p, entProductName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">[이용권] 시작일</label>
                      <input type="date" className="w-full border rounded p-2 text-sm" value={edit.entServiceStart} onChange={(e) => setEdit((p) => ({ ...p, entServiceStart: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">[이용권] 종료일</label>
                      <input type="date" className="w-full border rounded p-2 text-sm" value={edit.entServiceEnd} onChange={(e) => setEdit((p) => ({ ...p, entServiceEnd: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={apply} className="flex-1 bg-blue-600 text-white py-2 rounded text-sm">저장</button>
                    <button onClick={() => setEdit(null)} className="px-3 bg-gray-100 text-gray-800 rounded text-sm">취소</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => startEdit(selected)} className="w-full bg-gray-100 text-gray-800 py-2 rounded text-sm">
                  연락처/레벨/자녀/이용권 기간 변경
                </button>
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
