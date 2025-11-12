import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import apiClient from '../../shared/api/client';

const QUIZ_TYPES = [
  { value: 'MULTIPLE', label: '객관식' },
  { value: 'SHORT', label: '주관식' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: '전체 분야' },
  { value: 'KOREAN_HISTORY', label: '한국사' },
  { value: 'MODERN_HISTORY', label: '근현대사' },
  { value: 'WORLD_HISTORY', label: '세계사' },
  { value: 'GENERAL_HISTORY', label: '종합' },
];

const DIFFICULTY_OPTIONS = [
  { value: '', label: '전체 난이도' },
  { value: 'EASY', label: '기초' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HARD', label: '심화' },
];

const DEFAULT_CATEGORY = 'GENERAL_HISTORY';
const DEFAULT_DIFFICULTY = 'MEDIUM';
const MAX_IMAGE_SIZE_MB = 5;

const typeLabel = (value) => QUIZ_TYPES.find((item) => item.value === value)?.label || value;
const categoryLabel = (value) => CATEGORY_OPTIONS.find((item) => item.value === value)?.label || value;
const difficultyLabel = (value) => DIFFICULTY_OPTIONS.find((item) => item.value === value)?.label || value;

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const createEmptyChoice = (isCorrect = false) => ({
  id: null,
  content: '',
  is_correct: isCorrect,
});

const createEmptyQuestion = () => ({
  id: null,
  question_text: '',
  type: 'MULTIPLE',
  correct_answer: '',
  explanation: '',
  category: DEFAULT_CATEGORY,
  difficulty: DEFAULT_DIFFICULTY,
  choices: [createEmptyChoice(true), createEmptyChoice(false)],
  topic_ids: [],
  image_url: '',
});

const createEmptyBundle = () => ({
  id: null,
  title: '',
  description: '',
  category: '',
  difficulty: '',
  is_active: true,
  question_ids: [],
});

function BundleQuestionManagerModal({
  open,
  onClose,
  onApply,
  questionOptions,
  questionOptionsLoading,
  selectedQuestionIds,
}) {
  const PAGE_SIZE = 10;
  const [workingQuestionIds, setWorkingQuestionIds] = useState(selectedQuestionIds || []);
  const [questionSearch, setQuestionSearch] = useState('');
  const [questionTypeFilter, setQuestionTypeFilter] = useState('');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('');
  const [questionTopicFilter, setQuestionTopicFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [checkedQuestionIds, setCheckedQuestionIds] = useState([]);

  useEffect(() => {
    if (open) {
      setWorkingQuestionIds(selectedQuestionIds || []);
      setQuestionSearch('');
      setQuestionTypeFilter('');
      setQuestionCategoryFilter('');
      setQuestionDifficultyFilter('');
      setCurrentPage(1);
      setCheckedQuestionIds([]);
    }
  }, [open, selectedQuestionIds]);

  const filteredQuestionOptions = useMemo(() => {
    const searchKeyword = questionSearch.trim().toLowerCase();
    return questionOptions.filter((question) => {
      if (questionTypeFilter && question.type !== questionTypeFilter) return false;
      if (questionCategoryFilter && question.category !== questionCategoryFilter) return false;
      if (questionDifficultyFilter && question.difficulty !== questionDifficultyFilter) return false;
      if (searchKeyword && !question.question_text.toLowerCase().includes(searchKeyword)) return false;
      return true;
    });
  }, [questionOptions, questionTypeFilter, questionCategoryFilter, questionDifficultyFilter, questionSearch]);

  const selectedQuestions = useMemo(
    () => workingQuestionIds.map((id) => questionOptions.find((q) => q.id === id)).filter(Boolean),
    [workingQuestionIds, questionOptions],
  );

  const availableQuestions = useMemo(
    () => filteredQuestionOptions.filter((q) => !workingQuestionIds.includes(q.id)),
    [filteredQuestionOptions, workingQuestionIds],
  );

  const totalAvailablePages = Math.max(1, Math.ceil(availableQuestions.length / PAGE_SIZE));

  const paginatedAvailableQuestions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return availableQuestions.slice(start, start + PAGE_SIZE);
  }, [availableQuestions, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [questionSearch, questionTypeFilter, questionCategoryFilter, questionDifficultyFilter]);

  useEffect(() => {
    if (currentPage > totalAvailablePages) {
      setCurrentPage(totalAvailablePages);
    }
  }, [currentPage, totalAvailablePages]);

  useEffect(() => {
    setCheckedQuestionIds((prev) =>
      prev.filter((id) => availableQuestions.some((question) => question.id === id)),
    );
  }, [availableQuestions]);

  const handleToggleCheck = (id) => {
    setCheckedQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((questionId) => questionId !== id) : [...prev, id],
    );
  };

  const handleToggleAllCurrentPage = () => {
    const pageIds = paginatedAvailableQuestions.map((question) => question.id);
    const allChecked = pageIds.every((id) => checkedQuestionIds.includes(id));
    if (allChecked) {
      setCheckedQuestionIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setCheckedQuestionIds((prev) => {
        const next = [...prev];
        pageIds.forEach((id) => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleAddCheckedQuestions = () => {
    if (!checkedQuestionIds.length) return;
    setWorkingQuestionIds((prev) => {
      const next = [...prev];
      checkedQuestionIds.forEach((id) => {
        if (!next.includes(id)) {
          next.push(id);
        }
      });
      return next;
    });
    setCheckedQuestionIds([]);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalAvailablePages, prev + 1));
  };

  const allCurrentPageChecked =
    paginatedAvailableQuestions.length > 0 &&
    paginatedAvailableQuestions.every((question) => checkedQuestionIds.includes(question.id));

  const handleRemoveQuestion = (id) => {
    setWorkingQuestionIds((prev) => prev.filter((questionId) => questionId !== id));
  };

  const handleMoveQuestion = (id, direction) => {
    setWorkingQuestionIds((prev) => {
      const currentIndex = prev.findIndex((questionId) => questionId === id);
      if (currentIndex === -1) return prev;
      const nextIndex = currentIndex + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const newOrder = [...prev];
      const [removed] = newOrder.splice(currentIndex, 1);
      newOrder.splice(nextIndex, 0, removed);
      return newOrder;
    });
  };

  const handleApply = () => {
    onApply(workingQuestionIds);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900 bg-opacity-60 px-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">문제 선택 및 순서 편집</h2>
          <button
            type="button"
            className="text-gray-400 transition hover:text-gray-600"
            onClick={onClose}
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="grid h-[80vh] max-h-[80vh] gap-6 overflow-hidden px-6 py-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                선택된 문제 ({selectedQuestions.length}개)
              </h3>
              <span className="text-xs text-gray-500">위/아래 버튼으로 순서를 조정할 수 있습니다.</span>
            </div>
            <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-2">
              {selectedQuestions.length === 0 && (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                  추가한 문제가 없습니다. 오른쪽 목록에서 추가해주세요.
                </div>
              )}
              {selectedQuestions.map((question, index) => (
                <div
                  key={question.id}
                  className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {index + 1}. {question.question_text}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                        {typeLabel(question.type)}
                      </span>
                      {question.category && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                          {categoryLabel(question.category)}
                        </span>
                      )}
                      {question.difficulty && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                          {difficultyLabel(question.difficulty)}
                        </span>
                      )}
                      {(question.topics || []).map((topic) => (
                        <span
                          key={topic.id}
                          className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-600"
                        >
                          #{topic.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(question.id, -1)}
                      disabled={index === 0}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveQuestion(question.id, 1)}
                      disabled={index === selectedQuestions.length - 1}
                      className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
                    >
                      제거
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">문제 목록</h3>
              <span className="text-xs text-gray-500">필터와 검색으로 원하는 문제를 찾아 추가하세요.</span>
            </div>
            <div className="mt-3 flex flex-1 flex-col rounded-lg border border-gray-200 bg-gray-50 p-4">
              {questionOptionsLoading ? (
                <div className="py-8 text-center text-sm text-gray-500">문제 목록을 불러오는 중입니다...</div>
              ) : (
                <>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={questionSearch}
                      onChange={(event) => setQuestionSearch(event.target.value)}
                      placeholder="문제 내용 검색"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <select
                        value={questionTypeFilter}
                        onChange={(event) => setQuestionTypeFilter(event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">전체 유형</option>
                        {QUIZ_TYPES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={questionCategoryFilter}
                        onChange={(event) => setQuestionCategoryFilter(event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.value || 'all'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={questionDifficultyFilter}
                        onChange={(event) => setQuestionDifficultyFilter(event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <option key={option.value || 'all'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          onChange={handleToggleAllCurrentPage}
                          checked={allCurrentPageChecked}
                          disabled={!paginatedAvailableQuestions.length}
                        />
                        현재 페이지 전체 선택
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          선택된 문제 {checkedQuestionIds.length}개
                        </span>
                        <button
                          type="button"
                          onClick={handleAddCheckedQuestions}
                          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                          disabled={!checkedQuestionIds.length}
                        >
                          선택 문제 추가
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 divide-y divide-gray-200 overflow-y-auto">
                      {paginatedAvailableQuestions.length ? (
                        paginatedAvailableQuestions.map((question) => {
                          const isChecked = checkedQuestionIds.includes(question.id);
                          return (
                            <label
                              key={question.id}
                              className="flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={isChecked}
                                onChange={() => handleToggleCheck(question.id)}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {question.question_text}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                                    {typeLabel(question.type)}
                                  </span>
                                  {question.category && (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                      {categoryLabel(question.category)}
                                    </span>
                                  )}
                                  {question.difficulty && (
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                      {difficultyLabel(question.difficulty)}
                                    </span>
                                  )}
                          {(question.topics || []).map((topic) => (
                            <span
                              key={topic.id}
                              className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-600"
                            >
                              #{topic.name}
                            </span>
                          ))}
                                </div>
                              </div>
                            </label>
                          );
                        })
                      ) : (
                        <div className="px-4 py-10 text-center text-sm text-gray-500">
                          조건에 해당하는 문제가 없습니다. 필터를 조정하거나 새로운 문제를 추가해주세요.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={currentPage <= 1}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      이전
                    </button>
                    <span className="text-xs text-gray-500">
                      {currentPage} / {totalAvailablePages}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalAvailablePages}
                      className="rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      다음
                    </button>
                  </div>

                  <p className="mt-4 text-xs text-gray-500">
                    ※ 문제 목록은 최대 500개의 최신 문제만 표시됩니다. 추가 문제가 필요하면 문제 관리 탭에서 등록 후 다시 시도해주세요.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            onClick={handleApply}
            disabled={questionOptionsLoading}
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
}

function TopicManagerModal({
  open,
  onClose,
  topics,
  loading,
  onCreateTopic,
  onUpdateTopic,
  onDeleteTopic,
}) {
  const [errorMessage, setErrorMessage] = useState('');
  const [newTopic, setNewTopic] = useState({ name: '', description: '' });
  const [submittingNew, setSubmittingNew] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [processingTopicId, setProcessingTopicId] = useState(null);

  useEffect(() => {
    if (open) {
      setErrorMessage('');
      setNewTopic({ name: '', description: '' });
      setSubmittingNew(false);
      setEditingTopicId(null);
      setEditForm({ name: '', description: '' });
      setProcessingTopicId(null);
    }
  }, [open]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!newTopic.name.trim()) {
      setErrorMessage('주제 이름을 입력해주세요.');
      return;
    }
    setSubmittingNew(true);
    setErrorMessage('');
    try {
      await onCreateTopic({
        name: newTopic.name.trim(),
        description: newTopic.description.trim(),
      });
      setNewTopic({ name: '', description: '' });
    } catch (err) {
      setErrorMessage(err?.message || '주제를 추가하지 못했습니다.');
    } finally {
      setSubmittingNew(false);
    }
  };

  const handleStartEdit = (topic) => {
    setEditingTopicId(topic.id);
    setEditForm({
      name: topic.name,
      description: topic.description || '',
    });
    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    setEditingTopicId(null);
    setEditForm({ name: '', description: '' });
    setProcessingTopicId(null);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (editingTopicId === null) return;
    if (!editForm.name.trim()) {
      setErrorMessage('주제 이름을 입력해주세요.');
      return;
    }
    setProcessingTopicId(editingTopicId);
    setErrorMessage('');
    try {
      await onUpdateTopic(editingTopicId, {
        name: editForm.name.trim(),
        description: editForm.description.trim(),
      });
      handleCancelEdit();
    } catch (err) {
      setErrorMessage(err?.message || '주제를 수정하지 못했습니다.');
    } finally {
      setProcessingTopicId(null);
    }
  };

  const handleDelete = async (topicId) => {
    if (!window.confirm('선택한 주제를 삭제하시겠습니까? 연결된 문제의 태그도 함께 제거됩니다.')) return;
    setProcessingTopicId(topicId);
    setErrorMessage('');
    try {
      await onDeleteTopic(topicId);
      if (editingTopicId === topicId) {
        handleCancelEdit();
      }
    } catch (err) {
      setErrorMessage(err?.message || '주제를 삭제하지 못했습니다.');
    } finally {
      setProcessingTopicId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900 bg-opacity-60 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">주제(태그) 관리</h2>
          <button
            type="button"
            className="text-gray-400 transition hover:text-gray-600"
            onClick={onClose}
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <div className="grid max-h-[70vh] gap-6 overflow-hidden px-6 py-6 lg:grid-cols-[0.9fr,1.1fr]">
          <div className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 px-4 py-4">
            <h3 className="text-sm font-semibold text-gray-800">새 주제 추가</h3>
            <form onSubmit={handleCreate} className="mt-3 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">주제 이름</label>
                <input
                  type="text"
                  value={newTopic.name}
                  onChange={(event) => setNewTopic((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="예: 정치, 문화, 경제"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">설명 (선택)</label>
                <textarea
                  value={newTopic.description}
                  onChange={(event) =>
                    setNewTopic((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={2}
                  placeholder="주제에 대한 간단한 설명을 입력하세요."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                disabled={submittingNew || !newTopic.name.trim()}
              >
                {submittingNew ? '추가 중...' : '주제 추가'}
              </button>
            </form>
          </div>

          <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200">
            <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">등록된 주제 목록</h3>
              {loading && (
                <span className="text-xs text-gray-500">불러오는 중...</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {!topics.length && !loading ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-sm text-gray-500">
                  등록된 주제가 없습니다. 왼쪽 폼을 사용해 주제를 추가해주세요.
                </div>
              ) : (
                <div className="space-y-3">
                  {topics.map((topic) => {
                    const isEditing = editingTopicId === topic.id;
                    const isProcessing = processingTopicId === topic.id;
                    return (
                      <div
                        key={topic.id}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
                      >
                        {isEditing ? (
                          <form onSubmit={handleUpdate} className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">주제 이름</label>
                                <input
                                  type="text"
                                  value={editForm.name}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({ ...prev, name: event.target.value }))
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">설명</label>
                                <input
                                  type="text"
                                  value={editForm.description}
                                  onChange={(event) =>
                                    setEditForm((prev) => ({
                                      ...prev,
                                      description: event.target.value,
                                    }))
                                  }
                                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                                disabled={isProcessing}
                              >
                                취소
                              </button>
                              <button
                                type="submit"
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                                disabled={isProcessing || !editForm.name.trim()}
                              >
                                {isProcessing ? '저장 중...' : '저장'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{topic.name}</p>
                              {topic.description && (
                                <p className="text-xs text-gray-500">{topic.description}</p>
                              )}
                              <p className="mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                                ID: {topic.id}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(topic)}
                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(topic.id)}
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-50"
                                disabled={isProcessing}
                              >
                                {isProcessing ? '삭제 중...' : '삭제'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {(errorMessage || loading) && (
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
            {errorMessage ? (
              <p className="text-xs text-red-500">{errorMessage}</p>
            ) : (
              <p className="text-xs text-gray-500">주제 정보를 불러오는 중입니다...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialData,
  title,
  errorMessage,
  topicOptions,
  topicLoading,
  onOpenTopicManager,
}) {
  const [formData, setFormData] = useState(createEmptyQuestion());
  const [formErrors, setFormErrors] = useState({});
  const fileInputRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (open) {
      const baseData = initialData || createEmptyQuestion();
      setFormData((prev) => ({
        ...prev,
        ...baseData,
        topic_ids: baseData.topic_ids || [],
      }));
      setFormErrors({});
      setImageError('');
      setImageUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [initialData, open]);

  useEffect(() => {
    if (!open) return;
    if (!topicOptions.length) return;
    setFormData((prev) => ({
      ...prev,
      topic_ids: (prev.topic_ids || []).filter((id) =>
        topicOptions.some((topic) => topic.id === id),
      ),
    }));
  }, [topicOptions, open]);

  const validate = (data) => {
    const errors = {};
    if (!data.question_text.trim()) {
      errors.question_text = '문제 내용을 입력해주세요.';
    }
    if (!data.correct_answer.trim()) {
      errors.correct_answer = '정답을 입력해주세요.';
    }
    if (data.type === 'MULTIPLE') {
      const validChoices = data.choices.filter((choice) => choice.content.trim());
      if (validChoices.length < 2) {
        errors.choices = '객관식 문제는 최소 2개의 보기가 필요합니다.';
      }
      const hasCorrect = data.choices.some(
        (choice) => choice.is_correct && choice.content.trim(),
      );
      if (!hasCorrect) {
        errors.choices = '정답으로 지정된 보기를 하나 이상 선택해주세요.';
      }
    }
    return errors;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (event) => {
    const nextType = event.target.value;
    if (nextType === 'MULTIPLE' && formData.type !== 'MULTIPLE') {
      handleChange('choices', [createEmptyChoice(true), createEmptyChoice(false)]);
    }
    if (nextType === 'SHORT') {
      handleChange('choices', []);
    }
    handleChange('type', nextType);
  };

  const handleChoiceChange = (index, field, value) => {
    setFormData((prev) => {
      const choices = [...(prev.choices || [])];
      choices[index] = { ...choices[index], [field]: value };
      return { ...prev, choices };
    });
  };

  const handleSetCorrectChoice = (index) => {
    setFormData((prev) => {
      const choices = (prev.choices || []).map((choice, idx) => ({
        ...choice,
        is_correct: idx === index,
      }));
      return { ...prev, choices };
    });
  };

  const handleAddChoice = () => {
    setFormData((prev) => ({
      ...prev,
      choices: [...(prev.choices || []), createEmptyChoice(false)],
    }));
  };

  const handleRemoveChoice = (index) => {
    setFormData((prev) => {
      const next = [...(prev.choices || [])];
      next.splice(index, 1);
      return { ...prev, choices: next };
    });
  };

  const handleToggleTopic = (topicId) => {
    setFormData((prev) => {
      const current = prev.topic_ids || [];
      const exists = current.includes(topicId);
      if (exists) {
        return { ...prev, topic_ids: current.filter((id) => id !== topicId) };
      }
      return { ...prev, topic_ids: [...current, topicId] };
    });
  };

  const handleSelectImage = () => {
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: '' }));
    setImageError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setImageError(`이미지 크기는 최대 ${MAX_IMAGE_SIZE_MB}MB까지 업로드할 수 있습니다.`);
      event.target.value = '';
      return;
    }

    setImageUploading(true);
    setImageError('');

    try {
      const form = new FormData();
      form.append('file', file);
      const response = await apiClient.post('/admin/quiz/questions/upload-image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const imageUrl = response.data?.url;
      if (!imageUrl) {
        throw new Error('업로드 결과를 확인할 수 없습니다.');
      }
      setFormData((prev) => ({ ...prev, image_url: imageUrl }));
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        '이미지 업로드 중 오류가 발생했습니다.';
      setImageError(message);
    } finally {
      setImageUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const errors = validate(formData);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload = {
      question_text: formData.question_text.trim(),
      type: formData.type,
      correct_answer: formData.correct_answer.trim(),
      explanation: formData.explanation?.trim() || '',
      category: formData.category,
      difficulty: formData.difficulty,
      topic_ids: formData.topic_ids || [],
      image_url: formData.image_url ? formData.image_url : null,
      choices:
        formData.type === 'MULTIPLE'
          ? (formData.choices || [])
              .filter((choice) => choice.content.trim())
              .map((choice) => ({
                id: choice.id ?? undefined,
                content: choice.content.trim(),
                is_correct: !!choice.is_correct,
              }))
          : [],
    };

    onSubmit(payload);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            className="text-gray-400 transition hover:text-gray-600"
            onClick={onClose}
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">문제 유형</label>
                <select
                  value={formData.type}
                  onChange={handleTypeChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {QUIZ_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">분야</label>
                <select
                  value={formData.category}
                  onChange={(event) => handleChange('category', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORY_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">난이도</label>
                <select
                  value={formData.difficulty}
                  onChange={(event) => handleChange('difficulty', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DIFFICULTY_OPTIONS.filter((option) => option.value).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">주제 태그</label>
                <button
                  type="button"
                  onClick={onOpenTopicManager}
                  className="text-xs font-semibold text-blue-600 transition hover:text-blue-700"
                >
                  카테고리 관리
                </button>
              </div>
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                {topicLoading ? (
                  <div className="py-6 text-center text-sm text-gray-500">주제 목록을 불러오는 중입니다...</div>
                ) : topicOptions.length === 0 ? (
                  <div className="py-4 text-center text-sm text-gray-500">
                    아직 등록된 주제가 없습니다. 상단 버튼을 눌러 주제를 추가해주세요.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {topicOptions.map((topic) => {
                      const selected = (formData.topic_ids || []).includes(topic.id);
                      return (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => handleToggleTopic(topic.id)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                            selected
                              ? 'border-blue-500 bg-blue-50 text-blue-600 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-600'
                          }`}
                        >
                          <span>{topic.name}</span>
                          {selected && <i className="fas fa-check text-[10px]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                {(formData.topic_ids || []).length > 0 && (
                  <p className="mt-3 text-xs text-gray-500">
                    선택된 주제: {(formData.topic_ids || []).length}개
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">문제 이미지 (선택)</label>
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                {formData.image_url ? (
                  <div className="space-y-3">
                    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                      <img
                        src={formData.image_url}
                        alt="문제 이미지 미리보기"
                        className="max-h-64 w-full object-contain"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleSelectImage}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={imageUploading || loading}
                      >
                        {imageUploading ? '업로드 중...' : '이미지 변경'}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                        disabled={imageUploading || loading}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                      <i className="fas fa-image text-2xl text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700">이미지를 추가하여 문제를 더욱 생동감 있게 만들어보세요.</p>
                      <p className="mt-1 text-xs text-gray-500">JPG, PNG, GIF, WEBP / 최대 {MAX_IMAGE_SIZE_MB}MB</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleSelectImage}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={imageUploading || loading}
                    >
                      {imageUploading ? '업로드 중...' : '이미지 업로드'}
                    </button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageFileChange}
                />
                {!formData.image_url && imageUploading && (
                  <p className="mt-3 text-xs text-blue-600">이미지를 업로드하는 중입니다...</p>
                )}
                {imageError && <p className="mt-2 text-xs text-red-500">{imageError}</p>}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">문제 내용</label>
              <textarea
                value={formData.question_text}
                onChange={(event) => handleChange('question_text', event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예) 다음 중 조선의 과거제도와 관련이 없는 것은?"
              />
              {formErrors.question_text && (
                <p className="mt-2 text-sm text-red-500">{formErrors.question_text}</p>
              )}
            </div>

            {formData.type === 'MULTIPLE' && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">보기 목록</label>
                  <button
                    type="button"
                    onClick={handleAddChoice}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <i className="fas fa-plus mr-2" />보기 추가
                  </button>
                </div>

                <div className="space-y-3">
                  {(formData.choices || []).map((choice, index) => (
                    <div
                      key={index}
                      className="flex flex-col rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                            choice.is_correct
                              ? 'border-blue-500 bg-blue-500 text-white'
                              : 'border-gray-300 bg-white text-gray-400'
                          }`}
                          onClick={() => handleSetCorrectChoice(index)}
                          title="정답으로 설정"
                        >
                          <i className="fas fa-check text-xs" />
                        </button>
                        <span className="text-sm font-semibold text-gray-600">
                          {String.fromCharCode(65 + index)}.
                        </span>
                      </div>

                      <input
                        type="text"
                        className="mt-3 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:mt-0"
                        value={choice.content}
                        onChange={(event) => handleChoiceChange(index, 'content', event.target.value)}
                        placeholder="보기 내용을 입력하세요"
                      />

                      <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            choice.is_correct
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {choice.is_correct ? '정답' : '오답'}
                        </span>
                        <button
                          type="button"
                          className="rounded-md px-2 py-1 text-xs text-red-500 transition hover:bg-red-50"
                          onClick={() => handleRemoveChoice(index)}
                          disabled={(formData.choices || []).length <= 2}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {formErrors.choices && (
                  <p className="mt-2 text-sm text-red-500">{formErrors.choices}</p>
                )}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">정답</label>
              <input
                type="text"
                value={formData.correct_answer}
                onChange={(event) => handleChange('correct_answer', event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예) 정답 보기의 내용 또는 주관식 정답"
              />
              {formErrors.correct_answer && (
                <p className="mt-2 text-sm text-red-500">{formErrors.correct_answer}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">해설 (선택)</label>
              <textarea
                value={formData.explanation || ''}
                onChange={(event) => handleChange('explanation', event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="정답과 관련된 해설을 입력해주세요 (선택 사항)"
              />
            </div>

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 py-6">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={loading}
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BundleFormModal({
  open,
  onClose,
  onSubmit,
  loading,
  initialData,
  title,
  errorMessage,
  questionOptions,
  questionOptionsLoading,
}) {
  const [formData, setFormData] = useState(createEmptyBundle());
  const [questionManagerOpen, setQuestionManagerOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        ...(initialData || createEmptyBundle()),
        question_ids: initialData?.question_ids || initialData?.questions?.map((q) => q.question_id) || [],
      }));
    }
  }, [initialData, open]);

  const selectedQuestions = useMemo(
    () => formData.question_ids.map((id) => questionOptions.find((q) => q.id === id)).filter(Boolean),
    [formData.question_ids, questionOptions],
  );

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleActive = () => {
    setFormData((prev) => ({ ...prev, is_active: !prev.is_active }));
  };

  const handleQuestionManagerApply = (nextQuestionIds) => {
    setFormData((prev) => ({ ...prev, question_ids: nextQuestionIds }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!formData.title.trim()) {
      alert('테마형 제목을 입력하세요.');
      return;
    }
    if (!formData.question_ids.length) {
      alert('테마형에 포함할 문제를 최소 1개 이상 선택해주세요.');
      return;
    }
    onSubmit({
      title: formData.title.trim(),
      description: formData.description?.trim() || '',
      category: formData.category || null,
      difficulty: formData.difficulty || null,
      is_active: formData.is_active,
      question_ids: formData.question_ids,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50 px-4">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            className="text-gray-400 transition hover:text-gray-600"
            onClick={onClose}
          >
            <i className="fas fa-times text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">테마형 제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(event) => handleChange('title', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="예) 근현대사 필수 20제"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">분야</label>
                <select
                  value={formData.category}
                  onChange={(event) => handleChange('category', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">난이도</label>
                <select
                  value={formData.difficulty}
                  onChange={(event) => handleChange('difficulty', event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="bundle-active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={handleToggleActive}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="bundle-active" className="text-sm font-medium text-gray-700">
                  공개 상태 유지
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">테마형 설명 (선택)</label>
              <textarea
                value={formData.description || ''}
                onChange={(event) => handleChange('description', event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="테마형에 대한 설명을 입력해주세요."
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800">선택된 문제 ({selectedQuestions.length}개)</h3>
                  <button
                    type="button"
                    onClick={() => setQuestionManagerOpen(true)}
                    className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
                  >
                    문제 선택 / 순서 편집
                  </button>
                </div>
                <div className="mt-3 space-y-3">
                  {selectedQuestions.length === 0 && (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                      추가한 문제가 없습니다. ‘문제 선택 / 순서 편집’ 버튼을 눌러 문제를 추가해주세요.
                    </div>
                  )}
                  {selectedQuestions.map((question, index) => (
                    <div
                      key={question.id}
                      className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm"
                    >
                      <p className="text-sm font-medium text-gray-900">
                        {index + 1}. {question.question_text}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                          {typeLabel(question.type)}
                        </span>
                        {question.category && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                            {categoryLabel(question.category)}
                          </span>
                        )}
                        {question.difficulty && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                            {difficultyLabel(question.difficulty)}
                          </span>
                        )}
                        {(question.topics || []).map((topic) => (
                          <span
                            key={topic.id}
                            className="rounded-full bg-purple-100 px-2 py-0.5 text-purple-600"
                          >
                            #{topic.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                문제 선택과 순서 편집은 별도의 모달에서 진행됩니다. 위 버튼을 눌러 문제를 선택해주세요.
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 py-6">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              onClick={onClose}
              disabled={loading}
            >
              취소
            </button>
            <button
              type="submit"
              className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={loading || questionOptionsLoading}
            >
              {loading ? '저장 중...' : '테마형 저장'}
            </button>
          </div>
        </form>
        <BundleQuestionManagerModal
          open={questionManagerOpen}
          onClose={() => setQuestionManagerOpen(false)}
          onApply={handleQuestionManagerApply}
          questionOptions={questionOptions}
          questionOptionsLoading={questionOptionsLoading}
          selectedQuestionIds={formData.question_ids}
        />
      </div>
    </div>
  );
}

export default function QuizManager() {
  const [activeTab, setActiveTab] = useState('questions');

  // Question state
  const [questions, setQuestions] = useState([]);
  const [questionLoading, setQuestionLoading] = useState(true);
  const [questionError, setQuestionError] = useState(null);
  const [questionPage, setQuestionPage] = useState(1);
  const [questionTotalPages, setQuestionTotalPages] = useState(1);
  const [questionTotal, setQuestionTotal] = useState(0);
  const questionLimit = 10;
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState('');
  const [questionTopicFilter, setQuestionTopicFilter] = useState('');

  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [questionModalTitle, setQuestionModalTitle] = useState('');
  const [questionModalPayload, setQuestionModalPayload] = useState(createEmptyQuestion());
  const [questionModalLoading, setQuestionModalLoading] = useState(false);
  const [questionModalError, setQuestionModalError] = useState('');

  const [questionDeleteTarget, setQuestionDeleteTarget] = useState(null);
  const [questionDeleteLoading, setQuestionDeleteLoading] = useState(false);

  // Topic state
  const [topics, setTopics] = useState([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [topicManagerOpen, setTopicManagerOpen] = useState(false);

  // Bundle state
  const [bundles, setBundles] = useState([]);
  const [bundleLoading, setBundleLoading] = useState(true);
  const [bundleError, setBundleError] = useState(null);
  const [bundlePage, setBundlePage] = useState(1);
  const [bundleTotalPages, setBundleTotalPages] = useState(1);
  const [bundleTotal, setBundleTotal] = useState(0);
  const bundleLimit = 9;
  const [bundleCategoryFilter, setBundleCategoryFilter] = useState('');
  const [bundleDifficultyFilter, setBundleDifficultyFilter] = useState('');

  const [bundleModalOpen, setBundleModalOpen] = useState(false);
  const [bundleModalTitle, setBundleModalTitle] = useState('');
  const [bundleModalData, setBundleModalData] = useState(createEmptyBundle());
  const [bundleModalLoading, setBundleModalLoading] = useState(false);
  const [bundleModalError, setBundleModalError] = useState('');

  const [bundleDeleteTarget, setBundleDeleteTarget] = useState(null);
  const [bundleDeleteLoading, setBundleDeleteLoading] = useState(false);

  const [questionOptions, setQuestionOptions] = useState([]);
  const [questionOptionsLoading, setQuestionOptionsLoading] = useState(false);

  const fetchTopics = useCallback(async () => {
    setTopicsLoading(true);
    try {
      const response = await apiClient.get('/admin/quiz/topics');
      const items = response.data?.items || [];
      setTopics(items);
    } catch (err) {
      console.error('주제 목록을 불러오지 못했습니다.', err);
      setTopics([]);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(
    async (override = {}) => {
      setQuestionLoading(true);
      setQuestionError(null);
      try {
        const topicFilter = override.topicFilter ?? questionTopicFilter;
        const response = await apiClient.get('/admin/quiz/questions', {
          params: {
            page: override.page ?? questionPage,
            limit: questionLimit,
            search: (override.search ?? searchText) || undefined,
            quiz_type: (override.typeFilter ?? typeFilter) || undefined,
            category: (override.categoryFilter ?? questionCategoryFilter) || undefined,
            difficulty: (override.difficultyFilter ?? questionDifficultyFilter) || undefined,
            topic_id: topicFilter || undefined,
          },
        });

        const data = response.data || {};
        setQuestions(data.items || []);
        setQuestionTotal(data.pagination?.total || 0);
        setQuestionTotalPages(data.pagination?.total_pages || 1);

        if (override.page) {
          setQuestionPage(override.page);
        }
      } catch (err) {
        const message =
          err.response?.data?.detail || err.response?.data?.message || '문제 목록을 불러오는 중 오류가 발생했습니다.';
        setQuestionError(message);
      } finally {
        setQuestionLoading(false);
      }
    },
    [questionPage, searchText, typeFilter, questionCategoryFilter, questionDifficultyFilter, questionTopicFilter],
  );

  const fetchBundles = useCallback(
    async (override = {}) => {
      setBundleLoading(true);
      setBundleError(null);
      try {
        const response = await apiClient.get('/admin/quiz/bundles', {
          params: {
            page: override.page ?? bundlePage,
            limit: bundleLimit,
            search: override.search || undefined,
            category: (override.categoryFilter ?? bundleCategoryFilter) || undefined,
            difficulty: (override.difficultyFilter ?? bundleDifficultyFilter) || undefined,
          },
        });

        const data = response.data || {};
        setBundles(data.items || []);
        setBundleTotal(data.pagination?.total || 0);
        setBundleTotalPages(data.pagination?.total_pages || 1);

        if (override.page) {
          setBundlePage(override.page);
        }
      } catch (err) {
        const message =
          err.response?.data?.detail || err.response?.data?.message || '테마형 목록을 불러오는 중 오류가 발생했습니다.';
        setBundleError(message);
      } finally {
        setBundleLoading(false);
      }
    },
    [bundlePage, bundleCategoryFilter, bundleDifficultyFilter],
  );

  const loadQuestionOptions = useCallback(async () => {
    setQuestionOptionsLoading(true);
    try {
      const limit = 100;
      let page = 1;
      let totalPages = 1;
      const collected = [];

      do {
        const response = await apiClient.get('/admin/quiz/questions', {
          params: {
            page,
            limit,
          },
        });
        const items = response.data?.items || [];
        collected.push(
          ...items.map((item) => ({
            id: item.id,
            question_text: item.question_text,
            type: item.type,
            category: item.category,
            difficulty: item.difficulty,
            topics: item.topics || [],
            image_url: item.image_url || '',
          })),
        );

        const pagination = response.data?.pagination;
        totalPages = pagination?.total_pages || 1;
        page += 1;
      } while (page <= totalPages);

      setQuestionOptions(collected);
    } catch (err) {
      console.error('문제 선택 옵션을 불러오지 못했습니다.', err);
      setQuestionOptions([]);
    } finally {
      setQuestionOptionsLoading(false);
    }
  }, []);

  const handleCreateTopic = useCallback(
    async (payload) => {
      try {
        await apiClient.post('/admin/quiz/topics', payload);
        await fetchTopics();
        await fetchQuestions();
      } catch (err) {
        const message =
          err?.response?.data?.detail || err?.response?.data?.message || '주제를 추가하지 못했습니다.';
        throw new Error(message);
      }
    },
    [fetchQuestions, fetchTopics],
  );

  const handleUpdateTopic = useCallback(
    async (topicId, payload) => {
      try {
        await apiClient.put(`/admin/quiz/topics/${topicId}`, payload);
        await fetchTopics();
        await fetchQuestions();
      } catch (err) {
        const message =
          err?.response?.data?.detail || err?.response?.data?.message || '주제를 수정하지 못했습니다.';
        throw new Error(message);
      }
    },
    [fetchQuestions, fetchTopics],
  );

  const handleDeleteTopic = useCallback(
    async (topicId) => {
      try {
        await apiClient.delete(`/admin/quiz/topics/${topicId}`);
        await fetchTopics();
        await fetchQuestions();
      } catch (err) {
        const message =
          err?.response?.data?.detail || err?.response?.data?.message || '주제를 삭제하지 못했습니다.';
        throw new Error(message);
      }
    },
    [fetchQuestions, fetchTopics],
  );

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    }
  }, [activeTab, fetchQuestions]);

  useEffect(() => {
    if (activeTab === 'bundles') {
      fetchBundles();
    }
  }, [activeTab, fetchBundles]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const openCreateQuestionModal = () => {
    setQuestionModalTitle('새 퀴즈 문제 등록');
    setQuestionModalPayload(createEmptyQuestion());
    setQuestionModalError('');
    setQuestionModalOpen(true);
  };

  const openEditQuestionModal = async (questionId) => {
    setQuestionModalTitle('퀴즈 문제 수정');
    setQuestionModalError('');
    setQuestionModalPayload(createEmptyQuestion());
    setQuestionModalLoading(true);
    setQuestionModalOpen(true);
    try {
      const response = await apiClient.get(`/admin/quiz/questions/${questionId}`);
      const data = response.data?.data;
      setQuestionModalPayload({
        id: data.id,
        question_text: data.question_text,
        type: data.type,
        correct_answer: data.correct_answer,
        explanation: data.explanation || '',
        category: data.category || DEFAULT_CATEGORY,
        difficulty: data.difficulty || DEFAULT_DIFFICULTY,
        choices: (data.choices || []).map((choice) => ({
          id: choice.id,
          content: choice.content,
          is_correct: choice.is_correct,
        })),
        topic_ids: (data.topics || []).map((topic) => topic.id),
        image_url: data.image_url || '',
      });
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || '문제 정보를 불러오지 못했습니다.';
      setQuestionModalError(message);
    } finally {
      setQuestionModalLoading(false);
    }
  };

  const closeQuestionModal = () => {
    if (questionModalLoading) return;
    setQuestionModalOpen(false);
    setQuestionModalPayload(createEmptyQuestion());
    setQuestionModalError('');
  };

  const handleSubmitQuestionModal = async (payload) => {
    setQuestionModalLoading(true);
    setQuestionModalError('');
    try {
      if (questionModalPayload.id) {
        await apiClient.put(`/admin/quiz/questions/${questionModalPayload.id}`, payload);
        alert('문제가 수정되었습니다.');
      } else {
        await apiClient.post('/admin/quiz/questions', payload);
        alert('새 문제가 등록되었습니다.');
      }
      closeQuestionModal();
      await fetchQuestions();
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || '저장 중 오류가 발생했습니다.';
      setQuestionModalError(message);
    } finally {
      setQuestionModalLoading(false);
    }
  };

  const confirmDeleteQuestion = (question) => {
    setQuestionDeleteTarget(question);
  };

  const cancelDeleteQuestion = () => {
    if (questionDeleteLoading) return;
    setQuestionDeleteTarget(null);
  };

  const handleDeleteQuestion = async () => {
    if (!questionDeleteTarget) return;
    setQuestionDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/quiz/questions/${questionDeleteTarget.id}`);
      alert('문제가 삭제되었습니다.');
      setQuestionDeleteTarget(null);
      const nextPage = Math.min(questionPage, Math.max(1, Math.ceil((questionTotal - 1) / questionLimit)));
      await fetchQuestions({ page: nextPage });
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || '문제를 삭제하지 못했습니다.';
      alert(message);
    } finally {
      setQuestionDeleteLoading(false);
    }
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    fetchQuestions({ page: 1 });
  };

  const handleResetQuestionFilters = () => {
    setSearchText('');
    setTypeFilter('');
    setQuestionCategoryFilter('');
    setQuestionDifficultyFilter('');
    setQuestionTopicFilter('');
    fetchQuestions({
      page: 1,
      search: '',
      typeFilter: '',
      categoryFilter: '',
      difficultyFilter: '',
      topicFilter: '',
    });
  };

  const handleQuestionPageChange = (nextPage) => {
    if (nextPage < 1 || nextPage > questionTotalPages || nextPage === questionPage) return;
    fetchQuestions({ page: nextPage });
  };

  const openCreateBundleModal = async () => {
    setBundleModalTitle('새 테마형 만들기');
    setBundleModalData(createEmptyBundle());
    setBundleModalError('');
    setBundleModalOpen(true);
    await loadQuestionOptions();
  };

  const openEditBundleModal = async (bundleId) => {
    setBundleModalTitle('테마형 수정');
    setBundleModalError('');
    setBundleModalLoading(true);
    setBundleModalOpen(true);
    await loadQuestionOptions();
    try {
      const response = await apiClient.get(`/admin/quiz/bundles/${bundleId}`);
      const data = response.data;
      setBundleModalData({
        id: data.id,
        title: data.title,
        description: data.description || '',
        category: data.category || '',
        difficulty: data.difficulty || '',
        is_active: data.is_active,
        question_ids: (data.questions || []).map((item) => item.question_id),
      });
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || '테마형 정보를 불러오지 못했습니다.';
      setBundleModalError(message);
    } finally {
      setBundleModalLoading(false);
    }
  };

  const closeBundleModal = () => {
    if (bundleModalLoading) return;
    setBundleModalOpen(false);
    setBundleModalData(createEmptyBundle());
    setBundleModalError('');
  };

  const handleSubmitBundleModal = async (payload) => {
    setBundleModalLoading(true);
    setBundleModalError('');
    try {
      if (bundleModalData.id) {
        await apiClient.put(`/admin/quiz/bundles/${bundleModalData.id}`, payload);
        alert('테마형이 수정되었습니다.');
      } else {
        await apiClient.post('/admin/quiz/bundles', payload);
        alert('새 테마형이 생성되었습니다.');
      }
      closeBundleModal();
      await fetchBundles();
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || '테마형 저장 중 오류가 발생했습니다.';
      setBundleModalError(message);
    } finally {
      setBundleModalLoading(false);
    }
  };

  const confirmDeleteBundle = (bundle) => {
    setBundleDeleteTarget(bundle);
  };

  const cancelDeleteBundle = () => {
    if (bundleDeleteLoading) return;
    setBundleDeleteTarget(null);
  };

  const handleDeleteBundle = async () => {
    if (!bundleDeleteTarget) return;
    setBundleDeleteLoading(true);
    try {
      await apiClient.delete(`/admin/quiz/bundles/${bundleDeleteTarget.id}`);
      alert('테마형이 삭제되었습니다.');
      setBundleDeleteTarget(null);
      const nextPage = Math.min(bundlePage, Math.max(1, Math.ceil((bundleTotal - 1) / bundleLimit)));
      await fetchBundles({ page: nextPage });
    } catch (err) {
      const message =
        err.response?.data?.detail || err.response?.data?.message || '테마형을 삭제하지 못했습니다.';
      alert(message);
    } finally {
      setBundleDeleteLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600">
          <i className="fas fa-book-open" />
          퀴즈 관리 콘솔
        </div>
        <div className="flex rounded-full border border-gray-200 bg-white p-1 text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              activeTab === 'questions' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-blue-50'
            }`}
          >
            문제 관리
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bundles')}
            className={`rounded-full px-4 py-1.5 font-medium transition ${
              activeTab === 'bundles' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-blue-50'
            }`}
          >
            테마형 관리
          </button>
        </div>
      </div>

      {activeTab === 'questions' ? (
        <div className="space-y-6">
          <div className="flex flex_col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">퀴즈 문제 관리</h1>
              <p className="mt-1 text-sm text-gray-600">학습용 퀴즈 문제를 등록하고, 수정 및 삭제할 수 있습니다.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => {
                  fetchTopics();
                  setTopicManagerOpen(true);
                }}
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
              >
                <i className="fas fa-tags mr-2 text-sm" />
                카테고리 관리
              </button>
              <button
                type="button"
                onClick={openCreateQuestionModal}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <i className="fas fa-plus mr-2 text-sm" />새 문제 등록
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1">
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="문제 내용 검색"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-4">
                <select
                  value={typeFilter}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTypeFilter(value);
                    fetchQuestions({ page: 1, typeFilter: value });
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 유형</option>
                  {QUIZ_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={questionCategoryFilter}
                  onChange={(event) => {
                    const value = event.target.value;
                    setQuestionCategoryFilter(value);
                    fetchQuestions({ page: 1, categoryFilter: value });
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={questionDifficultyFilter}
                  onChange={(event) => {
                    const value = event.target.value;
                    setQuestionDifficultyFilter(value);
                    fetchQuestions({ page: 1, difficultyFilter: value });
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value || 'all'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={questionTopicFilter}
                  onChange={(event) => {
                    const value = event.target.value;
                    setQuestionTopicFilter(value);
                    fetchQuestions({ page: 1, topicFilter: value });
                  }}
                  disabled={topicsLoading && topics.length === 0}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">전체 주제</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  검색
                </button>
                {(searchText || typeFilter || questionCategoryFilter || questionDifficultyFilter) && (
                  <button
                    type="button"
                    onClick={handleResetQuestionFilters}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    초기화
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {questionLoading ? (
              <div className="py-16 text-center text-sm text-gray-500">문제를 불러오는 중입니다...</div>
            ) : questionError ? (
              <div className="py-16 text-center text-sm text-red-500">{questionError}</div>
            ) : questions.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">등록된 문제가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">문제</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">분야</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">주제</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">난이도</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">유형</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">등록일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">보기 수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">해설</th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {questions.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium text-gray-900">
                            {item.question_text.length > 80
                              ? `${item.question_text.slice(0, 80)}...`
                              : item.question_text}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.category ? categoryLabel(item.category) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.topics?.length ? (
                            <div className="flex flex-wrap gap-1">
                              {item.topics.map((topic) => (
                                <span
                                  key={topic.id}
                                  className="inline-flex items-center rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-600"
                                >
                                  #{topic.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.difficulty ? difficultyLabel(item.difficulty) : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{typeLabel(item.type)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(item.created_at)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.choice_count}개</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.has_explanation ? '있음' : '없음'}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditQuestionModal(item.id)}
                              className="text-blue-600 transition hover:text-blue-800"
                            >
                              수정
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmDeleteQuestion(item)}
                              className="text-red-600 transition hover:text-red-800"
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
            )}
          </div>

          {questionTotalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-700">
                총 {questionTotal}문제 중 {(questionPage - 1) * questionLimit + 1}–
                {Math.min(questionPage * questionLimit, questionTotal)}개
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleQuestionPageChange(questionPage - 1)}
                  disabled={questionPage <= 1}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                {Array.from({ length: questionTotalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => handleQuestionPageChange(pageNumber)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      pageNumber === questionPage
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleQuestionPageChange(questionPage + 1)}
                  disabled={questionPage >= questionTotalPages}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex_col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">테마형 관리</h1>
              <p className="mt-1 text-sm text-gray-600">분야와 난이도별로 묶인 테마형을 생성하고 정리할 수 있습니다.</p>
            </div>
            <button
              type="button"
              onClick={openCreateBundleModal}
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <i className="fas fa-plus mr-2 text-sm" />새 테마형 만들기
            </button>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              <select
                value={bundleCategoryFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setBundleCategoryFilter(value);
                  fetchBundles({ page: 1, categoryFilter: value });
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={bundleDifficultyFilter}
                onChange={(event) => {
                  const value = event.target.value;
                  setBundleDifficultyFilter(value);
                  fetchBundles({ page: 1, difficultyFilter: value });
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIFFICULTY_OPTIONS.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => fetchBundles({ page: 1 })}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                필터 적용
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            {bundleLoading ? (
              <div className="py-16 text-center text-sm text-gray-500">테마형을 불러오는 중입니다...</div>
            ) : bundleError ? (
              <div className="py-16 text-center text-sm text-red-500">{bundleError}</div>
            ) : bundles.length === 0 ? (
              <div className="py-16 text-center text-sm text-gray-500">등록된 테마형이 없습니다.</div>
            ) : (
              <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-3">
                {bundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="flex h-full flex-col justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-blue-600">
                        <span>{bundle.category ? categoryLabel(bundle.category) : '혼합 분야'}</span>
                        <span>{bundle.difficulty ? difficultyLabel(bundle.difficulty) : '혼합 난이도'}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-gray-900">{bundle.title}</h3>
                      {bundle.description && (
                        <p className="mt-2 text-sm text-gray-600 line-clamp-3">{bundle.description}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">문제 {bundle.question_count}개</span>
                        <span
                          className={`rounded-full px-2 py-0.5 ${
                            bundle.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {bundle.is_active ? '공개' : '비공개'}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5">
                          생성 {formatDateTime(bundle.created_at)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={() => openEditBundleModal(bundle.id)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-gray-600 transition hover:bg-gray-50"
                      >
                        수정하기
                      </button>
                      <button
                        type="button"
                        onClick={() => confirmDeleteBundle(bundle)}
                        className="rounded-lg border border-red-200 px-3 py-1 text-red-500 transition hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {bundleTotalPages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-sm text-gray-700">
                총 {bundleTotal}개 중 {(bundlePage - 1) * bundleLimit + 1}–
                {Math.min(bundlePage * bundleLimit, bundleTotal)}개
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => fetchBundles({ page: bundlePage - 1 })}
                  disabled={bundlePage <= 1}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                {Array.from({ length: bundleTotalPages }, (_, i) => i + 1).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => fetchBundles({ page: pageNumber })}
                    className={`rounded-md px-3 py-1 text-sm ${
                      pageNumber === bundlePage
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => fetchBundles({ page: bundlePage + 1 })}
                  disabled={bundlePage >= bundleTotalPages}
                  className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <QuizFormModal
        open={questionModalOpen}
        onClose={closeQuestionModal}
        onSubmit={handleSubmitQuestionModal}
        loading={questionModalLoading}
        initialData={questionModalPayload}
        title={questionModalTitle}
        errorMessage={questionModalError}
      topicOptions={topics}
      topicLoading={topicsLoading}
      onOpenTopicManager={() => {
        fetchTopics();
        setTopicManagerOpen(true);
      }}
      />

      <BundleFormModal
        open={bundleModalOpen}
        onClose={closeBundleModal}
        onSubmit={handleSubmitBundleModal}
        loading={bundleModalLoading}
        initialData={bundleModalData}
        title={bundleModalTitle}
        errorMessage={bundleModalError}
        questionOptions={questionOptions}
        questionOptionsLoading={questionOptionsLoading}
      />

      <TopicManagerModal
        open={topicManagerOpen}
        onClose={() => setTopicManagerOpen(false)}
        topics={topics}
        loading={topicsLoading}
        onCreateTopic={handleCreateTopic}
        onUpdateTopic={handleUpdateTopic}
        onDeleteTopic={handleDeleteTopic}
      />

      {questionDeleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">문제 삭제</h3>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700">
              <p className="leading-relaxed">
                "{questionDeleteTarget.question_text}" 문제를 삭제하시겠습니까?
              </p>
              <p className="mt-2 text-xs text-gray-500">삭제한 문제는 복구할 수 없습니다.</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={cancelDeleteQuestion}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                disabled={questionDeleteLoading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteQuestion}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={questionDeleteLoading}
              >
                {questionDeleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bundleDeleteTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-gray-900 bg-opacity-50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">테마형 삭제</h3>
            </div>
            <div className="px-6 py-5 text-sm text-gray-700">
              <p className="leading-relaxed">
                "{bundleDeleteTarget.title}" 테마형을 삭제하시겠습니까?
              </p>
              <p className="mt-2 text-xs text-gray-500">삭제한 테마형은 복구할 수 없습니다.</p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={cancelDeleteBundle}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                disabled={bundleDeleteLoading}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDeleteBundle}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                disabled={bundleDeleteLoading}
              >
                {bundleDeleteLoading ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
