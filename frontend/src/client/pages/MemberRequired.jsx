import React from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function MemberRequired() {
  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
      window.location.href = '/';
    } catch (e) {
      console.error('로그아웃 실패:', e);
      // 로그아웃 실패해도 홈으로 이동
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <i className="fas fa-user text-blue-600 text-3xl"></i>
          </div>
          
          {/* 제목 */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">일반 사용자 전용</h2>
          
          {/* 메시지 */}
          <p className="text-lg text-gray-600 mb-8">
            이 페이지는 일반 사용자 전용입니다.<br />
            관리자 계정으로는 접근할 수 없습니다.
          </p>
          
          {/* 버튼들 */}
          <div className="space-y-4">
            <button
              onClick={handleLogout}
              className="btn-danger w-full relative"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-sign-out-alt text-white/80 group-hover:text-white text-lg"></i>
              </span>
              로그아웃
            </button>
            
            <Link
              to="/"
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-home text-gray-400 group-hover:text-gray-500 text-lg"></i>
              </span>
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}












