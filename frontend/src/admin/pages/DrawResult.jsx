import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function DrawResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [winners, setWinners] = useState([]);
  const [count, setCount] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const [drawDatetime, setDrawDatetime] = useState(new Date());

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '추첨 결과 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // location.state에서 데이터 로드
  useEffect(() => {
    if (location.state) {
      const { winners: winnersData, totalParticipants: total, count: winnerCount } = location.state;
      setWinners(winnersData || []);
      setCount(winnerCount || winnersData?.length || 0);
      setTotalParticipants(total || 0);
      setDrawDatetime(new Date());
    } else {
      // state가 없으면 이전 페이지로 리다이렉트
      navigate('/admin/draw/select');
    }
  }, [location.state, navigate]);

  // 이탈 경고 - 브라우저 새로고침/닫기/외부 이동 방지
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isDataSaved) {
        e.preventDefault();
        e.returnValue = '저장되지 않은 추첨 결과가 있습니다. 정말 페이지를 벗어나시겠습니까?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDataSaved]);

  // 뒤로가기/앞으로가기 버튼 방지
  useEffect(() => {
    if (isDataSaved) return;

    // 현재 상태를 히스토리에 push하여 뒤로가기 감지 가능하게 함
    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e) => {
      if (!isDataSaved) {
        if (!window.confirm('저장되지 않은 추첨 결과가 있습니다. 정말 페이지를 벗어나시겠습니까?')) {
          // 다시 현재 상태를 히스토리에 push하여 위치 유지
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDataSaved]);

  // 전역 클릭 이벤트 리스너 - 모든 링크 클릭 감지 (Django 템플릿 방식)
  useEffect(() => {
    if (isDataSaved) return;

    const handleClick = (e) => {
      // Link나 a 태그 클릭 감지
      const link = e.target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href');
        if (!href) return;

        // 앵커 링크, JavaScript, mailto, tel 링크는 무시
        if (href.startsWith('#') || 
            href.startsWith('javascript:') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')) {
          return;
        }

        // 같은 사이트 내 페이지로 이동하는 경우 체크
        try {
          const currentPath = location.pathname;
          // 절대 경로인 경우
          if (href.startsWith('/')) {
            // 같은 페이지가 아니면 경고
            if (href !== currentPath && href !== '/admin/draw/result') {
              if (!window.confirm('저장되지 않은 추첨 결과가 있습니다. 정말 페이지를 벗어나시겠습니까?')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
              }
            }
          }
          // 상대 경로이거나 전체 URL인 경우도 체크 (외부 링크 제외)
          else if (!href.startsWith('http://') && !href.startsWith('https://')) {
            // 상대 경로인 경우 - 기본적으로 경고 (다른 페이지로 이동 가능성이 높음)
            if (href !== currentPath && href !== './' && href !== '') {
              if (!window.confirm('저장되지 않은 추첨 결과가 있습니다. 정말 페이지를 벗어나시겠습니까?')) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                return false;
              }
            }
          }
        } catch (err) {
          // href 파싱 중 오류 발생 시 무시
          console.error('Link href parsing error:', err);
        }
      }
    };

    // Capture phase에서 리스너 추가 (가장 먼저 실행되어 다른 핸들러보다 우선)
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isDataSaved, location.pathname]);

  // location.pathname 변경 감지 (React Router 내부 네비게이션 방지 - 보조용)
  const prevPathnameRef = useRef(location.pathname);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // 초기 마운트 시에는 경고하지 않음
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevPathnameRef.current = location.pathname;
      return;
    }

    if (isDataSaved) {
      prevPathnameRef.current = location.pathname;
      return;
    }

    // 경로가 변경되려 할 때 (다른 페이지로 이동)
    if (location.pathname !== prevPathnameRef.current && location.pathname !== '/admin/draw/result') {
      if (!window.confirm('저장되지 않은 추첨 결과가 있습니다. 정말 페이지를 벗어나시겠습니까?')) {
        // 원래 위치로 되돌리기
        navigate(prevPathnameRef.current, { replace: true });
        return;
      }
    }

    prevPathnameRef.current = location.pathname;
  }, [location.pathname, isDataSaved, navigate]);

  const formatDate = (date) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}:${ss}`;
  };

  const formatDateShort = (date) => {
    if (!date) return '-';
    const d = date instanceof Date ? date : new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}`;
  };

  const handleSaveClick = () => {
    setSaveModalOpen(true);
    setHasUnsavedChanges(true);
  };

  const handleCloseSaveModal = () => {
    setSaveModalOpen(false);
    if (!isDataSaved) {
      setFormData({ title: '', content: '' });
    }
  };

  const handleSaveResult = async () => {
    if (!formData.title.trim()) {
      alert('추첨 제목을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post('/draw/save', {
        title: formData.title.trim(),
        content: formData.content.trim(),
        draw_datetime: drawDatetime.toISOString(),
        total_participants: totalParticipants,
        winner_count: count,
        winners: winners.map(w => ({
          name: w.name,
          email: w.email,
          description: w.description,
        })),
      });

      alert('추첨 결과가 성공적으로 저장되었습니다!');
      setIsDataSaved(true);
      setHasUnsavedChanges(false);
      setSaveModalOpen(false);

      if (window.confirm('백오피스에서 저장된 추첨 기록을 확인하시겠습니까?')) {
        navigate('/admin/draw');
      }
    } catch (e) {
      console.error('추첨 결과 저장 실패:', e);
      setErrorMessage(e.response?.data?.detail || '저장 중 오류가 발생했습니다.');
      setErrorModalOpen(true);
    } finally {
      setSaving(false);
    }
  };


  const handlePrint = () => {
    window.print();
  };

  if (winners.length === 0) {
    return (
      <div className="w-full flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-gray-500 mb-4">당첨자 정보가 없습니다.</p>
          <Link
            to="/admin/draw/select"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary"
          >
            다시 선정하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* 축하 메시지 */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-primary/20 rounded-full mb-3 sm:mb-4">
          <i className="fas fa-trophy text-primary text-2xl sm:text-3xl"></i>
        </div>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 px-2 leading-tight">
          🎉 당첨자 발표 🎉
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 px-2">
          총 {count}명의 당첨자가 선정되었습니다!
        </p>
      </div>

      {/* 당첨자 목록 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6 sm:mb-8">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-primary/10 to-secondary/10">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">🏆 당첨자 명단</h3>
        </div>
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {winners.map((winner, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-primary/10 to-secondary/10 border-2 border-primary/20 rounded-lg p-3 sm:p-4 transform hover:scale-105 transition-transform duration-200"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm sm:text-lg">{index + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{winner.name}</h4>
                    <p className="text-xs sm:text-sm text-gray-600">{winner.email}</p>
                    {winner.description && (
                      <p className="text-xs sm:text-sm text-gray-500 truncate">{winner.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 당첨자 상세 정보 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden mb-6 sm:mb-8">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">당첨자 상세 정보</h3>
        </div>

        {/* 모바일용 카드 뷰 */}
        <div className="block sm:hidden">
          <div className="divide-y divide-gray-200">
            {winners.map((winner, index) => (
              <div key={index} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                    {index + 1}등
                  </span>
                  <span className="text-xs text-gray-500">{formatDateShort(winner.created_at)}</span>
                </div>
                <h4 className="text-base font-semibold text-gray-900 mb-2">{winner.name}</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">이메일:</span> {winner.email}
                  </p>
                  {winner.description && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">상세:</span> {winner.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 데스크톱용 테이블 뷰 */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순위</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {winners.map((winner, index) => (
                <tr key={index} className="hover:bg-primary/5">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                      {index + 1}등
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900 break-words">{winner.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 break-words">{winner.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 break-words">{winner.description || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDateShort(winner.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4 px-4">
        <button
          onClick={handleSaveClick}
          className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <i className="fas fa-save text-lg mr-2"></i>
          저장하기
        </button>
        <Link
          to="/admin/draw/select"
          className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <i className="fas fa-redo text-lg mr-2"></i>
          다시 선정하기
        </Link>
        <Link
          to="/admin/participants"
          className="inline-flex items-center justify-center px-4 sm:px-6 py-3 border border-gray-300 text-sm sm:text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <i className="fas fa-arrow-left text-lg mr-2"></i>
          대상자 관리로 돌아가기
        </Link>
      </div>

      {/* 인쇄 버튼 */}
      <div className="mt-6 sm:mt-8 text-center px-4">
        <button
          onClick={handlePrint}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <i className="fas fa-print text-lg mr-2"></i>
          인쇄하기
        </button>
      </div>

      {/* 저장 모달 */}
      {saveModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">추첨 결과 저장</h3>
                <button
                  onClick={handleCloseSaveModal}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="mt-4">
                <div className="mb-4">
                  <label htmlFor="draw-title" className="block text-sm font-medium text-gray-700 mb-2">
                    추첨 제목 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="draw-title"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="예: 2024년 1월 한국사 퀴즈 이벤트"
                  />
                </div>
                <div className="mb-6">
                  <label htmlFor="draw-content" className="block text-sm font-medium text-gray-700 mb-2">
                    추첨 내용
                  </label>
                  <textarea
                    id="draw-content"
                    name="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    placeholder="추첨에 대한 설명이나 메모를 입력하세요."
                  />
                </div>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">저장될 정보</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• 추첨일시: {formatDate(drawDatetime)}</p>
                    <p>• 추첨 대상자 수: {totalParticipants}명</p>
                    <p>• 당첨자 수: {count}명</p>
                    <p>
                      • 당첨자:{' '}
                      {winners.map((w, i) => (
                        <span key={i}>
                          <span className="font-medium">{w.name}</span>
                          {i < winners.length - 1 && ', '}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseSaveModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  type="button"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveResult}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  type="button"
                >
                  {saving ? '저장 중...' : '저장하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 에러 모달 */}
      {errorModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-red-600">오류 발생</h3>
                <button
                  onClick={() => setErrorModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="mt-4">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">{errorMessage}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  onClick={() => setErrorModalOpen(false)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                  type="button"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 인쇄용 스타일 */}
      <style>{`
        @media print {
          header, .no-print { display: none !important; }
          body { background: white !important; }
          .bg-gradient-to-br { background: #fef3c7 !important; }
          .border-2 { border: 2px solid #f59e0b !important; }
        }
      `}</style>
    </div>
  );
}












