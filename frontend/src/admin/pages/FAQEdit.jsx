import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function FAQEdit() {
  const { faqId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [categoryId, setCategoryId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingFAQ, setLoadingFAQ] = useState(true);

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = 'FAQ 수정 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  useEffect(() => {
    fetchCategories();
    if (faqId) {
      fetchFAQ();
    } else {
      setLoadingFAQ(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchFAQ = async () => {
    if (!faqId) {
      setLoadingFAQ(false);
      return;
    }
    
    try {
      const res = await apiClient.get(`/admin/faq/${faqId}`);
      const faq = res.data;
      setQuestion(faq.question || '');
      setAnswer(faq.answer || '');
      setCategoryId(faq.category_id?.toString() || '');
      setIsActive(faq.is_active ?? true);
      setOrder(faq.order || 0);
      setLoadingFAQ(false);
    } catch (e) {
      console.error('FAQ 조회 실패:', e);
      alert(e.response?.data?.detail || 'FAQ를 불러오는 중 오류가 발생했습니다.');
      navigate('/admin/faq');
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get('/admin/faq-categories');
      setCategories(Array.isArray(res.data) ? res.data : (res.data?.categories || []));
    } catch (e) {
      console.error('카테고리 조회 실패:', e);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      alert('질문을 입력해주세요.');
      return;
    }
    
    if (!answer.trim()) {
      alert('답변을 입력해주세요.');
      return;
    }
    
    if (question.length > 300) {
      alert('질문은 300자 이하로 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(`/admin/faq/${faqId}`, {
        question: question.trim(),
        answer: answer.trim(),
        category_id: categoryId ? Number(categoryId) : null,
        order: order,
        is_active: isActive,
      });
      alert('FAQ가 수정되었습니다!');
      navigate(`/admin/faq/${faqId}`);
    } catch (e) {
      alert(e.response?.data?.detail || 'FAQ 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingFAQ) {
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
          <h1 className="text-2xl font-bold text-gray-900">FAQ 수정</h1>
          <p className="mt-1 text-sm text-gray-500">FAQ를 수정하세요</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/faq"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            목록으로
          </Link>
        </div>
      </div>

      {/* FAQ 수정 폼 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={onSubmit} className="p-6 space-y-6">
          {/* 카테고리 선택 */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-900 mb-2">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              id="category_id"
              name="category_id"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">카테고리를 선택하세요</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 질문 */}
          <div>
            <label htmlFor="question" className="block text-sm font-medium text-gray-900 mb-2">
              질문 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="question"
              name="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
              maxLength={300}
              placeholder="질문을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="mt-1 text-sm text-gray-500">
              <span>{question.length}</span>/300자
            </div>
          </div>

          {/* 답변 */}
          <div>
            <label htmlFor="answer" className="block text-sm font-medium text-gray-900 mb-2">
              답변 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="answer"
              name="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              required
              rows={8}
              placeholder="답변을 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 resize-y"
            />
            <div className="mt-1 text-sm text-gray-500">
              <span>{answer.length}</span>자
            </div>
          </div>

          {/* 안내 메시지 */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-info-circle text-blue-500 mr-2"></i>
              <span className="text-sm text-blue-700">
                작성한 순서대로 표시됩니다 (먼저 작성한 것이 위에 표시)
              </span>
            </div>
          </div>

          {/* 공개 여부 */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-900">공개</span>
            </label>
            <div className="mt-1 text-sm text-gray-500">
              체크하면 클라이언트에서 볼 수 있습니다.
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Link
              to="/admin/faq"
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              취소
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? '수정 중...' : '수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}












