import React, { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

export default function Purchasers() {
  const [orders] = useState([
    { orderNo: "O-20240312001", orderDate: "2024-03-12 09:12", name: "김지연", product: "마미톡365", amount: 39000, method: "CARD", status: "PAID", impLink: "https://www.iamport.kr/payments" },
    { orderNo: "O-20240315003", orderDate: "2024-03-15 20:01", name: "Sato Aya", product: "마미톡365+마미보카", amount: 59000, method: "CARD", status: "REFUNDED", impLink: "https://www.iamport.kr/payments" },
    { orderNo: "O-20240401007", orderDate: "2024-04-01 08:30", name: "김지연", product: "마미톡365+마미보카", amount: 59000, method: "CARD", status: "PAID", impLink: "https://www.iamport.kr/payments" },
  ]);

  const [q, setQ] = useState("");
  const [productFilter, setProductFilter] = useState("ALL");

  const list = useMemo(() => {
    let arr = [...orders];
    if (productFilter !== "ALL") arr = arr.filter((o) => o.product === productFilter);
    const s = q.trim().toLowerCase();
    if (s) {
      arr = arr.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(s) ||
          o.name.toLowerCase().includes(s) ||
          o.product.toLowerCase().includes(s)
      );
    }
    // 최신 주문일 순 정렬
    return arr.sort((a, b) => new Date(b.orderDate.replace(" ", "T")) - new Date(a.orderDate.replace(" ", "T")));
  }, [orders, q, productFilter]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">💰 구매자 관리</h1>
        <div className="flex items-center space-x-2">
          <select className="border rounded px-2 py-2 text-sm" value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
            <option value="ALL">전체 상품</option>
            <option value="마미톡365">마미톡365</option>
            <option value="마미톡365+마미보카">마미톡365+마미보카</option>
          </select>
          <input className="border rounded px-3 py-2 text-sm w-64" placeholder="검색 (주문번호/이름/상품명)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs text-gray-500">주문번호</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">주문날짜</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">이름</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">상품</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">금액</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">결제 수단</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">상태</th>
              <th className="px-4 py-2 text-left text-xs text-gray-500">링크</th>
            </tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.orderNo} className="border-t">
                <td className="px-4 py-2 text-sm">{o.orderNo}</td>
                <td className="px-4 py-2 text-sm whitespace-nowrap">{o.orderDate}</td>
                <td className="px-4 py-2 text-sm">{o.name}</td>
                <td className="px-4 py-2 text-sm">{o.product}</td>
                <td className="px-4 py-2 text-sm">{o.amount.toLocaleString()}원</td>
                <td className="px-4 py-2 text-sm">{o.method}</td>
                <td className="px-4 py-2 text-xs">
                  <span className={`px-2 py-1 rounded-full ${o.status === "PAID" ? "bg-blue-100 text-blue-700" : o.status === "REFUNDED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">
                  <a href={o.impLink} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 hover:underline">
                    결제내역 열기 <ExternalLink className="w-4 h-4 ml-1" />
                  </a>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-gray-500" colSpan={8}>
                  조건에 맞는 주문이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
