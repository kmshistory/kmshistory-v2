import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import apiClient from '../../shared/api/client';

export default function EditProfile() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // 🎨 theme 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '프로필 수정 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 사용자 정보 상태
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 폼 상태
  const [nickname, setNickname] = useState('');
  const [originalNickname, setOriginalNickname] = useState('');

  // 중복 확인 상태
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [checkingNickname, setCheckingNickname] = useState(false);
  const [nicknameResult, setNicknameResult] = useState({ message: '', type: '', visible: false });

  // 제출 상태
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
      setNickname(userData.nickname || '');
      setOriginalNickname(userData.nickname || '');
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

  // 닉네임 중복 확인
  const handleCheckNickname = async () => {
    const trimmedNickname = nickname.trim();
    
    // 결과 메시지 초기화
    setNicknameResult({ message: '', type: '', visible: false });
    setNicknameChecked(false);

    if (!trimmedNickname) {
      setNicknameResult({
        message: '닉네임을 입력해주세요.',
        type: 'error',
        visible: true,
      });
      return;
    }

    if (trimmedNickname.length < 2 || trimmedNickname.length > 15) {
      setNicknameResult({
        message: '닉네임은 2-15자로 입력해주세요.',
        type: 'error',
        visible: true,
      });
      return;
    }

    // 닉네임 형식 검증 (한글/영문/숫자만)
    const nicknamePattern = /^[가-힣a-zA-Z0-9]+$/;
    if (!nicknamePattern.test(trimmedNickname)) {
      setNicknameResult({
        message: '닉네임은 한글, 영문, 숫자만 사용 가능합니다.',
        type: 'error',
        visible: true,
      });
      return;
    }

    // 원래 닉네임과 같으면 중복 확인 불필요
    if (trimmedNickname === originalNickname) {
      setNicknameResult({
        message: '현재 사용 중인 닉네임입니다.',
        type: 'info',
        visible: true,
      });
      setNicknameChecked(true);
      return;
    }

    setCheckingNickname(true);

    try {
      const response = await apiClient.post('/auth/check-nickname', {
        nickname: trimmedNickname,
      });

      if (response.status === 200) {
        setNicknameResult({
          message: '사용 가능한 닉네임입니다.',
          type: 'success',
          visible: true,
        });
        setNicknameChecked(true);
      }
    } catch (error) {
      const message = error.response?.data?.detail || '이미 사용 중인 닉네임입니다.';
      setNicknameResult({
        message,
        type: 'error',
        visible: true,
      });
      setNicknameChecked(false);
    } finally {
      setCheckingNickname(false);
    }
  };

  // 닉네임 입력 핸들러
  const handleNicknameChange = (value) => {
    setNickname(value);
    // 닉네임이 변경되면 중복 확인 상태 초기화
    if (value !== originalNickname) {
      setNicknameChecked(false);
      setNicknameResult({ message: '', type: '', visible: false });
    } else {
      // 원래 닉네임으로 돌아가면 자동으로 체크됨으로 표시
      setNicknameChecked(true);
      setNicknameResult({ message: '', type: '', visible: false });
    }
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 중복확인을 통과하지 않은 경우 제출 방지
    if (!nicknameChecked) {
      setNicknameResult({
        message: '닉네임 중복확인을 먼저 해주세요.',
        type: 'error',
        visible: true,
      });
      return;
    }

    // 닉네임이 변경되지 않았으면 제출 불필요
    if (nickname.trim() === originalNickname) {
      setNicknameResult({
        message: '변경된 내용이 없습니다.',
        type: 'info',
        visible: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiClient.post('/mypage/update', {
        nickname: nickname.trim(),
      });

      if (response.status === 200) {
        // 성공 메시지 표시 후 페이지 새로고침
        setNicknameResult({
          message: '정보가 성공적으로 수정되었습니다.',
          type: 'success',
          visible: true,
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      const message = error.response?.data?.detail || '정보 수정에 실패했습니다.';
      setNicknameResult({
        message,
        type: 'error',
        visible: true,
      });
      setNicknameChecked(false);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 transition-colors duration-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">정보수정</h1>
          <p className="mt-2 text-gray-600">내 정보를 수정하세요</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LNB */}
          <div className="lg:col-span-1">
            <nav className="space-y-2">
              <Link
                to="/mypage"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                마이페이지
              </Link>
              <Link
                to="/mypage/change-password"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors duration-200"
              >
                비밀번호 변경
              </Link>
              <Link
                to="/mypage/edit-profile"
                className="block px-4 py-2 text-sm font-medium text-white rounded-md transition-colors duration-200"
                style={{ backgroundColor: primary }}
              >
                정보수정
              </Link>
            </nav>
          </div>
          
          {/* 메인 콘텐츠 */}
          <div className="lg:col-span-11">
            <div className="bg-white shadow-sm rounded-lg transition-colors duration-200">
              <form id="editForm" className="space-y-6 p-6" onSubmit={handleSubmit}>
                {/* 닉네임 수정 */}
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-2">
                    닉네임
                  </label>
                  <div className="flex space-x-2">
                    <input
                      id="nickname"
                      name="nickname"
                      type="text"
                      value={nickname}
                      onChange={(e) => handleNicknameChange(e.target.value)}
                      required
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary transition-colors duration-200"
                      style={{
                        borderColor: '#D1D5DB',
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = primary;
                        e.target.style.boxShadow = `0 0 0 3px rgba(6, 31, 64, 0.1)`;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D1D5DB';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCheckNickname}
                      disabled={checkingNickname || nickname.trim() === originalNickname}
                      className="px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: (checkingNickname || nickname.trim() === originalNickname) ? '#9CA3AF' : primary,
                      }}
                      onMouseEnter={(e) => {
                        if (!checkingNickname && nickname.trim() !== originalNickname) {
                          e.target.style.backgroundColor = secondary;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!checkingNickname && nickname.trim() !== originalNickname) {
                          e.target.style.backgroundColor = primary;
                        }
                      }}
                    >
                      {checkingNickname ? '확인 중...' : '중복확인'}
                    </button>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">2-15자, 한글/영문/숫자만 사용 가능</p>
                  {/* 중복확인 결과 메시지 */}
                  {nicknameResult.visible && (
                    <div
                      className={`mt-1 text-sm font-medium ${
                        nicknameResult.type === 'success'
                          ? 'text-green-600'
                          : nicknameResult.type === 'error'
                          ? 'text-red-600'
                          : 'text-blue-600'
                      }`}
                    >
                      {nicknameResult.type === 'success' && (
                        <i className="fas fa-check-circle mr-1"></i>
                      )}
                      {nicknameResult.type === 'error' && (
                        <i className="fas fa-exclamation-circle mr-1"></i>
                      )}
                      {nicknameResult.type === 'info' && (
                        <i className="fas fa-info-circle mr-1"></i>
                      )}
                      {nicknameResult.message}
                    </div>
                  )}
                </div>
                
                {/* 이메일 (읽기 전용) */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    이메일
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <p className="mt-1 text-sm text-gray-500">이메일은 변경할 수 없습니다</p>
                </div>
                
                {/* 저장 버튼 */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!nicknameChecked || isSubmitting || nickname.trim() === originalNickname}
                    className="px-6 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: (!nicknameChecked || isSubmitting || nickname.trim() === originalNickname) ? '#9CA3AF' : primary,
                    }}
                    onMouseEnter={(e) => {
                      if (nicknameChecked && !isSubmitting && nickname.trim() !== originalNickname) {
                        e.target.style.backgroundColor = secondary;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (nicknameChecked && !isSubmitting && nickname.trim() !== originalNickname) {
                        e.target.style.backgroundColor = primary;
                      }
                    }}
                  >
                    {isSubmitting ? '수정 중...' : '정보 수정'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

