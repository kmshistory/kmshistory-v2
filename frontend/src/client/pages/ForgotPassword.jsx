import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import { clientTheme } from '../styles/ClientTheme';
import apiClient from '../../shared/api/client';

export default function ForgotPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 🎨 theme 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');

  // 🧩 clientTheme 기반 스타일
  const { input, label } = clientTheme.form;
  const { primary: primaryButton } = clientTheme.button;

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '비밀번호 찾기 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setErrorMessage('이메일 주소를 입력해주세요.');
      setShowErrorModal(true);
      setIsLoading(false);
      return;
    }

    if (!emailRegex.test(email.trim())) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      setShowErrorModal(true);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/password/reset/request', {
        email: email.trim(),
      });

      if (response.status === 200) {
        setIsEmailSent(true);
        setShowSuccessModal(true);
      }
    } catch (error) {
      const message = error.response?.data?.detail || 
                      error.response?.data?.message || 
                      '이메일 전송 중 오류가 발생했습니다.';
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-full">
      <div className="max-w-lg w-full space-y-8">
        {/* 로고 및 헤더 */}
        <div>
          <div
            className="mx-auto h-12 w-12 flex items-center justify-center rounded-full"
            style={{ backgroundColor: primary }}
          >
            <i className="fas fa-key text-white text-xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            비밀번호 찾기
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            가입하신 이메일 주소를 입력해주세요.
          </p>
        </div>

        {/* 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일 주소
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isEmailSent}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
                  isEmailSent ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                style={{
                  ...(isEmailSent ? {} : {
                    '--tw-ring-color': primary,
                  }),
                }}
                onFocus={(e) => {
                  if (!isEmailSent) {
                    e.target.style.borderColor = primary;
                  }
                }}
                onBlur={(e) => {
                  if (!isEmailSent) {
                    e.target.style.borderColor = '#d1d5db';
                  }
                }}
                placeholder="이메일 주소를 입력하세요"
              />
            </div>

            {/* 경고 메시지 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-triangle text-yellow-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    이메일을 잘못 입력한 경우, 이메일이 전송되지 않을 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading || isEmailSent}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isEmailSent ? '#6b7280' : primary,
              }}
              onMouseOver={(e) => {
                if (!isLoading && !isEmailSent) {
                  e.target.style.backgroundColor = secondary;
                }
              }}
              onMouseOut={(e) => {
                if (!isLoading && !isEmailSent) {
                  e.target.style.backgroundColor = primary;
                }
              }}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i
                  className={`fas fa-envelope ${
                    isEmailSent ? 'text-gray-400' : 'text-white'
                  }`}
                  aria-hidden="true"
                ></i>
              </span>
              {isLoading ? (
                <span>전송 중...</span>
              ) : isEmailSent ? (
                <span>이메일 전송 완료</span>
              ) : (
                <span>이메일 받기</span>
              )}
            </button>
          </div>

          {/* 로그인으로 돌아가기 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              <Link
                to="/login"
                className="font-medium hover:underline"
                style={{ color: primary }}
                onMouseOver={(e) => (e.target.style.color = secondary)}
                onMouseOut={(e) => (e.target.style.color = primary)}
              >
                ← 로그인으로 돌아가기
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSuccessModal(false);
            }
          }}
        >
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                이메일 전송 완료
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  비밀번호 재설정 링크가 <br />
                  입력하신 이메일 주소로 전송되었습니다.<br />
                  이메일을 확인해주세요.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="px-4 py-2 text-white text-base font-medium rounded-md w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{
                    backgroundColor: primary,
                  }}
                  onMouseOver={(e) => (e.target.style.backgroundColor = secondary)}
                  onMouseOut={(e) => (e.target.style.backgroundColor = primary)}
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 오류 모달 */}
      {showErrorModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowErrorModal(false);
            }
          }}
        >
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                전송 실패
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">{errorMessage}</p>
              </div>
              <div className="items-center px-4 py-3">
                <button onClick={() => setShowErrorModal(false)} className="btn-danger w-full">
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

