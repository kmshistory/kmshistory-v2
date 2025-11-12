import React, { useCallback, useEffect, useState } from 'react';
import apiClient from '../../shared/api/client';

const CATEGORY_LABELS = {
  KOREAN_HISTORY: '한국사',
  MODERN_HISTORY: '근현대사',
  WORLD_HISTORY: '세계사',
  GENERAL_HISTORY: '종합',
};

const DIFFICULTY_LABELS = {
  EASY: '기초',
  MEDIUM: '보통',
  HARD: '심화',
};

const categoryLabel = (value) => {
  if (!value) return '-';
  return CATEGORY_LABELS[value] || value;
};

const difficultyLabel = (value) => {
  if (!value) return '-';
  return DIFFICULTY_LABELS[value] || value;
};

const CATEGORY_SELECT_OPTIONS = [{ value: '', label: '전체' }].concat(
  Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
);

const DIFFICULTY_SELECT_OPTIONS = [{ value: '', label: '전체' }].concat(
  Object.entries(DIFFICULTY_LABELS).map(([value, label]) => ({ value, label })),
);

const QUESTION_PAGE_SIZE = 10;
const BUNDLE_PAGE_SIZE = 10;
const BUNDLE_USER_PAGE_SIZE = 10;

const formatPercent = (value) => {
  if (value === null || value === undefined) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(
    2,
    '0',
  )} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

function StatSection({ title, description, children, action }) {
  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4 gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
        </div>
        {action || null}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }) {
  return (
    <div className="py-10 flex flex-col items-center justify-center text-gray-400">
      <i className="fas fa-chart-line text-3xl mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="w-full flex items-center justify-center py-20">
      <div className="flex items-center gap-3 text-gray-500">
        <span className="loading loading-spinner loading-md" />
        <span>통계 데이터를 불러오는 중입니다...</span>
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="w-full flex flex-col items-center justify-center py-20 text-center text-red-500 space-y-4">
      <p className="font-medium">{error}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-red-200 text-sm text-red-600 hover:bg-red-50 transition"
        >
          <i className="fas fa-redo-alt" />
          다시 시도
        </button>
      ) : null}
    </div>
  );
}

