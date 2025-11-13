import React, { useState, useEffect } from 'react';
import apiClient from '../../shared/api/client';

export default function Schedule() {
  // 상태 관리
  const [events, setEvents] = useState([]);
  const [upcomingEventsData, setUpcomingEventsData] = useState([]);
  const [completedEventsData, setCompletedEventsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTab, setCurrentTab] = useState('upcoming');
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  // 폼 상태
  const [formData, setFormData] = useState({
    summary: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    description: '',
  });

  // 페이지 타이틀 설정
  useEffect(() => {
    document.title = '일정 관리 | 강민성 한국사';
    return () => {
      document.title = '강민성 한국사';
    };
  }, []);

  // 일정 목록 로드
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const upcomingRes = await apiClient.get('/calendar/admin/events');
      console.log('API 응답 전체 (예정):', upcomingRes.data);
      const upcomingEvents = upcomingRes.data.events || [];
      console.log('로드된 예정 일정 목록:', upcomingEvents);
      console.log('예정 일정 개수:', upcomingEvents.length);
      setUpcomingEventsData(upcomingEvents);

      let combinedEvents = [...upcomingEvents];

      try {
        const pastRes = await apiClient.get('/calendar/admin/events', {
          params: { status: 'completed' },
        });
        console.log('API 응답 전체 (종료 포함):', pastRes.data);
        const pastEventsRaw = pastRes.data.events || [];
        const now = new Date();
        const completedOnly = pastEventsRaw.filter((event) => {
          if (!event.end) return false;
          try {
            const endDate = new Date(event.end);
            return endDate <= now;
          } catch (e) {
            console.error('종료 일정 필터링 중 날짜 파싱 오류:', event.end, e);
            return false;
          }
        });
        console.log('로드된 종료 일정 목록:', completedOnly);
        console.log('종료 일정 개수:', completedOnly.length);
        setCompletedEventsData(completedOnly);
        if (completedOnly.length > 0) {
          const eventMap = new Map();
          upcomingEvents.forEach((event) => {
            eventMap.set(event.id, event);
          });
          completedOnly.forEach((event) => {
            eventMap.set(event.id, event);
          });
          combinedEvents = Array.from(eventMap.values());
        }
      } catch (pastErr) {
        console.warn('종료된 일정 조회 실패:', pastErr);
        setCompletedEventsData([]);
      }

      setEvents(combinedEvents);
      console.log('최종 일정 목록:', combinedEvents);
      console.log('최종 일정 개수:', combinedEvents.length);
      if (combinedEvents.length === 0) {
        // 일정이 없거나 Google Calendar 서비스가 초기화되지 않은 경우
        console.warn('일정 목록이 비어있습니다. Google Calendar 서비스가 초기화되지 않았거나 일정이 없을 수 있습니다.');
        console.warn('백엔드 로그를 확인하여 Google Calendar 서비스 초기화 상태를 확인하세요.');
      }
    } catch (err) {
      console.error('일정 목록 조회 실패:', err);
      console.error('에러 상세:', err.response?.data);
      const errorMessage = err.response?.data?.detail || '일정 목록을 불러오는데 실패했습니다.';
      showNotification(errorMessage, 'error');
      // 에러가 발생해도 빈 배열로 설정하여 UI가 깨지지 않도록 함
      setEvents([]);
      setUpcomingEventsData([]);
      setCompletedEventsData([]);
    } finally {
      setLoading(false);
    }
  };

  // 알림 표시
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // 모달 열기 (추가)
  const openCreateModal = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // 종료 시간은 시작 시간 + 1시간
    const endTime = new Date(now.getTime() + 60 * 60 * 1000);
    const endTimeString = endTime.toTimeString().slice(0, 5);

    setFormData({
      summary: '',
      start_date: today,
      start_time: currentTime,
      end_date: today,
      end_time: endTimeString,
      location: '',
      description: '',
    });
    setEditingEvent(null);
    setShowModal(true);
  };

  // 모달 열기 (수정)
  const openEditModal = async (eventId) => {
    try {
      const res = await apiClient.get(`/calendar/admin/events/${eventId}`);
      const event = res.data.event || res.data;

      const startDate = new Date(event.start);
      const endDate = new Date(event.end);

      setFormData({
        summary: event.summary || '',
        start_date: startDate.toISOString().split('T')[0],
        start_time: startDate.toTimeString().slice(0, 5),
        end_date: endDate.toISOString().split('T')[0],
        end_time: endDate.toTimeString().slice(0, 5),
        location: event.location || '',
        description: event.description || '',
      });
      setEditingEvent(eventId);
      setShowModal(true);
    } catch (err) {
      console.error('일정 정보 조회 실패:', err);
      showNotification('일정 정보를 불러오는데 실패했습니다.', 'error');
    }
  };

  // 모달 닫기
  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
    setFormData({
      summary: '',
      start_date: '',
      start_time: '',
      end_date: '',
      end_time: '',
      location: '',
      description: '',
    });
  };

  // 일정 저장 (추가/수정)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
    const endDateTime = `${formData.end_date}T${formData.end_time}:00`;

    const eventData = {
      summary: formData.summary,
      start_time: startDateTime,
      end_time: endDateTime,
      location: formData.location,
      description: formData.description,
    };

    try {
      if (editingEvent) {
        await apiClient.put(`/calendar/admin/events/${editingEvent}`, eventData);
        showNotification('일정이 수정되었습니다.', 'success');
      } else {
        await apiClient.post('/calendar/admin/events', eventData);
        showNotification('일정이 추가되었습니다.', 'success');
      }

      closeModal();
      setTimeout(() => {
        loadEvents();
        refreshCalendar();
      }, 500);
    } catch (err) {
      console.error('일정 저장 실패:', err);
      showNotification(err.response?.data?.detail || '일정 저장에 실패했습니다.', 'error');
    }
  };

  // 일정 삭제
  const handleDelete = async (eventId, eventTitle) => {
    if (!window.confirm(`"${eventTitle}" 일정을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await apiClient.delete(`/calendar/admin/events/${eventId}`);
      showNotification('일정이 삭제되었습니다.', 'success');
      setTimeout(() => {
        loadEvents();
        refreshCalendar();
      }, 500);
    } catch (err) {
      console.error('일정 삭제 실패:', err);
      showNotification('일정 삭제에 실패했습니다.', 'error');
    }
  };

  // 시작 시간 변경 시 종료 시간 자동 업데이트
  const handleStartTimeChange = (e) => {
    const startTime = e.target.value;
    setFormData({ ...formData, start_time: startTime });

    if (startTime) {
      const [hours, minutes] = startTime.split(':');
      const startDateTime = new Date();
      startDateTime.setHours(parseInt(hours), parseInt(minutes));

      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
      const endTimeString = endDateTime.toTimeString().slice(0, 5);
      setFormData((prev) => ({ ...prev, end_time: endTimeString }));
    }
  };

  // 캘린더 iframe 새로고침
  const refreshCalendar = () => {
    const iframe = document.querySelector('.calendar-iframe');
    if (iframe) {
      const currentSrc = iframe.src;
      iframe.src = '';
      setTimeout(() => {
        iframe.src = currentSrc;
      }, 100);
    }
  };

  // 월 변경
  const changeMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // 이번 달로 이동
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
  };

  // 날짜 포맷팅
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // HTML 이스케이프
  const escapeHtml = (text) => {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  // 필터링된 이벤트 계산
  const getFilteredEvents = () => {
    const now = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthFilter = (event) => {
      if (!event.start) {
        console.warn('일정에 start 날짜가 없습니다:', event);
        return false;
      }
      try {
        const eventDate = new Date(event.start);
        const year = eventDate.getFullYear();
        const month = eventDate.getMonth();
        const matches = year === currentYear && month === currentMonth;
        if (!matches) {
          console.log('월 불일치:', {
            eventTitle: event.summary,
            eventDate: event.start,
            eventYear: year,
            eventMonth: month,
            currentYear,
            currentMonth
          });
        }
        return matches;
      } catch (e) {
        console.error('날짜 파싱 오류:', event.start, e);
        return false;
      }
    };

    const upcomingMonthEvents = (upcomingEventsData || []).filter(monthFilter);
    const completedMonthEvents = (completedEventsData || []).filter(monthFilter);

    console.log('필터링 기준:', {
      currentYear,
      currentMonth,
      totalUpcoming: upcomingEventsData.length,
      totalCompleted: completedEventsData.length,
    });
    console.log('현재 월 예정 일정 개수:', upcomingMonthEvents.length);
    console.log('현재 월 종료 일정 개수:', completedMonthEvents.length);

    return { upcoming: upcomingMonthEvents, completed: completedMonthEvents };
  };

  const { upcoming, completed } = getFilteredEvents();
  const eventsToShow = currentTab === 'upcoming' ? upcoming : completed;

  return (
    <div className="w-full">
      <div className="p-6 space-y-6">
        {/* 페이지 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">일정 관리</h1>
            <p className="text-sm text-gray-600 mt-1">구글 캘린더 일정을 관리합니다.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="bg-primary hover:bg-secondary text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <i className="fas fa-plus"></i>
            <span>일정 추가</span>
          </button>
        </div>

        {/* 구글 캘린더 iframe */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">캘린더 보기</h2>
          <div className="w-full" style={{ height: '600px' }}>
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FSeoul&showPrint=0&title=%EA%B0%95%EB%AF%BC%EC%84%B1%ED%95%9C%EA%B5%AD%EC%82%AC%20%EA%B3%B5%EC%8B%9D%EC%9D%BC%EC%A0%95&src=Y19lMzA2ZGFjYmYyNWE2ZmM4MzRmNzgyNWVlMTRmYzU5MzJjYjM3Zjg2OTQ4MDU2MTEzYWYxOTYzOGNiZDFjZWI5QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=a28uc291dGhfa29yZWEjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%233f51b5&color=%23e67c73"
              className="calendar-iframe w-full h-full border border-gray-200 rounded-lg"
              frameBorder="0"
              scrolling="no"
              title="Google Calendar"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* 일정 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">일정 목록</h2>

              {/* 월별 네비게이션 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <i className="fas fa-chevron-left text-gray-600"></i>
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-24 text-center">
                  {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <i className="fas fa-chevron-right text-gray-600"></i>
                </button>
                <button
                  onClick={goToCurrentMonth}
                  className="ml-2 px-2 py-1 text-xs bg-primary text-white rounded hover:bg-secondary"
                >
                  이번 달
                </button>
              </div>
            </div>

            <button
              onClick={loadEvents}
              className="text-primary hover:text-secondary text-sm flex items-center space-x-1"
            >
              <i className="fas fa-refresh"></i>
              <span>새로고침</span>
            </button>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setCurrentTab('upcoming')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                currentTab === 'upcoming'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>예정된 일정</span>
              <span
                className={`ml-1 text-xs px-1 rounded-full ${
                  currentTab === 'upcoming'
                    ? 'bg-primary text-white'
                    : 'bg-gray-400 text-white'
                }`}
              >
                {upcoming.length}
              </span>
            </button>
            <button
              onClick={() => setCurrentTab('completed')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                currentTab === 'completed'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>종료된 일정</span>
              <span
                className={`ml-1 text-xs px-1 rounded-full ${
                  currentTab === 'completed'
                    ? 'bg-primary text-white'
                    : 'bg-gray-400 text-white'
                }`}
              >
                {completed.length}
              </span>
            </button>
          </div>

          {/* 로딩 상태 */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">일정을 불러오는 중...</p>
            </div>
          )}

          {/* 일정 목록 */}
          {!loading && (
            <div>
              {eventsToShow.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-2">
                    {events.length === 0 ? (
                      <div>
                        <p className="text-lg font-medium mb-2">일정 목록이 비어있습니다</p>
                        <p className="text-sm text-gray-400 mb-4">
                          Google Calendar 서비스가 초기화되지 않았거나 일정이 없을 수 있습니다.
                        </p>
                        <div className="text-xs text-gray-400 space-y-1 text-left max-w-md mx-auto">
                          <p className="font-semibold mb-2">Google Calendar API 인증이 필요합니다:</p>
                          <p>• token.json 파일이 프로젝트 루트에 있어야 합니다</p>
                          <p>• GOOGLE_CALENDAR_ID 환경변수가 .env 파일에 설정되어 있어야 합니다</p>
                          <p>• Google OAuth 인증을 통해 토큰을 발급받아야 합니다</p>
                          <p className="mt-2 text-gray-500">
                            참고: Google Calendar 웹에서 직접 추가한 일정은 API 인증이 완료되어야 표시됩니다.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium mb-2">
                          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월에는 일정이 없습니다
                        </p>
                        <p className="text-sm text-gray-400">
                          다른 월을 선택하거나 일정을 추가해주세요.
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          전체 일정 개수: {events.length}개 (예정 {upcomingEventsData.length}개 / 종료 {completedEventsData.length}개)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          제목
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          시작 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          종료 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          장소
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {eventsToShow.map((event) => (
                        <tr key={event.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {escapeHtml(event.summary)}
                            </div>
                            {event.description && (
                              <div className="text-sm text-gray-500">
                                {escapeHtml(event.description).substring(0, 50)}
                                {event.description.length > 50 ? '...' : ''}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(event.start)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(event.end)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.location ? escapeHtml(event.location) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openEditModal(event.id)}
                              className="text-primary hover:text-secondary mr-3"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              onClick={() => handleDelete(event.id, event.summary)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 일정 추가/수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          onClick={closeModal}
        >
          <div
            className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingEvent ? '일정 수정' : '일정 추가'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="eventTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  일정 제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="eventTitle"
                  required
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="일정 제목을 입력하세요"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="eventStartDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    시작 날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="eventStartDate"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="eventStartTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    시작 시간 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="eventStartTime"
                    required
                    value={formData.start_time}
                    onChange={handleStartTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="eventEndDate"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    종료 날짜 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="eventEndDate"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label
                    htmlFor="eventEndTime"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    종료 시간 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    id="eventEndTime"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="eventLocation" className="block text-sm font-medium text-gray-700 mb-1">
                  장소
                </label>
                <input
                  type="text"
                  id="eventLocation"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="장소를 입력하세요"
                />
              </div>

              <div>
                <label
                  htmlFor="eventDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  설명
                </label>
                <textarea
                  id="eventDescription"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="일정 설명을 입력하세요"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors"
                >
                  {editingEvent ? '수정' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 알림 */}
      {notification.show && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-lg shadow-lg ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}

