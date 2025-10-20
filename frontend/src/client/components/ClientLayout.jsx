import React from 'react';
import { Outlet } from 'react-router-dom';
import { clientTheme } from '../styles/ClientTheme';

const ClientLayout = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 헤더 */}
      <header 
        className="bg-dark border-none shadow-none"
        style={{ height: clientTheme.layout.header.height }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* 로고 */}
            <div className="flex items-center space-x-3">
              <a href="/" className="hover:opacity-80 transition-opacity duration-200">
                <img
                  src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FyqW4L%2FbtsQDbCqlgQ%2FAAAAAAAAAAAAAAAAAAAAABI9RXHqXJ6XSXpNFdsQwPbu4zo9nPIOKXoxwbMo4hH0%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1759244399%26allow_ip%3D%26allow_referer%3D%26signature%3DqqLlYwHqMc9Ap4MESmCem2kcSQ8%253D"
                  alt="강민성 한국사"
                  className="h-12 w-auto object-contain"
                />
              </a>
            </div>

            {/* 네비게이션 */}
            <nav className="hidden md:flex space-x-8">
              <a 
                href="/" 
                className="text-gray-300 hover:text-light font-bold transition-colors duration-200"
              >
                홈
              </a>
              <a 
                href="/schedule" 
                className="text-gray-300 hover:text-light font-bold transition-colors duration-200"
              >
                일정
              </a>
              
              {/* 드롭다운 메뉴 */}
              <div className="relative">
                <button className="text-gray-300 hover:text-light font-bold transition-colors duration-200 flex items-center">
                  정보
                  <i className="material-icons text-sm ml-1">keyboard_arrow_down</i>
                </button>
                <div className="absolute left-0 top-full mt-7 w-48 bg-white rounded-md shadow-lg border border-gray-300 py-1 z-50 hidden">
                  <a href="/notices" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    공지사항
                  </a>
                  <a href="/faq" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    자주 묻는 질문
                  </a>
                </div>
              </div>

              <a 
                href="https://youtube.com/@%ED%95%9C%EA%B5%AD%EC%82%AC%EA%B0%95%EB%AF%BC%EC%84%B1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-light font-bold transition-colors duration-200"
              >
                강민성 유튜브
              </a>
              <a 
                href="https://cafe.naver.com/kmshistory" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-light font-bold transition-colors duration-200"
              >
                네이버 카페
              </a>
            </nav>

            {/* 모바일 메뉴 버튼 */}
            <button className="md:hidden text-gray-300 hover:text-light">
              <i className="fas fa-bars text-xl"></i>
            </button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 푸터 */}
      <footer 
        className="bg-dark text-light py-8"
        style={{ backgroundColor: clientTheme.layout.footer.backgroundColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>&copy; 2024 강민성 한국사. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ClientLayout;
