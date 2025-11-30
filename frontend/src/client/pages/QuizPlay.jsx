import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';

const MODE_OPTIONS = [
  { value: 'random', label: '랜덤 퀴즈' },
  { value: 'bundle', label: '테마형 퀴즈' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: '전체 분야' },
  { value: 'ALL', label: '전체' },
  { value: 'PRE_MODERN_HISTORY', label: '전근대사' },
  { value: 'MODERN_HISTORY', label: '근현대사' },
];

const DIFFICULTY_OPTIONS = [
  { value: '', label: '전체 난이도' },
  { value: 'BASIC', label: '기초' },
  { value: 'STANDARD', label: '보통' },
  { value: 'ADVANCED', label: '심화' },
];

const QUIZ_TYPE_LABEL = {
  MULTIPLE: '객관식',
  SHORT: '주관식',
};

const CATEGORY_LABEL = CATEGORY_OPTIONS.reduce((acc, cur) => {
  if (cur.value) acc[cur.value] = cur.label;
  return acc;
}, {});

const DIFFICULTY_LABEL = DIFFICULTY_OPTIONS.reduce((acc, cur) => {
  if (cur.value) acc[cur.value] = cur.label;
  return acc;
}, {});

const MODE_DESCRIPTION = {
  random:
    '원하는 주제와 난이도를 고르고 다양한 문제를 랜덤으로 풀어보세요. 정답 여부는 자동으로 기록됩니다.',
  bundle:
    '분야와 난이도별로 큐레이션된 테마형을 선택해 풀 수 있어요. 모든 문제를 풀면 요약 리포트를 제공합니다.',
};

const BUNDLE_PAGE_SIZE = 9;

const buildQuestion = (raw) => {
  const questionId = raw.question_id ?? raw.id;
  const bundleItemId = raw.id ?? questionId;

  return {
    id: questionId,
    question_id: questionId,
    bundle_item_id: bundleItemId,
    question_text: raw.question_text,
    type: raw.type,
    choices: (raw.choices || []).map((choice) => ({
      id: choice.id,
      content: choice.content,
    })),
    explanation: raw.explanation ?? null,
    category: raw.category ?? null,
    difficulty: raw.difficulty ?? null,
    order: raw.order ?? 0,
    topics: (raw.topics || []).map((topic) => ({
      id: topic.id,
      name: topic.name,
      description: topic.description ?? '',
    })),
    image_url: raw.image_url ?? null,
  };
};

