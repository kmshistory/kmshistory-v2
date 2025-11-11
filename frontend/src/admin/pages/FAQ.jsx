import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function AdminFAQ() {
  const navigate = useNavigate();
  const query = useQuery();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchText, setSearchText] = useState(query.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(query.get('category_id') || '');
  const [currentPage, setCurrentPage] = useState(parseInt(query.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 카테고리 모달
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const limit = 10;

  const updateURL = (params = {}) => {
    const sp = new URLSearchParams();
    const page = params.page ?? currentPage;
    const s = params.search ?? searchText;
    const c = params.category_id ?? selectedCategory;
    if (page && page !== 1) sp.set('page', String(page));
    if (s) sp.set('search', s);
    if (c) sp.set('category_id', String(c));
    navigate({ pathname: '/admin/faq', search: `?${sp.toString()}` }, { replace: true });
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/admin/faq-categories');
      // API가 배열을 직접 반환
      setCategories(Array.isArray(res.data) ? res.data : (res.data?.categories || []));
    } catch (e) {
      console.error('카테고리 조회 실패:', e);
    }
  };

  const fetchList = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/admin/faq', {
        params: {
          page: currentPage,
          limit,
          search: searchText || undefined,
          category_id: selectedCategory || undefined,
        },
      });
      const data = res.data;
      setFaqs(data.items || data.faqs || []);
      setTotalPages(data.total_pages || data.totalPages || 1);
      setTotalCount(data.total || data.total_count || 0);
    } catch (e) {
      console.error('FAQ 목록 조회 실패:', e);
      setError(e.response?.data?.detail || 'FAQ 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchList();
  }, [currentPage, selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL({ page: 1, search: searchText, category_id: selectedCategory });
    fetchList();
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSelectedCategory('');
    setCurrentPage(1);
    updateURL({ page: 1, search: '', category_id: '' });
    fetchList();
  };

  const toggleActive = async (faqId) => {
    try {
      await apiClient.patch(`/admin/faq/${faqId}/toggle-active`);
      await fetchList();
    } catch (e) {
      alert(e.response?.data?.detail || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const deleteFaq = async (id) => {
    if (!confirm('정말 이 FAQ를 삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/admin/faq/${id}`);
      await fetchList();
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
    return `${y}-${m}-${da}`;
  };

  const getIndexNum = (idx) => (idx + 1) + (currentPage - 1) * limit;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ 관리</h1>
          <p className="mt-1 text-sm text-gray-500">자주 묻는 질문을 관리하세요</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-gray-900 bg-yellow-400 border border-yellow-500 rounded-lg hover:bg-yellow-500"
          >
            카테고리 관리
          </button>
          <Link
            to="/admin/faq/new"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            FAQ 등록
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              name="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="질문, 답변 검색..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="min-w-[150px]">
            <select
              name="category_id"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            검색
          </button>
          {(searchText || selectedCategory) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              초기화
            </button>
          )}
        </form>
      </div>

      {/* FAQ List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : faqs.length > 0 ? (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="block lg:hidden">
              <div className="divide-y divide-gray-200">
                {faqs.map((faq, idx) => (
                  <div key={faq.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">#{getIndexNum(idx)}</span>
                        {faq.category_name && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {faq.category_name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => toggleActive(faq.id)}
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          faq.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        } hover:opacity-80`}
                      >
                        {faq.is_active ? '공개' : '비공개'}
                      </button>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      <Link to={`/admin/faq/${faq.id}`} className="hover:text-blue-600">
                        {faq.question}
                      </Link>
                    </h3>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      <span>{formatDate(faq.created_at)}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link to={`/admin/faq/${faq.id}`} className="text-xs text-green-600 hover:text-green-800">
                        상세
                      </Link>
                      <Link to={`/admin/faq/${faq.id}/edit`} className="text-xs text-blue-600 hover:text-blue-800">
                        수정
                      </Link>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden lg:block overflow-x-auto">
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
                      질문
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      상태
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      생성일
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {faqs.map((faq, idx) => (
                    <tr key={faq.id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 text-center text-sm text-gray-900">{getIndexNum(idx)}</td>
                      <td className="px-3 py-4 text-center text-sm">
                        {faq.category_name ? (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {faq.category_name}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900">
                        <Link
                          to={`/admin/faq/${faq.id}`}
                          className="max-w-xs truncate text-blue-600 hover:text-blue-800 hover:underline"
                          title={faq.question}
                        >
                          {faq.question}
                        </Link>
                      </td>
                      <td className="px-3 py-4 text-center text-sm">
                        <button
                          onClick={() => toggleActive(faq.id)}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            faq.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          } hover:opacity-80`}
                        >
                          {faq.is_active ? '공개' : '비공개'}
                        </button>
                      </td>
                      <td className="px-3 py-4 text-center text-sm text-gray-500">
                        {formatDate(faq.created_at)}
                      </td>
                      <td className="px-3 py-4 text-center text-sm">
                        <div className="flex justify-center space-x-2">
                          <Link
                            to={`/admin/faq/${faq.id}`}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            상세
                          </Link>
                          <Link
                            to={`/admin/faq/${faq.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => deleteFaq(faq.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
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

            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  이전
                </button>
                <button
                  onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  다음
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    총 {totalCount}개 중 {(currentPage - 1) * limit + 1}-
                    {Math.min(currentPage * limit, totalCount)}개
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Previous</span>
                      <i className="fas fa-chevron-left text-lg"></i>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) =>
                      p === currentPage ? (
                        <span
                          key={p}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-primary text-sm font-medium text-white"
                        >
                          {p}
                        </span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p)}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          {p}
                        </button>
                      )
                    )}
                    <button
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
          <div className="p-16 text-center">
            <div className="flex flex-col items-center">
              <i className="fas fa-question-circle text-4xl text-gray-300 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">FAQ가 없습니다</h3>
              <p className="text-sm text-gray-500 mb-4">새로운 FAQ를 등록해보세요.</p>
              <Link
                to="/admin/faq/new"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                <i className="fas fa-plus mr-2"></i>
                FAQ 등록
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 카테고리 모달 */}
      {categoryModalOpen && (
        <CategoryModal
          onClose={() => setCategoryModalOpen(false)}
          onCategoryChanged={() => {
            fetchCategories();
            fetchList();
          }}
        />
      )}
    </div>
  );
}

function AddCategoryForm({ onCreated }) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (order < 1) return alert('순서는 1 이상이어야 합니다.');
    setSubmitting(true);
    try {
      await apiClient.post('/admin/faq-categories', { name, order, is_active: true });
      setName('');
      setOrder(1);
      onCreated?.();
    } catch (e) {
      alert(e.response?.data?.detail || '카테고리 추가 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mb-6 bg-gray-50 p-4 rounded-lg">
      <h4 className="text-sm font-bold text-gray-900 mb-3">새 카테고리 추가</h4>
      <form onSubmit={submit} className="flex gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder="카테고리명"
          maxLength={50}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <input
          value={order}
          onChange={(e) => setOrder(Number(e.target.value))}
          type="number"
          placeholder="순서"
          min={1}
          className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? '추가 중...' : '추가'}
        </button>
      </form>
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
        위에 있는 것부터 먼저 표시됩니다 (순서가 빠름)
      </div>
    </div>
  );
}

function CategoryModal({ onClose, onCategoryChanged }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">FAQ 카테고리 관리</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times w-6 h-6"></i>
          </button>
        </div>
        <div className="p-6">
          {/* 새 카테고리 추가 */}
          <AddCategoryForm onCreated={onCategoryChanged} />
          {/* 카테고리 목록 - key를 사용하여 모달이 열릴 때마다 재마운트 */}
          <CategoryList key={Date.now()} onChanged={onCategoryChanged} />
        </div>
      </div>
    </div>
  );
}

function CategoryList({ onChanged }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/faq-categories');
      // API가 배열을 직접 반환
      setItems(Array.isArray(res.data) ? res.data : (res.data?.categories || []));
    } catch (e) {
      console.error('카테고리 목록 로드 실패:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const edit = async (id, name, order, is_active) => {
    const newName = prompt('카테고리명:', name);
    if (!newName) return;
    const newOrderStr = prompt('순서:', String(order));
    if (newOrderStr === null) return;
    const newOrder = parseInt(newOrderStr, 10);
    if (Number.isNaN(newOrder) || newOrder < 1) return alert('순서는 1 이상이어야 합니다.');
    try {
      await apiClient.put(`/admin/faq-categories/${id}`, {
        name: newName,
        order: newOrder,
        is_active,
      });
      await load();
      onChanged?.();
    } catch (e) {
      alert(e.response?.data?.detail || '카테고리 수정 중 오류가 발생했습니다.');
    }
  };

  const remove = async (id) => {
    if (!confirm('정말 이 카테고리를 삭제하시겠습니까?')) return;
    try {
      await apiClient.delete(`/admin/faq-categories/${id}`);
      await load();
      onChanged?.();
    } catch (e) {
      alert(e.response?.data?.detail || '카테고리 삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">로딩 중...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>등록된 카테고리가 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      {items.map((cat) => (
        <div key={cat.id} className="flex items-center justify-between py-3 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-900">{cat.name}</span>
            {cat.is_active ? (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                활성
              </span>
            ) : (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                비활성
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => edit(cat.id, cat.name, cat.order, cat.is_active)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              수정
            </button>
            <button onClick={() => remove(cat.id)} className="text-red-600 hover:text-red-800 text-sm">
              삭제
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}












