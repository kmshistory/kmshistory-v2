import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30초로 증가 (이메일 발송 등 시간이 걸리는 작업 대비)
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // 쿠키 자동 포함 (백엔드 JWT 쿠키 방식)
});

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config) => {
    // JWT는 HttpOnly 쿠키(access_token)로 자동 전송됨
    // withCredentials: true로 쿠키 자동 포함
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    
    // 401 Unauthorized - 로그인 필요
    if (status === 401) {
      // /auth/me는 로그인 상태 확인용이므로 401이 정상 (리다이렉트 안함)
      if (url.includes('/auth/me')) {
        // 조용히 처리 (로그인하지 않은 상태로 간주)
        return Promise.reject(error);
      }

      if (url.includes('/quiz/')) {
        window.location.href = '/login-required';
        return Promise.reject(error);
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // 현재 페이지가 로그인 페이지가 아닐 때만 리다이렉트
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // 403 Forbidden - 권한 없음
    if (status === 403) {
      // 관리자 페이지 접근 시도 실패
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin-required';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
