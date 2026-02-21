import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import { clientTheme } from '../styles/ClientTheme';
import apiClient from '../../shared/api/client';

export default function ForgotPasswordReset() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isTokenValid, setIsTokenValid] = useState(true);

  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');
  const { input, label } = clientTheme.form;
  const { primary: primaryButton } = clientTheme.button;

  const token = useMemo(() => new URLSearchParams(location.search).get('token') || '', [location.search]);

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '비밀번호 재설정 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setErrorMessage('유효하지 않은 재설정 링크입니다.');
      setIsTokenValid(false);
      setShowErrorModal(true);
      return;
    }

    const verify = async () => {
      try {
        await apiClient.get(`/auth/verify-reset-token`, { params: { token } });
        setIsTokenValid(true);
      } catch (e) {
        const msg = e.response?.data?.detail || '토큰 검증 중 오류가 발생했습니다.';
        setErrorMessage(msg);
        setIsTokenValid(false);
        setShowErrorModal(true);
      }
    };
    verify();
  }, [token]);

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 6 || pwd.length > 32) errors.push('6-32자 사이로 입력해주세요.');
    const pats = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*(),.?":{}|<>]/];
    const count = pats.filter((p) => p.test(pwd)).length;
    if (count < 2) errors.push('영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상을 포함해야 합니다.');
    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isTokenValid) return;

    const { isValid, errors } = validatePassword(newPassword);
    if (!isValid) {
      setErrorMessage(errors[0]);
      setShowErrorModal(true);
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다.');
      setShowErrorModal(true);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        new_password: newPassword.trim(),
        confirm_password: confirmPassword.trim(),
      });
      setShowSuccessModal(true);
    } catch (e) {
      const msg = e.response?.data?.detail || e.response?.data?.message || '비밀번호 재설정 중 오류가 발생했습니다.';
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-full">
      <div className="max-w-lg w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full" style={{ backgroundColor: primary }}>
            <i className="fas fa-lock text-white text-xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">비밀번호 재설정</h2>
          <p className="mt-2 text-center text-sm text-gray-600">새로운 비밀번호를 입력해주세요.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">새 비밀번호</label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={!isTokenValid}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${!isTokenValid ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="새 비밀번호를 입력하세요"
              />
              <div className="mt-1 text-xs text-gray-500">
                • 6-32자 사이<br />• 영문 대·소문자, 숫자, 특수문자 중 2가지 이상 조합
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">새 비밀번호 확인</label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={!isTokenValid}
                className={`mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${!isTokenValid ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="새 비밀번호를 다시 입력하세요."
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !isTokenValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: isLoading || !isTokenValid ? '#6b7280' : primary }}
              onMouseOver={(e) => { if (!isLoading && isTokenValid) e.target.style.backgroundColor = secondary; }}
              onMouseOut={(e) => { if (!isLoading && isTokenValid) e.target.style.backgroundColor = primary; }}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className={`fas fa-save ${isLoading || !isTokenValid ? 'text-gray-300' : 'text-white'}`} aria-hidden="true"></i>
              </span>
              {isLoading ? '처리 중...' : '비밀번호 재설정'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              <Link to="/login" className="font-medium hover:underline" style={{ color: primary }} onMouseOver={(e) => (e.target.style.color = secondary)} onMouseOut={(e) => (e.target.style.color = primary)}>
                ← 로그인으로 돌아가기
              </Link>
            </p>
          </div>
        </form>
      </div>

      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowSuccessModal(false); }}>
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">비밀번호 재설정 완료</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">비밀번호가 성공적으로 재설정되었습니다.<br />새로운 비밀번호로 로그인해주세요.</p>
              </div>
              <div className="items-center px-4 py-3">
                <button onClick={() => { setShowSuccessModal(false); navigate('/login'); }} className="btn-primary w-full">
                  로그인하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) setShowErrorModal(false); }}>
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">재설정 실패</h3>
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















