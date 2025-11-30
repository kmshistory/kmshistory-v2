import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';

const CATEGORY_LABELS = {
  ALL: '전체',
  PRE_MODERN_HISTORY: '전근대사',
  MODERN_HISTORY: '근현대사',
};

const DIFFICULTY_LABELS = {
  BASIC: '기초',
  STANDARD: '보통',
  ADVANCED: '심화',
};

const categoryLabel = (value) => {
  if (!value) return '기타';
  return CATEGORY_LABELS[value] || value;
};

const difficultyLabel = (value) => {
  if (!value) return '기타';
  return DIFFICULTY_LABELS[value] || value;
};

const TABS = [
  { value: 'profile', label: '계정 정보' },
  { value: 'history', label: '테마형 내역' },
  { value: 'wrong', label: '오답 노트' },
  { value: 'stats', label: '학습 통계' },
];

export default function MyPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const [bundleHistory, setBundleHistory] = useState({ items: [] });
  const [bundleLoading, setBundleLoading] = useState(false);
  const [wrongAnswers, setWrongAnswers] = useState({ items: [] });
  const [wrongLoading, setWrongLoading] = useState(false);
  const [quizStats, setQuizStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '마이페이지 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!user) return;

    if (activeTab === 'history' && !bundleHistory.items.length) {
      loadBundleHistory();
    } else if (activeTab === 'wrong' && !wrongAnswers.items.length) {
      loadWrongAnswers();
    } else if (activeTab === 'stats' && !quizStats) {
      loadQuizStats();
    }
  }, [activeTab, user]);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/auth/me');
      setUser(res.data);
    } catch (e) {
      console.error('사용자 정보 조회 실패:', e);
      if (e.response?.status === 401) {
        navigate('/login');
      } else {
        setError(e.response?.data?.detail || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadBundleHistory = async () => {
    setBundleLoading(true);
    try {
      const { data } = await apiClient.get('/mypage/quiz/bundles');
      setBundleHistory(data);
    } catch (e) {
      console.error('테마형 내역 조회 실패:', e);
    } finally {
      setBundleLoading(false);
    }
  };

  const loadWrongAnswers = async () => {
    setWrongLoading(true);
    try {
      const { data } = await apiClient.get('/mypage/quiz/wrong-answers');
      setWrongAnswers(data);
    } catch (e) {
      console.error('오답 노트 조회 실패:', e);
    } finally {
      setWrongLoading(false);
    }
  };

  const loadQuizStats = async () => {
    setStatsLoading(true);
    try {
      const { data } = await apiClient.get('/mypage/quiz/stats');
      setQuizStats(data);
    } catch (e) {
      console.error('학습 통계 조회 실패:', e);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  const formatAccuracy = (value) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return `${Math.round(value * 100)}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchUserInfo}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === 'admin') {
    navigate('/member-required');
    return null;
  }

  const renderProfile = () => (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">내 정보</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <InfoItem label="이메일" value={user.email} />
          <InfoItem label="닉네임" value={user.nickname} />
          <InfoItem label="가입일" value={formatDate(user.created_at)} />
          <InfoItem
            label="이메일 인증"
            value={user.is_email_verified ? '인증 완료' : '미인증'}
            valueClass={user.is_email_verified ? 'text-emerald-600' : 'text-red-500'}
          />
        </div>
      </section>

      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">계정 관리</h2>
        <div className="mt-4 space-y-3">
          <ManageItem
            title="닉네임"
            description="닉네임을 변경할 수 있습니다"
            to="/mypage/edit-profile"
            cta="정보 수정"
          />
          <ManageItem
            title="비밀번호"
            description="보안을 위해 비밀번호는 표시되지 않습니다"
            to="/mypage/change-password"
            cta="비밀번호 변경"
          />
          <ManageItem
            title="회원탈퇴"
            description="계정을 영구적으로 삭제합니다"
            to="/mypage/withdraw"
            cta="회원탈퇴"
            danger
          />
        </div>
      </section>
    </div>
  );

  const renderHistory = () => (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">테마형 학습 내역</h2>
          <p className="text-sm text-gray-500">학습한 테마형의 진행 상황과 정확도를 확인하세요.</p>
        </div>
        <button
          type="button"
          onClick={loadBundleHistory}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <i className="fas fa-rotate-right" /> 새로고침
        </button>
      </header>

      {bundleLoading ? (
        <div className="mt-8 flex items-center justify-center py-12 text-sm text-gray-500">
          로딩 중입니다...
        </div>
      ) : bundleHistory.items.length === 0 ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-2 py-12 text-sm text-gray-500">
          <i className="fas fa-book-open text-2xl text-gray-300" />
          아직 학습한 테마형이 없습니다.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {bundleHistory.items.map((item) => (
            <article key={item.bundle_id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    {item.category && <Badge text={categoryLabel(item.category)} />}
                    {item.difficulty && <Badge text={difficultyLabel(item.difficulty)} />}
                    <Badge text={item.completed ? '완료' : item.in_progress ? '진행 중' : '대기'} variant={item.completed ? 'success' : item.in_progress ? 'info' : 'default'} />
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>정확도 {formatAccuracy(item.accuracy)}</p>
                  <p className="text-xs">마지막 학습: {formatDate(item.last_played_at)}</p>
                </div>
              </div>
              {item.description && (
                <p className="mt-3 text-sm text-gray-600 line-clamp-2">{item.description}</p>
              )}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center text-sm text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">{item.total_questions}</p>
                  <p>문제 수</p>
                </div>
                <div>
                  <p className="font-semibold text-emerald-600">{item.correct_answers}</p>
                  <p>정답 수</p>
                </div>
                <div>
                  <p className="font-semibold text-blue-600">{formatAccuracy(item.accuracy)}</p>
                  <p>정확도</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );

  const renderWrongAnswers = () => {
    const items = wrongAnswers.items || [];
    return (
      <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">오답 노트</h2>
            <p className="text-sm text-gray-500">틀렸던 문제를 복습하고 다시 도전해보세요.</p>
          </div>
          <button
            type="button"
            onClick={loadWrongAnswers}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <i className="fas fa-rotate-right" /> 새로고침
          </button>
        </header>

        {wrongLoading ? (
          <div className="mt-8 flex items-center justify-center py-12 text-sm text-gray-500">
            로딩 중입니다...
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 flex flex-col items-center justify-center gap-2 py-12 text-sm text-gray-500">
            <i className="fas fa-check-circle text-2xl text-emerald-400" />
            오답이 없습니다! 계속해서 도전해보세요.
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {items.map((item) => (
              <article key={item.history_id} className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="text-sm text-gray-500">
                    {item.bundle_title && <p className="font-semibold text-gray-700">{item.bundle_title}</p>}
                    <p>풀이일: {formatDate(item.solved_at)}</p>
                  </div>
                  <Badge text="오답" variant="danger" />
                </div>
                <p className="mt-3 text-base font-semibold text-gray-900">{item.question_text}</p>
                <div className="mt-3 grid gap-3 text-sm text-gray-700 md:grid-cols-2">
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <p className="font-semibold text-gray-900">내 답안</p>
                    <p className="mt-1 text-gray-700">{item.user_answer || '-'}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 shadow-sm">
                    <p className="font-semibold text-emerald-600">정답</p>
                    <p className="mt-1 text-gray-700">{item.correct_answer || '-'}</p>
                  </div>
                </div>
                {item.explanation && (
                  <div className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-600 shadow-sm">
                    <p className="font-semibold text-gray-900">해설</p>
                    <p className="mt-1 whitespace-pre-line">{item.explanation}</p>
                  </div>
                )}
                {item.topics?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {item.topics.map((topic) => (
                      <Badge key={topic.id} text={`#${topic.name}`} variant="info" />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    );
  };

  const renderStats = () => (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">학습 통계</h2>
          <p className="text-sm text-gray-500">카테고리/난이도별 성취도와 오답률이 높은 문제를 확인하세요.</p>
        </div>
        <button
          type="button"
          onClick={loadQuizStats}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <i className="fas fa-rotate-right" /> 새로고침
        </button>
      </header>

      {statsLoading ? (
        <div className="mt-8 flex items-center justify-center py-12 text-sm text-gray-500">
          로딩 중입니다...
        </div>
      ) : !quizStats ? (
        <div className="mt-8 flex flex-col items-center justify-center gap-2 py-12 text-sm text-gray-500">
          데이터를 가져오지 못했습니다.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard title="총 풀이 수" value={`${quizStats.total_attempts} 문제`} />
            <StatCard title="정답 수" value={`${quizStats.total_correct} 문제`} />
            <StatCard title="정확도" value={formatAccuracy(quizStats.accuracy)} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <StatTable
              title="카테고리별 정확도"
              columns={[{ key: 'category', label: '카테고리' }, { key: 'attempts', label: '풀이 수' }, { key: 'accuracy', label: '정확도' }]}
              rows={(quizStats.category_stats || []).map((item) => ({
                key: item.category || '기타',
                category: categoryLabel(item.category) || '기타',
                attempts: item.attempts,
                accuracy: formatAccuracy(item.accuracy),
              }))}
              emptyText="카테고리 통계가 없습니다."
            />
            <StatTable
              title="난이도별 정확도"
              columns={[{ key: 'difficulty', label: '난이도' }, { key: 'attempts', label: '풀이 수' }, { key: 'accuracy', label: '정확도' }]}
              rows={(quizStats.difficulty_stats || []).map((item) => ({
                key: item.difficulty || '기타',
                difficulty: difficultyLabel(item.difficulty) || '기타',
                attempts: item.attempts,
                accuracy: formatAccuracy(item.accuracy),
              }))}
              emptyText="난이도 통계가 없습니다."
            />
          </div>

          <StatTable
            title="오답률 높은 문제 Top 5"
            columns={[
              { key: 'question_text', label: '문제' },
              { key: 'attempts', label: '풀이 수' },
              { key: 'accuracy', label: '정확도' },
            ]}
            rows={(quizStats.hard_questions || []).map((item) => ({
              key: item.question_id,
              question_text: item.question_text,
              attempts: item.attempts,
              accuracy: formatAccuracy(item.accuracy),
            }))}
            emptyText="오답률이 높은 문제가 없습니다."
          />
        </div>
      )}
    </section>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'history':
        return renderHistory();
      case 'wrong':
        return renderWrongAnswers();
      case 'stats':
        return renderStats();
      case 'profile':
      default:
        return renderProfile();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 transition-colors duration-200">
      <div className="w-full sm:w-[95%] md:w-[768px] lg:w-[1024px] xl:w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">마이페이지</h1>
          <p className="mt-2 text-gray-600">내 정보와 학습 활동을 확인하세요.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-2">
            <nav className="space-y-1 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              {TABS.map((tab) => {
                const isActive = tab.value === activeTab;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTab(tab.value)}
                    className={`w-full rounded-lg px-4 py-2 text-left text-sm font-medium transition ${
                      isActive ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="lg:col-span-10">{renderContent()}</main>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value, valueClass }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-gray-900 ${valueClass || ''}`}>{value}</p>
    </div>
  );
}

function ManageItem({ title, description, to, cta, danger }) {
  return (
    <div className={`flex items-center justify-between rounded-lg p-4 ${danger ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Link
        to={to}
        className={`px-4 py-2 text-sm font-semibold transition ${
          danger
            ? 'rounded-md bg-red-600 text-white hover:bg-red-700'
            : 'rounded-md bg-primary text-white hover:bg-secondary'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function Badge({ text, variant = 'default' }) {
  const styles = {
    default: 'bg-gray-100 text-gray-600',
    info: 'bg-blue-100 text-blue-600',
    success: 'bg-emerald-100 text-emerald-600',
    danger: 'bg-rose-100 text-rose-600',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[variant] || styles.default}`}>
      {text}
    </span>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StatTable({ title, columns, rows, emptyText }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className="px-4 py-2 text-left font-medium uppercase tracking-wide text-gray-500"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-4 py-2 text-gray-700">
                      {row[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

