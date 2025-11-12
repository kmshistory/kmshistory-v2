import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import { clientTheme } from '../styles/ClientTheme';
import apiClient from '../../shared/api/client';

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 🎨 theme 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');

  // 🧩 clientTheme 기반 스타일
  const { input, label } = clientTheme.form;
  const { primary: primaryButton } = clientTheme.button;

  // 이미 로그인된 사용자인지 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        if (response.data && response.data.nickname) {
          // 이미 로그인된 사용자라면 홈으로 리다이렉트
          navigate('/', { replace: true });
        }
      } catch (error) {
        // 로그인되지 않은 상태이므로 정상 진행
      }
    };
    checkLoginStatus();
  }, [navigate]);

  // URL 파라미터에서 오류 메시지 확인
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      // 오류 메시지 표시 (HTML 지원)
      setError(decodeURIComponent(errorParam));
      setShowErrorModal(true);
      
      // URL에서 오류 파라미터 제거
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  // 로그인 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      // 로그인 성공 확인 후 세션으로 사용자 정보 조회
      try {
        const me = await apiClient.get('/auth/me');
        const userData = me.data || {};
        // localStorage 저장 (선택)
        if (userData && (userData.nickname || userData.email || userData.id)) {
          localStorage.setItem('user', JSON.stringify(userData));
          const userRole = userData.role || 'member';
          if (userRole === 'admin') {
            navigate('/admin', { replace: true });
          } else {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
          }
        } else {
          // 사용자 정보가 없으면 홈으로 이동 (쿠키 설정만 된 케이스 대비)
          navigate('/', { replace: true });
        }
      } catch (e) {
        // /auth/me가 401을 주는 경우도 있으므로 홈으로 이동
        navigate('/', { replace: true });
      }
    } catch (error) {
      // 오류 처리
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      setError(errorMessage);
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
            <i className="fas fa-user text-white text-xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            강민성 한국사에 오신 것을 환영합니다.
          </p>
        </div>

        {/* 로그인 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* 이메일 입력 */}
            <div>
              <label htmlFor="email" className="sr-only">
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:z-10 sm:text-sm"
                style={{
                  borderColor: input.border,
                  transition: input.transition,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primary;
                  e.target.style.boxShadow = `0 0 0 3px rgba(6, 31, 64, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = input.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="이메일 주소"
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label htmlFor="password" className="sr-only">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:z-10 sm:text-sm"
                style={{
                  borderColor: input.border,
                  transition: input.transition,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = primary;
                  e.target.style.boxShadow = `0 0 0 3px rgba(6, 31, 64, 0.1)`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = input.border;
                  e.target.style.boxShadow = 'none';
                }}
                placeholder="비밀번호"
              />
            </div>
          </div>

          {/* 로그인 상태 유지 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 border-gray-300 rounded"
                style={{
                  accentColor: primary,
                }}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                로그인 상태 유지
              </label>
            </div>
          </div>

          {/* 로그인 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: isLoading ? '#9CA3AF' : primary,
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundColor = primary;
                }
              }}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i
                  className="fas fa-lock"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                  aria-hidden="true"
                ></i>
              </span>
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </div>

          {/* 링크 */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              비밀번호를 잊으셨나요?{' '}
              <Link
                to="/auth/forgot-password"
                className="font-medium transition-colors duration-200"
                style={{ color: primary }}
                onMouseEnter={(e) => (e.target.style.color = secondary)}
                onMouseLeave={(e) => (e.target.style.color = primary)}
              >
                비밀번호 찾기
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              계정이 없으신가요?{' '}
              <Link
                to="/register"
                className="font-medium transition-colors duration-200"
                style={{ color: primary }}
                onMouseEnter={(e) => (e.target.style.color = secondary)}
                onMouseLeave={(e) => (e.target.style.color = primary)}
              >
                회원가입
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* 오류 모달 */}
      {showErrorModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowErrorModal(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">로그인 실패</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 whitespace-pre-wrap">{error}</p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-red-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 transition-colors duration-200"
                >
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

