import React, { useMemo, useState } from "react";

export default function OrderList() {
  const [q, setQ] = useState("");
  const [orders] = useState([
    { code: "S-20240320005", product: "마미톡365", amount: 39000, buyerName: "김지연", method: "CARD", bank: "-", depositor: "-", orderDate: "2024-03-20 12:15" },
    { code: "S-20240321001", product: "마미톡365+마미보카", amount: 59000, buyerName: "박도현", method: "무통장입금", bank: "국민", depositor: "박도현", orderDate: "2024-03-21 08:40" },
    { code: "S-20240322007", product: "마미톡365", amount: 39000, buyerName: "최나래", method: "CARD", bank: "-", depositor: "-", orderDate: "2024-03-22 19:02" },
  ]);

  const list = useMemo(() => {
    const c = [...orders].sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    const s = q.trim();
    if (!s) return c;
    return c.filter((o) => [o.code, o.product, o.buyerName, o.method].some((v) => (v || "").includes(s)));
  }, [orders, q]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">📋 주문 목록</h1>
      <div className="flex items-center mb-3">
        <div className="relative flex-1 max-w-md">
          <input className="w-full border rounded px-3 py-2 text-sm" placeholder="검색 (코드, 상품, 주문자, 결제수단)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500">코드</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">상품</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">금액</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">주문자명</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">결제수단</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">입금은행</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">입금자명</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">주문일</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.code} className="border-t">
                <td className="px-4 py-2 text-sm">{o.code}</td>
                <td className="px-4 py-2 text-sm">{o.product}</td>
                <td className="px-4 py-2 text-sm">{o.amount.toLocaleString()}원</td>
                <td className="px-4 py-2 text-sm">{o.buyerName}</td>
                <td className="px-4 py-2 text-sm">{o.method}</td>
                <td className="px-4 py-2 text-sm">{o.method === "무통장입금" ? o.bank : "-"}</td>
                <td className="px-4 py-2 text-sm">{o.method === "무통장입금" ? o.depositor : "-"}</td>
                <td className="px-4 py-2 text-sm whitespace-nowrap">{o.orderDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