export default function QuizPlay() {
  const navigate = useNavigate();

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '퀴즈 플레이 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  const [mode, setMode] = useState('random');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);

  const [question, setQuestion] = useState(null);
  const [questionContext, setQuestionContext] = useState({ mode: 'random', bundleId: null, index: 0 });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [validationMessage, setValidationMessage] = useState(null);

  const [bundleList, setBundleList] = useState([]);
  const [bundlePagination, setBundlePagination] = useState({ page: 1, total_pages: 1, total: 0 });
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleError, setBundleError] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [bundleQuestions, setBundleQuestions] = useState([]);
  const [bundleResults, setBundleResults] = useState({});
  const [bundleCompleted, setBundleCompleted] = useState(false);
  const [bundleSummaryExpanded, setBundleSummaryExpanded] = useState({});

  const isBundleMode = mode === 'bundle';
  const isMultipleChoice = useMemo(
    () => (question?.type || '').toUpperCase() === 'MULTIPLE',
    [question?.type]
  );
  const hasSubmitted = Boolean(result);

  const resetQuestionStates = useCallback(() => {
    setQuestion(null);
    setResult(null);
    setAnswer('');
    setValidationMessage(null);
    setFetchError(null);
    setQuestionContext((prev) => ({ mode: prev.mode, bundleId: prev.bundleId, index: 0 }));
  }, []);

  const loadRandomQuestion = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    setResult(null);
    setAnswer('');
    setValidationMessage(null);

    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (topicFilter) params.topicId = topicFilter;

      const { data } = await apiClient.get('/quiz/random', { params });
      setQuestion(buildQuestion(data));
      setQuestionContext({ mode: 'random', bundleId: null, index: 0 });
    } catch (error) {
      const status = error.response?.status;
      if (status === 404) {
        setFetchError(error.response?.data?.detail || '현재 출제된 문제가 없습니다.');
      } else {
        setFetchError('문제를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, difficultyFilter, topicFilter, navigate]);

  const loadBundleList = useCallback(
    async (page = 1) => {
      setBundleLoading(true);
      setBundleError(null);

      try {
        const params = {
          page,
          limit: BUNDLE_PAGE_SIZE,
        };
        if (categoryFilter) params.category = categoryFilter;
        if (difficultyFilter) params.difficulty = difficultyFilter;

        const { data } = await apiClient.get('/quiz/bundles', { params });
        setBundleList(data.items || []);
        setBundlePagination(data.pagination || { page, total_pages: 1, total: 0 });
      } catch (error) {
        const status = error.response?.status;
        if (status === 401) {
          navigate('/login-required');
          return;
        }
        setBundleError('테마형 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        setBundleList([]);
      } finally {
        setBundleLoading(false);
      }
    },
    [categoryFilter, difficultyFilter, navigate]
  );

  const saveBundleProgress = useCallback(
    async (
      bundleId,
      totalQuestions,
      questionResults,
      completedFlag,
      lastQuestionId = null,
      lastQuestionOrder = null,
      inProgressOverride = null,
    ) => {
      const correctAnswers = Object.values(questionResults).filter((item) => item?.is_correct).length;

      if (!totalQuestions) {
        return;
      }

      try {
        const { data } = await apiClient.post(`/quiz/bundles/${bundleId}/progress`, {
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          completed: completedFlag,
          last_question_id: lastQuestionId,
          last_question_order: lastQuestionOrder,
          in_progress: inProgressOverride ?? !completedFlag,
        });

        setSelectedBundle((prev) =>
          prev && prev.id === bundleId ? { ...prev, user_progress: data } : prev
        );
        setBundleList((prev) =>
          prev.map((bundle) =>
            bundle.id === bundleId ? { ...bundle, user_progress: data } : bundle
          )
        );
      } catch (error) {
      console.error('테마형 진행 상황을 저장하지 못했습니다.', error);
      }
    },
    [setBundleList]
  );

  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const { data } = await apiClient.get('/quiz/topics');
      setTopics(data.items || []);
    } catch (error) {
      console.error('주제 목록을 불러오지 못했습니다.', error);
      setTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const handleModeChange = (nextMode) => {
    if (mode === nextMode) return;

    if (mode === 'bundle' && selectedBundle) {
      setSelectedBundle(null);
      setBundleQuestions([]);
      setBundleResults({});
      setBundleCompleted(false);
      resetQuestionStates();
    }

    setMode(nextMode);
    if (nextMode === 'random') {
      setQuestionContext({ mode: 'random', bundleId: null, index: 0 });
    }
  };

  const handleChoiceSelect = (choiceId) => {
    if (hasSubmitted) return;
    setAnswer(choiceId.toString());
    setValidationMessage(null);
  };

  const handleAnswerChange = (value) => {
    if (hasSubmitted) return;
    setAnswer(value);
    setValidationMessage(null);
  };
  
    const handleSubmit = async () => {
    if (hasSubmitted) return;
    if (!question) return;

    if (!answer || !answer.trim()) {
      setValidationMessage(isMultipleChoice ? '보기를 선택해주세요.' : '정답을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setValidationMessage(null);

    try {
      const payload = {
        question_id: question.id,
        user_answer: answer.trim(),
      };

      if (questionContext.mode === 'bundle' && selectedBundle) {
        payload.bundle_id = selectedBundle.id;
      }

      const { data } = await apiClient.post('/quiz/submit', payload);

      const submissionResult = {
        ...data,
        user_answer: answer.trim(),
        solved_at: new Date().toISOString(),
      };
      setResult(submissionResult);

      if (questionContext.mode === 'bundle' && selectedBundle) {
        const nextResults = {
          ...bundleResults,
          [question.id]: submissionResult,
        };
        setBundleResults(nextResults);

        const totalQuestions = bundleQuestions.length || selectedBundle.question_count || Object.keys(nextResults).length;
        const isCompleted = totalQuestions > 0 && Object.keys(nextResults).length >= totalQuestions;
        const currentOrder = bundleQuestions[questionContext.index]?.order ?? questionContext.index;

        saveBundleProgress(
          selectedBundle.id,
          totalQuestions,
          nextResults,
          isCompleted,
          question.id,
          currentOrder,
          isCompleted ? false : null,
        );

        if (isCompleted) {
          setBundleCompleted(true);
        }
      }
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        if (questionContext.mode === 'bundle') {
          navigate('/login-required');
        }
        return;
      }
      setValidationMessage('정답을 제출하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const moveToBundleQuestion = useCallback(
    (targetIndex) => {
      if (!selectedBundle) return;
      const nextQuestion = bundleQuestions[targetIndex];
      if (!nextQuestion) {
        setQuestion(null);
        setResult(null);
        setAnswer('');
        return;
      }

      const storedResult = bundleResults[nextQuestion.id];

      setQuestion(nextQuestion);
      setQuestionContext({ mode: 'bundle', bundleId: selectedBundle.id, index: targetIndex });
      setResult(storedResult || null);
      setAnswer(storedResult?.user_answer ?? '');
      setValidationMessage(null);
    },
    [bundleQuestions, bundleResults, selectedBundle],
  );

  const advanceBundleQuestion = useCallback(() => {
    if (!selectedBundle || !bundleQuestions.length) {
      return;
    }

    const unsolvedIndices = bundleQuestions
      .map((questionItem, idx) => (!bundleResults[questionItem.id] ? idx : null))
      .filter((idx) => idx !== null);

    if (!unsolvedIndices.length) {
      setBundleCompleted(true);
      setQuestion(null);
      setResult(null);
      setAnswer('');
      const lastSolvedQuestion = bundleQuestions[questionContext.index] || bundleQuestions[bundleQuestions.length - 1];
      if (lastSolvedQuestion) {
        saveBundleProgress(
          selectedBundle.id,
          bundleQuestions.length,
          bundleResults,
          true,
          lastSolvedQuestion.id,
          lastSolvedQuestion.order,
          false,
        );
      }
      return;
    }

    const currentIndex = questionContext.index ?? 0;
    const nextIndex = unsolvedIndices.find((idx) => idx > currentIndex) ?? unsolvedIndices[0];
    moveToBundleQuestion(nextIndex);
  }, [bundleQuestions, bundleResults, moveToBundleQuestion, questionContext.index, saveBundleProgress, selectedBundle]);

  const handleNextQuestion = () => {
    if (questionContext.mode === 'bundle') {
      advanceBundleQuestion();
    } else if (!loading) {
      loadRandomQuestion();
    }
  };

  const handleKeyDown = (event) => {
    if (hasSubmitted) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectBundle = async (bundleId) => {
    setBundleLoading(true);
    setBundleError(null);
    resetQuestionStates();
    setBundleCompleted(false);
    setBundleResults({});

    try {
      const { data } = await apiClient.get(`/quiz/bundles/${bundleId}`);
      const normalizedQuestions = (data.questions || []).map(buildQuestion);

      const serverResults = {};
      (data.question_progress || []).forEach((progress) => {
        serverResults[progress.question_id] = {
          is_correct: progress.is_correct,
          correct_answer: progress.correct_answer,
          explanation: progress.explanation,
          user_answer: progress.user_answer,
          solved_at: progress.solved_at,
        };
      });

      const totalQuestions = normalizedQuestions.length;
      const solvedCount = Object.keys(serverResults).length;
      const completedFromServer = data.user_progress?.completed ?? false;
      const allSolved = totalQuestions > 0 && solvedCount >= totalQuestions;
      const completed = completedFromServer || allSolved;

      setSelectedBundle(data);
      setBundleQuestions(normalizedQuestions);
      setBundleResults(serverResults);
      setBundleCompleted(completed);

      if (totalQuestions === 0) {
        setQuestion(null);
        setQuestionContext({ mode: 'bundle', bundleId: data.id, index: 0 });
        return;
      }

      if (completed) {
        setQuestion(null);
        setResult(null);
        setAnswer('');
        setQuestionContext({ mode: 'bundle', bundleId: data.id, index: 0 });
        return;
      }

      const firstUnsolvedIndex = normalizedQuestions.findIndex((questionItem) => !serverResults[questionItem.id]);
      let startIndex = firstUnsolvedIndex !== -1 ? firstUnsolvedIndex : 0;

      if (firstUnsolvedIndex === -1 && data.user_progress?.last_question_order !== undefined) {
        const byOrderIndex = normalizedQuestions.findIndex(
          (questionItem) => questionItem.order === data.user_progress.last_question_order,
        );
        if (byOrderIndex !== -1) {
          startIndex = byOrderIndex;
        }
      }

      const startQuestion = normalizedQuestions[startIndex];
      const existingResult = serverResults[startQuestion.id];

      setQuestion(startQuestion);
      setQuestionContext({ mode: 'bundle', bundleId: data.id, index: startIndex });
      setResult(existingResult || null);
      setAnswer(existingResult?.user_answer ?? '');
      setValidationMessage(null);

      saveBundleProgress(
        data.id,
        totalQuestions,
        serverResults,
        false,
        startQuestion.id,
        startQuestion.order,
        true,
      );
    } catch (error) {
      const status = error.response?.status;
      if (status === 401) {
        navigate('/login-required');
        return;
      }
      setBundleError('테마형을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
      setSelectedBundle(null);
      setBundleQuestions([]);
    } finally {
      setBundleLoading(false);
    }
  };

  const handleExitBundle = () => {
    if (selectedBundle && questionContext.mode === 'bundle') {
      const currentQuestion = bundleQuestions[questionContext.index] || bundleQuestions[0];
      const totalQuestions = bundleQuestions.length || selectedBundle.question_count || Object.keys(bundleResults).length;
      saveBundleProgress(
        selectedBundle.id,
        totalQuestions,
        bundleResults,
        bundleCompleted,
        currentQuestion?.id ?? null,
        currentQuestion?.order ?? null,
        bundleCompleted ? false : true,
      );
    }

    setSelectedBundle(null);
    setBundleQuestions([]);
    setBundleResults({});
    setBundleCompleted(false);
    setBundleSummaryExpanded({});
    setQuestionContext({ mode: 'bundle', bundleId: null, index: 0 });
    resetQuestionStates();
  };

  const handleRetryBundle = async () => {
    if (!selectedBundle) return;
    setBundleLoading(true);
    try {
      await apiClient.delete(`/quiz/bundles/${selectedBundle.id}/progress`);
      setBundleResults({});
      setBundleCompleted(false);
      setBundleSummaryExpanded({});
      await handleSelectBundle(selectedBundle.id);
    } catch (error) {
      console.error('테마형 진행 기록을 초기화하지 못했습니다.', error);
      setBundleError('테마형 진행 기록을 초기화하지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setBundleLoading(false);
    }
  };

  const toggleBundleSummaryItem = useCallback((questionId) => {
    setBundleSummaryExpanded((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  }, []);

  useEffect(() => {
    if (mode === 'random') {
      loadRandomQuestion();
    }
  }, [mode, loadRandomQuestion]);

  useEffect(() => {
    if (mode === 'bundle') {
      loadBundleList(1);
    }
  }, [mode, loadBundleList]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    if (!topicFilter) return;
    if (!topics.length) return;
    const exists = topics.some((topic) => String(topic.id) === String(topicFilter));
    if (!exists) {
      setTopicFilter('');
    }
  }, [topics, topicFilter]);

  useEffect(() => {
    if (selectedBundle) {
      setBundleSummaryExpanded({});
    }
  }, [selectedBundle?.id]);

  const randomFilters = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={difficultyFilter}
        onChange={(event) => setDifficultyFilter(event.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {DIFFICULTY_OPTIONS.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={topicFilter}
        onChange={(event) => setTopicFilter(event.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={topicsLoading && topics.length === 0}
      >
        <option value="">전체 주제</option>
        {topics.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.name}
          </option>
        ))}
      </select>
    </div>
  );

  const bundleFilters = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <select
        value={categoryFilter}
        onChange={(event) => setCategoryFilter(event.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {CATEGORY_OPTIONS.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        value={difficultyFilter}
        onChange={(event) => setDifficultyFilter(event.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {DIFFICULTY_OPTIONS.map((option) => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => loadBundleList(1)}
        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        필터 적용
      </button>
    </div>
  );

  const renderBundleList = () => {
    if (bundleLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-6 text-sm font-medium text-gray-600">테마형을 불러오는 중입니다...</p>
        </div>
      );
    }

    if (bundleError) {
      return (
        <div className="py-16 text-center">
              <h2 className="text-lg font-semibold text-gray-900">테마형을 불러올 수 없습니다</h2>
          <p className="mt-3 text-sm text-gray-600">{bundleError}</p>
          <button
            type="button"
            onClick={() => loadBundleList(bundlePagination.page)}
            className="mt-6 inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            다시 시도
          </button>
        </div>
      );
    }

    if (!bundleList.length) {
      return (
        <div className="py-16 text-center text-sm text-gray-500">
          조건에 맞는 테마형이 없습니다. 필터를 변경해보세요.
        </div>
      );
    }
  
    return (
      <>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {bundleList.map((bundle) => (
            <div
              key={bundle.id}
              className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-blue-600">
                  <span>{bundle.category ? CATEGORY_LABEL[bundle.category] : '혼합 분야'}</span>
                  <span>{bundle.difficulty ? DIFFICULTY_LABEL[bundle.difficulty] : '혼합 난이도'}</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">{bundle.title}</h3>
                {bundle.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-3">{bundle.description}</p>
                )}
                {bundle.user_progress && (
                  <div className="mt-3 flex items-center justify-between text-xs font-semibold">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${
                        bundle.user_progress.completed
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <i
                        className={`fas ${
                          bundle.user_progress.completed ? 'fa-check-circle' : 'fa-play-circle'
                        } text-[11px]`}
                      />
                      {bundle.user_progress.completed ? '완료됨' : '진행 중'}
                    </span>
                    <span className="text-gray-500">
                      정답 {bundle.user_progress.correct_answers ?? 0}/
                      {bundle.user_progress.total_questions || bundle.question_count}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>문제 {bundle.question_count}개</span>
                <button
                  type="button"
                  onClick={() => handleSelectBundle(bundle.id)}
                  className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  시작하기
                </button>
              </div>
            </div>
          ))}
        </div>

        {bundlePagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => loadBundleList(bundlePagination.page - 1)}
              disabled={bundlePagination.page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              이전
            </button>
            <span className="text-sm text-gray-500">
              {bundlePagination.page} / {bundlePagination.total_pages}
            </span>
              <button
              type="button"
              onClick={() => loadBundleList(bundlePagination.page + 1)}
              disabled={bundlePagination.page >= bundlePagination.total_pages}
              className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              다음
            </button>
          </div>
        )}
      </>
    );
  };

  const renderBundleSummary = () => {
    const total = bundleQuestions.length;
    const solved = Object.keys(bundleResults).length;
    const correct = Object.values(bundleResults).filter((res) => res.is_correct).length;

    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-10 shadow-sm">
        <h2 className="text-2xl font-bold text-emerald-700">{selectedBundle?.title || '테마형'} 완료!</h2>
        <p className="mt-2 text-sm text-emerald-800">
          총 {total}문제 중 {solved}문제를 풀었으며, 그 중 {correct}문제를 맞췄어요.
        </p>

        <div className="mt-6 space-y-4">
          {bundleQuestions.map((bundleQuestion, index) => {
            const resultInfo = bundleResults[bundleQuestion.id];
            const isExpanded = Boolean(bundleSummaryExpanded[bundleQuestion.id]);
            const statusLabel = resultInfo ? (resultInfo.is_correct ? '정답' : '오답') : '미풀이';
            const statusClass = resultInfo
              ? resultInfo.is_correct
                ? 'text-emerald-600'
                : 'text-rose-500'
              : 'text-gray-400';

            return (
              <div
                key={bundleQuestion.id}
                className="rounded-xl border border-white/80 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {index + 1}. {bundleQuestion.question_text}
                    </p>
                    {bundleQuestion.image_url && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        <img
                          src={bundleQuestion.image_url}
                          alt="문제 이미지"
                          className="max-h-[240px] w-full object-contain"
                        />
                      </div>
                    )}
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                        {QUIZ_TYPE_LABEL[bundleQuestion.type] || '퀴즈'}
                      </span>
                      {bundleQuestion.category && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                          {CATEGORY_LABEL[bundleQuestion.category] || bundleQuestion.category}
                        </span>
                      )}
                      {bundleQuestion.difficulty && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                          {DIFFICULTY_LABEL[bundleQuestion.difficulty] || bundleQuestion.difficulty}
                        </span>
                      )}
                      {(bundleQuestion.topics || []).map((topic) => (
                        <span
                          key={topic.id}
                          className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-600"
                        >
                          {topic.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${statusClass}`}>{statusLabel}</span>
                    {resultInfo && (
                      <button
                        type="button"
                        onClick={() => toggleBundleSummaryItem(bundleQuestion.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {isExpanded ? '접기' : '자세히 보기'}
                      </button>
                    )}
                  </div>
                </div>
                {resultInfo && isExpanded && (
                  <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <p className="font-semibold text-gray-900">
                      정답: <span className="font-normal text-gray-700">{resultInfo.correct_answer || '-'}</span>
                    </p>
                    <p className="mt-1 text-gray-700">
                      내 답안: <span className="font-semibold text-gray-800">{resultInfo.user_answer ?? '-'}</span>
                    </p>
                    {resultInfo.explanation && (
                      <div className="mt-3">
                        <p className="font-semibold text-gray-900">해설</p>
                        <p className="mt-1 whitespace-pre-line leading-relaxed text-gray-700">
                          {resultInfo.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handleExitBundle}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            목록으로 돌아가기
          </button>
          <button
            type="button"
            onClick={handleRetryBundle}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            다시 풀기
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
              한국사 퀴즈
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {MODE_OPTIONS.map((option) => {
                const active = option.value === mode;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleModeChange(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      active
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-white text-gray-600 shadow-sm hover:bg-blue-50'
                    }`}
                  >
                    {option.label}
              </button>
                );
              })}
            </div>
            <p className="mt-4 max-w-3xl text-sm text-gray-600">{MODE_DESCRIPTION[mode]}</p>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm font-semibold text-gray-800">필터 선택</div>
            {isBundleMode ? bundleFilters : randomFilters}
          </div>
        </div>

        {isBundleMode ? (
          <>
            {!selectedBundle && renderBundleList()}

            {selectedBundle && bundleCompleted && renderBundleSummary()}

            {selectedBundle && !bundleCompleted && question && (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-600">테마형 퀴즈</p>
                    <h2 className="text-xl font-bold text-gray-900">{selectedBundle.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>
                        분야:{' '}
                        {question.category ? CATEGORY_LABEL[question.category] || question.category : '혼합'}
                      </span>
                      <span>
                        난이도:{' '}
                        {question.difficulty
                          ? DIFFICULTY_LABEL[question.difficulty] || question.difficulty
                          : '혼합'}
                      </span>
                      <span>
                        진행도: {Object.keys(bundleResults).length} / {bundleQuestions.length}
                      </span>
                      {question.topics?.length ? (
                        <span className="inline-flex items-center gap-1 text-purple-600">
                          <span className="font-medium text-purple-600">주제:</span>
                          {question.topics.map((topic) => (
                            <span
                              key={topic.id}
                              className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-600"
                            >
                              {topic.name}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-gray-400">주제: 없음</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExitBundle}
                    className="rounded-lg border border-gray-200 px-3 py-1 text-xs text-gray-500 transition hover:bg-gray-50"
                  >
                    테마형 목록으로
                  </button>
                </div>

                <div className="px-6 py-8 sm:px-10 sm:py-10">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">
                        {QUIZ_TYPE_LABEL[question.type] || '퀴즈'}
                        {questionContext.mode === 'bundle' && hasSubmitted && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            이미 풀이
                          </span>
                        )}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-gray-900">{question.question_text}</h3>
                    </div>
                  </div>

                  {question.image_url && (
                    <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                      <img
                        src={question.image_url}
                        alt="문제 이미지"
                        className="max-h-[320px] w-full object-contain"
                      />
                    </div>
                  )}

                  {isMultipleChoice ? (
                    <div className="mt-8 space-y-3">
                      {question.choices?.length ? (
                        question.choices.map((choice, index) => {
                          const isSelected = answer === choice.id.toString();
                          return (
                            <button
                              key={choice.id}
                              type="button"
                              onClick={() => handleChoiceSelect(choice.id)}
                              className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                  : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                              } ${hasSubmitted ? 'cursor-not-allowed opacity-70' : ''}`}
                              disabled={hasSubmitted}
                            >
                              <span className="text-sm font-semibold text-gray-900">
                                {String.fromCharCode(65 + index)}.
                              </span>{' '}
                              <span className="text-sm text-gray-800">{choice.content}</span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm text-yellow-800">
                          이 문제는 보기 정보가 없습니다. 다음 문제로 넘어가주세요.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-8">
                      <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="quiz-bundle-answer">
                        정답을 입력해주세요
                      </label>
                      <input
                        id="quiz-bundle-answer"
                        type="text"
                        value={answer}
                        onChange={(event) => handleAnswerChange(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="예: 독립협회"
                        className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoComplete="off"
                        disabled={hasSubmitted}
                      />
                    </div>
                  )}

                  {validationMessage && (
                    <p className="mt-4 text-sm font-medium text-red-500">{validationMessage}</p>
                  )}

                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-gray-400">
                      정답 제출 후 자동으로 기록되며, 테마형 완료 시 요약 리포트를 제공합니다.
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                        disabled={
                          hasSubmitted || submitting || (isMultipleChoice && !question.choices?.length)
                        }
                      >
                        {submitting ? '채점 중...' : '정답 제출'}
                      </button>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        다음 문제
                      </button>
                    </div>
                  </div>

                  {questionContext.mode !== 'bundle' && result && (
                    <div
                      className={`mt-10 rounded-2xl border px-6 py-6 ${
                        result.is_correct
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-rose-200 bg-rose-50'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p
                            className={`text-lg font-semibold ${
                              result.is_correct ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            {result.is_correct ? '정답입니다!' : '아쉽네요. 다음에는 맞출 수 있어요.'}
                          </p>
                          {!result.is_correct && (
                            <p className="mt-1 text-sm text-gray-700">
                              정답은 <span className="font-semibold">{result.correct_answer}</span> 입니다.
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          다음 문제
                        </button>
                      </div>
                      {result.explanation && (
                        <div className="mt-5 rounded-xl border border-white/60 bg-white/80 px-4 py-4 text-sm text-gray-700 shadow-sm">
                          <p className="font-semibold text-gray-900">해설</p>
                          <p className="mt-2 whitespace-pre-line leading-relaxed text-gray-700">
                            {result.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                <p className="mt-6 text-sm font-medium text-gray-600">문제를 불러오는 중입니다...</p>
              </div>
            ) : fetchError ? (
              <div className="px-8 py-16 text-center">
                <h2 className="text-lg font-semibold text-gray-900">문제를 불러올 수 없습니다</h2>
                <p className="mt-3 text-sm text-gray-600">{fetchError}</p>
              </div>
            ) : question ? (
              <div className="px-6 py-8 sm:px-10 sm:py-12">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-600">
                      {QUIZ_TYPE_LABEL[question.type] || '퀴즈'}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
                      {question.question_text}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>
                        분야:{' '}
                        {question.category ? CATEGORY_LABEL[question.category] || question.category : '혼합'}
                      </span>
                      <span>
                        난이도:{' '}
                        {question.difficulty
                          ? DIFFICULTY_LABEL[question.difficulty] || question.difficulty
                          : '혼합'}
                      </span>
                      {question.topics?.length ? (
                        <span className="inline-flex items-center gap-1 text-purple-600">
                          <span className="font-medium text-purple-600">주제:</span>
                          {question.topics.map((topic) => (
                            <span
                              key={topic.id}
                              className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-600"
                            >
                              {topic.name}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="text-gray-400">주제: 없음</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    disabled={loading}
                  >
                    다른 문제 받기
                  </button>
                </div>

                {question.image_url && (
                  <div className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                    <img
                      src={question.image_url}
                      alt="문제 이미지"
                      className="max-h-[320px] w-full object-contain"
                    />
                  </div>
                )}

                {isMultipleChoice ? (
                  <div className="mt-8 space-y-3">
                    {question.choices?.length ? (
                      question.choices.map((choice, index) => {
                        const isSelected = answer === choice.id.toString();
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => handleChoiceSelect(choice.id)}
                            className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                            } ${hasSubmitted ? 'cursor-not-allowed opacity-70' : ''}`}
                            disabled={hasSubmitted}
                          >
                            <span className="text-sm font-semibold text-gray-900">
                              {String.fromCharCode(65 + index)}.
                            </span>{' '}
                            <span className="text-sm text-gray-800">{choice.content}</span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-4 text-sm text-yellow-800">
                        이 문제는 보기 정보가 없습니다. 다른 문제를 불러와 주세요.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-8">
                    <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="quiz-answer">
                      정답을 입력해주세요
                    </label>
          <input
                      id="quiz-answer"
            type="text"
            value={answer}
                      onChange={(event) => handleAnswerChange(event.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="예: 독립협회"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoComplete="off"
                      disabled={hasSubmitted}
                    />
                  </div>
                )}

                {validationMessage && (
                  <p className="mt-4 text-sm font-medium text-red-500">{validationMessage}</p>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-gray-400">
                    정답 제출 후 해설과 정답을 확인할 수 있습니다.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
                      type="button"
          onClick={handleSubmit}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
                      disabled={
                        hasSubmitted || submitting || (isMultipleChoice && !question.choices?.length)
                      }
                    >
                      {submitting ? '채점 중...' : '정답 제출'}
                    </button>
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      disabled={loading}
                    >
                      다음 문제
                    </button>
                  </div>
                </div>

                {result && (
                  <div
                    className={`mt-10 rounded-2xl border px-6 py-6 ${
                      result.is_correct
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-rose-200 bg-rose-50'
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p
                          className={`text-lg font-semibold ${
                            result.is_correct ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {result.is_correct ? '정답입니다!' : '아쉽네요. 다음에는 맞출 수 있어요.'}
                        </p>
                        {!result.is_correct && (
                          <p className="mt-1 text-sm text-gray-700">
                            정답은 <span className="font-semibold">{result.correct_answer}</span> 입니다.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        새로운 문제 풀기
        </button>
                    </div>
                    {result.explanation && (
                      <div className="mt-5 rounded-xl border border-white/60 bg-white/80 px-4 py-4 text-sm text-gray-700 shadow-sm">
                        <p className="font-semibold text-gray-900">해설</p>
                        <p className="mt-2 whitespace-pre-line leading-relaxed text-gray-700">
                          {result.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
      </div>
    );
  }
  