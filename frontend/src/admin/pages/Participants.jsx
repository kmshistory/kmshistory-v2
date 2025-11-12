import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import apiClient from '../../shared/api/client';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Participants() {
  const navigate = useNavigate();
  const query = useQuery();
  const [searchParams, setSearchParams] = useSearchParams();

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '참가자 관리 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [searchType, setSearchType] = useState('name');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(parseInt(query.get('page') || '1', 10));
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const limit = 10;

  // 모달 상태
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageModalContent, setMessageModalContent] = useState({ title: '', message: '', isSuccess: true });

  // 폼 상태
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', description: '' });
  const [uploadReplaceAll, setUploadReplaceAll] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // URL에서 검색 파라미터 로드
  useEffect(() => {
    const name = query.get('name');
    const description = query.get('description');
    const email = query.get('email');
    
    if (name) {
      setSearchType('name');
      setSearchText(name);
    } else if (description) {
      setSearchType('description');
      setSearchText(description);
    } else if (email) {
      setSearchType('email');
      setSearchText(email);
    }
  }, [query]);

  useEffect(() => {
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchText, searchType]);

  // URL 파라미터에서 메시지 확인
  useEffect(() => {
    const message = query.get('message');
    const error = query.get('error');
    if (message) {
      setMessageModalContent({ title: '성공', message: decodeURIComponent(message), isSuccess: true });
      setMessageModalOpen(true);
      // URL에서 제거
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('message');
      setSearchParams(newParams);
    } else if (error) {
      setMessageModalContent({ title: '오류', message: decodeURIComponent(error), isSuccess: false });
      setMessageModalOpen(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('error');
      setSearchParams(newParams);
    }
  }, [query, searchParams, setSearchParams]);

  const fetchParticipants = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        limit,
      };
      
      // 검색 타입에 따라 파라미터 설정
      if (searchText) {
        if (searchType === 'name') {
          params.name = searchText;
        } else if (searchType === 'description') {
          params.description = searchText;
        } else if (searchType === 'email') {
          params.email = searchText;
        }
      }

      const res = await apiClient.get('/participants', { params });
      setParticipants(res.data.participants || []);
      setTotalCount(res.data.total || 0);
      setTotalPages(Math.ceil((res.data.total || 0) / limit));
    } catch (e) {
      console.error('대상자 목록 조회 실패:', e);
      setError(e.response?.data?.detail || '대상자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    updateURL({ page: 1 });
    fetchParticipants();
  };

  const handleResetFilters = () => {
    setSearchText('');
    setSearchType('name');
    setCurrentPage(1);
    navigate('/admin/participants');
    fetchParticipants();
  };

  const updateURL = (params = {}) => {
    const sp = new URLSearchParams();
    const page = params.page ?? currentPage;
    if (page && page > 1) sp.set('page', String(page));
    
    if (searchText) {
      if (searchType === 'name') {
        sp.set('name', searchText);
      } else if (searchType === 'description') {
        sp.set('description', searchText);
      } else if (searchType === 'email') {
        sp.set('email', searchText);
      }
    }
    
    navigate({ pathname: '/admin/participants', search: `?${sp.toString()}` }, { replace: true });
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

  const getParticipantNumber = (index) => {
    return (currentPage - 1) * limit + index + 1;
  };

  // 체크박스 관리
  const toggleSelectAll = () => {
    if (selectedIds.size === participants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(participants.map(p => p.id)));
    }
  };

  const toggleSelect = (id) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // 모달 관리
  const openAddModal = () => {
    setFormData({ name: '', email: '', description: '' });
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setFormData({ name: '', email: '', description: '' });
  };

  const openEditModal = (participant) => {
    setEditingParticipant(participant);
    setFormData({
      name: participant.name || '',
      email: participant.email || '',
      description: participant.description || '',
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingParticipant(null);
    setFormData({ name: '', email: '', description: '' });
  };

  const openDeleteModal = (participant) => {
    setEditingParticipant(participant);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setEditingParticipant(null);
  };

  const openBulkDeleteModal = () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.');
      return;
    }
    setBulkDeleteModalOpen(true);
  };

  const closeBulkDeleteModal = () => {
    setBulkDeleteModalOpen(false);
  };

  const closeMessageModal = () => {
    setMessageModalOpen(false);
  };

  // 폼 제출
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/participants', formData);
      closeAddModal();
      await fetchParticipants();
      setMessageModalContent({ title: '성공', message: '대상자가 추가되었습니다.', isSuccess: true });
      setMessageModalOpen(true);
    } catch (e) {
      alert(e.response?.data?.detail || '대상자 추가 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingParticipant) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/participants/${editingParticipant.id}`, formData);
      closeEditModal();
      await fetchParticipants();
      setMessageModalContent({ title: '성공', message: '대상자가 수정되었습니다.', isSuccess: true });
      setMessageModalOpen(true);
    } catch (e) {
      alert(e.response?.data?.detail || '대상자 수정 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingParticipant) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/participants/${editingParticipant.id}`);
      closeDeleteModal();
      await fetchParticipants();
      setMessageModalContent({ title: '성공', message: '대상자가 삭제되었습니다.', isSuccess: true });
      setMessageModalOpen(true);
    } catch (e) {
      alert(e.response?.data?.detail || '대상자 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await apiClient.delete('/participants', { data: { ids: Array.from(selectedIds) } });
      closeBulkDeleteModal();
      setSelectedIds(new Set());
      await fetchParticipants();
      setMessageModalContent({ title: '성공', message: `${selectedIds.size}명의 대상자가 삭제되었습니다.`, isSuccess: true });
      setMessageModalOpen(true);
    } catch (e) {
      alert(e.response?.data?.detail || '대상자 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput?.files?.[0];
    if (!file) {
      alert('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('replace_all', uploadReplaceAll);
      
      const res = await fetch('/api/participants/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.detail || '파일 업로드 중 오류가 발생했습니다.');
      }

      const result = await res.json();
      fileInput.value = '';
      await fetchParticipants();
      setMessageModalContent({ title: '성공', message: result.message || '파일 업로드가 완료되었습니다.', isSuccess: true });
      setMessageModalOpen(true);
    } catch (e) {
      alert(e.message || '파일 업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    updateURL({ page });
  };

  return (
    <div className="w-full">
      {/* 페이지 헤더 */}
      <div className="mb-6">
        <div className="text-center sm:text-left mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">대상자 관리</h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">대상자를 등록하고 관리할 수 있습니다.</p>
        </div>

        {/* 파일 업로드 폼 */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <form onSubmit={handleFileUpload}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
              <div className="flex-1">
                <input
                  id="fileInput"
                  type="file"
                  accept=".xlsx,.xls"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-blue-700"
                  required
                />
              </div>
              <div className="flex items-center justify-center lg:justify-start space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="replace_all"
                    checked={!uploadReplaceAll}
                    onChange={() => setUploadReplaceAll(false)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">추가</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="replace_all"
                    checked={uploadReplaceAll}
                    onChange={() => setUploadReplaceAll(true)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">교체</span>
                </label>
              </div>
              <div className="flex-shrink-0">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full lg:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                >
                  <i className="fas fa-upload text-sm mr-2"></i>
                  {uploading ? '업로드 중...' : '대상자 목록에 넣기'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* 검색 폼 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
        <form onSubmit={handleSearchSubmit}>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <div className="flex-shrink-0">
              <select
                id="searchType"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="px-3 py-2 rounded-md border border-gray-300 shadow-sm hover:border-gray-400 focus:border-primary focus:ring-primary text-sm min-w-[100px] transition-colors duration-200"
              >
                <option value="name">이름</option>
                <option value="description">상세</option>
                <option value="email">이메일</option>
              </select>
            </div>
            <div className="flex-1 w-full">
              <input
                type="text"
                id="searchInput"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={`${searchType === 'name' ? '이름' : searchType === 'description' ? '상세' : '이메일'}으로 검색`}
                className="block w-full px-3 py-2 rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary text-sm"
              />
            </div>
            <div className="flex-shrink-0">
              <button
                type="submit"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-secondary hover:bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              >
                <i className="fas fa-search text-sm mr-2"></i>
                검색
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 검색 상태 표시 */}
      {searchText && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-search text-blue-400 text-lg mr-2"></i>
              <span className="text-sm text-blue-800">
                검색 조건:{' '}
                <span className="font-medium">
                  {searchType === 'name' ? '이름' : searchType === 'description' ? '상세' : '이메일'}: "{searchText}"
                </span>
              </span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              전체 목록 보기 →
            </button>
          </div>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="mb-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={openAddModal}
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <i className="fas fa-plus text-sm mr-2"></i>
              대상자 추가
            </button>
            <button
              onClick={openBulkDeleteModal}
              disabled={selectedIds.size === 0}
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <i className="fas fa-trash text-sm mr-2"></i>
              선택 삭제
            </button>
            <Link
              to="/admin/draw/select"
              className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <i className="fas fa-gift text-sm mr-2"></i>
              당첨자 선정하러 가기
            </Link>
          </div>
          <div className="flex items-center gap-3 lg:ml-auto">
            <Link
              to="/admin/participants"
              onClick={(e) => {
                e.preventDefault();
                handleResetFilters();
              }}
              className="inline-flex justify-center items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <i className="fas fa-list text-xs mr-1"></i>
              전체보기
            </Link>
            <span className="text-sm text-gray-600">선택된 대상자: {selectedIds.size}명</span>
          </div>
        </div>
      </div>

      {/* 대상자 목록 */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-300 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">로딩 중...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : participants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 min-h-96">
            <i className="fas fa-users text-gray-400 text-5xl mb-4"></i>
            <h3 className="text-sm font-medium text-gray-900 mb-1">추가된 대상자가 없습니다.</h3>
            <p className="text-sm text-gray-500">엑셀 파일을 업로드하여 대상자를 등록해보세요.</p>
          </div>
        ) : (
          <>
            {/* 모바일 카드 뷰 */}
            <div className="block sm:hidden">
              {participants.map((participant, index) => (
                <div key={participant.id} className="border-b border-gray-200 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        className="participant-checkbox rounded border-gray-300 text-primary focus:ring-primary"
                        checked={selectedIds.has(participant.id)}
                        onChange={() => toggleSelect(participant.id)}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{participant.name}</div>
                        <div className="text-xs text-gray-500">#{getParticipantNumber(index)}</div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(participant)}
                        className="text-xs text-primary hover:text-secondary"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => openDeleteModal(participant)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">이메일:</span> {participant.email}
                    </div>
                    <div>
                      <span className="font-medium">상세:</span> {participant.description || '-'}
                    </div>
                    <div>
                      <span className="font-medium">등록일:</span> {formatDate(participant.created_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 태블릿 테이블 뷰 */}
            <div className="hidden sm:block md:hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === participants.length && participants.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant, index) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="participant-checkbox rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedIds.has(participant.id)}
                          onChange={() => toggleSelect(participant.id)}
                        />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getParticipantNumber(index)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 break-words">{participant.name}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 break-words">{participant.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => openEditModal(participant)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => openDeleteModal(participant)}
                            className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
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

            {/* 데스크톱 테이블 뷰 */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === participants.length && participants.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이메일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상세</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등록일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {participants.map((participant, index) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          className="participant-checkbox rounded border-gray-300 text-primary focus:ring-primary"
                          checked={selectedIds.has(participant.id)}
                          onChange={() => toggleSelect(participant.id)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getParticipantNumber(index)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 break-words">{participant.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 break-words">{participant.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 break-words">{participant.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(participant.created_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(participant)}
                            className="text-primary hover:text-secondary"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => openDeleteModal(participant)}
                            className="text-red-600 hover:text-red-800"
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
          </>
        )}
      </div>

      {/* 페이징 */}
      {!loading && !error && totalCount > 0 && (
        <div className="mt-3">
          <div className="flex flex-col lg:flex-row lg:items-end gap-2">
            <div className="bg-white px-4 py-3 text-center border-t border-gray-200 rounded-lg shadow-sm border">
              <p className="text-sm text-gray-700">
                총 <span className="font-medium text-primary">{totalCount}</span>명 중{' '}
                <span className="font-medium text-primary">{(currentPage - 1) * limit + 1}</span> -{' '}
                <span className="font-medium text-primary">{Math.min(currentPage * limit, totalCount)}</span>번째 표시
              </p>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-end justify-center lg:justify-end lg:ml-auto space-y-1 sm:space-y-0">
                <div className="flex items-center space-x-2 sm:hidden">
                  {currentPage > 1 && (
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      이전
                    </button>
                  )}
                  <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-primary text-white rounded-md">
                    {currentPage} / {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      다음
                    </button>
                  )}
                </div>
                <div className="hidden sm:flex items-center space-x-2">
                  {currentPage > 1 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        처음
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        이전
                      </button>
                    </>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((pageNum) => {
                      const start = Math.max(1, currentPage - 2);
                      const end = Math.min(totalPages, currentPage + 2);
                      return pageNum === 1 || pageNum === totalPages || (pageNum >= start && pageNum <= end);
                    })
                    .map((pageNum, idx, arr) => {
                      const prev = arr[idx - 1];
                      const showEllipsis = prev && pageNum - prev > 1;
                      return (
                        <React.Fragment key={pageNum}>
                          {showEllipsis && (
                            <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
                          )}
                          {pageNum === currentPage ? (
                            <span className="px-3 py-2 text-sm font-medium bg-primary text-white rounded-md">
                              {pageNum}
                            </span>
                          ) : (
                            <button
                              onClick={() => handlePageChange(pageNum)}
                              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md"
                            >
                              {pageNum}
                            </button>
                          )}
                        </React.Fragment>
                      );
                    })}
                  {currentPage < totalPages && (
                    <>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        다음
                      </button>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        마지막
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 추가 모달 */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">새 대상자 추가</h3>
              <form onSubmit={handleAddSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일 *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상세</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {submitting ? '추가 중...' : '추가'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">대상자 정보 수정</h3>
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이름 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">이메일 *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상세</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {submitting ? '수정 중...' : '수정'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 개별 삭제 모달 */}
      {deleteModalOpen && editingParticipant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">삭제 확인</h3>
              <p className="text-sm text-gray-500 mb-6">
                '{editingParticipant.name}'님을 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 선택 삭제 모달 */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">선택삭제 확인</h3>
              <p className="text-sm text-gray-500 mb-6">
                선택한 <span className="font-medium">{selectedIds.size}</span>명의 대상자를 삭제하시겠습니까?<br />
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={closeBulkDeleteModal}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  취소
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 메시지 모달 */}
      {messageModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div
                className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                  messageModalContent.isSuccess ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                <i
                  className={`${
                    messageModalContent.isSuccess ? 'fas fa-check-circle text-green-600' : 'fas fa-exclamation-circle text-red-600'
                  } text-2xl`}
                ></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">{messageModalContent.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{messageModalContent.message}</p>
              <button
                onClick={closeMessageModal}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

