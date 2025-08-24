import React, { useState } from "react";

export default function PurchaseEventSettings() {
  const [emails, setEmails] = useState(["ops@example.com"]);
  const [val, setVal] = useState("");

  const add = () => {
    const e = val.trim();
    if (!e) return;
    setEmails((p) => [...p, e]);
    setVal("");
  };
  const remove = (i) => setEmails((p) => p.filter((_, idx) => idx !== i));

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">구매 이벤트 수신 설정</h1>
      <div className="bg-white border rounded-lg shadow-sm p-4 max-w-xl">
        <div className="text-sm text-gray-600 mb-3">결제 성공/환불 등의 구매 이벤트 알림을 받을 관리자 이메일 주소를 지정하세요.</div>
        <div className="flex space-x-2 mb-3">
          <input className="flex-1 border rounded p-2 text-sm" placeholder="admin@example.com" value={val} onChange={(e) => setVal(e.target.value)} />
          <button onClick={add} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">추가</button>
        </div>
        <ul className="space-y-2">
          {emails.map((e, i) => (
            <li key={`${e}-${i}`} className="flex items-center justify-between border rounded p-2">
              <span className="text-sm">{e}</span>
              <button onClick={() => remove(i)} className="text-xs text-red-600">삭제</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
