import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function NoticeDetail() {
  const { id } = useParams();
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchNotice();
    } else {
      setError('공지사항 ID가 없습니다.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchNotice = async () => {
    if (!id) {
      setError('공지사항 ID가 없습니다.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/notices/${id}`);
      setNotice(res.data);
      setLoading(false);
      
      // Toast UI Editor Viewer 초기화 (비동기)
      setTimeout(() => {
        if (res.data.content && viewerRef.current) {
          waitForTUI(() => {
            if (viewerRef.current) {
              renderContent(res.data.content, viewerRef.current);
            }
          });
        }
      }, 100);
    } catch (e) {
      console.error('공지사항 상세 조회 실패:', e);
      setError(e.response?.data?.detail || '공지사항을 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const waitForTUI = (cb) => {
    if (window.toastui?.Editor) return cb();
    const iv = setInterval(() => {
      if (window.toastui?.Editor) {
        clearInterval(iv);
        cb();
      }
    }, 50);
    setTimeout(() => clearInterval(iv), 5000);
  };

  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  };

  const loadCss = (href) => {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`link[href="${href}"]`);
      if (existing) {
        resolve();
        return;
      }
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = href;
      l.onload = resolve;
      l.onerror = reject;
      document.head.appendChild(l);
    });
  };

  useEffect(() => {
    // Toast UI Editor CSS/JS 로드
    loadCss('https://uicdn.toast.com/editor/latest/toastui-editor.min.css');
    loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js');
    loadScript('https://uicdn.toast.com/editor/latest/i18n/ko-kr.js');
  }, []);

  const renderContent = (content, container) => {
    if (!container) return;
    
    if (!window.toastui?.Editor) {
      container.innerHTML = content;
      return;
    }
    
    try {
      const existingViewer = container.querySelector('.toastui-editor');
      if (existingViewer) {
        existingViewer.remove();
      }
      
      const customHTMLRenderer = {
        htmlBlock: {
          iframe(node) {
            return [
              { type: 'openTag', tagName: 'iframe', outerNewLine: true, attributes: node.attrs },
              { type: 'html', content: node.childrenHTML },
              { type: 'closeTag', tagName: 'iframe', outerNewLine: true },
            ];
          },
        },
      };
      
      new window.toastui.Editor({
        el: container,
        initialValue: content,
        viewer: true,
        customHTMLRenderer: customHTMLRenderer,
      });
      
      setTimeout(() => {
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
          heading.style.borderBottom = 'none';
          heading.style.border = 'none';
          heading.style.outline = 'none';
          heading.style.boxShadow = 'none';
          heading.style.background = 'none';
          heading.style.backgroundImage = 'none';
          heading.style.backgroundColor = 'transparent';
          heading.style.borderImage = 'none';
        });
        
        const tuiHeadings = container.querySelectorAll('.toastui-editor-contents h1, .toastui-editor-contents h2, .toastui-editor-contents h3, .toastui-editor-contents h4, .toastui-editor-contents h5, .toastui-editor-contents h6');
        tuiHeadings.forEach(heading => {
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
    } catch (error) {
      console.error('Toast UI Viewer 초기화 오류:', error);
      container.innerHTML = content;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}년 ${month}월 ${day}일`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <i className="fas fa-exclamation-circle text-red-600 text-2xl mb-2"></i>
            <p className="text-red-700">{error}</p>
            <Link to="/notices" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
              목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!notice) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to="/notices"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <i className="fas fa-arrow-left w-5 h-5 mr-2"></i>
            목록으로 돌아가기
          </Link>
        </div>

        {/* Notice Card */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              {notice.category_name && (
                <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {notice.category_name}
                </span>
              )}
              <span className="text-sm text-gray-500">
                {formatDate(notice.published_at || notice.created_at)}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{notice.title}</h1>
            <div className="flex items-center text-sm text-gray-600">
              <span>작성자: {notice.author_nickname || '관리자'}</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-4">
            <div ref={viewerRef} id="viewer" className="prose max-w-none"></div>
          </div>
        </article>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/notices"
            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            목록으로
          </Link>
        </div>
      </div>

      {/* Toast UI Editor Contents 스타일 */}
      <style>{`
        .toastui-editor-contents {
          font-family: 'Pretendard', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif';
          font-size: 16px;
          line-height: 1.8;
          color: #2E3140;
        }

        .dark .toastui-editor-contents {
          color: #e2e8f0;
        }

        .toastui-editor-contents h1,
        .toastui-editor-contents h2,
        .toastui-editor-contents h3,
        .toastui-editor-contents h4,
        .toastui-editor-contents h5,
        .toastui-editor-contents h6 {
          margin-top: 2em;
          margin-bottom: 1em;
          font-weight: 700;
          line-height: 1.4;
          color: #2E3140;
          border-bottom: none !important;
        }

        .toastui-editor-contents h1:first-child,
        .toastui-editor-contents h2:first-child,
        .toastui-editor-contents h3:first-child,
        .toastui-editor-contents h4:first-child,
        .toastui-editor-contents h5:first-child,
        .toastui-editor-contents h6:first-child {
          margin-top: 0.5em;
        }

        .dark .toastui-editor-contents h1,
        .dark .toastui-editor-contents h2,
        .dark .toastui-editor-contents h3,
        .dark .toastui-editor-contents h4,
        .dark .toastui-editor-contents h5,
        .dark .toastui-editor-contents h6 {
          color: #f7fafc;
        }

        .toastui-editor-contents p {
          margin: 1.2em 0;
          color: #2E3140;
        }

        .toastui-editor-contents p:first-child {
          margin-top: 0.5em;
        }

        .dark .toastui-editor-contents p {
          color: #e2e8f0;
        }

        .toastui-editor-contents img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 2em 0;
        }

        .toastui-editor-contents iframe {
          max-width: 100%;
          margin: 2em 0;
          border-radius: 8px;
        }

        .toastui-editor-contents blockquote {
          border-left: 4px solid #3b82f6;
          background-color: #f8f9fa;
          color: #2E3140;
          margin: 1.5em 0;
          padding: 1em 1.5em;
          border-radius: 4px;
        }

        .dark .toastui-editor-contents blockquote {
          border-left-color: #60a5fa;
          background-color: #1f2937;
          color: #e2e8f0;
        }

        .toastui-editor-contents code {
          background-color: #f1f3f4;
          color: #e83e8c;
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-size: 0.9em;
        }

        .dark .toastui-editor-contents code {
          background-color: #374151;
          color: #f472b6;
        }

        .toastui-editor-contents pre {
          background-color: #f8f9fa;
          color: #2E3140;
          padding: 1.5em;
          border-radius: 8px;
          overflow-x: auto;
          margin: 2em 0;
        }

        .dark .toastui-editor-contents pre {
          background-color: #1f2937;
          color: #e2e8f0;
        }

        .toastui-editor-contents pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
        }

        .toastui-editor-contents table {
          width: 100%;
          border-collapse: collapse;
          margin: 2em 0;
        }

        .toastui-editor-contents table th,
        .toastui-editor-contents table td {
          border: 1px solid #e2e8f0;
          padding: 12px;
        }

        .dark .toastui-editor-contents table th,
        .dark .toastui-editor-contents table td {
          border-color: #4a5568;
        }

        .toastui-editor-contents table th {
          background-color: #f8f9fa;
          color: #2E3140;
          font-weight: 600;
        }

        .dark .toastui-editor-contents table th {
          background-color: #374151;
          color: #e2e8f0;
        }

        .toastui-editor-contents a {
          color: #3b82f6;
          text-decoration: underline;
        }

        .dark .toastui-editor-contents a {
          color: #60a5fa;
        }

        .toastui-editor-contents a:hover {
          color: #2563eb;
        }

        .dark .toastui-editor-contents a:hover {
          color: #93c5fd;
        }

        .toastui-editor-contents ul,
        .toastui-editor-contents ol {
          margin: 1.2em 0;
          padding-left: 2em;
        }

        .toastui-editor-contents li {
          margin: 0.5em 0;
          color: #2E3140;
        }

        .dark .toastui-editor-contents li {
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