const QuestionTable = ({ items }) => {
  if (!items?.length) {
    return <EmptyState message="집계된 문제 통계가 아직 없습니다." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">문제</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">카테고리</th>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">난이도</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">시도</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">정답</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">오답률</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.question_id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900 line-clamp-2">{item.question_text}</p>
                  {item.topics?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {item.topics.map((topic) => (
                        <span
                          key={topic.id}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700"
                        >
                          {topic.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-3 text-gray-600">{categoryLabel(item.category)}</td>
              <td className="px-4 py-3 text-gray-600">{difficultyLabel(item.difficulty)}</td>
              <td className="px-4 py-3 text-right text-gray-700">{item.total_attempts.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-gray-700">{item.correct_count.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-red-500 font-semibold">
                {formatPercent(1 - item.accuracy)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BundleTable = ({ items }) => {
  if (!items?.length) {
    return <EmptyState message="테마형 통계가 아직 없습니다." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-gray-600">테마형</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">참여 인원</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">완료</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">진행 중</th>
            <th className="px-4 py-3 text-right font-semibold text-gray-600">평균 정답률</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map((item) => (
            <tr key={item.bundle_id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <p className="font-medium text-gray-900">{item.title}</p>
              </td>
              <td className="px-4 py-3 text-right text-gray-700">{item.total_users.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-emerald-600 font-semibold">
                {item.completed_users.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-indigo-600 font-semibold">
                {item.in_progress_users.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-gray-900 font-semibold">
                {formatPercent(item.average_accuracy)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const BundleUserTable = ({ items }) => {
  if (!items?.length) {
    return <EmptyState message="테마형별 사용자 통계가 아직 없습니다." />;
  }

  return (
    <div className="space-y-4">
      {items.map((bundle) => (
        <div key={bundle.bundle_id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
          <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">{bundle.bundle_title}</h3>
            <span className="text-xs text-gray-500">표시된 사용자 {bundle.users.length}명</span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-white">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">사용자</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">풀이 수</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">정답 수</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600">정답률</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-600">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {bundle.users.map((user) => (
                  <tr key={`${bundle.bundle_id}-${user.user_id}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{user.nickname}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{user.attempts.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{user.correct_answers.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-900 font-semibold">{formatPercent(user.accuracy)}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.completed
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        {user.completed ? '완료' : '진행 중'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
      <button
        type="button"
        onClick={handlePrev}
        className="btn btn-sm btn-ghost"
        disabled={currentPage === 1}
      >
        이전
      </button>
      <span className="font-medium">
        {currentPage} / {totalPages}
      </span>
      <button
        type="button"
        onClick={handleNext}
        className="btn btn-sm btn-ghost"
        disabled={currentPage === totalPages}
      >
        다음
      </button>
    </div>
  );
}

export default function QuizStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState(null);
  const [topicOptions, setTopicOptions] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [questionPage, setQuestionPage] = useState(1);
  const [bundlePage, setBundlePage] = useState(1);
  const [bundleUserPage, setBundleUserPage] = useState(1);
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('');
  const [questionTopicFilter, setQuestionTopicFilter] = useState('');
  const [bundleCategoryFilter, setBundleCategoryFilter] = useState('');
  const [bundleDifficultyFilter, setBundleDifficultyFilter] = useState('');

  useEffect(() => {
    const fetchTopics = async () => {
      setTopicsLoading(true);
      try {
        const response = await apiClient.get('/admin/quiz/topics');
        const items = response.data?.items ?? response.data ?? [];
        setTopicOptions(items);
      } catch (err) {
        console.error('주제 목록 조회 실패:', err);
        setTopicOptions([]);
      } finally {
        setTopicsLoading(false);
      }
    };

    fetchTopics();
  }, []);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        question_limit: QUESTION_PAGE_SIZE,
        question_page: questionPage,
        bundle_limit: BUNDLE_PAGE_SIZE,
        bundle_page: bundlePage,
        bundle_user_limit: 5,
        bundle_user_page: bundleUserPage,
      };
      if (questionCategoryFilter) params.question_category = questionCategoryFilter;
      if (questionDifficultyFilter) params.question_difficulty = questionDifficultyFilter;
      if (questionTopicFilter) params.question_topic_id = Number(questionTopicFilter);
      if (bundleCategoryFilter) params.bundle_category = bundleCategoryFilter;
      if (bundleDifficultyFilter) params.bundle_difficulty = bundleDifficultyFilter;

      const response = await apiClient.get('/admin/quiz/stats', { params });
      setStats(response.data?.data ?? null);
    } catch (err) {
      console.error('퀴즈 통계 조회 실패:', err);
      const message = err.response?.data?.detail || '통계 데이터를 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [
    questionCategoryFilter,
    questionDifficultyFilter,
    questionTopicFilter,
    bundleCategoryFilter,
    bundleDifficultyFilter,
    questionPage,
    bundlePage,
    bundleUserPage,
  ]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    if (!stats) return;

    const questionTotalPages = Math.max(
      1,
      Math.ceil((stats.question_total ?? 0) / QUESTION_PAGE_SIZE),
    );
    if (questionPage > questionTotalPages) {
      setQuestionPage(questionTotalPages);
    }

    const bundleTotalPages = Math.max(1, Math.ceil((stats.bundle_total ?? 0) / BUNDLE_PAGE_SIZE));
    if (bundlePage > bundleTotalPages) {
      setBundlePage(bundleTotalPages);
    }

    const bundleUserTotalPages = Math.max(
      1,
      Math.ceil((stats.bundle_user_total ?? 0) / BUNDLE_USER_PAGE_SIZE),
    );
    if (bundleUserPage > bundleUserTotalPages) {
      setBundleUserPage(bundleUserTotalPages);
    }
  }, [stats, questionPage, bundlePage, bundleUserPage]);

  const handleResetQuestionFilters = () => {
    setQuestionCategoryFilter('');
    setQuestionDifficultyFilter('');
    setQuestionTopicFilter('');
    setQuestionPage(1);
  };

  const handleResetBundleFilters = () => {
    setBundleCategoryFilter('');
    setBundleDifficultyFilter('');
    setBundlePage(1);
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={loadStats} />;
  }

  if (!stats) {
    return <EmptyState message="표시할 통계 데이터가 없습니다." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">퀴즈 통계 대시보드</h1>
            <button
              type="button"
              onClick={loadStats}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition"
            >
              <i className="fas fa-sync-alt" />
              새로 고침
            </button>
          </div>
          <p className="text-sm text-gray-500">
            최근 집계 기준: {formatDateTime(stats.generated_at)} • 문제/테마형/사용자 관점에서 학습 현황을 한눈에 확인하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <StatSection
            title="오답률이 높은 문제 TOP"
            description="정답률이 낮은 순으로 최대 10건까지 표시됩니다."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="select select-sm select-bordered"
                  value={questionCategoryFilter}
                  onChange={(event) => {
                    setQuestionCategoryFilter(event.target.value);
                    setQuestionPage(1);
                  }}
                >
                  {CATEGORY_SELECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-sm select-bordered"
                  value={questionDifficultyFilter}
                  onChange={(event) => {
                    setQuestionDifficultyFilter(event.target.value);
                    setQuestionPage(1);
                  }}
                >
                  {DIFFICULTY_SELECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-sm select-bordered"
                  value={questionTopicFilter}
                  onChange={(event) => {
                    setQuestionTopicFilter(event.target.value);
                    setQuestionPage(1);
                  }}
                  disabled={topicsLoading}
                >
                  <option value="">전체 주제</option>
                  {topicOptions.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleResetQuestionFilters}
                  className="btn btn-sm btn-ghost"
                >
                  초기화
                </button>
              </div>
            }
          >
            <QuestionTable items={stats.top_incorrect_questions} />
            <Pagination
              currentPage={questionPage}
              totalPages={Math.max(
                1,
                Math.ceil((stats.question_total ?? 0) / QUESTION_PAGE_SIZE),
              )}
              onPageChange={setQuestionPage}
            />
          </StatSection>

          <StatSection
            title="테마형 진행 현황"
            description="사용자들이 풀이한 테마형의 참여 인원과 평균 정답률입니다."
            action={
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="select select-sm select-bordered"
                  value={bundleCategoryFilter}
                  onChange={(event) => {
                    setBundleCategoryFilter(event.target.value);
                    setBundlePage(1);
                  }}
                >
                  {CATEGORY_SELECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-sm select-bordered"
                  value={bundleDifficultyFilter}
                  onChange={(event) => {
                    setBundleDifficultyFilter(event.target.value);
                    setBundlePage(1);
                  }}
                >
                  {DIFFICULTY_SELECT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleResetBundleFilters}
                  className="btn btn-sm btn-ghost"
                >
                  초기화
                </button>
              </div>
            }
          >
            <BundleTable items={stats.bundle_performance} />
            <Pagination
              currentPage={bundlePage}
              totalPages={Math.max(1, Math.ceil((stats.bundle_total ?? 0) / BUNDLE_PAGE_SIZE))}
              onPageChange={setBundlePage}
            />
          </StatSection>

          <StatSection
            title="테마형별 사용자 성적 현황"
            description="각 테마형별로 상위 사용자들의 진행 상황과 성적을 확인할 수 있습니다."
          >
            <BundleUserTable items={stats.bundle_user_performance} />
            <Pagination
              currentPage={bundleUserPage}
              totalPages={Math.max(
                1,
                Math.ceil((stats.bundle_user_total ?? 0) / BUNDLE_USER_PAGE_SIZE),
              )}
              onPageChange={setBundleUserPage}
            />
          </StatSection>
        </div>
      </div>
    </div>
  );
}

