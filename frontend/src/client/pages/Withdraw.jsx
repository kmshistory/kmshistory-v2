import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import apiClient from '../../shared/api/client';

export default function Withdraw() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🎨 theme 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '회원 탈퇴 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 상태
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agreeChecked, setAgreeChecked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 사용자 정보 로드
  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/auth/me');
      const userData = res.data;
      
      // 관리자는 마이페이지 접근 불가
      if (userData.role === 'admin') {
        navigate('/member-required');
        return;
      }
      
      setUser(userData);
    } catch (e) {
      console.error('사용자 정보 조회 실패:', e);
      if (e.response?.status === 401) {
        navigate('/login');
      } else {
        setError(e.response?.data?.detail || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 탈퇴 버튼 클릭
  const handleWithdrawClick = () => {
    if (!agreeChecked) {
      setErrorMessage('탈퇴 약관에 동의해주세요.');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmModal(true);
  };

  // 탈퇴 확인 모달에서 취소
  const handleCancelWithdraw = () => {
    setShowConfirmModal(false);
  };

  // 실제 탈퇴 처리
  const handleConfirmWithdraw = async () => {
    setShowConfirmModal(false);
    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/mypage/withdraw');

      if (response.status === 200) {
        setShowSuccessModal(true);
        // 2초 후 홈으로 리다이렉트
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.detail || '회원탈퇴 처리 중 오류가 발생했습니다.';
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchUserInfo}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary"
            style={{ backgroundColor: primary }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = secondary;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = primary;
            }}
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
          <h1 className="text-3xl font-bold text-gray-900">회원탈퇴</h1>
          <p className="mt-2 text-gray-600">계정을 영구적으로 삭제합니다</p>
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
              <div className="space-y-6">
                {/* 회원탈퇴 안내 */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">회원탈퇴 안내</h2>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <i className="fas fa-info-circle text-blue-400 text-lg"></i>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">탈퇴 처리 안내</h3>
                        <div className="mt-2 text-sm text-blue-700">
                          <p>탈퇴 신청 즉시 계정이 비활성화되며, 7일 후 완전히 삭제됩니다.</p>
                          <p className="mt-1">삭제된 계정 정보는 복구할 수 없습니다.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 탈퇴 전 확인사항 */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">탈퇴 전 확인사항</h2>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-700">
                          <strong>정기구독 관련:</strong> 정기구독 중인 경우 당월 결제 금액은 환불되지 않으며, 이후 자동 결제가 중단됩니다.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-700">
                          <strong>콘텐츠 보존:</strong> 작성한 글, 댓글 등은 자동으로 삭제되지 않으며, 필요시 탈퇴 전 직접 삭제해주세요.
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <i className="fas fa-exclamation-triangle text-yellow-500 mt-1"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-700">
                          <strong>개인정보 삭제:</strong> 탈퇴 완료 시, 관련 법령에 따라 보관이 필요한 항목을 제외하고 모든 개인정보가 즉시 삭제되며, 삭제된 정보는 복구되지 않습니다.
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
                
                {/* 회원탈퇴 신청 */}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">회원탈퇴 신청</h2>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="withdrawAgree"
                        name="withdrawAgree"
                        checked={agreeChecked}
                        onChange={(e) => setAgreeChecked(e.target.checked)}
                        className="mt-1 mr-3"
                      />
                      <label
                        htmlFor="withdrawAgree"
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        위 내용을 모두 확인했으며, 탈퇴 시 복구할 수 없음을 이해하고 계정을 탈퇴신청합니다.
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleWithdrawClick}
                      disabled={!agreeChecked || isSubmitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? '처리 중...' : '회원탈퇴 신청'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* 탈퇴 확인 모달 */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={handleCancelWithdraw}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-[420px] shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 text-center">
              {/* 모달 아이콘 */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              
              {/* 모달 제목 */}
              <h3 className="text-lg font-medium text-gray-900 mb-2">회원탈퇴 확인</h3>
              
              {/* 모달 내용 */}
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-3">
                  정말로 회원탈퇴를 진행하시겠습니까?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700 font-medium">
                    탈퇴 시 계정이 즉시 삭제됩니다.
                  </p>
                </div>
              </div>
              
              {/* 모달 버튼 */}
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={handleCancelWithdraw}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors duration-200"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmWithdraw}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                >
                  탈퇴 신청
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">처리 완료</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  회원탈퇴가 완료되었습니다.
                </p>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    window.location.href = '/';
                  }}
                  className="px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200"
                  style={{ backgroundColor: primary }}
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
        </div>
      )}

      {/* 에러 모달 */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">오류 발생</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">{errorMessage}</p>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowErrorModal(false)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
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












