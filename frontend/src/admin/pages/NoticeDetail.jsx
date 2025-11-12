import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function NoticeDetail() {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const viewerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (noticeId) {
      fetchNotice();
    } else {
      setError('공지사항 ID가 없습니다.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noticeId]);

  const fetchNotice = async () => {
    if (!noticeId) {
      setError('공지사항 ID가 없습니다.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/admin/notices/${noticeId}`);
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
    // Toast UI Editor Viewer CSS/JS 로드
    loadCss('https://uicdn.toast.com/editor/latest/toastui-editor-viewer.min.css');
    loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-viewer.min.js');
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

  const deleteNotice = async () => {
    if (!confirm('정말로 이 공지사항을 삭제하시겠습니까?')) return;
    
    try {
      await apiClient.delete(`/admin/notices/${noticeId}`);
      // showToast 함수가 있다면 사용, 없으면 navigate
      navigate('/admin/notices');
    } catch (e) {
      alert(e.response?.data?.detail || '삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}:${ss}`;
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <i className="fas fa-exclamation-circle text-red-600 text-2xl mb-2"></i>
          <p className="text-red-700">{error}</p>
          <Link to="/admin/notices" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  if (!notice) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항 상세</h1>
          <p className="mt-1 text-sm text-gray-500">공지사항 정보를 확인하세요</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/notices"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            목록으로
          </Link>
          {!notice.is_deleted && (
            <>
              <Link
                to={`/admin/notices/${noticeId}/edit`}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
              >
                수정하기
              </Link>
              <button
                onClick={deleteNotice}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                삭제하기
              </button>
            </>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">카테고리</label>
            {notice.category_name ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                {notice.category_name}
              </span>
            ) : (
              <span className="text-sm text-gray-500">미분류</span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">상태</label>
            {notice.is_deleted ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                삭제됨
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                정상
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">작성자</label>
            <p className="text-sm text-gray-900">{notice.author_nickname || '알 수 없음'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">발행일</label>
            <p className="text-sm text-gray-900">
              {notice.published_at ? (
                formatDate(notice.published_at)
              ) : (
                <span className="text-gray-500">
                  즉시 발행 (생성일: {formatDate(notice.created_at)})
                </span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">생성일</label>
            <p className="text-sm text-gray-900">{formatDate(notice.created_at)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">수정일</label>
            <p className="text-sm text-gray-900">{formatDate(notice.updated_at)}</p>
          </div>
          {notice.is_deleted && notice.deleted_at && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">삭제일</label>
              <p className="text-sm text-gray-900">{formatDate(notice.deleted_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{notice.title}</h2>
        <div className="border-t border-gray-500 pt-6">
          <div ref={viewerRef} id="viewer" className="prose max-w-none"></div>
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

        .toastui-editor-contents h1 {
          font-size: 2em;
        }

        .toastui-editor-contents h2 {
          font-size: 1.5em;
        }

        .toastui-editor-contents h3 {
          font-size: 1.25em;
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

        .toastui-editor-contents strong {
          font-weight: 600;
          color: #2E3140;
        }

        .dark .toastui-editor-contents strong {
          color: #f7fafc;
        }

        .toastui-editor-contents em {
          font-style: italic;
          color: #2E3140;
        }

        .dark .toastui-editor-contents em {
          color: #e2e8f0;
        }
      `}</style>
    </div>
  );
}
