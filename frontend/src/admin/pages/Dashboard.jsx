import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../shared/api/client';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    summary: {},
    upcoming_events: [],
    recent_notifications: []
  });
  const navigate = useNavigate();

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '대시보드 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/dashboard/overview');
      console.log('대시보드 응답:', response.data);
      setDashboardData({
        summary: response.data.summary || {},
        upcoming_events: response.data.upcoming_events || [],
        recent_notifications: response.data.recent_notifications || []
      });
    } catch (err) {
      console.error('대시보드 데이터 조회 에러:', err);
      console.error('에러 상세:', err.response?.data);
      if (err.response?.status === 401 || err.response?.status === 403) {
        // 인증/인가 오류는 authProvider가 처리
        setError('관리자 권한이 필요합니다.');
      } else {
        const errorMsg = err.response?.data?.detail || err.message || '대시보드 데이터를 불러오는 중 오류가 발생했습니다.';
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const stats = dashboardData.summary;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // primary 색상 (테마에 맞게 조정)
  const primaryColor = 'bg-blue-600';

  return (
    <div className="w-full">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">강민성 한국사 관리자 시스템</h1>
              <p className="mt-2 text-gray-600">서비스의 모든 기능을 관리합니다.</p>
            </div>
            <div className="hidden sm:block">
              <div className="w-16 h-16 overflow-hidden">
                <img
                  src="https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdna%2FyqW4L%2FbtsQDbCqlgQ%2FAAAAAAAAAAAAAAAAAAAAABI9RXHqXJ6XSXpNFdsQwPbu4zo9nPIOKXoxwbMo4hH0%2Fimg.png%3Fcredential%3DyqXZFxpELC7KVnFOS48ylbz2pIh7yKj8%26expires%3D1759244399%26allow_ip%3D%26allow_referer%3D%26signature%3DqqLlYwHqMc9Ap4MESmCem2kcSQ8%253D"
                  alt="강민성 한국사"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Members */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600 text-2xl"></i>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">전체 회원 수</h3>
              <p className="text-3xl font-bold text-blue-600 mb-1">{stats?.total_users || 0}</p>
              <p className="text-xs text-gray-500">등록된 회원 수</p>
            </div>
          </div>
        </div>

        {/* Total Participants */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-plus text-green-600 text-2xl"></i>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">전체 대상자</h3>
              <p className="text-3xl font-bold text-green-600 mb-1">{stats?.total_participants || 0}</p>
              <p className="text-xs text-gray-500">등록된 대상자 수</p>
            </div>
          </div>
        </div>

        {/* Total Questions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-question-circle text-purple-600 text-2xl"></i>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">전체 문제 수</h3>
              <p className="text-3xl font-bold text-purple-600 mb-1">{stats?.total_questions || 0}</p>
              <p className="text-xs text-gray-500">등록된 문제 개수</p>
            </div>
          </div>
        </div>

        {/* Total Bundles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-layer-group text-orange-600 text-2xl"></i>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">전체 테마형 수</h3>
              <p className="text-3xl font-bold text-orange-600 mb-1">{stats?.total_bundles || 0}</p>
              <p className="text-xs text-gray-500">생성된 테마형 개수</p>
            </div>
          </div>
        </div>

        {/* Total Draws */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-trophy text-yellow-600 text-2xl"></i>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">전체 추첨 수</h3>
              <p className="text-3xl font-bold text-yellow-600 mb-1">{stats?.total_draws || 0}</p>
              <p className="text-xs text-gray-500">등록된 추첨 기록</p>
            </div>
          </div>
        </div>

        {/* Unread Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-bell text-red-600 text-2xl"></i>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-sm font-medium text-gray-600 mb-1">읽지 않은 알림</h3>
              <p className="text-3xl font-bold text-red-600 mb-1">{stats?.unread_notifications || 0}</p>
              <p className="text-xs text-gray-500">확인 대기 중인 알림</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Management Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">관리 기능</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 ${primaryColor} rounded-lg flex items-center justify-center`}>
                  <i className="fas fa-users text-white"></i>
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900">회원 관리</h4>
                <p className="text-sm text-gray-500">사용자 목록 확인 및 관리</p>
              </div>
              <div className="ml-auto">
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/draw')}
              className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-white"></i>
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900">추첨 관리</h4>
                <p className="text-sm text-gray-500">당첨자 목록 및 추첨 작업 조회</p>
              </div>
              <div className="ml-auto">
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </button>
          </div>
        </div>

        {/* System Settings */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">시스템 설정</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/settings')}
              className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                  <i className="fas fa-cog text-white"></i>
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900">기본 설정</h4>
                <p className="text-sm text-gray-500">시스템 설정 및 약관 관리</p>
              </div>
              <div className="ml-auto">
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </button>

            <button
              onClick={() => navigate('/admin/participants')}
              className="w-full flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <i className="fas fa-list text-white"></i>
                </div>
              </div>
              <div className="ml-3 text-left">
                <h4 className="text-sm font-medium text-gray-900">대상자 관리</h4>
                <p className="text-sm text-gray-500">대상자 관리 페이지 - 클라이언트</p>
              </div>
              <div className="ml-auto">
                <i className="fas fa-chevron-right text-gray-400"></i>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Upcoming Events & Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">다가오는 일정</h3>
            <button
              onClick={() => navigate('/admin/schedule')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              전체 보기
            </button>
          </div>
          {dashboardData.upcoming_events && dashboardData.upcoming_events.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.upcoming_events.slice(0, 5).map((event, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{event.summary || '제목 없음'}</h4>
                      <div className="flex items-center text-xs text-gray-500 space-x-3">
                        {event.start && (
                          <span>
                            <i className="fas fa-calendar-alt mr-1"></i>
                            {new Date(event.start).toLocaleDateString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        )}
                        {event.location && (
                          <span>
                            <i className="fas fa-map-marker-alt mr-1"></i>
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-700"
                        title="캘린더에서 보기"
                      >
                        <i className="fas fa-external-link-alt text-xs"></i>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-calendar-times text-4xl mb-3 opacity-50"></i>
              <p className="text-sm">다가오는 일정이 없습니다</p>
            </div>
          )}
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">최근 알림</h3>
            <button
              onClick={() => navigate('/admin/notifications')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              전체 보기
            </button>
          </div>
          {dashboardData.recent_notifications && dashboardData.recent_notifications.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recent_notifications.slice(0, 5).map((notification, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg transition-colors duration-200 ${
                    notification.is_read
                      ? 'bg-gray-50 hover:bg-gray-100'
                      : 'bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            notification.type === 'user_joined'
                              ? 'bg-blue-100 text-blue-800'
                              : notification.type === 'draw_saved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {notification.type === 'user_joined'
                            ? '사용자 가입'
                            : notification.type === 'draw_saved'
                            ? '추첨 결과'
                            : '기타'}
                        </span>
                        {!notification.is_read && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            새
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 mb-1">{notification.title}</h4>
                      {notification.created_at && (
                        <p className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-bell-slash text-4xl mb-3 opacity-50"></i>
              <p className="text-sm">최근 알림이 없습니다</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
