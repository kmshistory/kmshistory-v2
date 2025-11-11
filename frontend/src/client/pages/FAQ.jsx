import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function FAQ() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 5;
  
  // 검색 및 필터 상태
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category_id') || '');

  // 아코디언 상태 (열린 FAQ ID 목록)
  const [openFaqIds, setOpenFaqIds] = useState(new Set());

  // FAQ 목록 및 카테고리 조회
  useEffect(() => {
    fetchData();
    fetchCategories();
    // 스크롤 맨 위로
    window.scrollTo(0, 0);
  }, [currentPage, search, selectedCategory]);

  // URL 파라미터 동기화
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1;
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category_id') || '';
    
    if (page !== currentPage) setCurrentPage(page);
    if (searchParam !== search) setSearch(searchParam);
    if (categoryParam !== selectedCategory) setSelectedCategory(categoryParam);
  }, [searchParams]);

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

      const faqsRes = await apiClient.get('/faq', { params });
      setFaqs(faqsRes.data.items || []);
      setCurrentPage(faqsRes.data.page || 1);
      setTotalPages(faqsRes.data.total_pages || 1);
      setTotal(faqsRes.data.total || 0);
    } catch (err) {
      console.error('FAQ 조회 에러:', err);
      setError('FAQ를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/faq-categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('FAQ 카테고리 조회 에러:', err);
    }
  };

  // 검색 적용
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL({ search, category_id: selectedCategory, page: 1 });
  };

  // 카테고리 변경
  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    updateURL({ search, category_id: categoryId, page: 1 });
  };

  // 검색 초기화
  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    updateURL({ search: '', category_id: selectedCategory, page: 1 });
  };

  const updateURL = (params) => {
    const newParams = new URLSearchParams();
    if (params.search) newParams.set('search', params.search);
    if (params.category_id) newParams.set('category_id', params.category_id);
    if (params.page && params.page > 1) newParams.set('page', params.page);
    setSearchParams(newParams);
  };

  // 아코디언 토글
  const toggleAccordion = (faqId) => {
    setOpenFaqIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(faqId)) {
        newSet.delete(faqId);
      } else {
        newSet.add(faqId);
      }
      return newSet;
    });
  };

  // 페이지 정보 표시
  const getPageInfo = () => {
    if (faqs.length === 0) {
      return `총 ${total}개 중 0개 표시`;
    }
    const start = ((currentPage - 1) * limit) + 1;
    const end = Math.min(currentPage * limit, total);
    return `총 ${total}개 중 ${start}~${end}개 표시`;
  };

  // primary 색상 (테마에 맞게 조정 필요)
  const primaryColor = 'bg-blue-600';
  const primaryTextColor = 'text-white';

  return (
    <div className="w-full sm:w-[95%] md:w-[768px] lg:w-[1024px] xl:w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="text-center sm:text-left mb-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">자주 묻는 질문</h1>
          <p className="text-gray-600">강민성 한국사와 관련한 자주 묻는 질문과 답변을 모았습니다.</p>
        </div>
      </div>

      {/* 검색바 */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <div className="relative">
            <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              name="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색어를 입력해주세요"
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </form>
      </div>

      {/* 카테고리 탭 */}
      <div className="mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => handleCategoryClick('')}
            className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              !selectedCategory
                ? `${primaryColor} ${primaryTextColor}`
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            전체
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(String(category.id))}
              className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === String(category.id)
                  ? `${primaryColor} ${primaryTextColor}`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* 페이지 정보 */}
      {!loading && !error && (
        <div className="mb-4 text-sm text-gray-600 text-left">
          {getPageInfo()}
        </div>
      )}

      {/* FAQ 아코디언 리스트 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">로딩 중...</div>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="text-red-500">{error}</div>
          </div>
        ) : faqs.length > 0 ? (
          faqs.map((faq) => {
            const isOpen = openFaqIds.has(faq.id);
            return (
              <div key={faq.id} className="border-b border-gray-200 last:border-b-0">
                {/* 질문 (클릭 가능) */}
                <button
                  onClick={() => toggleAccordion(faq.id)}
                  className="w-full px-4 sm:px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                >
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 leading-tight">
                      {faq.question}
                    </h3>
                    {faq.category_name && (
                      <span className="inline-block text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full mt-1">
                        {faq.category_name}
                      </span>
                    )}
                  </div>
                  <i
                    className={`fas fa-chevron-down text-gray-500 text-lg sm:text-xl transition-transform duration-200 flex-shrink-0 ml-2 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  ></i>
                </button>

                {/* 답변 (접힘/펼침) */}
                {isOpen && (
                  <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              {search ? (
                <>
                  <i className="fas fa-search text-4xl mb-4 opacity-50"></i>
                  <p className="text-lg mb-2">검색 결과가 없습니다</p>
                  <p className="text-sm">다른 검색어로 다시 시도해보세요.</p>
                </>
              ) : (
                <>
                  <i className="fas fa-question-circle text-4xl mb-4 opacity-50"></i>
                  <p className="text-lg mb-2">해당 카테고리에 등록된 FAQ가 없습니다</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 페이지네이션 */}
      {!loading && !error && totalPages >= 1 && (
        <div className="flex justify-center items-center mt-12 mb-16">
          <div className="flex items-center space-x-1">
            {/* << 첫 페이지 */}
            {currentPage > 1 ? (
              <Link
                to={`/faq?page=1${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
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
                to={`/faq?page=${currentPage - 1}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
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

            {/* 페이지 번호들 (모든 페이지 표시) */}
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
                  to={`/faq?page=${pageNum}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
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
                to={`/faq?page=${currentPage + 1}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
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
                to={`/faq?page=${totalPages}${search ? `&search=${search}` : ''}${selectedCategory ? `&category_id=${selectedCategory}` : ''}`}
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










