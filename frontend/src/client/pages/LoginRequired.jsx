import React from 'react';
import { Link } from 'react-router-dom';

export default function LoginRequired() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-6">
            <i className="fas fa-lock text-blue-600 text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">회원 전용 서비스입니다</h2>
          <p className="text-lg text-gray-600 mb-8">
            퀴즈 기능은 로그인한 회원만 이용할 수 있습니다.<br />
            로그인 후 다시 시도해 주세요.
          </p>
          <div className="space-y-4">
            <Link
              to="/login"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-sign-in-alt text-white/80 group-hover:text-white text-lg"></i>
              </span>
              로그인하기
            </Link>
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


