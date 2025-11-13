import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import apiClient from '../../shared/api/client';

export default function RegisterConfirm() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const theme = useTheme();
  const primary = themeUtils.getColor(theme, 'primary');

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.title = '회원가입 확인 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('유효하지 않은 요청입니다. 이미 사용되었거나 잘못된 링크일 수 있습니다.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await apiClient.get('/auth/verify-signup', { params: { token } });
        setStatus('success');
        setMessage(response.data?.message || '회원가입이 완료되었습니다. 이제 로그인하실 수 있습니다.');
      } catch (error) {
        const detail =
          error.response?.data?.detail ||
          '가입 인증에 실패했습니다. 링크가 만료되었거나 이미 사용되었습니다.';
        setStatus('error');
        setMessage(detail);
      }
    };

    verifyToken();
  }, [token]);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  const iconClass = isLoading
    ? 'fas fa-spinner fa-pulse text-blue-600'
    : isSuccess
    ? 'fas fa-check-circle text-green-600'
    : 'fas fa-exclamation-triangle text-red-600';

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: primary }}
          >
            <i className="fas fa-envelope-open text-white text-xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            가입 인증 {isSuccess ? '완료' : '확인'}
          </h2>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center space-y-4 text-center">
            <i className={`${iconClass} text-4xl`}></i>
            <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>
          </div>

          <div className="mt-8 flex flex-col items-center space-y-3">
            {isSuccess ? (
              <Link
                to="/login"
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                로그인하기
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                다시 회원가입 진행하기
              </Link>
            )}
            <Link
              to="/"
              className="inline-flex w-full justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              홈으로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

