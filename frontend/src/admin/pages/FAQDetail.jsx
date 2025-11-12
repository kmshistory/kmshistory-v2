import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function FAQDetail() {
  const { faqId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [faq, setFaq] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (faqId) {
      fetchFAQ();
    } else {
      setError('FAQ ID가 없습니다.');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqId]);

  const fetchFAQ = async () => {
    if (!faqId) {
      setError('FAQ ID가 없습니다.');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/admin/faq/${faqId}`);
      setFaq(res.data);
      setLoading(false);
    } catch (e) {
      console.error('FAQ 상세 조회 실패:', e);
      setError(e.response?.data?.detail || 'FAQ를 불러오는 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '-';
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${da} ${hh}:${mm}`;
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
          <Link to="/admin/faq" className="mt-4 inline-block px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700">
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  if (!faq) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ 상세보기</h1>
          <p className="mt-1 text-sm text-gray-500">FAQ 정보를 확인하세요</p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/admin/faq"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            목록으로
          </Link>
          <Link
            to={`/admin/faq/${faqId}/edit`}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            수정하기
          </Link>
        </div>
      </div>

      {/* FAQ 상세 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 space-y-6">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              카테고리
            </label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              {faq.category_name ? (
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {faq.category_name}
                </span>
              ) : (
                <span className="text-gray-400">카테고리 없음</span>
              )}
            </div>
          </div>

          {/* 질문 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              질문
            </label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
              {faq.question}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {faq.question?.length || 0}/300자
            </div>
          </div>

          {/* 답변 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              답변
            </label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg min-h-[200px] whitespace-pre-wrap">
              {faq.answer}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              {faq.answer?.length || 0}자
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
            <label className="block text-sm font-medium text-gray-900 mb-2">
              공개 상태
            </label>
            <div className="flex items-center">
              {faq.is_active ? (
                <>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                    공개
                  </span>
                  <span className="ml-2 text-sm text-gray-600">클라이언트에서 볼 수 있습니다.</span>
                </>
              ) : (
                <>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    비공개
                  </span>
                  <span className="ml-2 text-sm text-gray-600">클라이언트에서 볼 수 없습니다.</span>
                </>
              )}
            </div>
          </div>

          {/* 메타 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                FAQ ID
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                {faq.id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                조회수
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                {faq.views || 0}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                생성일
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                {formatDate(faq.created_at)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                수정일
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                {formatDate(faq.updated_at)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












