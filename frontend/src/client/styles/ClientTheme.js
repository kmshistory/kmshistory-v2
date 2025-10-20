// 클라이언트 테마 설정
export const clientTheme = {
  // 레이아웃
  layout: {
    header: {
      height: '4rem', // 64px
      backgroundColor: '#051326',
      borderBottom: 'none',
      shadow: 'none'
    },
    footer: {
      backgroundColor: '#051326',
      color: '#979DA6',
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
      color: '#D1D5DB',
      hoverColor: '#F2F2F2',
      fontWeight: 'bold',
      transition: 'color 200ms ease-in-out'
    },
    activeLink: {
      color: '#F2F2F2',
      fontWeight: 'bold'
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
  }
};
