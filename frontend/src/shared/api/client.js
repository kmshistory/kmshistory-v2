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
    // /auth/me 요청에 플래그 추가 (401 에러 조용히 처리)
    if (config.url?.includes('/auth/me')) {
      config.silent401 = true;
      // validateStatus를 동적으로 설정하여 401을 정상 응답으로 처리
      const originalValidateStatus = config.validateStatus;
      config.validateStatus = function (status) {
        // /auth/me의 401은 정상 응답으로 처리
        if (status === 401) {
          return true;
        }
        // 원래 validateStatus가 있으면 사용, 없으면 기본값
        if (originalValidateStatus) {
          return originalValidateStatus(status);
        }
        return status >= 200 && status < 300;
      };
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    // /auth/me의 401 응답을 에러로 변환하여 catch 블록에서 처리할 수 있도록 함
    if (response.config?.url?.includes('/auth/me') && response.status === 401) {
      // 401을 에러로 변환하되, validateStatus로 이미 정상 응답으로 처리되어
      // 브라우저 콘솔에는 에러가 출력되지 않음
      const error = new Error('Unauthorized');
      error.response = response;
      error.config = response.config;
      error.silent = true; // 콘솔 출력 방지 플래그
      return Promise.reject(error);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    const isAuthMe = url.includes('/auth/me');
    
    // 401 Unauthorized - 로그인 필요
    if (status === 401) {
      // /auth/me는 validateStatus에서 이미 처리되므로 여기서는 다른 401만 처리
      if (isAuthMe) {
        // 조용히 처리 (로그인하지 않은 상태로 간주)
        error.silent = true;
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
