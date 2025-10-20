import React, { createContext, useContext } from 'react';
import { designSystem } from '../styles/design-system';

// 테마 컨텍스트 생성
const ThemeContext = createContext();

// 테마 프로바이더 컴포넌트
export const ThemeProvider = ({ children, theme = 'client' }) => {
  const themeConfig = {
    client: {
      ...designSystem,
      mode: 'client'
    },
    admin: {
      ...designSystem,
      mode: 'admin'
    }
  };

  const currentTheme = themeConfig[theme] || themeConfig.client;

  return (
    <ThemeContext.Provider value={currentTheme}>
      {children}
    </ThemeContext.Provider>
  );
};

// 테마 훅
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 테마 유틸리티 함수들
export const themeUtils = {
  // 색상 가져오기
  getColor: (theme, colorPath) => {
    const keys = colorPath.split('.');
    let value = theme.colors;
    for (const key of keys) {
      value = value?.[key];
    }
    return value;
  },

  // 간격 가져오기
  getSpacing: (theme, size) => {
    return theme.spacing[size] || size;
  },

  // 그림자 가져오기
  getShadow: (theme, shadow) => {
    return theme.shadows[shadow] || shadow;
  },

  // 반응형 브레이크포인트
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  }
};
