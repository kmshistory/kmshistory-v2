// 관리자 테마 설정 (React-Admin 커스터마이징)
export const adminTheme = {
  // React-Admin 테마 오버라이드
  palette: {
    primary: {
      main: '#061F40',
      light: '#062540',
      dark: '#051326'
    },
    secondary: {
      main: '#979DA6',
      light: '#F2F2F2',
      dark: '#6B7280'
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF'
    },
    text: {
      primary: '#051326',
      secondary: '#6B7280'
    }
  },

  // 타이포그래피 설정 - Pretendard 폰트 전역 적용
  typography: {
    fontFamily: [
      'Pretendard Variable',
      'Pretendard',
      '-apple-system',
      'BlinkMacSystemFont',
      'system-ui',
      'Roboto',
      'Helvetica Neue',
      'Segoe UI',
      'Apple SD Gothic Neo',
      'Noto Sans KR',
      'Malgun Gothic',
      'Apple Color Emoji',
      'Segoe UI Emoji',
      'Segoe UI Symbol',
      'sans-serif'
    ].join(',')
  },

  // 사이드바
  sidebar: {
    width: '15rem', // 240px
    collapsedWidth: '4rem', // 64px
    backgroundColor: '#061F40',
    color: 'white',
    transition: 'width 300ms ease-in-out'
  },

  // 헤더
  header: {
    height: '4rem', // 64px
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E5E7EB',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },

  // 메인 콘텐츠
  main: {
    backgroundColor: '#F8FAFC',
    minHeight: 'calc(100vh - 4rem)',
    padding: '1.5rem'
  },

  // 카드/페이퍼
  paper: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    padding: '1.5rem'
  },

  // 테이블
  table: {
    header: {
      backgroundColor: '#F8FAFC',
      fontWeight: '600',
      color: '#051326'
    },
    row: {
      '&:nth-of-type(even)': {
        backgroundColor: '#F9FAFB'
      },
      '&:hover': {
        backgroundColor: '#F3F4F6'
      }
    }
  },

  // 버튼
  button: {
    primary: {
      backgroundColor: '#061F40',
      color: 'white',
      '&:hover': {
        backgroundColor: '#062540'
      }
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#061F40',
      border: '1px solid #061F40',
      '&:hover': {
        backgroundColor: '#F8FAFC'
      }
    }
  },

  // 폼
  form: {
    input: {
      border: '1px solid #D1D5DB',
      borderRadius: '0.375rem',
      '&:focus': {
        borderColor: '#061F40',
        boxShadow: '0 0 0 3px rgba(6, 31, 64, 0.1)'
      }
    }
  },

  // 상태 색상
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  }
};

// React-Admin 컴포넌트 커스터마이징을 위한 스타일
export const adminComponentStyles = {
  // 사이드바 메뉴 아이템
  menuItem: {
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)'
    },
    '&.active': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)'
    }
  },

  // 데이터 테이블
  dataTable: {
    '& .MuiTableHead-root': {
      backgroundColor: '#F8FAFC'
    },
    '& .MuiTableRow-root:nth-of-type(even)': {
      backgroundColor: '#F9FAFB'
    },
    '& .MuiTableRow-root:hover': {
      backgroundColor: '#F3F4F6'
    }
  },

  // 필터 폼
  filterForm: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
  },

  // 액션 버튼
  actionButton: {
    backgroundColor: '#061F40',
    color: 'white',
    '&:hover': {
      backgroundColor: '#062540'
    }
  }
};
