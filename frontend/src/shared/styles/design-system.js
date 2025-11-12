// 강민성 한국사 디자인 시스템
export const designSystem = {
  // 색상 팔레트
  colors: {
    // 메인 색상
    primary: '#061F40',      // 진한 파란색 (메인 브랜드)
    secondary: '#062540',    // 보조 파란색
    accent: '#F2F2F2',       // 연한 회색 (배경)
    light: '#979DA6',       // 중간 회색 (텍스트)
    dark: '#051326',        // 매우 진한 파란색
    
    // 삼성 테마 색상
    samsungBlue: '#1428a0',
    samsungLight: '#f8fafc',
    
    // 상태 색상
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // 그레이 스케일
    gray: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827'
    }
  },

  // 타이포그래피
  typography: {
    fontFamily: {
      sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'sans-serif']
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem'     // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },

  // 간격 시스템
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
    '4xl': '6rem'    // 96px
  },

  // 그림자
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
  },

  // 둥근 모서리
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    base: '0.25rem',  // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px'
  },

  // 애니메이션
  transitions: {
    fast: '150ms ease-in-out',
    normal: '200ms ease-in-out',
    slow: '300ms ease-in-out'
  }
};

// 그라디언트
export const gradients = {
  primary: 'linear-gradient(135deg, #061F40 0%, #062540 50%, #051326 100%)',
  dark: 'linear-gradient(180deg, #051326 0%, #061F40 50%, #051326 100%)',
  light: 'linear-gradient(135deg, #979DA6 0%, #061F40 100%)'
};

// 유틸리티 클래스
export const utilityClasses = {
  // 텍스트 줄임 처리
  lineClamp1: {
    display: '-webkit-box',
    WebkitLineClamp: 1,
    lineClamp: 1,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  lineClamp2: {
    display: '-webkit-box',
    WebkitLineClamp: 2,
    lineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  lineClamp3: {
    display: '-webkit-box',
    WebkitLineClamp: 3,
    lineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },

  // 카드 호버 효과
  cardHover: {
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px rgba(0,0,0,.1)'
    }
  },

  // 커스텀 스크롤바
  customScrollbar: {
    '&::-webkit-scrollbar': {
      width: '6px'
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent'
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#979DA6',
      borderRadius: '3px'
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: '#6b7280'
    }
  }
};
