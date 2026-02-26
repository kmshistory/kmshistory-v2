import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import apiClient from '../../shared/api/client';

const ERROR_MESSAGES = {
  no_code: '인증 코드를 받지 못했습니다. 다시 시도해 주세요.',
  google_auth_failed: 'Google 인증에 실패했습니다. 다시 시도해 주세요.',
  naver_auth_failed: '네이버 인증에 실패했습니다. 다시 시도해 주세요.',
  login_failed: '로그인 처리에 실패했습니다. 다시 시도해 주세요.',
};

export default function Login() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);

  // 약관 동의 모달 (Google 버튼 클릭 시 표시)
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeCollection, setAgreeCollection] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [pendingSignupToken, setPendingSignupToken] = useState(null);

  const primary = themeUtils.getColor(theme, 'primary');
  const canProceedGoogleLogin = agreeTerms && agreePrivacy && agreeCollection;

  useEffect(() => {
    document.title = '로그인 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 이미 로그인된 사용자인지 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) return;

      try {
        const response = await apiClient.get('/auth/me');
        if (response.data && response.data.nickname) {
          navigate('/', { replace: true });
        }
      } catch {
        localStorage.removeItem('user');
      }
    };
    checkLoginStatus();
  }, [navigate]);

  // URL 파라미터: 오류 메시지 또는 pending_signup (신규 가입 약관 동의)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const errorParam = searchParams.get('error');
    const pendingParam = searchParams.get('pending_signup');

    if (errorParam) {
      setError(ERROR_MESSAGES[errorParam] || decodeURIComponent(errorParam));
      setShowErrorModal(true);
      navigate(location.pathname, { replace: true });
    } else if (pendingParam) {
      setPendingSignupToken(pendingParam);
      setShowTermsModal(true);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate]);

  const handleCompleteSignup = async () => {
    if (!pendingSignupToken || !canProceedGoogleLogin) return;
    try {
      const res = await apiClient.post('/auth/google/complete-signup', {
        pending_signup: pendingSignupToken,
        agree_terms: agreeTerms,
        agree_privacy: agreePrivacy,
        agree_collection: agreeCollection,
        agree_marketing: agreeMarketing,
      });
      setPendingSignupToken(null);
      setShowTermsModal(false);
      navigate('/', { replace: true });
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.detail || '가입 완료 처리에 실패했습니다. 다시 시도해 주세요.';
      setError(msg);
      setShowErrorModal(true);
    }
  };

  const closeTermsModal = () => {
    setShowTermsModal(false);
    setPendingSignupToken(null);
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-full">
      <div className="max-w-lg w-full space-y-8">
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
            강민성 한국사에 오신 것을 환영합니다. 구글 또는 네이버 계정으로 로그인해 주세요.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <a
            href="/api/auth/google"
            className="group relative w-full flex justify-center items-center gap-3 py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 shadow-sm"
            style={{ borderColor: themeUtils.getColor(theme, 'border') || '#d1d5db' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google로 로그인
          </a>

          <a
            href="/api/auth/naver"
            className="group relative w-full flex justify-center items-center gap-3 py-3 px-4 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#03A94D]/50 transition-all duration-200 shadow-sm hover:opacity-90"
            style={{
              backgroundColor: '#03A94D',
              borderColor: '#03A94D',
              color: '#FFFFFF',
            }}
          >
            <span className="text-lg font-bold">N</span>
            네이버로 로그인
          </a>

        </div>

        <div className="mt-6 text-right">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-user-shield" aria-hidden="true"></i>
            관리자
          </Link>
        </div>
      </div>

      {/* 약관 동의 모달 (신규 가입 시 pending_signup 리다이렉트로 표시) */}
      {showTermsModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4"
          onClick={closeTermsModal}
        >
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">약관 동의</h3>
            <p className="text-sm text-gray-600 mb-4">
              서비스 이용을 위해 아래 약관에 동의해 주세요.
            </p>
            <div className="space-y-3 text-sm mb-6">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: primary }}
                />
                <span>
                  <Link to="/terms" target="_blank" className="underline hover:no-underline" style={{ color: primary }}>
                    이용약관
                  </Link>
                  에 동의합니다 (필수)
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: primary }}
                />
                <span>
                  <Link to="/privacy" target="_blank" className="underline hover:no-underline" style={{ color: primary }}>
                    개인정보처리방침
                  </Link>
                  에 동의합니다 (필수)
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeCollection}
                  onChange={(e) => setAgreeCollection(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: primary }}
                />
                <span>
                  <Link to="/privacy/collection" target="_blank" className="underline hover:no-underline" style={{ color: primary }}>
                    개인정보 수집·이용
                  </Link>
                  에 동의합니다 (필수)
                </span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: primary }}
                />
                <span>마케팅 정보 수신에 동의합니다 (선택)</span>
              </label>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={closeTermsModal} className="btn-outline flex-1">
                취소
              </button>
              <button
                type="button"
                disabled={!canProceedGoogleLogin || !pendingSignupToken}
                onClick={handleCompleteSignup}
                className="btn-primary flex-1"
              >
                동의하고 가입 완료
              </button>
            </div>
          </div>
        </div>
      )}

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
