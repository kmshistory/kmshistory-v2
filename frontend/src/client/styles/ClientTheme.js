// 클라이언트 테마 설정
export const clientTheme = {
  // 레이아웃
  layout: {
    header: {
      height: 'auto', // 내용에 따라 자동 조정 (기존과 동일)
      backgroundColor: '#051326', // 기존 bg-dark 색상
      borderBottom: 'none',
      shadow: 'none' // 기존과 동일
    },
    footer: {
      backgroundColor: '#051326',
      color: '#FFFFFF',
      padding: '2rem 0'
    },
    container: {
      maxWidth: '80rem', // 1280px
      margin: '0 auto',
      padding: '0 1rem'
    }
  },

  // 네비게이션
  navigation: {
    link: {
      color: '#D1D5DB', // text-gray-300
      hoverColor: '#F2F2F2', // text-light
      fontWeight: 'bold',
      transition: 'color 200ms ease-in-out'
    },
    activeLink: {
      color: '#F2F2F2', // text-light
      fontWeight: 'bold'
    },
    mobileMenu: {
      backgroundColor: '#051326', // bg-dark
      borderTopColor: '#374151', // border-gray-700
      hoverBackgroundColor: '#374151', // hover:bg-gray-700
      textColor: '#D1D5DB', // text-gray-300
      hoverTextColor: '#F2F2F2' // hover:text-light
    }
  },

  // 카드 컴포넌트
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px rgba(0,0,0,.1)'
    }
  },

  // 버튼 스타일
  button: {
    primary: {
      backgroundColor: '#061F40',
      color: 'white',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      fontWeight: '600',
      transition: 'all 200ms ease-in-out',
      '&:hover': {
        backgroundColor: '#062540',
        transform: 'translateY(-1px)'
      }
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#061F40',
      border: '2px solid #061F40',
      padding: '0.75rem 1.5rem',
      borderRadius: '0.375rem',
      fontWeight: '600',
      transition: 'all 200ms ease-in-out',
      '&:hover': {
        backgroundColor: '#061F40',
        color: 'white'
      }
    }
  },

  // 폼 요소
  form: {
    input: {
      border: '1px solid #D1D5DB',
      borderRadius: '0.375rem',
      padding: '0.75rem',
      fontSize: '1rem',
      transition: 'border-color 200ms ease-in-out',
      '&:focus': {
        outline: 'none',
        borderColor: '#061F40',
        boxShadow: '0 0 0 3px rgba(6, 31, 64, 0.1)'
      }
    },
    label: {
      color: '#374151',
      fontWeight: '600',
      marginBottom: '0.5rem',
      display: 'block'
    }
  },

  // 공지사항/FAQ 카드
  contentCard: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '1rem',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 25px rgba(0,0,0,.1)'
    }
  },

  // 홈 페이지 스타일
  home: {
    mainCard: {
      backgroundColor: 'rgba(6, 31, 64, 0.1)', // bg-primary/10
      backdropBlur: true,
      borderColor: 'rgba(255, 255, 255, 0.5)', // border-white/50
      borderWidth: '2px',
      borderRadius: '0.5rem',
      padding: '2rem',
      hoverBackgroundColor: 'rgba(6, 31, 64, 0.2)', // hover:bg-primary/20
      transition: 'all 0.3s ease'
    },
    secondaryCard: {
      backgroundColor: 'rgba(6, 37, 64, 0.1)', // bg-secondary/10
      backdropBlur: true,
      borderColor: 'rgba(255, 255, 255, 0.5)', // border-white/50
      borderWidth: '2px',
      borderRadius: '0.5rem',
      padding: '2rem',
      hoverBackgroundColor: 'rgba(6, 37, 64, 0.2)', // hover:bg-secondary/20
      transition: 'all 0.3s ease'
    },
    smallCard: {
      backgroundColor: 'rgba(151, 157, 166, 0.1)', // bg-light/10
      backdropBlur: true,
      borderColor: 'rgba(255, 255, 255, 0.5)', // border-white/50
      borderWidth: '2px',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      hoverBackgroundColor: 'rgba(151, 157, 166, 0.2)', // hover:bg-light/20
      transition: 'all 0.3s ease'
    },
    iconColors: {
      blue: '#3B82F6', // bg-blue-500
      yellow: '#EAB308', // bg-yellow-500
      green: '#10B981' // bg-green-500
    }
  }
};
