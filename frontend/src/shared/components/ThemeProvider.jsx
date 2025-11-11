import React, { createContext, useContext } from 'react';
import { designSystem } from '../styles/design-system';

/**
 * 🔹 ThemeContext
 * - client / admin 테마를 나눠 관리
 * - designSystem 기반으로 구성
 */
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children, theme = 'client' }) => {
  // 각 테마별 설정
  const themeConfig = {
    client: {
      ...designSystem,
      mode: 'client',
      background: '#F8FAFC', // 클라이언트용 밝은 배경
    },
    admin: {
      ...designSystem,
      mode: 'admin',
      background: '#F3F4F6', // 관리자용 연한 회색 배경
    },
  };

  const currentTheme = themeConfig[theme] || themeConfig.client;

  return (
    <ThemeContext.Provider value={currentTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 🔹 useTheme 훅
 * - 현재 테마 객체(designSystem 확장본) 접근 가능
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * 🔹 themeUtils
 * - designSystem 기반 유틸 함수 모음
 */
export const themeUtils = {
  /** 색상 가져오기 (예: getColor(theme, 'gray.500')) */
  getColor: (theme, colorPath) => {
    const keys = colorPath.split('.');
    let value = theme.colors;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  },

  /** 간격 가져오기 (예: getSpacing(theme, 'md')) */
  getSpacing: (theme, size) => {
    return theme.spacing[size] || size;
  },

  /** 그림자 가져오기 (예: getShadow(theme, 'lg')) */
  getShadow: (theme, shadow) => {
    return theme.shadows[shadow] || shadow;
  },

  /** 반응형 브레이크포인트 */
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};
