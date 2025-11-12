import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import { clientTheme } from '../styles/ClientTheme';
import apiClient from '../../shared/api/client';

const ClientLayout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // 🎨 designSystem 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const light = themeUtils.getColor(theme, 'light');
  const dark = themeUtils.getColor(theme, 'dark');

  // 🧩 clientTheme 기반 레이아웃 스타일
  const { header, footer, container } = clientTheme.layout;
  const link = clientTheme.navigation.link;
  const activeLink = clientTheme.navigation.activeLink;
  const mobileMenu = clientTheme.navigation.mobileMenu;

  const checkLoginStatus = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.data && response.data.nickname) {
        setIsLoggedIn(true);
        setUser(response.data);
      } else {
        setIsLoggedIn(false);
        setUser(null);
      }
    } catch (error) {
      // 401 (Unauthorized)는 정상적인 경우 (로그인하지 않은 상태)
      // 500 (Internal Server Error)는 서버 에러지만 조용히 처리
      // 나머지 에러도 조용히 처리
      setIsLoggedIn(false);
      setUser(null);
      
      // 디버그 모드에서만 에러 로그 출력 (개발 중에만 필요시 주석 해제)
      // if (process.env.NODE_ENV === 'development') {
      //   console.log('[Auth] 로그인 상태 확인 실패:', error.response?.status);
      // }
    }
  }, []);

  // 로그인 상태 확인
  useEffect(() => {
    checkLoginStatus();
  }, [location.pathname, checkLoginStatus]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#userDropdown') && !e.target.closest('#userMenuButton')) {
        setShowUserDropdown(false);
      }
      if (!e.target.closest('#notificationDropdown') && !e.target.closest('#notificationMenuButton')) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);



  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem('user');
      navigate('/');
    } catch (error) {
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* 헤더 */}
      <header
        className="flex-shrink-0"
        style={{
          height: header.height,
          backgroundColor: header.backgroundColor,
          borderBottom: header.borderBottom,
          boxShadow: header.shadow,
        }}
      >
        <div
          className="flex justify-between items-center py-4 px-4 sm:px-6 lg:px-8"
          style={{
            maxWidth: container.maxWidth,
            margin: container.margin,
          }}
        >
          {/* 로고 */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="hover:opacity-80 transition-opacity duration-200">
              <img
                src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FyqW4L%2FbtsQDbCqlgQ%2FAAAAAAAAAAAAAAAAAAAAABI9RXHqXJ6XSXpNFdsQwPbu4zo9nPIOKXoxwbMo4hH0%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1759244399%26allow_ip%3D%26allow_referer%3D%26signature%3DqqLlYwHqMc9Ap4MESmCem2kcSQ8%253D"
                alt="강민성 한국사"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          {/* 네비게이션 - clientTheme 기반 */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="transition-colors duration-200"
              style={{
                color: location.pathname === '/' ? activeLink.color : link.color,
                fontWeight: link.fontWeight,
                transition: link.transition,
              }}
              onMouseOver={(e) => {
                if (location.pathname !== '/') e.target.style.color = link.hoverColor;
              }}
              onMouseOut={(e) => {
                if (location.pathname !== '/') e.target.style.color = link.color;
              }}
            >
              홈
            </Link>
            
            <Link
              to="/schedule"
              className="transition-colors duration-200"
              style={{
                color: location.pathname === '/schedule' ? activeLink.color : link.color,
                fontWeight: link.fontWeight,
                transition: link.transition,
              }}
              onMouseOver={(e) => {
                if (location.pathname !== '/schedule') e.target.style.color = link.hoverColor;
              }}
              onMouseOut={(e) => {
                if (location.pathname !== '/schedule') e.target.style.color = link.color;
              }}
            >
              일정
            </Link>

            <Link
              to="/quiz"
              className="transition-colors duration-200"
              style={{
                color: location.pathname.startsWith('/quiz') ? activeLink.color : link.color,
                fontWeight: link.fontWeight,
                transition: link.transition,
              }}
              onMouseOver={(e) => {
                if (!location.pathname.startsWith('/quiz')) e.target.style.color = link.hoverColor;
              }}
              onMouseOut={(e) => {
                if (!location.pathname.startsWith('/quiz')) e.target.style.color = link.color;
              }}
            >
              퀴즈
            </Link>

            {/* 알림 드롭다운 메뉴 */}
            <div className="relative">
              <button
                id="notificationMenuButton"
                onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                className="transition-colors duration-200 flex items-center"
                style={{
                  color: link.color,
                  fontWeight: link.fontWeight,
                  transition: link.transition,
                }}
                onMouseOver={(e) => (e.target.style.color = link.hoverColor)}
                onMouseOut={(e) => (e.target.style.color = link.color)}
              >
                알림
                <i className="material-icons text-sm ml-1">keyboard_arrow_down</i>
              </button>
              
              {showNotificationDropdown && (
                <div className="absolute left-0 top-full mt-7 w-48 bg-white rounded-md shadow-lg border border-gray-300 py-1 z-50">
                  <Link
                    to="/notices"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowNotificationDropdown(false)}
                  >
                    공지사항
                  </Link>
                  <Link
                    to="/faq"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowNotificationDropdown(false)}
                  >
                    자주 묻는 질문
                  </Link>
                </div>
              )}
            </div>

            {/* 외부 링크 */}
            <a
              href="https://youtube.com/@%ED%95%9C%EA%B5%AD%EC%82%AC%EA%B0%95%EB%AF%BC%EC%84%B1"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200"
              style={{
                color: link.color,
                fontWeight: link.fontWeight,
                transition: link.transition,
              }}
              onMouseOver={(e) => (e.target.style.color = link.hoverColor)}
              onMouseOut={(e) => (e.target.style.color = link.color)}
            >
              강민성 유튜브
            </a>
            <a
              href="https://cafe.naver.com/kmshistory"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200"
              style={{
                color: link.color,
                fontWeight: link.fontWeight,
                transition: link.transition,
              }}
              onMouseOver={(e) => (e.target.style.color = link.hoverColor)}
              onMouseOut={(e) => (e.target.style.color = link.color)}
            >
              네이버 카페
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfaDMefOXCTWOfxO4krHX3XtOoCYipCRzEQYE06hzrnL2i8UQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200"
              style={{
                color: link.color,
                fontWeight: link.fontWeight,
                transition: link.transition,
              }}
              onMouseOver={(e) => (e.target.style.color = link.hoverColor)}
              onMouseOut={(e) => (e.target.style.color = link.color)}
            >
              강연신청
            </a>
          </nav>

          {/* 우측 로그인/사용자 메뉴 */}
          <div className="flex items-center space-x-4">
            {/* 로그인 버튼 (비로그인 상태) */}
            {!isLoggedIn && (
              <Link
                to="/login"
                className="transition-colors duration-200 hidden md:block"
                id="loginLink"
                style={{
                  color: link.color,
                  fontWeight: link.fontWeight,
                  transition: link.transition,
                }}
                onMouseOver={(e) => (e.target.style.color = link.hoverColor)}
                onMouseOut={(e) => (e.target.style.color = link.color)}
              >
                로그인
              </Link>
            )}

            {/* 사용자 드롭다운 메뉴 (로그인 상태) */}
            {isLoggedIn && (
              <div className="relative hidden md:block" id="userDropdown">
                <button
                  id="userMenuButton"
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center transition-colors duration-200"
                  style={{
                    color: link.color,
                    fontWeight: link.fontWeight,
                    transition: link.transition,
                  }}
                  onMouseOver={(e) => (e.target.style.color = link.hoverColor)}
                  onMouseOut={(e) => (e.target.style.color = link.color)}
                >
                  <span id="userNickname">{user?.nickname} 님</span>
                  <i className="material-icons text-sm ml-1">keyboard_arrow_down</i>
                </button>
                
                {showUserDropdown && (
                  <div className="absolute right-0 top-full mt-7 w-48 bg-white rounded-md border border-gray-300 py-1 z-50">
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        id="adminPageLink"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        관리자 페이지
                      </Link>
                    )}
                    <Link
                      to="/mypage"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserDropdown(false)}
                    >
                      마이페이지
                    </Link>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        handleLogout();
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}

          {/* 모바일 메뉴 버튼 */}
            <button
              id="mobile-menu-button"
              className="md:hidden transition-colors duration-200"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Open menu"
              style={{
                color: link.color,
                transition: link.transition,
              }}
              onMouseOver={(e) => (e.target.style.color = link.hoverColor)}
              onMouseOut={(e) => (e.target.style.color = link.color)}
            >
              <i className="material-icons text-xl">menu</i>
            </button>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        <div
          id="mobile-menu"
          className={`md:hidden ${showMobileMenu ? '' : 'hidden'} border-t`}
          style={{
            backgroundColor: mobileMenu.backgroundColor,
            borderTopColor: mobileMenu.borderTopColor,
          }}
        >
          <div className="px-4 py-2 space-y-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              style={{
                color: mobileMenu.textColor,
              }}
              onClick={() => setShowMobileMenu(false)}
              onMouseOver={(e) => {
                e.target.style.color = mobileMenu.hoverTextColor;
                e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
              }}
              onMouseOut={(e) => {
                e.target.style.color = mobileMenu.textColor;
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              홈
            </Link>
            
            <Link
              to="/schedule"
              className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              style={{
                color: mobileMenu.textColor,
              }}
              onClick={() => setShowMobileMenu(false)}
              onMouseOver={(e) => {
                e.target.style.color = mobileMenu.hoverTextColor;
                e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
              }}
              onMouseOut={(e) => {
                e.target.style.color = mobileMenu.textColor;
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              일정
            </Link>

            <Link
              to="/quiz"
              className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              style={{
                color: mobileMenu.textColor,
              }}
              onClick={() => setShowMobileMenu(false)}
              onMouseOver={(e) => {
                e.target.style.color = mobileMenu.hoverTextColor;
                e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
              }}
              onMouseOut={(e) => {
                e.target.style.color = mobileMenu.textColor;
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              퀴즈
            </Link>
            
            {/* 모바일 알림 메뉴 */}
            <div className="px-3 py-2">
              <div className="text-base font-medium mb-2" style={{ color: mobileMenu.textColor }}>
                알림
              </div>
              <div className="ml-4 space-y-1">
                <Link
                  to="/notices"
                  className="block px-3 py-2 rounded-md text-sm transition-colors duration-200"
                  style={{ color: mobileMenu.textColor }}
                  onClick={() => setShowMobileMenu(false)}
                  onMouseOver={(e) => {
                    e.target.style.color = mobileMenu.hoverTextColor;
                    e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = mobileMenu.textColor;
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  공지사항
                </Link>
                <Link
                  to="/faq"
                  className="block px-3 py-2 rounded-md text-sm transition-colors duration-200"
                  style={{ color: mobileMenu.textColor }}
                  onClick={() => setShowMobileMenu(false)}
                  onMouseOver={(e) => {
                    e.target.style.color = mobileMenu.hoverTextColor;
                    e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
                  }}
                  onMouseOut={(e) => {
                    e.target.style.color = mobileMenu.textColor;
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  자주 묻는 질문
                </Link>
              </div>
            </div>
            <a
              href="https://youtube.com/@%ED%95%9C%EA%B5%AD%EC%82%AC%EA%B0%95%EB%AF%BC%EC%84%B1"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              style={{ color: mobileMenu.textColor }}
              onMouseOver={(e) => {
                e.target.style.color = mobileMenu.hoverTextColor;
                e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
              }}
              onMouseOut={(e) => {
                e.target.style.color = mobileMenu.textColor;
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              강민성 유튜브
            </a>
            <a
              href="https://cafe.naver.com/kmshistory"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              style={{ color: mobileMenu.textColor }}
              onMouseOver={(e) => {
                e.target.style.color = mobileMenu.hoverTextColor;
                e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
              }}
              onMouseOut={(e) => {
                e.target.style.color = mobileMenu.textColor;
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              네이버 카페
            </a>
            <a
              href="https://docs.google.com/forms/d/e/1FAIpQLSfaDMefOXCTWOfxO4krHX3XtOoCYipCRzEQYE06hzrnL2i8UQ/viewform"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
              style={{ color: mobileMenu.textColor }}
              onMouseOver={(e) => {
                e.target.style.color = mobileMenu.hoverTextColor;
                e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
              }}
              onMouseOut={(e) => {
                e.target.style.color = mobileMenu.textColor;
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              강연신청
            </a>
            
            {/* 모바일 사용자 메뉴 (로그인 전) */}
            {!isLoggedIn && (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                id="mobileLoginLink"
                style={{ color: mobileMenu.textColor }}
                onClick={() => setShowMobileMenu(false)}
                onMouseOver={(e) => {
                  e.target.style.color = mobileMenu.hoverTextColor;
                  e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
                }}
                onMouseOut={(e) => {
                  e.target.style.color = mobileMenu.textColor;
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                로그인
              </Link>
            )}
            
            {/* 모바일 사용자 메뉴 (로그인 후) */}
            {isLoggedIn && (
              <div id="mobileUserMenu">
                <div className="px-3 py-2 text-sm sm:text-base font-medium" id="mobileUserNickname" style={{ color: mobileMenu.textColor }}>
                  {user?.nickname} 님
                </div>
                <div className="ml-4 space-y-1">
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 rounded-md text-sm transition-colors duration-200"
                      id="mobileAdminPageLink"
                      style={{ color: mobileMenu.textColor }}
                      onClick={() => setShowMobileMenu(false)}
                      onMouseOver={(e) => {
                        e.target.style.color = mobileMenu.hoverTextColor;
                        e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
                      }}
                      onMouseOut={(e) => {
                        e.target.style.color = mobileMenu.textColor;
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      관리자 페이지
                    </Link>
                  )}
                  <Link
                    to="/mypage"
                    className="block px-3 py-2 rounded-md text-sm transition-colors duration-200"
                    style={{ color: mobileMenu.textColor }}
                    onClick={() => setShowMobileMenu(false)}
                    onMouseOver={(e) => {
                      e.target.style.color = mobileMenu.hoverTextColor;
                      e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = mobileMenu.textColor;
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    마이페이지
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-200"
                    style={{ color: mobileMenu.textColor }}
                    onMouseOver={(e) => {
                      e.target.style.color = mobileMenu.hoverTextColor;
                      e.target.style.backgroundColor = mobileMenu.hoverBackgroundColor;
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = mobileMenu.textColor;
                      e.target.style.backgroundColor = 'transparent';
                    }}
                  >
                    로그아웃
          </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 푸터 */}
      <footer
        className="text-center flex-shrink-0"
        style={{
          backgroundColor: footer.backgroundColor,
          color: footer.color,
          padding: footer.padding,
        }}
      >
        <div
          style={{
            maxWidth: container.maxWidth,
            margin: container.margin,
            padding: container.padding,
          }}
        >
          <div className="flex flex-col md:flex-row justify-center items-center">
            <div className="text-sm opacity-70">
              © {new Date().getFullYear()} 강민성 한국사. All rights reserved.  | 문의: official@kmshistory.kr
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;
