import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, FileText, Users, ShoppingCart, LucideIcon } from "lucide-react";

// 서브메뉴 아이템 타입
interface SubmenuItem {
  id: string;
  label: string;
}

// 메뉴 아이템 타입
interface MenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  submenu?: SubmenuItem[];
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname.replace('/', '') || 'content-generation';

  const menu: MenuItem[] = [
    { id: "dashboard", icon: Home, label: "대시보드" },
    {
      id: "content",
      icon: FileText,
      label: "AI 콘텐츠 생성·관리",
      submenu: [
        { id: "content-generation", label: "콘텐츠 생성" },
        { id: "content-list", label: "콘텐츠 목록" },
        { id: "content-group-settings", label: "콘텐츠 발송 및 그룹 설정" },
        { id: "prompt-management", label: "프롬프트 관리" },
        { id: "welcome-message", label: "웰컴 메시지 (별도)" },
        { id: "notification-message", label: "알림톡 메시지 (별도)" },
      ],
    },
    {
      id: "users",
      icon: Users,
      label: "회원 관리",
      submenu: [
        { id: "all-users", label: "전체 회원" },
        { id: "purchasers", label: "구매자 관리" },
        { id: "service-groups", label: "회원 그룹 관리" },
      ],
    },
    {
      id: "sales",
      icon: ShoppingCart,
      label: "판매관리",
      submenu: [
        { id: "order-list", label: "주문 목록" },
        { id: "order-management", label: "주문 관리" },
        { id: "purchase-event-settings", label: "구매 이벤트 수신 설정" },
      ],
    },
    {
      id: "test",
      icon: FileText,
      label: "테스트",
      submenu: [
        { id: "line-login-test", label: "LINE 로그인 (프론트 방식)" },
        { id: "line-sdk-test", label: "LINE 로그인 (서버 통합)" },
      ],
    },
  ];

  const isOpen = (item: MenuItem): boolean =>
    activeTab === item.id || (item.submenu && item.submenu.some((s) => s.id === activeTab)) || false;

  const handleMenuClick = (item: MenuItem): void => {
    if (item.submenu) {
      // 서브메뉴가 있는 경우 첫 번째 서브메뉴로 이동
      navigate(`/${item.submenu[0].id}`);
    } else {
      navigate(`/${item.id}`);
    }
  };

  const handleSubmenuClick = (submenuId: string): void => {
    navigate(`/${submenuId}`);
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">마미톡 어드민</h1>
        <p className="text-sm text-gray-500 mt-1">NEXT 관리자 페이지</p>
      </div>
      <nav className="px-3">
        {menu.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => handleMenuClick(item)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left mb-1 ${
                isOpen(item) ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
            {item.submenu && isOpen(item) && (
              <div className="ml-8 mb-2">
                {item.submenu.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => handleSubmenuClick(sub.id)}
                    className={`w-full text-left px-3 py-1 text-sm rounded ${
                      activeTab === sub.id ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}