import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../../shared/api/client';

export default function PrivacyPolicy() {
  const [title, setTitle] = useState('개인정보처리방침');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const viewerRef = useRef(null);
  const viewerInstanceRef = useRef(null);

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '개인정보처리방침 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // Toast UI Editor 스크립트 및 CSS 로드
  useEffect(() => {
    let cssLoaded = false;
    let scriptLoaded = false;

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
        link.onerror = () => resolve(); // 에러가 나도 계속 진행
        document.head.appendChild(link);
      });
    };

    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) {
          if (window.toastui?.Editor) {
            resolve();
          } else {
            // 스크립트는 로드되었지만 아직 초기화되지 않음
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
          // 스크립트 로드 후 Editor가 사용 가능할 때까지 대기
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

    const loadToastUI = async () => {
      try {
        await loadCss('https://uicdn.toast.com/editor/latest/toastui-editor.min.css');
        cssLoaded = true;
        await loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js');
        scriptLoaded = true;
        // 한국어 locale은 선택사항이므로 에러가 나도 무시
        loadScript('https://uicdn.toast.com/editor/latest/i18n/ko-kr.js').catch(() => {});
      } catch (err) {
        console.error('Toast UI Editor 로드 실패:', err);
        setError('에디터를 불러올 수 없습니다.');
      }
    };

    loadToastUI();

    return () => {
      // 컴포넌트 언마운트 시 정리
      if (viewerInstanceRef.current) {
        try {
          viewerInstanceRef.current.destroy();
        } catch (e) {
          console.error('Viewer destroy 에러:', e);
        }
        viewerInstanceRef.current = null;
      }
    };
  }, []);

  // API에서 데이터 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.get('/settings/privacy');
        if (response.status === 200) {
          setTitle(response.data.title || '개인정보처리방침');
          setContent(response.data.content || '');
        }
      } catch (err) {
        console.error('개인정보처리방침 조회 실패:', err);
        setError('개인정보처리방침을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toast UI Editor Viewer 초기화
  useEffect(() => {
    if (!content || !viewerRef.current || !window.toastui?.Editor) {
      return;
    }

    // 기존 Viewer 인스턴스 제거
    if (viewerInstanceRef.current) {
      try {
        viewerInstanceRef.current.destroy();
      } catch (e) {
        console.error('Viewer destroy 에러:', e);
      }
      viewerInstanceRef.current = null;
    }

    // Viewer 초기화
    try {
      viewerInstanceRef.current = new window.toastui.Editor({
        el: viewerRef.current,
        initialValue: content,
        viewer: true,
      });

      // 렌더링 후 제목 하단 테두리 강제 제거
      setTimeout(() => {
        const headings = viewerRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach((heading) => {
          heading.style.borderBottom = 'none';
          heading.style.border = 'none';
          heading.style.outline = 'none';
          heading.style.boxShadow = 'none';
          heading.style.background = 'none';
          heading.style.backgroundImage = 'none';
          heading.style.backgroundColor = 'transparent';
          heading.style.borderImage = 'none';
        });

        // Toast UI 특정 클래스들도 처리
        const tuiHeadings = viewerRef.current.querySelectorAll(
          '.toastui-editor-contents h1, .toastui-editor-contents h2, .toastui-editor-contents h3, .toastui-editor-contents h4, .toastui-editor-contents h5, .toastui-editor-contents h6'
        );
        tuiHeadings.forEach((heading) => {
          heading.style.borderBottom = 'none';
          heading.style.border = 'none';
          heading.style.outline = 'none';
          heading.style.boxShadow = 'none';
          heading.style.background = 'none';
          heading.style.backgroundImage = 'none';
          heading.style.backgroundColor = 'transparent';
          heading.style.borderImage = 'none';
        });
      }, 100);
    } catch (err) {
      console.error('Toast UI Viewer 초기화 실패:', err);
      // 폴백: HTML 직접 렌더링
      if (viewerRef.current) {
        viewerRef.current.innerHTML = content;
      }
    }
  }, [content]);

  return (
    <div className="min-h-screen bg-gray-50 py-12 transition-colors duration-200">
      <div className="w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8 transition-colors duration-200">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">{title}</h1>

          <div ref={viewerRef} className="prose max-w-none text-gray-800">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">로딩 중...</span>
              </div>
            )}
            {error && (
              <div className="text-center py-8 text-red-500">{error}</div>
            )}
          </div>
        </div>
      </div>

      {/* Toast UI Editor Contents 스타일 */}
      <style>{`
        /* Toast UI Editor Contents 스타일 */
        .toastui-editor-contents {
          font-family: inherit !important;
          font-size: inherit !important;
          line-height: 1.6 !important;
        }

        .toastui-editor-contents h1,
        .toastui-editor-contents h2,
        .toastui-editor-contents h3,
        .toastui-editor-contents h4,
        .toastui-editor-contents h5,
        .toastui-editor-contents h6 {
          margin-top: 1.5em !important;
          margin-bottom: 0.5em !important;
          font-weight: 600 !important;
          line-height: 1.25 !important;
        }

        .toastui-editor-contents h1 {
          font-size: 2em !important;
        }

        .toastui-editor-contents h2 {
          font-size: 1.5em !important;
        }

        .toastui-editor-contents h3 {
          font-size: 1.25em !important;
        }

        .toastui-editor-contents p {
          margin-bottom: 1em !important;
        }

        .toastui-editor-contents ul,
        .toastui-editor-contents ol {
          margin-bottom: 1em !important;
          padding-left: 2em !important;
        }

        .toastui-editor-contents li {
          margin-bottom: 0.5em !important;
        }

        .toastui-editor-contents blockquote {
          border-left: 4px solid #e5e7eb !important;
          padding-left: 1em !important;
          margin: 1em 0 !important;
          font-style: italic !important;
          color: #6b7280 !important;
        }

        .toastui-editor-contents img {
          max-width: 100% !important;
          height: auto !important;
          margin: 1em 0 !important;
        }

        .toastui-editor-contents a {
          color: #3b82f6 !important;
          text-decoration: underline !important;
        }

        .toastui-editor-contents a:hover {
          color: #2563eb !important;
        }

        .toastui-editor-contents hr {
          border: none !important;
          border-top: 1px solid #e5e7eb !important;
          margin: 2em 0 !important;
        }

        .toastui-editor-contents strong {
          font-weight: 600 !important;
        }

        .toastui-editor-contents em {
          font-style: italic !important;
        }

        .toastui-editor-contents u {
          text-decoration: underline !important;
        }

        .toastui-editor-contents s {
          text-decoration: line-through !important;
        }

        .toastui-editor-contents .ql-align-center {
          text-align: center !important;
        }

        .toastui-editor-contents .ql-align-right {
          text-align: right !important;
        }

        .toastui-editor-contents .ql-align-justify {
          text-align: justify !important;
        }
      `}</style>
    </div>
  );
}

