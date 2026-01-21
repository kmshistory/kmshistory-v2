import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, themeUtils } from '../../shared/components/ThemeProvider';
import { clientTheme } from '../styles/ClientTheme';
import apiClient from '../../shared/api/client';

export default function Register() {
  const theme = useTheme();
  const primary = themeUtils.getColor(theme, 'primary');
  const secondary = themeUtils.getColor(theme, 'secondary');
  const { input } = clientTheme.form;

  useEffect(() => {
    document.title = '회원가입 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');

  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState({ type: '', message: '' });

  const [passwordValidation, setPasswordValidation] = useState({ length: false, complexity: false });
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [passwordConfirmMessage, setPasswordConfirmMessage] = useState({ visible: false, success: false });

  const [nicknameChecked, setNicknameChecked] = useState(false);
  const [nicknameSuccess, setNicknameSuccess] = useState(false);
  const [nicknameError, setNicknameError] = useState('');

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeCollection, setAgreeCollection] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [currentTermsType, setCurrentTermsType] = useState(null);
  const [termsModalTitle, setTermsModalTitle] = useState('');
  const [termsModalContent, setTermsModalContent] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [registrationPending, setRegistrationPending] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const allChecked = agreeTerms && agreePrivacy && agreeCollection && agreeMarketing;
    setAgreeAll(allChecked);
  }, [agreeTerms, agreePrivacy, agreeCollection, agreeMarketing]);

  const isFieldDisabled = registrationPending || isLoading;

  const validateEmailFormat = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleAgreeAll = (checked) => {
    if (registrationPending) return;
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeCollection(checked);
    setAgreeMarketing(checked);
  };

  const handleCheckEmail = async () => {
    if (registrationPending) return;

    if (!email) {
      setEmailCheckResult({ type: 'error', message: '이메일을 입력해주세요.' });
      return;
    }

    if (!validateEmailFormat(email)) {
      setEmailCheckResult({ type: 'error', message: '올바른 이메일 형식을 입력해주세요.' });
      return;
    }

    try {
      const response = await apiClient.post('/auth/check-email', { email });
      if (response.status === 200) {
        setEmailCheckResult({ type: 'success', message: response.data?.message || '사용 가능한 이메일입니다.' });
        setEmailChecked(true);
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.message || '이메일 중복확인 중 오류가 발생했습니다.';
      setEmailCheckResult({ type: 'error', message });
      setEmailChecked(false);
    }
  };

  const validatePassword = (value) => {
    const lengthValid = value.length >= 6 && value.length <= 32;
    const complexityValid = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*(),.?":{}|<>]/].filter((pattern) => pattern.test(value)).length >= 2;
    setPasswordValidation({ length: lengthValid, complexity: complexityValid });
    const success = value === passwordConfirm && value.length > 0;
    setPasswordMatch(success);
    setPasswordConfirmMessage({ visible: passwordConfirm.length > 0, success });
  };

  const handlePasswordChange = (value) => {
    if (registrationPending) return;
    setPassword(value);
    validatePassword(value);
  };

  const handlePasswordConfirmChange = (value) => {
    if (registrationPending) return;
    setPasswordConfirm(value);
    const success = value === password && value.length > 0;
    setPasswordMatch(success);
    setPasswordConfirmMessage({ visible: value.length > 0, success });
  };

  const validateNicknameFormat = (value) => value.length >= 2 && value.length <= 15 && /^[가-힣a-zA-Z0-9]+$/.test(value);

  const handleCheckNickname = async () => {
    if (registrationPending) return;

    if (!nickname) {
      setNicknameError('닉네임을 입력해주세요.');
      setNicknameSuccess(false);
      setNicknameChecked(false);
      return;
    }

    if (!validateNicknameFormat(nickname)) {
      setNicknameError('닉네임은 2-15자, 한글/영문/숫자만 사용 가능합니다.');
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
    } catch (err) {
      const message = err.response?.data?.detail || '닉네임이 중복되거나 사용할 수 없습니다.';
      setNicknameError(message);
      setNicknameSuccess(false);
      setNicknameChecked(false);
    }
  };

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
      if (response.data?.content) {
        setTermsModalContent(response.data.content);
      } else {
        setTermsModalContent('<div class="text-center py-8 text-gray-500">약관 내용을 불러올 수 없습니다.</div>');
      }
    } catch (err) {
      setTermsModalContent('<div class="text-center py-8 text-red-500">약관 내용을 불러올 수 없습니다.</div>');
    }
  };

  const agreeFromModal = () => {
    if (!currentTermsType) {
      setShowTermsModal(false);
      return;
    }

    if (!registrationPending) {
      if (currentTermsType === 'terms') setAgreeTerms(true);
      if (currentTermsType === 'privacy') setAgreePrivacy(true);
      if (currentTermsType === 'collection') setAgreeCollection(true);
      if (currentTermsType === 'marketing') setAgreeMarketing(true);
    }

    setShowTermsModal(false);
  };

  const canSubmit = () =>
    !registrationPending &&
    emailChecked &&
    passwordValidation.length &&
    passwordValidation.complexity &&
    passwordMatch &&
    nicknameChecked &&
    agreeTerms &&
    agreePrivacy &&
    agreeCollection;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSubmit()) {
      alert('모든 필수 항목을 올바르게 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        nickname,
        agreeTerms,
        agreePrivacy,
        agreeCollection,
        agreeMarketing,
      });

      setPendingEmail(email);
      setPendingMessage(
        response.data?.message || '입력하신 이메일 주소로 인증 링크를 보냈습니다. 메일을 확인하여 가입을 완료해주세요.',
      );
      setRegistrationPending(true);
      setShowPendingModal(true);
    } catch (err) {
      const message = err.response?.data?.detail || '회원가입 중 오류가 발생했습니다.';
      setError(message);
      alert(message);
    } finally {
      setIsLoading(false);
    }
  };

  const submitLabel = registrationPending ? '이메일을 확인해주세요' : isLoading ? '처리 중...' : '회원가입';

  return (
    <div className="flex min-h-full items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8">
        <div>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: primary }}>
            <i className="fas fa-user-plus text-white text-xl"></i>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">회원가입</h2>
          <p className="mt-2 text-center text-sm text-gray-600">강민성 한국사의 회원가입 페이지입니다.</p>
        </div>

        {registrationPending && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            <strong>{pendingEmail}</strong> 주소로 인증 링크를 발송했습니다. 메일을 확인하고 가입을 완료해주세요.
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                이메일
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  disabled={isFieldDisabled}
                  value={email}
                  onChange={(event) => {
                    if (registrationPending) return;
                    setEmail(event.target.value);
                    setEmailChecked(false);
                    setEmailCheckResult({ type: '', message: '' });
                  }}
                  className="relative block w-full flex-1 appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm"
                  style={{ borderColor: input.border, transition: input.transition }}
                  onFocus={(event) => {
                    if (registrationPending) return;
                    event.target.style.borderColor = primary;
                    event.target.style.boxShadow = '0 0 0 3px rgba(6, 31, 64, 0.1)';
                  }}
                  onBlur={(event) => {
                    event.target.style.borderColor = input.border;
                    event.target.style.boxShadow = 'none';
                  }}
                  placeholder="이메일 주소"
                />
                <button
                  type="button"
                  onClick={handleCheckEmail}
                  disabled={isFieldDisabled}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ backgroundColor: primary, borderColor: primary }}
                  onMouseEnter={(event) => {
                    if (event.currentTarget.disabled) return;
                    event.currentTarget.style.backgroundColor = secondary;
                    event.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.25)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = primary;
                    event.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  중복확인
                </button>
              </div>
              {emailCheckResult.message && (
                <div
                  className={`mt-1 flex items-center text-xs ${
                    emailCheckResult.type === 'success' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  <i
                    className={`fas ${emailCheckResult.type === 'success' ? 'fa-check' : 'fa-times'} mr-2 w-4`}
                  ></i>
                  <span>{emailCheckResult.message}</span>
                </div>
              )}
            </div>

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
                disabled={isFieldDisabled}
                value={password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm"
                style={{ borderColor: input.border, transition: input.transition }}
                onFocus={(event) => {
                  if (registrationPending) return;
                  event.target.style.borderColor = primary;
                  event.target.style.boxShadow = '0 0 0 3px rgba(6, 31, 64, 0.1)';
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = input.border;
                  event.target.style.boxShadow = 'none';
                }}
                placeholder="비밀번호를 입력하세요."
              />
              {password && (
                <div className="mt-1 space-y-1 text-xs">
                  <div className="flex items-center">
                    <i
                      className={`fas ${
                        passwordValidation.length ? 'fa-check' : 'fa-times'
                      } mr-2 w-4 ${passwordValidation.length ? 'text-green-500' : 'text-red-500'}`}
                    ></i>
                    <span className={passwordValidation.length ? 'text-green-500' : 'text-red-500'}>
                      6-32자 사이
                    </span>
                  </div>
                  <div className="flex items-center">
                    <i
                      className={`fas ${
                        passwordValidation.complexity ? 'fa-check' : 'fa-times'
                      } mr-2 w-4 ${passwordValidation.complexity ? 'text-green-500' : 'text-red-500'}`}
                    ></i>
                    <span className={passwordValidation.complexity ? 'text-green-500' : 'text-red-500'}>
                      영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상
                    </span>
                  </div>
                </div>
              )}
            </div>

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
                disabled={isFieldDisabled}
                value={passwordConfirm}
                onChange={(event) => handlePasswordConfirmChange(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm"
                style={{ borderColor: input.border, transition: input.transition }}
                onFocus={(event) => {
                  if (registrationPending) return;
                  event.target.style.borderColor = primary;
                  event.target.style.boxShadow = '0 0 0 3px rgba(6, 31, 64, 0.1)';
                }}
                onBlur={(event) => {
                  event.target.style.borderColor = input.border;
                  event.target.style.boxShadow = 'none';
                }}
                placeholder="비밀번호를 다시 입력해주세요."
              />
              {passwordConfirmMessage.visible && (
                <div className="mt-1 flex items-center text-xs">
                  {passwordConfirmMessage.success ? (
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

            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                닉네임
              </label>
              <div className="mt-1 flex space-x-2">
                <input
                  id="nickname"
                  name="nickname"
                  type="text"
                  required
                  disabled={isFieldDisabled}
                  value={nickname}
                  onChange={(event) => {
                    if (registrationPending) return;
                    setNickname(event.target.value);
                    setNicknameChecked(false);
                    setNicknameError('');
                    setNicknameSuccess(false);
                  }}
                  className="relative block w-full flex-1 appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-0 sm:text-sm"
                  style={{ borderColor: input.border, transition: input.transition }}
                  onFocus={(event) => {
                    if (registrationPending) return;
                    event.target.style.borderColor = primary;
                    event.target.style.boxShadow = '0 0 0 3px rgba(6, 31, 64, 0.1)';
                  }}
                  onBlur={(event) => {
                    event.target.style.borderColor = input.border;
                    event.target.style.boxShadow = 'none';
                  }}
                  placeholder="닉네임을 입력하세요."
                />
                <button
                  type="button"
                  onClick={handleCheckNickname}
                  disabled={isFieldDisabled}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ backgroundColor: primary, borderColor: primary }}
                  onMouseEnter={(event) => {
                    if (event.currentTarget.disabled) return;
                    event.currentTarget.style.backgroundColor = secondary;
                    event.currentTarget.style.boxShadow = '0 6px 12px rgba(37, 99, 235, 0.25)';
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = primary;
                    event.currentTarget.style.boxShadow = 'none';
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

          <div className="space-y-3">
            <div className="flex items-center rounded-lg bg-gray-50 p-3">
              <input
                id="agree-all"
                name="agree-all"
                type="checkbox"
                checked={agreeAll}
                disabled={registrationPending}
                onChange={(event) => handleAgreeAll(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
                style={{ accentColor: primary }}
              />
              <label htmlFor="agree-all" className="ml-2 block text-sm font-medium text-gray-900">
                전체 약관에 동의합니다.
              </label>
            </div>

            <div className="space-y-2 pl-4">
              {[
                { id: 'terms', label: '서비스 이용약관에 동의합니다.', required: true, state: agreeTerms, setter: setAgreeTerms },
                { id: 'privacy', label: '개인정보처리방침에 동의합니다.', required: true, state: agreePrivacy, setter: setAgreePrivacy },
                { id: 'collection', label: '개인정보수집 및 이용동의에 동의합니다.', required: true, state: agreeCollection, setter: setAgreeCollection },
                { id: 'marketing', label: '마케팅정보 수집 및 이용에 동의합니다. (선택)', required: false, state: agreeMarketing, setter: setAgreeMarketing },
              ].map((item) => (
                <div key={item.id} className="flex items-center">
                  <input
                    id={`agree-${item.id}`}
                    name={`agree-${item.id}`}
                    type="checkbox"
                    required={item.required}
                    checked={item.state}
                    disabled={registrationPending}
                    onChange={(event) => {
                      if (registrationPending) return;
                      item.setter(event.target.checked);
                    }}
                    className="h-4 w-4 rounded border-gray-300"
                    style={{ accentColor: primary }}
                  />
                  <label htmlFor={`agree-${item.id}`} className="ml-2 block text-sm text-gray-900">
                    {item.label}
                  </label>
                  <button
                    type="button"
                    onClick={() => handleShowTermsModal(item.id)}
                    className="ml-2 text-xs text-blue-600 underline transition-colors hover:text-blue-800"
                  >
                    전문보기
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!canSubmit() || isLoading}
              className="group relative flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                backgroundColor: canSubmit() && !isLoading ? primary : '#9CA3AF',
              }}
              onMouseEnter={(event) => {
                if (!canSubmit() || isLoading) return;
                event.target.style.backgroundColor = secondary;
              }}
              onMouseLeave={(event) => {
                if (!canSubmit() || isLoading) return;
                event.target.style.backgroundColor = primary;
              }}
            >
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <i className="fas fa-user-plus text-white" aria-hidden="true"></i>
              </span>
              {submitLabel}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="font-medium transition-colors duration-200"
                style={{ color: primary }}
                onMouseEnter={(event) => (event.target.style.color = secondary)}
                onMouseLeave={(event) => (event.target.style.color = primary)}
              >
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>

      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50"
          onClick={() => setShowTermsModal(false)}
        >
          <div
            className="relative top-10 mx-auto w-11/12 max-w-4xl rounded-md border bg-white p-5 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{termsModalTitle}</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 transition-colors hover:text-gray-600"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <div
              id="termsModalContent"
              className="max-h-96 overflow-y-auto rounded-lg border bg-white p-4"
            >
              {termsModalContent && <div dangerouslySetInnerHTML={{ __html: termsModalContent }} />}
            </div>
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50"
              >
                닫기
              </button>
              <button
                onClick={agreeFromModal}
                className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors duration-200"
                style={{ backgroundColor: primary }}
                onMouseEnter={(event) => (event.target.style.backgroundColor = secondary)}
                onMouseLeave={(event) => (event.target.style.backgroundColor = primary)}
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showPendingModal && (
        <div className="fixed inset-0 z-50 flex h-full w-full items-center justify-center bg-gray-900 bg-opacity-50 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <i className="fas fa-envelope-open-text text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">이메일을 확인해주세요</h3>
              <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">{pendingMessage}</p>
              <div className="mt-6 flex w-full flex-col space-y-3">
                <Link
                  to="/login"
                  className="w-full rounded-md bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  로그인 화면으로 이동
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


