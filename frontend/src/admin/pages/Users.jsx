import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function Users() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
  });
  const limit = 10;

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '사용자 관리 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 모달 상태
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [unblockModalOpen, setUnblockModalOpen] = useState(false);

  // 선택된 사용자 정보
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    nickname: '',
    password: '',
    role: 'member',
  });
  const [blockReason, setBlockReason] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [blocking, setBlocking] = useState(false);

  // 현재 사용자 정보 조회
  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchUserCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // 페이지 변경 시 즉시 실행
    fetchUsers();
    fetchUserCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    // 역할/상태 필터 변경 시 즉시 실행
    fetchUsers();
    fetchUserCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.role, filters.status]);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiClient.get('/auth/me');
      setCurrentUser(res.data);
    } catch (e) {
      console.error('현재 사용자 정보 조회 실패:', e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit,
      };
      if (filters.search) params.q = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) {
        params.status = filters.status; // 'active' 또는 'blocked'
      }

      const res = await apiClient.get('/admin/users', { params });
      // API 응답 구조: PageResponse { items: [...], total: ..., page: ..., limit: ..., total_pages: ... }
      const data = res.data.items || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('사용자 목록 조회 실패:', e);
      setError(e.response?.data?.detail || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCount = async () => {
    try {
      const params = {};
      if (filters.search) params.q = filters.search;
      if (filters.role) params.role = filters.role;
      if (filters.status) {
        params.status = filters.status; // 'active' 또는 'blocked'
      }

      const res = await apiClient.get('/admin/users/count', { params });
      const count = res.data.total_count || 0;
      setTotalCount(count);
      setTotalPages(Math.ceil(count / limit));
    } catch (e) {
      console.error('사용자 수 조회 실패:', e);
    }
  };

  // 검색 입력 debounce
  useEffect(() => {
    // 초기 로드 시에는 debounce 없이 즉시 실행하지 않음 (이미 초기 useEffect에서 실행됨)
    if (filters.search === '') {
      // 빈 검색어로 초기화할 때만 즉시 실행
      fetchUsers();
      fetchUserCount();
      return;
    }
    
    // 검색어 입력 시 300ms debounce
    const timer = setTimeout(() => {
      fetchUsers();
      fetchUserCount();
    }, 300);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  const handleSearchChange = (e) => {
    setFilters({ ...filters, search: e.target.value });
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR');
  };

  const formatRole = (role) => {
    const roleMap = {
      admin: '관리자',
      leader: '리더',
      member: '일반',
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const classMap = {
      admin: 'bg-red-100 text-red-800',
      leader: 'bg-yellow-100 text-yellow-800',
      member: 'bg-blue-100 text-blue-800',
    };
    return classMap[role] || classMap.member;
  };

  const getStatusBadge = (user) => {
    if (user.is_blocked) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">차단됨</span>;
    }
    if (user.is_active) {
      if (user.is_email_verified) {
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">활성</span>;
      }
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">대기</span>;
    }
    return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">비활성</span>;
  };

  // 안전하게 차단 상태 확인
  const isUserBlocked = (user) => {
    return user.is_blocked === true;
  };

  const handleViewUser = async (userId) => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      setSelectedUser(res.data);
      setDetailModalOpen(true);
    } catch (e) {
      alert(e.response?.data?.detail || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      const user = res.data;
      setFormData({
        email: user.email,
        nickname: user.nickname,
        password: '',
        role: user.role,
      });
      setIsEditMode(true);
      setSelectedUser(user);
      setFormModalOpen(true);
    } catch (e) {
      alert(e.response?.data?.detail || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleAddUser = () => {
    setFormData({
      email: '',
      nickname: '',
      password: '',
      role: 'member',
    });
    setIsEditMode(false);
    setSelectedUser(null);
    setFormModalOpen(true);
  };

  const handleDeleteUser = (userId, userName) => {
    setSelectedUser({ id: userId, nickname: userName });
    setDeleteModalOpen(true);
  };

  const handleBlockUser = (userId, userName) => {
    setSelectedUser({ id: userId, nickname: userName });
    setBlockReason('');
    setBlockModalOpen(true);
  };

  const handleUnblockUser = (userId, userName) => {
    setSelectedUser({ id: userId, nickname: userName });
    setUnblockModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isEditMode) {
        // 수정
        const updateData = {
          nickname: formData.nickname,
        };
        if (selectedUser.role !== 'admin') {
          updateData.role = formData.role;
        }
        await apiClient.put(`/admin/users/${selectedUser.id}`, updateData);
        alert('사용자 정보가 수정되었습니다.');
      } else {
        // 추가
        await apiClient.post('/admin/users', formData);
        alert('사용자가 추가되었습니다. 이제 해당 이메일과 비밀번호로 로그인할 수 있습니다.');
      }
      setFormModalOpen(false);
      await fetchUsers();
      await fetchUserCount();
    } catch (e) {
      alert(e.response?.data?.detail || '사용자 저장 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/admin/users/${selectedUser.id}/permanent`);
      setDeleteModalOpen(false);
      alert('사용자가 삭제되었습니다.');
      await fetchUsers();
      await fetchUserCount();
    } catch (e) {
      alert(e.response?.data?.detail || '사용자 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmBlock = async () => {
    if (!selectedUser) return;
    setBlocking(true);
    try {
      await apiClient.post(`/admin/users/${selectedUser.id}/block`, {
        reason: blockReason || '관리자에 의한 차단',
      });
      setBlockModalOpen(false);
      setBlockReason('');
      alert('사용자가 차단되었습니다.');
      await fetchUsers();
      await fetchUserCount();
    } catch (e) {
      alert(e.response?.data?.detail || '사용자 차단 중 오류가 발생했습니다.');
    } finally {
      setBlocking(false);
    }
  };

  const handleConfirmUnblock = async () => {
    if (!selectedUser) return;
    setBlocking(true);
    try {
      await apiClient.post(`/admin/users/${selectedUser.id}/unblock`);
      setUnblockModalOpen(false);
      alert('차단이 해제되었습니다.');
      await fetchUsers();
      await fetchUserCount();
    } catch (e) {
      alert(e.response?.data?.detail || '차단 해제 중 오류가 발생했습니다.');
    } finally {
      setBlocking(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const getUserNumber = (index) => {
    return (currentPage - 1) * limit + index + 1;
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
          <p className="mt-1 text-sm text-gray-500">사용자 목록을 관리하고 정보를 수정할 수 있습니다.</p>
        </div>
        <button
          onClick={handleAddUser}
          className="inline-flex items-center px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
        >
          <i className="fas fa-plus mr-2"></i>
          회원 추가
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              검색
            </label>
            <div className="relative">
              <input
                type="text"
                id="search"
                value={filters.search}
                onChange={handleSearchChange}
                placeholder="이메일, 닉네임 검색"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400 text-lg"></i>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-2">
              역할
            </label>
            <select
              id="role-filter"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
            >
              <option value="">전체</option>
              <option value="admin">관리자</option>
              <option value="leader">리더</option>
              <option value="member">일반</option>
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              상태
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors duration-200"
            >
              <option value="">전체</option>
              <option value="active">활성</option>
              <option value="blocked">차단</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">이메일</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">닉네임</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">역할</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">상태</th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">가입일</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-28">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2 text-gray-500">사용자 목록을 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-red-500">{error}</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    사용자를 찾을 수 없습니다.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 text-center text-sm text-gray-900">{getUserNumber(index)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 truncate" title={user.email}>
                      {user.email}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{user.nickname}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">{getStatusBadge(user)}</td>
                    <td className="px-2 py-4 text-sm text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="text-purple-700 hover:text-purple-900"
                        >
                          상세보기
                        </button>
                        <button
                          onClick={() => handleEditUser(user.id)}
                          className="text-green-500 hover:text-green-700"
                        >
                          수정
                        </button>
                        {user.id !== currentUser?.id && user.role !== 'admin' && (
                          <>
                            {isUserBlocked(user) ? (
                              <button
                                onClick={() => handleUnblockUser(user.id, user.nickname)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                차단해제
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlockUser(user.id, user.nickname)}
                                className="text-pink-600 hover:text-pink-900"
                              >
                                차단
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteUser(user.id, user.nickname)}
                              className="text-red-600 hover:text-red-900"
                            >
                              삭제
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && !error && users.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                이전
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                다음
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  총 {totalCount}개 중 {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, totalCount)}개
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <i className="fas fa-chevron-left text-lg"></i>
                  </button>
                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        pageNum === currentPage
                          ? 'z-10 bg-primary border-primary text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* User Detail Modal */}
      {detailModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border border-gray-200 w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">사용자 상세 정보</h3>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="text-gray-900 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">닉네임</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedUser.nickname}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">역할</label>
                  <p className="mt-1 text-sm text-gray-900">{formatRole(selectedUser.role)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedUser.is_active
                      ? selectedUser.is_email_verified
                        ? '활성 (로그인 완료)'
                        : '대기 (Google 로그인 필요)'
                      : '비활성'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">가입일</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                </div>
                {selectedUser.is_blocked && selectedUser.blocked_at && (
                  <div className="border-t pt-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-red-800 mb-2">차단 정보</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-xs font-medium text-red-700">차단 일시</label>
                          <p className="text-sm text-red-800">{formatDate(selectedUser.blocked_at)}</p>
                        </div>
                        {selectedUser.blocked_reason && (
                          <div>
                            <label className="block text-xs font-medium text-red-700">차단 사유</label>
                            <p className="text-sm text-red-800 whitespace-pre-wrap">{selectedUser.blocked_reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {formModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border border-gray-200 w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">{isEditMode ? '사용자 수정' : '사용자 추가'}</h3>
                <button
                  onClick={() => setFormModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label htmlFor="form-email" className="block text-sm font-medium text-gray-700">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="form-email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isEditMode}
                    required={!isEditMode}
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      isEditMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    placeholder="example@gmail.com"
                  />
                </div>
                <div>
                  <label htmlFor="form-nickname" className="block text-sm font-medium text-gray-700">
                    닉네임
                  </label>
                  <input
                    type="text"
                    id="form-nickname"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                {!isEditMode && (
                  <div>
                    <label htmlFor="form-password" className="block text-sm font-medium text-gray-700">
                      비밀번호
                    </label>
                    <input
                      type="password"
                      id="form-password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!isEditMode}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      placeholder="6-32자, 영문/숫자/특수문자 중 2가지 이상"
                    />
                    <p className="mt-1 text-xs text-gray-500">영문 대·소문자, 숫자, 특수문자 중 최소 2가지 이상 포함</p>
                  </div>
                )}
                <div>
                  <label htmlFor="form-role" className="block text-sm font-medium text-gray-700">
                    역할
                  </label>
                  <select
                    id="form-role"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    disabled={isEditMode && selectedUser?.role === 'admin'}
                    required
                    className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
                      isEditMode && selectedUser?.role === 'admin' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="member">일반 사용자</option>
                    <option value="leader">리더</option>
                    {!isEditMode && <option value="admin">관리자</option>}
                  </select>
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setFormModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    {submitting ? '저장 중...' : '저장'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border border-gray-200 w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">사용자 삭제 확인</h3>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">정말 삭제하시겠습니까?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  <span className="font-medium">{selectedUser.nickname}</span>님을 영구적으로 삭제합니다.<br />
                  이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setDeleteModalOpen(false)}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={deleting}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {deleting ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Confirmation Modal */}
      {blockModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border border-gray-200 w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">사용자 차단</h3>
                <button
                  onClick={() => setBlockModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div>
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                  <i className="fas fa-ban text-orange-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2 text-center">정말 차단하시겠습니까?</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  <span className="font-medium">{selectedUser.nickname}</span>님을 차단합니다.<br />
                  차단된 회원은 로그인과 재가입이 불가능합니다.
                </p>
                <div className="mb-4">
                  <label htmlFor="block-reason" className="block text-sm font-medium text-gray-700 mb-2">
                    차단 사유 (선택)
                  </label>
                  <textarea
                    id="block-reason"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="차단 사유를 입력하세요"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setBlockModalOpen(false)}
                    disabled={blocking}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmBlock}
                    disabled={blocking}
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                  >
                    {blocking ? '차단 중...' : '차단'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Confirmation Modal */}
      {unblockModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border border-gray-200 w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">차단 해제</h3>
                <button
                  onClick={() => setUnblockModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                  <i className="fas fa-check-circle text-blue-600 text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">차단을 해제하시겠습니까?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  <span className="font-medium">{selectedUser.nickname}</span>님의 차단을 해제합니다.<br />
                  해제 후 정상적으로 로그인할 수 있습니다.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setUnblockModalOpen(false)}
                    disabled={blocking}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleConfirmUnblock}
                    disabled={blocking}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {blocking ? '해제 중...' : '해제'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

