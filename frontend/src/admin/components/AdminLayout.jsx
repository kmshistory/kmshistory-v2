import React, { useState } from 'react';
import { Admin, Resource } from 'react-admin';
import { dataProvider } from '../dataProvider';
import { authProvider } from '../authProvider';
import { adminTheme } from '../styles/AdminTheme';

// 임시 리소스 컴포넌트들
const UserList = () => <div>사용자 목록</div>;
const NoticeList = () => <div>공지사항 목록</div>;
const FAQList = () => <div>FAQ 목록</div>;
const ParticipantList = () => <div>대상자 목록</div>;
const DrawList = () => <div>추첨 목록</div>;

const AdminLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen bg-samsung-light transition-colors duration-200 overflow-hidden">
      <div className="flex h-screen">
        {/* 사이드바 */}
        <div 
          id="sidebar" 
          className={`lnb-container bg-primary shadow-lg transition-all duration-300 flex-shrink-0 sm:relative ${
            sidebarCollapsed ? 'collapsed' : ''
          }`}
          style={{ 
            width: sidebarCollapsed ? adminTheme.sidebar.collapsedWidth : adminTheme.sidebar.width,
            backgroundColor: adminTheme.sidebar.backgroundColor
          }}
        >
          {/* 사이드바 헤더 */}
          <div className="lnb-header h-16 flex items-center justify-between px-4 border-b border-secondary">
            <a href="/admin" className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-200">
              <div className="w-8 h-8 flex items-center justify-center">
                <i className="fas fa-landmark text-white text-md"></i>
              </div>
              <span className="text-md font-semibold text-white sidebar-text">
                강민성 한국사 관리자
              </span>
            </a>
            <button 
              id="sidebar-toggle" 
              className="sm:block hidden p-1 rounded-md text-gray-300 hover:text-white transition-colors duration-200"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <i className="fas fa-bars text-md"></i>
            </button>
          </div>

          {/* 사이드바 네비게이션 */}
          <nav className="lnb-content mt-6 px-4 pb-6">
            <div className="space-y-1">
              <a 
                href="/admin" 
                className="nav-item flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <i className="nav-icon fas fa-tachometer-alt mr-3"></i>
                <span className="sidebar-text">대시보드</span>
              </a>
              
              <a 
                href="/admin/users" 
                className="nav-item flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <i className="nav-icon fas fa-users mr-3"></i>
                <span className="sidebar-text">사용자 관리</span>
              </a>
              
              <a 
                href="/admin/notices" 
                className="nav-item flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <i className="nav-icon fas fa-bullhorn mr-3"></i>
                <span className="sidebar-text">공지사항</span>
              </a>
              
              <a 
                href="/admin/faq" 
                className="nav-item flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <i className="nav-icon fas fa-question-circle mr-3"></i>
                <span className="sidebar-text">FAQ</span>
              </a>
              
              <a 
                href="/admin/participants" 
                className="nav-item flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <i className="nav-icon fas fa-list mr-3"></i>
                <span className="sidebar-text">대상자 관리</span>
              </a>
              
              <a 
                href="/admin/draw" 
                className="nav-item flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <i className="nav-icon fas fa-random mr-3"></i>
                <span className="sidebar-text">추첨 관리</span>
              </a>
              
              <a 
                href="/admin/schedule" 
                className="nav-item flex items-center px-3 py-2 text-sm font-medium text-white rounded-md hover:bg-secondary transition-colors duration-200"
              >
                <i className="nav-icon fas fa-calendar mr-3"></i>
                <span className="sidebar-text">일정 관리</span>
              </a>
            </div>
          </nav>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 상단 헤더 */}
          <header 
            className="bg-white border-b border-gray-200 shadow-sm"
            style={{ height: adminTheme.header.height }}
          >
            <div className="flex items-center justify-between px-6 py-4">
              <h1 className="text-xl font-semibold text-gray-900">관리자 시스템</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">관리자님, 안녕하세요!</span>
                <button className="text-gray-600 hover:text-gray-900">
                  <i className="fas fa-sign-out-alt"></i>
                </button>
              </div>
            </div>
          </header>

          {/* 메인 콘텐츠 */}
          <main 
            className="flex-1 overflow-auto p-6"
            style={{ backgroundColor: adminTheme.main.backgroundColor }}
          >
            <Admin 
              dataProvider={dataProvider} 
              authProvider={authProvider}
              theme={adminTheme}
            >
              <Resource name="users" list={UserList} />
              <Resource name="notices" list={NoticeList} />
              <Resource name="faq" list={FAQList} />
              <Resource name="participants" list={ParticipantList} />
              <Resource name="draw" list={DrawList} />
            </Admin>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
