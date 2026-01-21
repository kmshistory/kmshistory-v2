import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import apiClient from '../../shared/api/client';

export default function ChangePassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🎨 theme 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '비밀번호 변경 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 폼 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 유효성 검사 상태
  const [passwordValidation, setPasswordValidation] = useState({ length: false, complexity: false });
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [passwordMatchMessage, setPasswordMatchMessage] = useState({ type: '', visible: false });

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState({ title: '', message: '', type: 'info' });
  const [shouldRedirectToLogin, setShouldRedirectToLogin] = useState(false);

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiClient.get('/auth/me');
        if (res.data.role === 'admin') {
          navigate('/member-required');
        }
      } catch (error) {
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };
    checkAuth();
  }, [navigate]);

  // 비밀번호 유효성 검사
  const validatePassword = (pwd) => {
    const lengthValid = pwd.length >= 6 && pwd.length <= 32;
    
    const patterns = [
      /[A-Z]/,  // 대문자
      /[a-z]/,  // 소문자
      /[0-9]/,  // 숫자
      /[!@#$%^&*(),.?":{}|<>]/,  // 특수문자
    ];
    
    const matchCount = patterns.filter(pattern => pattern.test(pwd)).length;
    const complexityValid = matchCount >= 2;

    setPasswordValidation({ length: lengthValid, complexity: complexityValid });
    
    // 비밀번호 재확인도 다시 체크
    if (confirmPassword) {
      setPasswordMatch(pwd === confirmPassword);
      setPasswordMatchMessage({
        type: pwd === confirmPassword ? 'success' : 'error',
        visible: confirmPassword.length > 0,
      });
    }
  };

  // 현재 비밀번호 입력 핸들러
  const handleCurrentPasswordChange = (value) => {
    setCurrentPassword(value);
  };

  // 새 비밀번호 입력 핸들러
  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    validatePassword(value);
  };

  // 새 비밀번호 확인 핸들러
  const handleConfirmPasswordChange = (value) => {
    setConfirmPassword(value);
    const match = value === newPassword;
    setPasswordMatch(match);
    setPasswordMatchMessage({
      type: match ? 'success' : 'error',
      visible: value.length > 0,
    });
  };

  // 알림 모달 표시
  const showAlert = (title, message, type = 'info') => {
    setAlertData({ title, message, type });
    setShowAlertModal(true);
  };

  // 알림 모달 닫기
  const closeAlertModal = () => {
    setShowAlertModal(false);
    if (shouldRedirectToLogin) {
      setTimeout(() => {
        navigate('/login');
      }, 500);
    }
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 현재 비밀번호와 새 비밀번호가 같은지 검사
    if (currentPassword === newPassword) {
      showAlert('동일한 비밀번호', '현재 비밀번호와 새 비밀번호가 같습니다. 다른 비밀번호를 입력해주세요.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('비밀번호 확인', '새 비밀번호가 일치하지 않습니다.', 'warning');
      return;
    }

    // 비밀번호 길이 검사
    if (newPassword.length < 6 || newPassword.length > 32) {
      showAlert('비밀번호 길이 오류', '새 비밀번호는 6-32자 사이여야 합니다.', 'warning');
      return;
    }

    // 비밀번호 복잡도 검사
    const patterns = [
      /[A-Z]/,  // 대문자
      /[a-z]/,  // 소문자
      /[0-9]/,  // 숫자
      /[!@#$%^&*(),.?":{}|<>]/,  // 특수문자
    ];
    
    const matchCount = patterns.filter(pattern => pattern.test(newPassword)).length;
    if (matchCount < 2) {
      showAlert('비밀번호 복잡도 오류', '새 비밀번호는 영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상을 포함해야 합니다.', 'warning');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/mypage/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (response.status === 200) {
        setShouldRedirectToLogin(true);
        showAlert('변경 완료', '비밀번호가 성공적으로 변경되었습니다.\n보안을 위해 다시 로그인해주세요.', 'success');
      }
    } catch (error) {
      const message = error.response?.data?.detail || '비밀번호 변경에 실패했습니다.';
      showAlert('변경 실패', message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { to: '/mypage', label: '마이페이지' },
    { to: '/mypage/edit-profile', label: '정보수정' },
    { to: '/mypage/change-password', label: '비밀번호 변경' },
    { to: '/mypage/withdraw', label: '회원탈퇴' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 transition-colors duration-200">
      <div className="w-full sm:w-[95%] md:w-[768px] lg:w-[1024px] xl:w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">비밀번호 변경</h1>
          <p className="mt-2 text-gray-600">보안을 위해 현재 비밀번호를 입력하고 새로운 비밀번호를 설정해주세요</p>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-12">
          {/* LNB */}
          <aside className="lg:col-span-2">
            <nav className="space-y-1 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`block rounded-lg px-4 py-2 text-sm font-medium transition ${
                      isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
          
          {/* 메인 콘텐츠 */}
          <main className="lg:col-span-10">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-colors duration-200">
              <form id="changePasswordForm" className="space-y-6" onSubmit={handleSubmit}>
                {/* 현재 비밀번호 */}
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => handleCurrentPasswordChange(e.target.value)}
                    placeholder="현재 비밀번호를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary transition-colors duration-200"
                    style={{
                      borderColor: '#D1D5DB',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primary;
                      e.target.style.boxShadow = `0 0 0 3px rgba(6, 31, 64, 0.1)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = clientTheme.form.input.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                
                {/* 새 비밀번호 */}
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => handleNewPasswordChange(e.target.value)}
                    placeholder="새 비밀번호를 입력하세요"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary transition-colors duration-200"
                    style={{
                      borderColor: '#D1D5DB',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primary;
                      e.target.style.boxShadow = `0 0 0 3px rgba(6, 31, 64, 0.1)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = clientTheme.form.input.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <p className="mt-1 text-sm text-gray-500">6-32자, 영문 대·소문자/숫자/특수문자 중 2가지 이상 포함</p>
                  {newPassword && (
                    <div className="mt-2 text-xs space-y-1">
                      <div className="flex items-center">
                        <i className={`fas ${passwordValidation.length ? 'fa-check' : 'fa-times'} mr-2 w-4 ${
                          passwordValidation.length ? 'text-green-500' : 'text-red-500'
                        }`}></i>
                        <span className={passwordValidation.length ? 'text-green-500' : 'text-red-500'}>
                          6-32자 사이
                        </span>
                      </div>
                      <div className="flex items-center">
                        <i className={`fas ${passwordValidation.complexity ? 'fa-check' : 'fa-times'} mr-2 w-4 ${
                          passwordValidation.complexity ? 'text-green-500' : 'text-red-500'
                        }`}></i>
                        <span className={passwordValidation.complexity ? 'text-green-500' : 'text-red-500'}>
                          영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 새 비밀번호 확인 */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    placeholder="새 비밀번호를 다시 입력하세요."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary transition-colors duration-200"
                    style={{
                      borderColor: '#D1D5DB',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = primary;
                      e.target.style.boxShadow = `0 0 0 3px rgba(6, 31, 64, 0.1)`;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = clientTheme.form.input.border;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {passwordMatchMessage.visible && (
                    <div className="mt-1 text-xs flex items-center">
                      {passwordMatchMessage.type === 'success' ? (
                        <>
                          <i className="fas fa-check mr-2 w-4 text-green-500"></i>
                          <span className="text-green-500">비밀번호가 일치합니다.</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-times mr-2 w-4 text-red-500"></i>
                          <span className="text-red-500">비밀번호가 일치하지 않습니다.</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 저장 버튼 */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isLoading || !passwordValidation.length || !passwordValidation.complexity || !passwordMatch}
                    className="px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: (isLoading || !passwordValidation.length || !passwordValidation.complexity || !passwordMatch) ? '#9CA3AF' : primary,
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading && passwordValidation.length && passwordValidation.complexity && passwordMatch) {
                        e.target.style.backgroundColor = secondary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading && passwordValidation.length && passwordValidation.complexity && passwordMatch) {
                        e.target.style.backgroundColor = primary;
                      }
                    }}
                  >
                    {isLoading ? '변경 중...' : '비밀번호 변경'}
                  </button>
                </div>
              </form>
            </div>
          </main>
        </div>
      </div>

      {/* 알림 모달 */}
      {showAlertModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full"
          style={{ zIndex: 10000 }}
          onClick={closeAlertModal}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 text-center">
              <div
                className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                  alertData.type === 'success'
                    ? 'bg-green-100'
                    : alertData.type === 'error'
                    ? 'bg-red-100'
                    : alertData.type === 'warning'
                    ? 'bg-yellow-100'
                    : 'bg-blue-100'
                }`}
              >
                <i
                  className={`text-2xl ${
                    alertData.type === 'success'
                      ? 'fas fa-check-circle text-green-600'
                      : alertData.type === 'error'
                      ? 'fas fa-exclamation-circle text-red-600'
                      : alertData.type === 'warning'
                      ? 'fas fa-exclamation-triangle text-yellow-600'
                      : 'fas fa-info-circle text-blue-600'
                  }`}
                ></i>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">{alertData.title}</h3>
              <p className="text-sm text-gray-500 mb-4 whitespace-pre-line">{alertData.message}</p>
              <button
                onClick={closeAlertModal}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                style={{
                  backgroundColor: primary,
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = secondary;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = primary;
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

