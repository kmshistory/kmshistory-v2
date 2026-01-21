import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function DrawList() {
  const navigate = useNavigate();
  const query = useQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '추첨 목록 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawRecords, setDrawRecords] = useState([]);
  const [searchText, setSearchText] = useState(query.get('search') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(query.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteRecordId, setDeleteRecordId] = useState(null);
  const [deleteRecordTitle, setDeleteRecordTitle] = useState('');
  const [deleting, setDeleting] = useState(false);

  const limit = 10;

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/draw/list', {
        params: {
          page: currentPage,
          limit,
          search: searchText || undefined,
        },
      });
      // API 응답 구조: { message: "...", data: [...], pagination: {...} }
      const data = res.data.data || res.data.items || [];
      const pagination = res.data.pagination || {};
      setDrawRecords(data);
      setTotalPages(pagination.total_pages || 1);
      setTotalCount(pagination.total || pagination.total_count || 0);
    } catch (e) {
      console.error('추첨 목록 조회 실패:', e);
      setError(e.response?.data?.detail || e.response?.data?.message || '추첨 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL({ page: 1, search: searchText });
    fetchList();
  };

  const handleResetFilters = () => {
    setSearchText('');
    setCurrentPage(1);
    updateURL({ page: 1, search: '' });
    fetchList();
  };

  const updateURL = (params = {}) => {
    const sp = new URLSearchParams();
    const page = params.page ?? currentPage;
    const s = params.search ?? searchText;
    if (page && page !== 1) sp.set('page', String(page));
    if (s) sp.set('search', s);
    navigate({ pathname: '/admin/draw', search: `?${sp.toString()}` }, { replace: true });
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
  };

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}`;
  };

  const showDeleteModal = (recordId, recordTitle) => {
    setDeleteRecordId(recordId);
    setDeleteRecordTitle(recordTitle);
    setDeleteModalOpen(true);
  };

  const hideDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteRecordId(null);
    setDeleteRecordTitle('');
  };

  const confirmDelete = async () => {
    if (!deleteRecordId) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/draw/${deleteRecordId}/delete`);
      hideDeleteModal();
      alert('추첨 기록이 성공적으로 삭제되었습니다.');
      await fetchList();
    } catch (e) {
      alert(e.response?.data?.detail || e.response?.data?.message || '삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateURL({ page, search: searchText });
  };

  return (
    <div className="w-full">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">추첨 관리</h1>
            <p className="mt-1 text-sm text-gray-600">추첨 기록을 관리하고 조회할 수 있습니다.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              총 <span className="font-semibold text-gray-900">{totalCount}</span>개의 추첨 기록
            </div>
          </div>
        </div>
      </div>

      {/* 검색 필터 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              name="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="추첨 제목, 내용 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            검색
          </button>
          {searchText && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              초기화
            </button>
          )}
        </form>
      </div>

      {/* 추첨 기록 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : drawRecords.length > 0 ? (
          <>
            {/* 데스크톱용 테이블 뷰 */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추첨 제목</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추첨일시</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">대상자 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">당첨자 수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drawRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <i className="fas fa-trophy text-primary text-sm"></i>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{record.title}</div>
                            {record.content && (
                              <div className="text-sm text-gray-500 break-words">{record.content}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(record.draw_datetime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {record.total_participants || 0}명
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {record.winner_count || 0}명
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(record.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link
                            to={`/admin/draw/${record.id}`}
                            className="text-purple-700 hover:text-purple-900 transition-colors duration-150"
                          >
                            상세보기
                          </Link>
                          <button
                            onClick={() => showDeleteModal(record.id, record.title)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-150"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 모바일용 카드 뷰 */}
            <div className="block sm:hidden">
              <div className="divide-y divide-gray-200">
                {drawRecords.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                          <i className="fas fa-trophy text-primary text-sm"></i>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">{record.title}</h3>
                          {record.content && (
                            <p className="text-xs text-gray-500 mt-1">{record.content}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/admin/draw/${record.id}`}
                          className="text-purple-700 hover:text-purple-900 text-xs"
                        >
                          상세보기
                        </Link>
                        <button
                          onClick={() => showDeleteModal(record.id, record.title)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500">추첨일시:</span>
                        <span className="text-gray-900 font-medium ml-1">{formatDateTime(record.draw_datetime)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">생성일:</span>
                        <span className="text-gray-900 font-medium ml-1">{formatDate(record.created_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">대상자:</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-1">
                          {record.total_participants || 0}명
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">당첨자:</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-1">
                          {record.winner_count || 0}명
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    총 {totalCount}개 중 {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalCount)}개
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <i className="fas fa-chevron-left text-lg"></i>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      pageNum === currentPage ? (
                        <span
                          key={pageNum}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-primary text-sm font-medium text-white"
                        >
                          {pageNum}
                        </span>
                      ) : (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {pageNum}
                        </button>
                      )
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <i className="fas fa-chevron-right text-lg"></i>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <i className="fas fa-trophy text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">추첨 기록이 없습니다</h3>
            <p className="text-gray-500 mb-6">아직 저장된 추첨 기록이 없습니다.</p>
            <div className="text-sm text-gray-400">
              <i className="fas fa-info-circle mr-1"></i>
              추첨을 진행하고 결과를 저장하면 여기에 표시됩니다.
            </div>
          </div>
        )}
      </div>

      {/* 삭제 확인 모달 */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-red-600">추첨 기록 삭제</h3>
                <button
                  onClick={hideDeleteModal}
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
                    <p className="text-sm text-gray-700">
                      정말로 <strong>{deleteRecordTitle}</strong> 추첨 기록을 삭제하시겠습니까?
                    </p>
                    <p className="text-xs text-gray-500 mt-1">삭제된 기록은 복구할 수 없습니다.</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  onClick={hideDeleteModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  type="button"
                  disabled={deleting}
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  type="button"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}












