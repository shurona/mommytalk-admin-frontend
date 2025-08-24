import React from "react";
import { ExternalLink } from "lucide-react";

export default function OrderManagement() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">주문 관리</h1>
      <p className="text-sm text-gray-600 mb-4">아임포트 주문관리 페이지로 이동하여 상세 확인/환불 처리를 진행하세요.</p>
      <a
        href="https://admin.iamport.kr/payments"
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Iamport 주문관리 바로가기 <ExternalLink className="w-4 h-4 ml-2" />
      </a>
    </div>
  );
}
