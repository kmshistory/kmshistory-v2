import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function NoticeEdit() {
  const { noticeId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [publishStatus, setPublishStatus] = useState('published');
  const [publishedAt, setPublishedAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingNotice, setLoadingNotice] = useState(true);
  const [initialContent, setInitialContent] = useState('');

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '공지사항 수정 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchNotice();
    // Toast UI Editor 스크립트 로드
    const ensureToastUI = async () => {
      if (window.toastui?.Editor) return;
      await loadScript('https://uicdn.toast.com/editor/latest/toastui-editor-all.min.js');
      await loadScript('https://uicdn.toast.com/editor/latest/i18n/ko-kr.js');
      await loadCss('https://uicdn.toast.com/editor/latest/toastui-editor.min.css');
    };
    ensureToastUI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 공지사항 데이터와 Toast UI Editor 로드 완료 후 에디터 초기화
  useEffect(() => {
    if (!loadingNotice && initialContent && window.toastui?.Editor) {
      // DOM이 렌더링될 때까지 약간의 지연
      setTimeout(() => {
        initEditor();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingNotice, initialContent]);

  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const loadCss = (href) => new Promise((resolve, reject) => {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    l.onload = resolve;
    l.onerror = reject;
    document.head.appendChild(l);
  });

  const fetchNotice = async () => {
    if (!noticeId) return;
    try {
      const res = await apiClient.get(`/admin/notices/${noticeId}`);
      const notice = res.data;
      setTitle(notice.title || '');
      setCategoryId(notice.category_id?.toString() || '');
      setPublishStatus(notice.publish_status || 'published');
      setInitialContent(notice.content || '');
      if (notice.published_at) {
        // ISO 문자열을 datetime-local 형식으로 변환
        const date = new Date(notice.published_at);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        setPublishedAt(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
      setLoadingNotice(false);
    } catch (e) {
      console.error('공지사항 조회 실패:', e);
      alert(e.response?.data?.detail || '공지사항을 불러오는 중 오류가 발생했습니다.');
      navigate('/admin/notices');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/admin/notice-categories');
      setCategories(Array.isArray(res.data) ? res.data : (res.data?.categories || []));
    } catch (e) {
      // ignore
    }
  };

  const YT_URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
  const makeIframeHTML = (id) => `<iframe src="https://www.youtube.com/embed/${id}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy" style="width:100%; aspect-ratio:16/9;"></iframe>`;

  const youtubeAndImageSanitizer = (html) => {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const allowed = new Set(['DIV','IFRAME','#text','P','BR','SPAN','B','I','EM','STRONG','UL','OL','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE','CODE','PRE','TABLE','THEAD','TBODY','TR','TH','TD','HR','A','IMG','STYLE']);
      doc.body.querySelectorAll('*').forEach((el) => {
        const nm = el.nodeName;
        if (!allowed.has(nm)) { el.remove(); return; }
        [...el.attributes].forEach(a => { if (a.name.toLowerCase().startsWith('on')) el.removeAttribute(a.name); });
        if (nm === 'A') { el.setAttribute('rel','noopener noreferrer'); el.setAttribute('target','_blank'); }
        if (nm === 'IMG') {
          const safe = new Set(['src','alt','style','width','height','loading']);
          [...el.attributes].forEach(a => { if (!safe.has(a.name.toLowerCase())) el.removeAttribute(a.name); });
        }
        if (nm === 'IFRAME') {
          const src = el.getAttribute('src') || '';
          const ok = /^https:\/\/(?:www\.)?youtube\.com\/embed\/[A-Za-z0-9_-]{11}$/.test(src);
          if (!ok) { el.remove(); return; }
          const safe = new Set(['src','title','frameborder','allow','allowfullscreen','loading','style']);
          [...el.attributes].forEach(a => { if (!safe.has(a.name.toLowerCase())) el.removeAttribute(a.name); });
        }
      });
      return doc.body.innerHTML;
    } catch { return ''; }
  };

  const initEditor = () => {
    if (!window.toastui?.Editor) {
      console.warn('Toast UI Editor가 로드되지 않았습니다.');
      return;
    }
    const { Editor } = window.toastui;
    const el = document.getElementById('notice-editor');
    if (!el) {
      console.warn('에디터 엘리먼트를 찾을 수 없습니다.');
      return;
    }
    
    // 기존 에디터가 있으면 제거
    if (editorRef.current) {
      try {
        editorRef.current.destroy();
      } catch (e) {
        // ignore
      }
      editorRef.current = null;
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

    const ed = new Editor({
      el,
      height: '600px',
      initialEditType: 'wysiwyg',
      previewStyle: 'tab',
      usageStatistics: false,
      language: 'ko-KR',
      placeholder: '내용을 입력하세요',
      initialValue: initialContent,
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task'],
        ['table', 'image', 'link'],
        ['code', 'codeblock']
      ],
      customHTMLSanitizer: youtubeAndImageSanitizer,
      customHTMLRenderer,
      hooks: {
        addImageBlobHook: async (blob, callback) => {
          try {
            const formData = new FormData();
            formData.append('file', blob, 'image.jpg');
            const res = await fetch('/api/admin/notices/upload-image', { method: 'POST', body: formData });
            if (!res.ok) {
              const e = await res.json().catch(() => ({}));
              throw new Error(e.detail || '이미지 업로드에 실패했습니다.');
            }
            const result = await res.json();
            callback(result.url, '이미지 업로드 완료');
          } catch (err) {
            console.error('이미지 업로드 오류:', err);
            callback('', err.message || '이미지 업로드에 실패했습니다.');
          }
        },
      },
    });

    // 붙여넣기에서 YouTube URL 탐지 및 이미지 처리
    const root =
      el.querySelector('.toastui-editor-ww-mode') ||
      el.querySelector('.toastui-editor-md-container textarea');
    
    root?.addEventListener('paste', (e) => {
      const cd = e.clipboardData || window.clipboardData;
      const text = cd?.getData('text') || '';
      
      // 이미지 붙여넣기 처리
      const items = cd?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
              e.preventDefault();
              const formData = new FormData();
              formData.append('file', blob, 'image.jpg');
              fetch('/api/admin/notices/upload-image', { method: 'POST', body: formData })
                .then(response => response.json())
                .then(result => {
                  if (result.url) {
                    const currentHTML = ed.getHTML();
                    const newHTML = currentHTML + `<img src="${result.url}" alt="업로드된 이미지" style="max-width: 100%; height: auto;"><br>`;
                    ed.setHTML(newHTML);
                  }
                })
                .catch(error => console.error('이미지 업로드 오류:', error));
              return;
            }
          }
        }
      }
      
      // 유튜브 URL 처리
      const m = text.match(YT_URL_RE);
      if (!m) return;
      setTimeout(() => {
        const html = ed.getHTML();
        const replaced = html.replace(
          /<p>(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^<\s]+)<\/p>/i,
          () => makeIframeHTML(m[1])
        );
        if (replaced !== html) ed.setHTML(replaced);
      }, 0);
    });

    // 변경 감지 (직접 타이핑한 URL도 커버)
    const onChange = (() => {
      let t;
      return () => {
        clearTimeout(t);
        t = setTimeout(() => {
          const html = ed.getHTML();
          const replaced = html.replace(
            /<p>(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)[^<\s]+)<\/p>/ig,
            (whole, url) => {
              const m = url.match(YT_URL_RE);
              return m ? makeIframeHTML(m[1]) : whole;
            }
          );
          if (replaced !== html) ed.setHTML(replaced);
        }, 250);
      };
    })();
    ed.on('change', onChange);

    editorRef.current = ed;
  };

  const minDateTime = (() => {
    const now = new Date();
    const offsetMs = 9 * 60 * 60 * 1000; // KST
    const kst = new Date(now.getTime() + offsetMs);
    return kst.toISOString().slice(0, 16);
  })();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }
    if (title.length > 100) {
      alert('제목은 100자 이하로 입력해주세요.');
      return;
    }
    if (!categoryId) {
      alert('카테고리를 선택해주세요.');
      return;
    }
    const content = editorRef.current ? editorRef.current.getHTML() : '';
    if (!content || content === '<p><br></p>') {
      alert('내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(`/admin/notices/${noticeId}`, {
        title,
        category_id: Number(categoryId),
        publish_status: publishStatus,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : null,
        content,
      });
      alert('공지사항이 수정되었습니다!');
      navigate(`/admin/notices/${noticeId}`);
    } catch (e) {
      alert(e.response?.data?.detail || '공지사항 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingNotice) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">공지사항 수정</h1>
          <p className="mt-1 text-sm text-gray-500">공지사항을 수정하세요</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to={`/admin/notices/${noticeId}`}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            취소
          </Link>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <form onSubmit={onSubmit}>
          {/* Title */}
          <div className="mb-6">
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-2">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              maxLength={100}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">1자 이상 100자 이하로 입력해주세요</p>
          </div>

          {/* Category */}
          <div className="mb-6">
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-900 mb-2">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              id="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="" disabled>[선택]</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Publish Status */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              발행 설정 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="publish_status"
                  value="published"
                  checked={publishStatus === 'published'}
                  onChange={() => setPublishStatus('published')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">즉시 공개</span>
              </label>
              <div className="flex items-center space-x-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="publish_status"
                    value="scheduled"
                    checked={publishStatus === 'scheduled'}
                    onChange={() => setPublishStatus('scheduled')}
                    className="mr-3 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-900">예약 발행</span>
                </label>
                {publishStatus === 'scheduled' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="datetime-local"
                      value={publishedAt}
                      min={minDateTime}
                      onChange={(e) => setPublishedAt(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-xs text-gray-500">과거 날짜는 선택할 수 없습니다</span>
                  </div>
                )}
              </div>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="publish_status"
                  value="private"
                  checked={publishStatus === 'private'}
                  onChange={() => setPublishStatus('private')}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900">비공개</span>
              </label>
            </div>
          </div>

          {/* Content Editor */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              내용 <span className="text-red-500">*</span>
            </label>
            <div id="notice-editor" data-placeholder="내용을 입력하세요"></div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3">
            <Link
              to={`/admin/notices/${noticeId}`}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn-blue"
            >
              {loading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

