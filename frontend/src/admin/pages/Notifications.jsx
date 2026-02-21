import React, { useEffect, useMemo, useState } from "react";
import apiClient from "../../shared/api/client";

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 필터 상태
  const [filterAll, setFilterAll] = useState(true);
  const [filterUsers, setFilterUsers] = useState(true);
  const [filterDraws, setFilterDraws] = useState(true);

  // 페이지네이션 상태
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // 토스트
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '알림 관리 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  useEffect(() => {
    loadNotifications();
  }, []);

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "info" }), 3000);
  };

  const loadNotifications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get("/notifications", { params: { limit: 50 } });
      setNotifications(res.data.notifications || []);
      setPage(1);
    } catch (e) {
      setError("알림을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const isNew = (dateString) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    return d >= twoDaysAgo;
  };

  const formatRelative = (dateString) => {
    if (!dateString) return "알 수 없음";
    const date = new Date(dateString);
    const now = new Date();
    const diffMin = Math.floor((now - date) / 60000);
    if (diffMin < 1) return "방금 전";
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}시간 전`;
    return date.toLocaleDateString("ko-KR");
  };

  const filtered = useMemo(() => {
    const base = notifications || [];
    const arr = base.filter((n) => {
      if (!filterAll) {
        // 개별 필터 기반
        if (n.type === "user_joined" && !filterUsers) return false;
        if (n.type === "draw_saved" && !filterDraws) return false;
      }
      return true;
    });
    return arr;
  }, [notifications, filterAll, filterUsers, filterDraws]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIdx = (page - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  const getBadgeClass = (type) => {
    switch (type) {
      case "user_joined":
        return "bg-blue-100 text-blue-800";
      case "draw_saved":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case "user_joined":
        return "사용자 가입";
      case "draw_saved":
        return "추첨 결과";
      default:
        return "기타";
    }
  };

  const markAsRead = async (id) => {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (String(n.id) === String(id) ? { ...n, is_read: true } : n)));
    } catch (e) {
      showToast("읽음 처리 중 오류가 발생했습니다.", "error");
    }
  };

  const markAllRead = async () => {
    try {
      await apiClient.put("/notifications/mark-all-read");
      showToast("모든 알림이 읽음 상태로 표시되었습니다.", "success");
      loadNotifications();
    } catch (e) {
      showToast("읽음 처리 중 오류가 발생했습니다.", "error");
    }
  };

  const clearAll = async () => {
    try {
      await apiClient.delete("/notifications/clear-all");
      showToast("모든 알림이 삭제되었습니다.", "success");
      loadNotifications();
    } catch (e) {
      showToast("삭제 중 오류가 발생했습니다.", "error");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">알림 센터</h1>
        <p className="text-gray-600">시스템 알림 및 활동 내역을 관리합니다.</p>
      </div>

      {/* 필터 및 액션 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap items-center gap-4 w-full">
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filterAll}
                onChange={(e) => {
                  const v = e.target.checked;
                  setFilterAll(v);
                  setFilterUsers(v);
                  setFilterDraws(v);
                  setPage(1);
                }}
              />
              <span className="ml-2 text-sm text-gray-700">전체</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filterUsers}
                onChange={(e) => {
                  const v = e.target.checked;
                  setFilterUsers(v);
                  setFilterAll(v && filterDraws);
                  setPage(1);
                }}
              />
              <span className="ml-2 text-sm text-gray-700">사용자 가입</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={filterDraws}
                onChange={(e) => {
                  const v = e.target.checked;
                  setFilterDraws(v);
                  setFilterAll(v && filterUsers);
                  setPage(1);
                }}
              />
              <span className="ml-2 text-sm text-gray-700">추첨 결과</span>
            </label>
          </div>
          <div className="ml-auto">
            <button
              onClick={markAllRead}
              className="btn-blue"
            >
              모두 읽음 처리
            </button>
            <button
              onClick={clearAll}
              className="btn-danger ml-2"
            >
              전체 삭제
            </button>
          </div>
        </div>
      </div>

      {/* 알림 목록 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">최근 알림</h2>
        </div>

        {loading ? (
          <div className="p-6 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            알림 내역을 불러오는 중...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <i className="fas fa-bell-slash text-gray-400 text-6xl mb-4"></i>
            <p className="text-lg font-medium">알림이 없습니다</p>
            <p className="text-sm">새로운 활동이 있을 때 알림이 표시됩니다.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {currentItems.map((n) => (
              <div
                key={n.id}
                className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer ${
                  n.is_read ? "bg-white" : "bg-blue-50"
                }`}
                onClick={() => markAsRead(n.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeClass(n.type)}`}>
                        {getTypeText(n.type)}
                      </span>
                      <span className="text-sm text-gray-500">{formatRelative(n.created_at)}</span>
                      {isNew(n.created_at) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          new
                        </span>
                      )}
                    </div>
                    <p className="text-gray-900 mb-2">{n.title}</p>
                    {n.content && (
                      <p className="text-gray-600 text-sm">{n.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {filtered.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                이전
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 {filtered.length}개 중 {(startIdx + 1)}-{Math.min(startIdx + itemsPerPage, filtered.length)}
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500"
                  >
                    <span className="sr-only">Previous</span>
                    <i className="fas fa-chevron-left text-lg"></i>
                  </button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === i + 1
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500"
                  >
                    <span className="sr-only">Next</span>
                    <i className="fas fa-chevron-right text-lg"></i>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 토스트 */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg max-w-sm text-white"
          style={{ backgroundColor: toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#2563eb' }}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-2">
              {toast.type === 'success' && <i className="fas fa-check-circle"></i>}
              {toast.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
              {toast.type === 'info' && <i className="fas fa-info-circle"></i>}
            </div>
            <div className="text-sm font-medium">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}











