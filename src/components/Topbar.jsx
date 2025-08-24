import React from "react";
import { Globe, Bell } from "lucide-react";

export default function Topbar({ selectedCountry, setSelectedCountry }) {
  return (
    <div className="bg-white border-b px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Globe className="h-5 w-5 text-gray-400" />
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="border-0 text-sm font-medium text-gray-700"
          >
            <option value="KOR">🌐 마미톡잉글리시 KOR</option>
            <option value="JPN">🌐 마미톡잉글리시 JP</option>
          </select>
        </div>
        <div className="flex items-center space-x-3">
          <Bell className="h-5 w-5 text-gray-400" />
          <div className="text-sm text-gray-600">{new Date().toLocaleDateString("ko-KR")}</div>
        </div>
      </div>
    </div>
  );
}
