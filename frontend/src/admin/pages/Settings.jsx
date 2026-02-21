import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function Settings() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState('general');
  
  // 관리자 정보 상태
  const [adminInfo, setAdminInfo] = useState({ email: '', nickname: '' });
  const [loadingAdminInfo, setLoadingAdminInfo] = useState(true);
  
  // 약관 데이터 상태
  const [termsData, setTermsData] = useState({ title: '', content: '' });
  const [privacyData, setPrivacyData] = useState({ title: '', content: '' });
  const [collectionData, setCollectionData] = useState({ title: '', content: '' });
  const [marketingData, setMarketingData] = useState({ title: '', content: '' });
  
  // 에디터 인스턴스
  const termsEditorRef = useRef(null);
  const privacyEditorRef = useRef(null);
  const collectionEditorRef = useRef(null);
  const marketingEditorRef = useRef(null);
  
  // 비밀번호 변경 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '설정 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({ length: false, complexity: false });
  const [passwordMatch, setPasswordMatch] = useState(false);
  const [currentPasswordValid, setCurrentPasswordValid] = useState(null);
  const [currentPasswordValidationMessage, setCurrentPasswordValidationMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // 제출 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 알림 상태
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // URL 해시에서 탭 초기화
  useEffect(() => {
    const hash = location.hash.substring(1);
    const validTabs = ['general', 'terms', 'privacy', 'collection', 'marketing'];
    if (hash && validTabs.includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  // Toast UI Editor 로드
  useEffect(() => {
    const loadToastUI = async () => {
      if (window.toastui?.Editor) return;
      
      const loadCss = (href) => {
        return new Promise((resolve) => {
          if (document.querySelector(`link[href="${href}"]`)) {
            resolve();
            return;
          }
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = href;
          link.onload = () => resolve();
          link.onerror = () => resolve();
          document.head.appendChild(link);
        });
      };

      const loadScript = (src) => {
        return new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            if (window.toastui?.Editor) {
              resolve();
            } else {
              const checkInterval = setInterval(() => {
                if (window.toastui?.Editor) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 50);
              setTimeout(() => {
                clearInterval(checkInterval);
                reject(new Error('Toast UI Editor 로드 타임아웃'));
              }, 5000);
            }
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.async = true;
          script.onload = () => {
            const checkInterval = setInterval(() => {
              if (window.toastui?.Editor) {
                clearInterval(checkInterval);
                resolve();
              }
            }, 50);
            setTimeout(() => {
              clearInterval(checkInterval);
              reject(new Error('Toast UI Editor 초기화 타임아웃'));
            }, 5000);
          };
          script.onerror = () => reject(new Error('Toast UI Editor 스크립트 로드 실패'));
          document.body.appendChild(script);
        });
      };

      try {
        await loadCss('https://uicdn.toast.com/editor/latest/toastui-editor.min.css');
        await loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js');
        loadScript('https://uicdn.toast.com/editor/latest/i18n/ko-kr.js').catch(() => {});
      } catch (err) {
        console.error('Toast UI Editor 로드 실패:', err);
        showNotification('에디터를 불러올 수 없습니다.', 'error');
      }
    };

    loadToastUI();
  }, []);

  // 관리자 정보 로드
  useEffect(() => {
    fetchAdminInfo();
  }, []);

  const fetchAdminInfo = async () => {
    setLoadingAdminInfo(true);
    try {
      const res = await apiClient.get('/admin/me');
      setAdminInfo({
        email: res.data.email || '',
        nickname: res.data.nickname || '',
      });
    } catch (err) {
      console.error('관리자 정보 조회 실패:', err);
      showNotification('관리자 정보를 불러올 수 없습니다.', 'error');
    } finally {
      setLoadingAdminInfo(false);
    }
  };

  // 약관 데이터 로드
  useEffect(() => {
    if (activeTab === 'general') return;
    
    const loadTermsData = async () => {
      try {
        // Terms
        if (activeTab === 'terms' && !termsData.content) {
          const termsRes = await apiClient.get('/settings/terms').catch(() => null);
          if (termsRes?.data) {
            setTermsData({
              title: termsRes.data.title || '이용약관',
              content: termsRes.data.content || '<p>이용약관 내용을 입력하세요.</p>',
            });
          } else {
            setTermsData({
              title: '이용약관',
              content: '<p>이용약관 내용을 입력하세요.</p>',
            });
          }
        }
        
        // Privacy
        if (activeTab === 'privacy' && !privacyData.content) {
          const privacyRes = await apiClient.get('/settings/privacy').catch(() => null);
          if (privacyRes?.data) {
            setPrivacyData({
              title: privacyRes.data.title || '개인정보처리방침',
              content: privacyRes.data.content || '<p>개인정보처리방침 내용을 입력하세요.</p>',
            });
          } else {
            setPrivacyData({
              title: '개인정보처리방침',
              content: '<p>개인정보처리방침 내용을 입력하세요.</p>',
            });
          }
        }
        
        // Collection
        if (activeTab === 'collection' && !collectionData.content) {
          const collectionRes = await apiClient.get('/settings/collection').catch(() => null);
          if (collectionRes?.data) {
            setCollectionData({
              title: collectionRes.data.title || '개인정보 수집 및 이용동의',
              content: collectionRes.data.content || '<p>개인정보 수집 및 이용동의 내용을 입력하세요.</p>',
            });
          } else {
            setCollectionData({
              title: '개인정보 수집 및 이용동의',
              content: '<p>개인정보 수집 및 이용동의 내용을 입력하세요.</p>',
            });
          }
        }
        
        // Marketing
        if (activeTab === 'marketing' && !marketingData.content) {
          const marketingRes = await apiClient.get('/settings/marketing').catch(() => null);
          if (marketingRes?.data) {
            setMarketingData({
              title: marketingRes.data.title || '마케팅정보 수집 및 이용동의',
              content: marketingRes.data.content || '<p>마케팅정보 수집 및 이용동의 내용을 입력하세요.</p>',
            });
          } else {
            setMarketingData({
              title: '마케팅정보 수집 및 이용동의',
              content: '<p>마케팅정보 수집 및 이용동의 내용을 입력하세요.</p>',
            });
          }
        }
      } catch (err) {
        console.error('약관 데이터 로드 실패:', err);
      }
    };

    loadTermsData();
  }, [activeTab]);

  // 에디터 초기화
  useEffect(() => {
    if (!window.toastui?.Editor) return;

    const initEditor = (editorRef, editorId, initialContent) => {
      const el = document.querySelector(`#${editorId}`);
      if (!el) return;

      // 기존 에디터가 있으면 제거
      if (editorRef.current) {
        try {
          editorRef.current.destroy();
        } catch (e) {
          console.error('에디터 destroy 실패:', e);
        }
        editorRef.current = null;
      }

      try {
        const editor = new window.toastui.Editor({
          el,
          height: '500px',
          initialEditType: 'wysiwyg',
          previewStyle: 'tab',
          usageStatistics: false,
          language: 'ko',
          toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['quote', 'ul', 'ol'],
            ['table', 'link'],
            ['code', 'codeblock']
          ]
        });
        
        // HTML 콘텐츠 설정
        if (initialContent) {
          editor.setHTML(initialContent);
        }
        
        editorRef.current = editor;
      } catch (err) {
        console.error(`에디터 초기화 실패 (${editorId}):`, err);
      }
    };

    // 각 탭에 맞는 에디터 초기화
    if (activeTab === 'terms') {
      setTimeout(() => {
        initEditor(termsEditorRef, 'terms-editor', termsData.content);
      }, 100);
    }
    if (activeTab === 'privacy') {
      setTimeout(() => {
        initEditor(privacyEditorRef, 'privacy-editor', privacyData.content);
      }, 100);
    }
    if (activeTab === 'collection') {
      setTimeout(() => {
        initEditor(collectionEditorRef, 'collection-editor', collectionData.content);
      }, 100);
    }
    if (activeTab === 'marketing') {
      setTimeout(() => {
        initEditor(marketingEditorRef, 'marketing-editor', marketingData.content);
      }, 100);
    }
  }, [activeTab, termsData.content, privacyData.content, collectionData.content, marketingData.content]);

  // 탭 변경
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  // 알림 표시
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // 관리자 정보 저장
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await apiClient.put('/admin/update-profile', {
        nickname: adminInfo.nickname,
      });
      showNotification('관리자 설정이 저장되었습니다.', 'success');
      await fetchAdminInfo();
    } catch (err) {
      showNotification(err.response?.data?.detail || '저장에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 약관 저장
  const handleTermsSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const content = termsEditorRef.current?.getHTML() || '';
      await apiClient.post('/settings/terms', {
        title: termsData.title,
        content,
      });
      showNotification('이용약관이 저장되었습니다.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || '저장에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrivacySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const content = privacyEditorRef.current?.getHTML() || '';
      await apiClient.post('/settings/privacy', {
        title: privacyData.title,
        content,
      });
      showNotification('개인정보처리방침이 저장되었습니다.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || '저장에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectionSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const content = collectionEditorRef.current?.getHTML() || '';
      await apiClient.post('/settings/collection', {
        title: collectionData.title,
        content,
      });
      showNotification('개인정보 수집 및 이용동의가 저장되었습니다.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || '저장에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarketingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const content = marketingEditorRef.current?.getHTML() || '';
      await apiClient.post('/settings/marketing', {
        title: marketingData.title,
        content,
      });
      showNotification('마케팅정보 수집 및 이용동의가 저장되었습니다.', 'success');
    } catch (err) {
      showNotification(err.response?.data?.detail || '저장에 실패했습니다.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 비밀번호 검증
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
    
    if (confirmPassword) {
      setPasswordMatch(pwd === confirmPassword);
    }
  };

  // 현재 비밀번호 확인 (debounce)
  useEffect(() => {
    if (!currentPassword || currentPassword.length < 3) {
      setCurrentPasswordValid(null);
      setCurrentPasswordValidationMessage('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const res = await apiClient.post('/admin/verify-password', {
          password: currentPassword,
        });
        if (res.data.valid) {
          setCurrentPasswordValid(true);
          setCurrentPasswordValidationMessage('✓ 현재 비밀번호와 일치합니다');
        } else {
          setCurrentPasswordValid(false);
          setCurrentPasswordValidationMessage('✗ 현재 비밀번호와 일치하지 않습니다');
        }
      } catch (err) {
        setCurrentPasswordValid(false);
        setCurrentPasswordValidationMessage('✗ 현재 비밀번호와 일치하지 않습니다');
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentPassword]);

  // 비밀번호 변경
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (currentPassword === newPassword) {
      showNotification('새 비밀번호는 현재 비밀번호와 달라야 합니다.', 'error');
      return;
    }
    
    if (!passwordValidation.length || !passwordValidation.complexity) {
      showNotification('비밀번호 조건을 확인해주세요.', 'error');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showNotification('비밀번호 확인이 일치하지 않습니다.', 'error');
      return;
    }
    
    if (!currentPasswordValid) {
      showNotification('현재 비밀번호를 확인해주세요.', 'error');
      return;
    }
    
    setIsChangingPassword(true);
    
    try {
      await apiClient.post('/admin/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      showNotification('비밀번호가 성공적으로 변경되었습니다.', 'success');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordValidation({ length: false, complexity: false });
      setPasswordMatch(false);
      setCurrentPasswordValid(null);
      setCurrentPasswordValidationMessage('');
    } catch (err) {
      showNotification(err.response?.data?.detail || '비밀번호 변경에 실패했습니다.', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="mt-1 text-sm text-gray-500">시스템 설정을 관리하세요</p>
      </div>

      {/* Settings Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          <button
            onClick={() => handleTabChange('general')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            관리자 정보 설정
          </button>
          <button
            onClick={() => handleTabChange('terms')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'terms'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            이용약관 설정
          </button>
          <button
            onClick={() => handleTabChange('privacy')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            개인정보처리방침 설정
          </button>
          <button
            onClick={() => handleTabChange('collection')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'collection'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            개인정보수집 설정
          </button>
          <button
            onClick={() => handleTabChange('marketing')}
            className={`border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
              activeTab === 'marketing'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            마케팅정보이용동의 설정
          </button>
        </nav>
      </div>

      {/* Settings Content */}
      <div>
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">관리자 설정</h3>
            
            <form onSubmit={handleGeneralSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="nickname" className="block text-sm font-medium text-gray-700">
                    관리자 이름
                  </label>
                  <input
                    type="text"
                    id="nickname"
                    value={adminInfo.nickname}
                    onChange={(e) => setAdminInfo({ ...adminInfo, nickname: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="관리자 이름을 입력하세요."
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700">
                  관리자 이메일
                </label>
                <input
                  type="email"
                  id="admin-email"
                  value={adminInfo.email}
                  disabled
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">현재 로그인한 관리자 계정입니다.</p>
              </div>
              
              <div>
                <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700">
                  관리자 비밀번호
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="password"
                    id="admin-password"
                    value="********"
                    disabled
                    className="mt-1 block w-2/3 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="mt-1 btn-outline whitespace-nowrap"
                  >
                    변경하기
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Terms Settings */}
        {activeTab === 'terms' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">이용약관 설정</h3>
            
            <form onSubmit={handleTermsSubmit} className="space-y-6">
              <div>
                <label htmlFor="terms-title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="terms-title"
                  value={termsData.title}
                  onChange={(e) => setTermsData({ ...termsData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="terms-content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <div id="terms-editor" style={{ minHeight: '400px' }}></div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Privacy Settings */}
        {activeTab === 'privacy' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">개인정보처리방침 설정</h3>
            
            <form onSubmit={handlePrivacySubmit} className="space-y-6">
              <div>
                <label htmlFor="privacy-title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="privacy-title"
                  value={privacyData.title}
                  onChange={(e) => setPrivacyData({ ...privacyData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="privacy-content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <div id="privacy-editor" style={{ minHeight: '400px' }}></div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Collection Settings */}
        {activeTab === 'collection' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">개인정보수집 설정</h3>
            
            <form onSubmit={handleCollectionSubmit} className="space-y-6">
              <div>
                <label htmlFor="collection-title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="collection-title"
                  value={collectionData.title}
                  onChange={(e) => setCollectionData({ ...collectionData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="collection-content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <div id="collection-editor" style={{ minHeight: '400px' }}></div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Marketing Settings */}
        {activeTab === 'marketing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">마케팅정보이용동의 설정</h3>
            
            <form onSubmit={handleMarketingSubmit} className="space-y-6">
              <div>
                <label htmlFor="marketing-title" className="block text-sm font-medium text-gray-700 mb-2">
                  제목
                </label>
                <input
                  type="text"
                  id="marketing-title"
                  value={marketingData.title}
                  onChange={(e) => setMarketingData({ ...marketingData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label htmlFor="marketing-content" className="block text-sm font-medium text-gray-700 mb-2">
                  내용
                </label>
                <div id="marketing-editor" style={{ minHeight: '400px' }}></div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">비밀번호 변경</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <form onSubmit={handlePasswordChange} className="space-y-4" noValidate>
                <div>
                  <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    id="current-password"
                    autoComplete="current-password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {currentPasswordValidationMessage && (
                    <div
                      className={`mt-2 text-xs ${
                        currentPasswordValid ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {currentPasswordValidationMessage}
                    </div>
                  )}
                </div>
                
                <div>
                  <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                    새 비밀번호
                  </label>
                  <input
                    type="text"
                    id="new-password"
                    autoComplete="off"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  <div className="mt-2 text-xs space-y-1">
                    <div className={passwordValidation.length ? 'text-green-500' : 'text-gray-700'}>
                      {passwordValidation.length ? '✓' : '•'} 최소 6글자, 최대 32글자
                    </div>
                    <div className={passwordValidation.complexity ? 'text-green-500' : 'text-gray-700'}>
                      {passwordValidation.complexity ? '✓' : '•'} 영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="text"
                    id="confirm-password"
                    autoComplete="off"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordMatch(e.target.value === newPassword);
                    }}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                  {confirmPassword && (
                    <div className={`mt-2 text-xs ${passwordMatch ? 'text-green-500' : 'text-red-500'}`}>
                      {passwordMatch ? '✓ 비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordValidation({ length: false, complexity: false });
                      setPasswordMatch(false);
                      setCurrentPasswordValid(null);
                      setCurrentPasswordValidationMessage('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isChangingPassword || !passwordValidation.length || !passwordValidation.complexity || !passwordMatch || !currentPasswordValid}
                    className="btn-primary"
                  >
                    {isChangingPassword ? '변경 중...' : '변경'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}

