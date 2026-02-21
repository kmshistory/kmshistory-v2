import React from 'react';
import { Link } from 'react-router-dom';

export default function AdminRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* 아이콘 */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/20 mb-6">
            <i className="fas fa-lock text-primary text-3xl"></i>
          </div>
          
          {/* 제목 */}
          <h2 className="text-3xl font-bold text-gray-900 mb-4">관리자 권한 필요</h2>
          
          {/* 메시지 */}
          <p className="text-lg text-gray-600 mb-8">
            해당 페이지는 관리자만 접근이 가능합니다.
          </p>
          
          {/* 버튼들 */}
          <div className="space-y-4">
            <Link
              to="/login"
              className="btn-primary w-full relative"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-sign-in-alt text-white group-hover:text-white text-lg"></i>
              </span>
              로그인하기
            </Link>
            
            <Link
              to="/"
              className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
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












