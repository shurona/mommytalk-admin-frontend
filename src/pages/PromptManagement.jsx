import React, { useState } from "react";
import { History } from "lucide-react";

export default function PromptManagement() {
  const now = () => new Date().toLocaleString("ko-KR");
  const [contentPrompt, setContentPrompt] = useState("콘텐츠 생성 프롬프트: 한국/일본 2030 엄마 대상...");
  const [expressionPrompt, setExpressionPrompt] = useState("응용표현 프롬프트: 원문을 맥락 유지하며 3가지 응용표현으로...");
  const [contentLabel, setContentLabel] = useState("");
  const [exprLabel, setExprLabel] = useState("");

  const [contentVersions, setContentVersions] = useState([
    { id: 1, label: "v1 초기 등록", createdAt: "2024-03-10 10:00", text: "초기 v1 내용" },
  ]);
  const [exprVersions, setExprVersions] = useState([
    { id: 1, label: "v1 초기 등록", createdAt: "2024-03-10 10:00", text: "초기 v1 내용" },
  ]);

  const saveVersion = (type, label) => {
    const entry = {
      id: Date.now(),
      label: label || `v${Math.floor(Math.random() * 1000)}`,
      createdAt: now(),
      text: type === "content" ? contentPrompt : expressionPrompt,
    };
    if (type === "content") setContentVersions((p) => [entry, ...p]);
    else setExprVersions((p) => [entry, ...p]);
  };

  const rollback = (type, version) => {
    if (type === "content") setContentPrompt(version.text);
    else setExpressionPrompt(version.text);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">🔧 프롬프트 관리</h1>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-2">콘텐츠 생성 프롬프트</h2>
          <textarea className="w-full border rounded p-3 text-sm h-48" value={contentPrompt} onChange={(e) => setContentPrompt(e.target.value)} />
          <div className="flex items-center space-x-2 mt-2">
            <input
              className="flex-1 border rounded p-2 text-sm"
              placeholder="버전 라벨 (예: v2_엄마레벨규칙보강)"
              value={contentLabel}
              onChange={(e) => setContentLabel(e.target.value)}
            />
            <button onClick={() => { saveVersion("content", contentLabel); setContentLabel(""); }} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
              등록
            </button>
          </div>
          <div className="mt-4">
            <div className="flex items-center mb-2 text-sm text-gray-700">
              <History className="w-4 h-4 mr-1" /> 등록된 버전 히스토리
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {contentVersions.map((v) => (
                <div key={v.id} className="border rounded p-2">
                  <div className="text-sm font-medium">{v.label}</div>
                  <div className="text-xs text-gray-500">{v.createdAt}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{v.text}</div>
                  <div className="mt-2">
                    <button onClick={() => rollback("content", v)} className="px-2 py-1 text-xs bg-gray-100 rounded">
                      이 버전으로 롤백
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg shadow-sm p-4">
          <h2 className="font-semibold mb-2">응용표현 프롬프트</h2>
          <textarea className="w-full border rounded p-3 text-sm h-48" value={expressionPrompt} onChange={(e) => setExpressionPrompt(e.target.value)} />
          <div className="flex items-center space-x-2 mt-2">
            <input
              className="flex-1 border rounded p-2 text-sm"
              placeholder="버전 라벨 (예: v2_문장길이체크강화)"
              value={exprLabel}
              onChange={(e) => setExprLabel(e.target.value)}
            />
            <button onClick={() => { saveVersion("expr", exprLabel); setExprLabel(""); }} className="px-3 py-2 bg-blue-600 text-white rounded text-sm">
              등록
            </button>
          </div>
          <div className="mt-4">
            <div className="flex items-center mb-2 text-sm text-gray-700">
              <History className="w-4 h-4 mr-1" /> 등록된 버전 히스토리
            </div>
            <div className="space-y-2 max-h-64 overflow-auto">
              {exprVersions.map((v) => (
                <div key={v.id} className="border rounded p-2">
                  <div className="text-sm font-medium">{v.label}</div>
                  <div className="text-xs text-gray-500">{v.createdAt}</div>
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{v.text}</div>
                  <div className="mt-2">
                    <button onClick={() => rollback("expr", v)} className="px-2 py-1 text-xs bg-gray-100 rounded">
                      이 버전으로 롤백
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
