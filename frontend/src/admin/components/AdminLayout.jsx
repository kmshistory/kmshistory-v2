import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useLogout } from "react-admin";
import apiClient from "../../shared/api/client";

const AdminLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userName, setUserName] = useState("관리자");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  // 사이드바 상태 초기화 (localStorage에서)
  useEffect(() => {
    const savedState = localStorage.getItem("sidebarCollapsed");
    if (savedState === "true") {
      setSidebarCollapsed(true);
    }
  }, []);

  // 사용자 정보 로드
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        if (response.data.nickname) {
          setUserName(response.data.nickname);
        }
      } catch (error) {
        console.error("사용자 정보 로드 실패:", error);
      }
    };
    loadUserInfo();
  }, []);

  // 사이드바 토글
  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 실패:", error);
      navigate("/login");
    }
  };

  // 네비게이션 메뉴 구조 (원본과 동일)
  const navSections = [
    {
      type: "single",
      items: [
        { href: "/admin", icon: "fa-tachometer-alt", label: "대시보드" },
      ],
    },
    {
      type: "section",
      title: "[회원 관리]",
      items: [{ href: "/admin/users", icon: "fa-users", label: "회원 관리" }],
    },
    {
      type: "section",
      title: "[기능 관리]",
      items: [
        { href: "/admin/draw", icon: "fa-trophy", label: "추첨 관리" },
        { href: "/admin/participants", icon: "fa-address-card", label: "대상자 관리" },
        { href: "/admin/quiz", icon: "fa-lightbulb", label: "퀴즈 관리" },
        { href: "/admin/schedule", icon: "fa-calendar", label: "일정 관리" },
      ],
    },
    {
      type: "section",
      title: "[통계]",
      items: [{ href: "/admin/quiz/stats", icon: "fa-chart-line", label: "퀴즈 통계" }],
    },
    {
      type: "section",
      title: "[설정]",
      items: [
        { href: "/admin/notices", icon: "fa-bullhorn", label: "공지사항 관리" },
        { href: "/admin/faq", icon: "fa-question-circle", label: "FAQ 관리" },
        { href: "/admin/settings", icon: "fa-cog", label: "기본 설정" },
      ],
    },
  ];

  // 현재 경로가 활성 상태인지 확인
  const isActive = (href) => {
    const currentPath = location.pathname.replace(/\/$/, "") || "/";
    const navPath = href.replace(/\/$/, "") || "/";
    return currentPath === navPath;
  };

  return (
    <div className="h-screen bg-samsung-light transition-colors duration-200 overflow-hidden">
      {/* Loading Overlay (필요시 사용) */}
      {/* <div id="loading-overlay" className="fixed inset-0 bg-black bg-opacity-50 z-50 hidden flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
          <div className="loading-spinner"></div>
          <span className="text-gray-700">로딩 중...</span>
        </div>
      </div> */}

      {/* Main Layout */}
      <div className="flex h-screen">
        {/* Left Navigation Bar (LNB) */}
        <aside
          id="sidebar"
          className={`lnb-container bg-primary shadow-lg transition-all duration-300 flex-shrink-0 sm:relative ${
            sidebarCollapsed ? "collapsed" : ""
          }`}
          style={{ width: sidebarCollapsed ? "4rem" : "15rem" }}
        >
          {/* Logo Section */}
          <div className="lnb-header h-16 flex items-center justify-between px-4 border-b border-secondary">
            <Link
              to="/admin"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200"
            >
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="fas fa-landmark text-white text-md"></i>
              </div>
              <span className="text-md font-semibold text-white sidebar-text">
                강민성 한국사 관리자
              </span>
            </Link>
            <button
              id="sidebar-toggle"
              onClick={toggleSidebar}
              className="sm:block hidden p-1 rounded-md text-gray-300 hover:text-white transition-colors duration-200"
            >
              <i className="fas fa-bars text-md"></i>
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="lnb-content mt-6 px-4 pb-6">
            <div className="space-y-1">
              {navSections.map((section, sectionIdx) => (
                <div key={sectionIdx} className={section.type === "single" ? "pt-1" : "space-y-1"}>
                  {section.type === "section" && (
                    <div className="text-xs font-semibold text-gray-300 uppercase tracking-wider px-3 py-2 sidebar-text">
                      {section.title}
                    </div>
                  )}
                  {section.items.map((item) => {
                    const active = isActive(item.href);
                    return (
                  <Link
                        key={item.href}
                        to={item.href}
                        className={`nav-item group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                          active
                            ? "bg-secondary text-white hover:text-white shadow-lg ring-2 ring-white ring-opacity-20"
                            : "text-gray-300 hover:bg-secondary hover:text-white"
                        }`}
                      >
                        <i
                          className={`fas ${item.icon} nav-icon mr-3 text-lg ${
                            active
                              ? "text-white"
                              : "text-gray-400 group-hover:text-white"
                          }`}
                        ></i>
                    <span
                      className={`sidebar-text ${
                        active ? "text-white" : "text-gray-300 group-hover:text-white"
                      }`}
                    >
                      {item.label}
                    </span>
                        <span className="tooltip">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header */}
          <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between px-6 h-full">
              {/* Left side */}
              <div className="flex items-center">
                <button
                  id="mobile-sidebar-toggle"
                  onClick={toggleSidebar}
                  className="sm:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 mr-2"
                >
                  <i className="fas fa-bars text-lg"></i>
                </button>
                <button
                  id="desktop-sidebar-toggle"
                  onClick={toggleSidebar}
                  className="hidden sm:block p-2 rounded-md text-gray-500 hover:text-gray-700 mr-2"
                >
                  <i className="fas fa-bars text-lg"></i>
                </button>
                <h1 className="text-xl font-semibold text-gray-900">
                  {location.pathname === "/admin" ? "대시보드" : "관리자 시스템"}
                </h1>
                {location.pathname === "/admin" && (
                  <Link
                    to="/"
                    target="_blank"
                    className="ml-3 px-3 py-1 rounded-md text-sm font-medium text-green-700 hover:text-green-800 bg-green-100 hover:bg-green-200 transition-colors duration-200"
                    title="클라이언트 홈"
                  >
                    클라이언트 홈
                  </Link>
                )}
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-2">
                {/* Client Home */}
                <Link
                  to="/"
                  target="_blank"
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700"
                  title="클라이언트 홈"
                >
                  <i className="fas fa-home text-lg"></i>
                </Link>

                {/* Notifications */}
                <Link
                  to="/admin/notifications"
                  className="p-2 rounded-md text-gray-500 hover:text-gray-700 relative"
                >
                  <i className="fas fa-bell text-lg"></i>
                </Link>

                {/* User menu */}
                <div className="relative">
                  <button
                    id="user-menu-button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-md text-gray-500 hover:text-gray-700"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-white text-sm"></i>
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-900">
                      {userName}
                    </span>
                    <i className="fas fa-chevron-down text-sm"></i>
                  </button>

                  {/* User dropdown */}
                  {userDropdownOpen && (
                    <div
                      id="user-dropdown"
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      <Link
                        to="/admin/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        설정
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <Link
                        to="/"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        사이트 홈
                      </Link>
                      <hr className="my-1 border-gray-200" />
                      <button
                        id="logout-button"
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto custom-scrollbar bg-samsung-light">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>

      {/* 외부 클릭 시 드롭다운 닫기 */}
      {userDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserDropdownOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;
