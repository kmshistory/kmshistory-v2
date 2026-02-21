import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function Notices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [notices, setNotices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  
  // 검색 및 필터 상태
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '공지사항 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 공지사항 목록 및 카테고리 조회
  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [currentPage, search, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit: limit,
      };
      if (search) params.search = search;
      if (selectedCategory) params.category_id = selectedCategory;

      const noticesRes = await apiClient.get('/notices', { params });
      setNotices(noticesRes.data.items || []);
      setCurrentPage(noticesRes.data.page || 1);
      setTotalPages(noticesRes.data.total_pages || 1);
      setTotal(noticesRes.data.total || 0);
    } catch (err) {
      console.error('공지사항 조회 에러:', err);
      setError('공지사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/notice-categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('카테고리 조회 에러:', err);
    }
  };

  // 검색 및 필터 적용
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL({ search, category_id: selectedCategory, page: 1 });
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    updateURL({ search, category_id: categoryId, page: 1 });
  };

  const handleReset = () => {
    setSearch('');
    setSelectedCategory('');
    setCurrentPage(1);
    updateURL({ search: '', category_id: '', page: 1 });
  };

  const updateURL = (params) => {
    const newParams = new URLSearchParams();
    if (params.search) newParams.set('search', params.search);
    if (params.category_id) newParams.set('category_id', params.category_id);
    if (params.page && params.page > 1) newParams.set('page', params.page);
    setSearchParams(newParams);
  };

  // 날짜 포맷팅 (YYYY.MM.DD)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 번호 계산
  const getNoticeNumber = (index) => {
    return index + 1 + (currentPage - 1) * limit;
  };

  // 페이지 정보 계산
  const getPageInfo = () => {
    if (notices.length === 0) {
      return `총 ${total}개 중 0개 표시`;
    }
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
    return `총 ${total}개 중 ${start}~${end}개 표시`;
  };

  return (
    <div className="w-full sm:w-[95%] md:w-[768px] lg:w-[1024px] xl:w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항</h1>
        <p className="text-gray-600">강민성 한국사의 소식을 확인하세요.</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="제목, 내용 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="min-w-[150px]">
            <select
              name="category_id"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 카테고리</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-blue">
            검색
          </button>
          {(search || selectedCategory) && (
            <Link
              to="/notices"
              onClick={(e) => {
                e.preventDefault();
                handleReset();
              }}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              초기화
            </Link>
          )}
        </form>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">불러오는 중...</p>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 mb-6">
          {error}
        </div>
      )}

      {/* Notice List */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {notices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <i className="fas fa-inbox mx-auto h-12 w-12 text-gray-400 text-5xl mb-4"></i>
              <p className="text-gray-500">공지사항이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 모바일 카드 뷰 */}
              <div className="block sm:hidden">
                <div className="divide-y divide-gray-200">
                  {notices.map((notice, index) => (
                    <div key={notice.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            #{getNoticeNumber(index)}
                          </span>
                          {notice.category_name && (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {notice.category_name}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(notice.published_at || notice.created_at)}
                        </div>
                      </div>
                      <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                        <Link
                          to={`/notices/${notice.id}`}
                          className="hover:text-blue-600"
                        >
                          {notice.title}
                        </Link>
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{notice.author_nickname || '관리자'}</span>
                        <span>조회 {notice.views || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 데스크톱 테이블 뷰 */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        번호
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        카테고리
                      </th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        제목
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                        작성자
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                        등록일
                      </th>
                      <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        조회수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {notices.map((notice, index) => (
                      <tr
                        key={notice.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {getNoticeNumber(index)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-center">
                          {notice.category_name ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {notice.category_name}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-3 py-4">
                          <Link
                            to={`/notices/${notice.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {notice.title}
                          </Link>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {notice.author_nickname || '관리자'}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {formatDate(notice.published_at || notice.created_at)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {notice.views || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* 페이지 정보 */}
      {!loading && !error && (
        <div className="mt-2 mb-2 text-sm text-gray-600 text-left">
          {getPageInfo()}
        </div>
      )}

      {/* 페이지네이션 */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex justify-center items-center mt-12 mb-16">
          <div className="flex items-center space-x-1">
            {/* << 첫 페이지 */}
            {currentPage > 1 ? (
              <Link
                to={`/notices?page=1${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(1);
                  updateURL({ search, category_id: selectedCategory, page: 1 });
                }}
                className="px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                &laquo;&laquo;
              </Link>
            ) : (
              <span className="px-2 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
                &laquo;&laquo;
              </span>
            )}

            {/* < 이전 페이지 */}
            {currentPage > 1 ? (
              <Link
                to={`/notices?page=${currentPage - 1}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  const newPage = currentPage - 1;
                  setCurrentPage(newPage);
                  updateURL({ search, category_id: selectedCategory, page: newPage });
                }}
                className="px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                &laquo;
              </Link>
            ) : (
              <span className="px-2 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
                &laquo;
              </span>
            )}

            {/* 페이지 번호들 */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              pageNum === currentPage ? (
                <span
                  key={pageNum}
                  className="px-3 py-2 text-sm font-medium text-white bg-gray-600 rounded-lg"
                >
                  {pageNum}
                </span>
              ) : (
                <Link
                  key={pageNum}
                  to={`/notices?page=${pageNum}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(pageNum);
                    updateURL({ search, category_id: selectedCategory, page: pageNum });
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  {pageNum}
                </Link>
              )
            ))}

            {/* > 다음 페이지 */}
            {currentPage < totalPages ? (
              <Link
                to={`/notices?page=${currentPage + 1}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  const newPage = currentPage + 1;
                  setCurrentPage(newPage);
                  updateURL({ search, category_id: selectedCategory, page: newPage });
                }}
                className="px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                &raquo;
              </Link>
            ) : (
              <span className="px-2 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
                &raquo;
              </span>
            )}

            {/* >> 마지막 페이지 */}
            {currentPage < totalPages ? (
              <Link
                to={`/notices?page=${totalPages}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage(totalPages);
                  updateURL({ search, category_id: selectedCategory, page: totalPages });
                }}
                className="px-2 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                &raquo;&raquo;
              </Link>
            ) : (
              <span className="px-2 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-lg cursor-not-allowed">
                &raquo;&raquo;
              </span>
            )}
          </div>
        </div>
      )}

      {/* 하단 여백 */}
      <div className="h-16"></div>
    </div>
  );
}
