import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import { clientTheme } from '../styles/ClientTheme';
import apiClient from '../../shared/api/client';

export default function Register() {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // 🎨 theme 기반 색상
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');

  // 🧩 clientTheme 기반 스타일
  const { input, label } = clientTheme.form;
  const { primary: primaryButton } = clientTheme.button;

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '회원가입 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // 유효성 검사 상태
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(false);

  // 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeCollection, setAgreeCollection] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  // UI 상태
  const [emailCheckResult, setEmailCheckResult] = useState({ type: '', message: '' });
  const [nicknameError, setNicknameError] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ length: false, complexity: false });
  const [passwordConfirmMessage, setPasswordConfirmMessage] = useState({ type: '', visible: false });

  // 모달 상태
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSendCompleteModal, setShowSendCompleteModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsModalContent, setTermsModalContent] = useState('');
  const [termsModalTitle, setTermsModalTitle] = useState('');
  const [currentTermsType, setCurrentTermsType] = useState(null);

  // 인증 관련
  const [verificationSectionEnabled, setVerificationSectionEnabled] = useState(false);
  const [sendCodeBtnDisabled, setSendCodeBtnDisabled] = useState(true);
  const [sendCodeBtnText, setSendCodeBtnText] = useState('인증번호 전송');
  const [verifyCodeBtnDisabled, setVerifyCodeBtnDisabled] = useState(true);
  const [verifyCodeBtnText, setVerifyCodeBtnText] = useState('인증 확인');
  const [timeLeft, setTimeLeft] = useState(180);
  const [showResendBtn, setShowResendBtn] = useState(false);
  const countdownTimerRef = useRef(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Toast UI Editor 로드
  useEffect(() => {
    // Toast UI Editor CSS 로드
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://uicdn.toast.com/editor/latest/toastui-editor.min.css';
    document.head.appendChild(cssLink);

    // Toast UI Editor JS 로드
    const script1 = document.createElement('script');
    script1.src = 'https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js';
    script1.async = true;
    document.body.appendChild(script1);

    // 한국어 로케일 로드
    const script2 = document.createElement('script');
    script2.src = 'https://uicdn.toast.com/editor/latest/i18n/ko-kr.js';
    script2.async = true;
    document.body.appendChild(script2);

    return () => {
      document.head.removeChild(cssLink);
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  // 전체 동의 체크박스 업데이트
  useEffect(() => {
    const allChecked = agreeTerms && agreePrivacy && agreeCollection && agreeMarketing;
    setAgreeAll(allChecked);
  }, [agreeTerms, agreePrivacy, agreeCollection, agreeMarketing]);

  // 전체 동의 체크박스 클릭
  const handleAgreeAll = (checked) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeCollection(checked);
    setAgreeMarketing(checked);
  };

  // 이메일 형식 검증
  const validateEmailFormat = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // 이메일 중복확인
  const handleCheckEmail = async () => {
    if (!email) {
      setEmailCheckResult({ type: 'error', message: '이메일을 입력해주세요' });
      setSendCodeBtnDisabled(true);
      return;
    }

    if (!validateEmailFormat(email)) {
      setEmailCheckResult({ type: 'error', message: '올바른 이메일 형식을 입력해주세요' });
      setSendCodeBtnDisabled(true);
      return;
    }

    try {
      const response = await apiClient.post('/auth/check-email', { email });
      
      if (response.status === 200) {
        setEmailCheckResult({ type: 'success', message: response.data?.message || '사용 가능한 이메일입니다' });
        setEmailChecked(true);
        setSendCodeBtnDisabled(false);
      }
    } catch (error) {
      console.error('이메일 중복확인 에러:', error);
      const message = error.response?.data?.detail || error.message || '이메일 중복확인 중 오류가 발생했습니다.';
      setEmailCheckResult({ type: 'error', message });
      setEmailChecked(false);
      setSendCodeBtnDisabled(true);
    }
  };

  // 인증번호 전송
  const handleSendVerificationCode = async () => {
    if (!emailChecked) {
      alert('이메일 중복확인을 먼저 해주세요.');
      return;
    }

    setSendCodeBtnText('발송중...');
    setSendCodeBtnDisabled(true);

    try {
      const response = await apiClient.post('/auth/send-code', { email });
      
      if (response.status === 200) {
        setShowSendCompleteModal(true);
        setSendCodeBtnText('발송완료');
        setVerificationSectionEnabled(true);
        startCountdown();
        
        // 이메일 필드 비활성화
        const emailField = document.getElementById('email');
        if (emailField) emailField.disabled = true;
      }
    } catch (error) {
      const message = error.response?.data?.detail || '인증번호 발송에 실패했습니다.';
      alert(message);
      setSendCodeBtnText('인증번호 전송');
      setSendCodeBtnDisabled(false);
    }
  };

  // 카운트다운 시작
  const startCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }

    setTimeLeft(180);
    const startTime = Date.now();
    const endTime = startTime + 180000; // 3분

    countdownTimerRef.current = setInterval(() => {
      const remaining = Math.ceil((endTime - Date.now()) / 1000);
      
      if (remaining <= 0) {
        clearInterval(countdownTimerRef.current);
        setTimeLeft(0);
        setShowResendBtn(true);
      } else {
        setTimeLeft(remaining);
      }
    }, 100);
  };

  // 카운트다운 정리
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // 인증번호 확인
  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      alert('인증번호 6자리를 입력해주세요.');
      return;
    }

    try {
      const response = await apiClient.post('/auth/verify-email', {
        email,
        code: verificationCode.trim(),
      });

      if (response.status === 200) {
        setEmailVerified(true);
        setShowSuccessModal(true);
        setVerifyCodeBtnText('인증완료');
        setVerifyCodeBtnDisabled(true);
        
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
        }
      }
    } catch (error) {
      console.error('인증번호 확인 에러:', error);
      const message = error.response?.data?.detail || '인증번호 확인 중 오류가 발생했습니다.';
      alert(message);
    }
  };

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
    setPasswordValid(lengthValid && complexityValid);
    
    // 비밀번호 재확인도 다시 체크
    if (passwordConfirm) {
      setPasswordMatch(pwd === passwordConfirm);
    }
  };

  // 비밀번호 입력 핸들러
  const handlePasswordChange = (value) => {
    setPassword(value);
    validatePassword(value);
  };

  // 비밀번호 재확인 핸들러
  const handlePasswordConfirmChange = (value) => {
    setPasswordConfirm(value);
    const match = value === password;
    setPasswordMatch(match);
    setPasswordConfirmMessage({
      type: match ? 'success' : 'error',
      visible: value.length > 0,
    });
  };

  // 닉네임 유효성 검사
  const validateNickname = (nick) => {
    if (nick.length < 2 || nick.length > 15) return false;
    return /^[가-힣a-zA-Z0-9]+$/.test(nick);
  };

  // 닉네임 중복확인
  const handleCheckNickname = async () => {
    if (!nickname) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (!validateNickname(nickname)) {
      setNicknameError('닉네임은 2-15자 사이의 한글, 영문, 숫자만 사용 가능합니다.');
      setNicknameSuccess(false);
      setNicknameChecked(false);
      return;
    }

    try {
      const response = await apiClient.post('/auth/check-nickname', { nickname });
      
      if (response.status === 200) {
        setNicknameSuccess(true);
        setNicknameError('');
        setNicknameChecked(true);
      }
    } catch (error) {
      const message = error.response?.data?.detail || '닉네임이 중복되거나 조건에 맞지 않습니다';
      setNicknameError(message);
      setNicknameSuccess(false);
      setNicknameChecked(false);
    }
  };

  // 약관 모달 표시
  const handleShowTermsModal = async (type) => {
    setCurrentTermsType(type);
    
    const titles = {
      terms: '서비스 이용약관',
      privacy: '개인정보처리방침',
      collection: '개인정보 수집 및 이용동의',
      marketing: '마케팅정보 수집 및 이용동의',
    };
    
    setTermsModalTitle(titles[type] || '약관 내용');
    setShowTermsModal(true);

    try {
      const response = await apiClient.get(`/settings/${type}`);
      if (response.data && response.data.content) {
        setTermsModalContent(response.data.content);
        
        // Toast UI Editor 렌더링
        setTimeout(() => {
          if (window.toastui?.Editor) {
            const container = document.getElementById('termsModalContent');
            if (container) {
              const existingViewer = container.querySelector('.toastui-editor');
              if (existingViewer) {
                existingViewer.remove();
              }
              
              try {
                new window.toastui.Editor({
                  el: container,
                  initialValue: response.data.content,
                  viewer: true,
                });
              } catch (error) {
                console.error('Toast UI Editor 렌더링 실패:', error);
              }
            }
          }
        }, 100);
      }
    } catch (error) {
      setTermsModalContent('<div class="text-center py-8 text-red-500">약관 내용을 불러올 수 없습니다.</div>');
    }
  };

  // 약관 모달에서 동의하기
  const agreeFromModal = () => {
    if (!currentTermsType) return;

    const checkboxId = `agree-${currentTermsType}`;
    const checkbox = document.getElementById(checkboxId);
    
    if (checkbox) {
      checkbox.checked = true;
      if (currentTermsType === 'terms') setAgreeTerms(true);
      else if (currentTermsType === 'privacy') setAgreePrivacy(true);
      else if (currentTermsType === 'collection') setAgreeCollection(true);
      else if (currentTermsType === 'marketing') setAgreeMarketing(true);
    }

    setShowTermsModal(false);
  };

  // 회원가입 제출 가능 여부 확인
  const canSubmit = () => {
    return emailChecked && emailVerified &&
           passwordValid && passwordMatch &&
           nicknameChecked &&
           agreeTerms && agreePrivacy && agreeCollection;
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!canSubmit()) {
      alert('모든 필수 항목을 올바르게 입력해주세요.');
      return;
    }

    if (!emailVerified) {
      alert('이메일 인증을 완료해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        passwordConfirm,
        nickname,
        agreeTerms,
        agreePrivacy,
        agreeCollection,
        agreeMarketing,
      });

      if (response.status === 200) {
        alert('회원가입이 완료되었습니다!');
        navigate('/login');
      }
    } catch (error) {
      const message = error.response?.data?.detail || '회원가입 중 오류가 발생했습니다.';
      setError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  // 인증번호 입력 시 숫자만 허용
  const handleVerificationCodeChange = (value) => {
    const numericValue = value.replace(/[^0-9]/g, '').slice(0, 6);
    setVerificationCode(numericValue);
    setVerifyCodeBtnDisabled(numericValue.length !== 6);
  };

  // 재전송
  const handleResendCode = async () => {
    setShowResendBtn(false);
    setSendCodeBtnText('재전송 중...');
    setSendCodeBtnDisabled(true);

    try {
      const response = await apiClient.post('/auth/send-code', { email });
      
      if (response.status === 200) {
        setTimeLeft(180);
        startCountdown();
        setSendCodeBtnText('인증번호 전송');
        setSendCodeBtnDisabled(false);
        alert('인증번호가 재발송되었습니다.');
      }
    } catch (error) {
      const message = error.response?.data?.detail || '인증번호 재발송에 실패했습니다.';
      alert(message);
      setSendCodeBtnText('인증번호 전송');
      setSendCodeBtnDisabled(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 min-h-full">
      <div className="max-w-lg w-full space-y-8">
        {/* 헤더 */}
        <div>
          <div
            className="mx-auto h-12 w-12 flex items-center justify-center rounded-full"
            style={{ backgroundColor: primary }}
          >
            <i className="fas fa-user-plus text-white text-xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            회원가입
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            강민성 한국사의 회원가입 페이지입니다.
          </p>
        </div>

        {/* 회원가입 폼 */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="flex space-x-2 mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailChecked(false);
                    setEmailCheckResult({ type: '', message: '' });
                    setSendCodeBtnDisabled(true);
                  }}
                  className="flex-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm"
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
                <button
                  type="button"
                  onClick={handleCheckEmail}
                  className="px-4 py-2 border rounded-md transition-colors duration-200 text-sm"
                  style={{
                    borderColor: primary,
                    color: primary,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = primary;
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = primary;
                  }}
                >
                  중복확인
                </button>
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={sendCodeBtnDisabled}
                  className="px-4 py-2 rounded-md transition-colors duration-200 text-sm text-white"
                  style={{
                    backgroundColor: sendCodeBtnDisabled ? '#9CA3AF' : '#1F2937',
                  }}
                >
                  {sendCodeBtnText}
                </button>
              </div>
              {emailCheckResult.message && (
                <div className={`mt-1 text-xs flex items-center ${
                  emailCheckResult.type === 'success' ? 'text-green-500' : 'text-red-500'
                }`}>
                  <i className={`fas ${emailCheckResult.type === 'success' ? 'fa-check' : 'fa-times'} mr-2 w-4`}></i>
                  <span>{emailCheckResult.message}</span>
                </div>
              )}
            </div>

            {/* 인증번호 섹션 */}
            <div
              className={`block mt-4 ${verificationSectionEnabled ? 'opacity-100' : 'opacity-50'}`}
            >
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                인증번호
              </label>
              <div className="flex space-x-2 mt-1">
                <input
                  id="verificationCode"
                  name="verificationCode"
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => handleVerificationCodeChange(e.target.value)}
                  disabled={!verificationSectionEnabled || emailVerified}
                  className="flex-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm text-left"
                  style={{
                    borderColor: input.border,
                    backgroundColor: !verificationSectionEnabled || emailVerified ? '#F3F4F6' : 'white',
                    cursor: !verificationSectionEnabled || emailVerified ? 'not-allowed' : 'text',
                  }}
                  placeholder="인증번호 6자리를 입력하세요."
                />
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyCodeBtnDisabled || emailVerified}
                  className="px-4 py-2 rounded-md transition-colors duration-200 text-sm text-white"
                  style={{
                    backgroundColor: verifyCodeBtnDisabled || emailVerified ? '#9CA3AF' : '#059669',
                  }}
                >
                  {verifyCodeBtnText}
                </button>
              </div>
              <div className="mt-2 flex justify-between items-center">
                {timeLeft > 0 ? (
                  <p className="text-xs text-blue-500">
                    인증번호는 <strong>{formatTime(timeLeft)}</strong> 후 만료됩니다
                  </p>
                ) : (
                  <p className="text-xs text-red-500">인증번호가 만료되었습니다</p>
                )}
                {showResendBtn && (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    재전송
                  </button>
                )}
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm"
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
                placeholder="비밀번호를 입력하세요."
              />
              {password && (
                <div className="mt-1 text-xs space-y-1">
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

            {/* 비밀번호 재확인 */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700">
                비밀번호 재확인
              </label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => handlePasswordConfirmChange(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm"
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
                placeholder="비밀번호를 다시 입력해주세요."
              />
              {passwordConfirmMessage.visible && (
                <div className="mt-1 text-xs flex items-center">
                  {passwordConfirmMessage.type === 'success' ? (
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

            {/* 닉네임 */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임
              </label>
              <div className="flex space-x-2 mt-1">
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    setNicknameChecked(false);
                    setNicknameError('');
                    setNicknameSuccess(false);
                  }}
                  className="flex-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:z-10 sm:text-sm"
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
                  placeholder="닉네임을 입력하세요."
                />
                <button
                  type="button"
                  onClick={handleCheckNickname}
                  className="px-4 py-2 border rounded-md transition-colors duration-200 text-sm"
                  style={{
                    borderColor: primary,
                    color: primary,
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = primary;
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.color = primary;
                  }}
                >
                  중복확인
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">한글, 영문, 숫자만 사용 가능 (2-15자)</p>
              {nicknameError && (
                <p className="mt-1 text-xs text-red-500">{nicknameError}</p>
              )}
              {nicknameSuccess && (
                <p className="mt-1 text-xs text-green-500">사용 가능한 닉네임입니다</p>
              )}
            </div>
          </div>

          {/* 약관 동의 섹션 */}
          <div className="space-y-3">
            {/* 전체 동의 */}
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <input
                id="agree-all"
                name="agree-all"
                type="checkbox"
                checked={agreeAll}
                onChange={(e) => handleAgreeAll(e.target.checked)}
                className="h-4 w-4 border-gray-300 rounded"
                style={{ accentColor: primary }}
              />
              <label htmlFor="agree-all" className="ml-2 block text-sm font-medium text-gray-900">
                전체 약관에 동의합니다.
              </label>
            </div>

            {/* 개별 약관 동의 */}
            <div className="space-y-2 pl-4">
              <div className="flex items-center">
                <input
                  id="agree-terms"
                  name="agree-terms"
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: primary }}
                />
                <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
                  서비스 이용약관에 동의합니다.
                </label>
                <button
                  type="button"
                  onClick={() => handleShowTermsModal('terms')}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  전문보기
                </button>
              </div>

              <div className="flex items-center">
                <input
                  id="agree-privacy"
                  name="agree-privacy"
                  type="checkbox"
                  required
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: primary }}
                />
                <label htmlFor="agree-privacy" className="ml-2 block text-sm text-gray-900">
                  개인정보처리방침에 동의합니다.
                </label>
                <button
                  type="button"
                  onClick={() => handleShowTermsModal('privacy')}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  전문보기
                </button>
              </div>

              <div className="flex items-center">
                <input
                  id="agree-collection"
                  name="agree-collection"
                  type="checkbox"
                  required
                  checked={agreeCollection}
                  onChange={(e) => setAgreeCollection(e.target.checked)}
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: primary }}
                />
                <label htmlFor="agree-collection" className="ml-2 block text-sm text-gray-900">
                  개인정보수집 및 이용동의에 동의합니다.
                </label>
                <button
                  type="button"
                  onClick={() => handleShowTermsModal('collection')}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  전문보기
                </button>
              </div>

              <div className="flex items-center">
                <input
                  id="agree-marketing"
                  name="agree-marketing"
                  type="checkbox"
                  checked={agreeMarketing}
                  onChange={(e) => setAgreeMarketing(e.target.checked)}
                  className="h-4 w-4 border-gray-300 rounded"
                  style={{ accentColor: primary }}
                />
                <label htmlFor="agree-marketing" className="ml-2 block text-sm text-gray-900">
                  마케팅정보 수집 및 이용에 동의합니다. (선택)
                </label>
                <button
                  type="button"
                  onClick={() => handleShowTermsModal('marketing')}
                  className="ml-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  전문보기
                </button>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div>
            <button
              type="submit"
              disabled={!canSubmit() || isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: canSubmit() && !isLoading ? primary : '#9CA3AF',
              }}
              onMouseEnter={(e) => {
                if (canSubmit() && !isLoading) {
                  e.target.style.backgroundColor = secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (canSubmit() && !isLoading) {
                  e.target.style.backgroundColor = primary;
                }
              }}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <i className="fas fa-user-plus text-white" aria-hidden="true"></i>
              </span>
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </div>

          {/* 로그인 링크 */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="font-medium transition-colors duration-200"
                style={{ color: primary }}
                onMouseEnter={(e) => (e.target.style.color = secondary)}
                onMouseLeave={(e) => (e.target.style.color = primary)}
              >
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* 성공 모달 */}
      {showSuccessModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <i className="fas fa-check text-green-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">인증 완료!</h3>
              <p className="text-sm text-gray-500 mb-4">이메일 인증이 완료되었습니다.</p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white transition-colors duration-200"
                style={{ backgroundColor: primary }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = secondary)}
                onMouseLeave={(e) => (e.target.style.backgroundColor = primary)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 발송 완료 모달 */}
      {showSendCompleteModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowSendCompleteModal(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <i className="fas fa-envelope text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">발송이 완료되었습니다</h3>
              <p className="text-sm text-gray-500 mb-4">인증번호가 이메일로 발송되었습니다.</p>
              <button
                onClick={() => setShowSendCompleteModal(false)}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-black text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 hover:bg-gray-800"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 약관 모달 */}
      {showTermsModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">{termsModalTitle}</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div
              id="termsModalContent"
              className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-white"
            >
              {termsModalContent && (
                <div dangerouslySetInnerHTML={{ __html: termsModalContent }} />
              )}
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                닫기
              </button>
              <button
                onClick={agreeFromModal}
                className="px-4 py-2 text-white rounded-md text-sm font-medium transition-colors duration-200"
                style={{ backgroundColor: primary }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = secondary)}
                onMouseLeave={(e) => (e.target.style.backgroundColor = primary)}
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

