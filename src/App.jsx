import React, { useState } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ContentGeneration from "./pages/ContentGeneration";
import ContentList from "./pages/ContentList";
import ContentGroupSettings from "./pages/ContentGroupSettings";
import PromptManagement from "./pages/PromptManagement";
import AllUsers from "./pages/AllUsers";
import Purchasers from "./pages/Purchasers";
import ServiceGroups from "./pages/ServiceGroups";
import OrderList from "./pages/OrderList";
import OrderManagement from "./pages/OrderManagement";
import PurchaseEventSettings from "./pages/PurchaseEventSettings";

export default function App() {
  const [activeTab, setActiveTab] = useState("content-generation");
  const [selectedCountry, setSelectedCountry] = useState("KOR");

  const renderContent = () => {
    switch (activeTab) {
      case "content-generation":
        return <ContentGeneration />;
      case "content-list":
        return <ContentList />;
      case "content-group-settings":
        return <ContentGroupSettings />;
      case "prompt-management":
        return <PromptManagement />;
      case "all-users":
        return <AllUsers />;
      case "purchasers":
        return <Purchasers />;
      case "service-groups":
        return <ServiceGroups />;
      case "order-list":
        return <OrderList />;
      case "order-management":
        return <OrderManagement />;
      case "purchase-event-settings":
        return <PurchaseEventSettings />;
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">페이지 준비중</h1>
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <p>해당 페이지는 준비중입니다.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        <Topbar selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} />
        {renderContent()}
      </div>
    </div>
  );
}
