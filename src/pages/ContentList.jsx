import React, { useState } from "react";

export default function ContentList() {
  const [contentList] = useState([
    { id: 1, registerDate: "2024.03.20", theme: "아침 인사", status: "완료" },
    { id: 2, registerDate: "2024.03.20", theme: "아침 인사", status: "완료" },
    { id: 3, registerDate: "2024.03.21", theme: "놀이 시간", status: "대기중" },
    { id: 4, registerDate: "2024.03.18", theme: "잠자리", status: "실패" },
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">콘텐츠 목록</h1>
      <div className="bg-white rounded-lg shadow-sm border overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">번호</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">등록일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">주제</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">액션</th>
            </tr>
          </thead>
          <tbody>
            {contentList.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-6 py-4 text-sm">{item.id}</td>
                <td className="px-6 py-4 text-sm">{item.registerDate}</td>
                <td className="px-6 py-4 text-sm">{item.theme}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      item.status === "완료"
                        ? "bg-green-100 text-green-800"
                        : item.status === "대기중"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {item.status === "대기중" && (
                    <button className="bg-red-100 text-red-700 px-3 py-1 rounded text-xs">취소</button>
                  )}
                  {item.status === "실패" && (
                    <button className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs">다시 보내기</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
