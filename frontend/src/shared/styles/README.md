# KMS History 디자인 시스템

## 개요
기존 Jinja2 템플릿의 디자인을 React 컴포넌트로 마이그레이션하기 위한 디자인 시스템입니다.

## 색상 팔레트
- **Primary**: `#061F40` - 메인 브랜드 색상 (진한 파란색)
- **Secondary**: `#062540` - 보조 색상
- **Accent**: `#F2F2F2` - 강조 색상 (연한 회색)
- **Light**: `#979DA6` - 중간 회색 (텍스트)
- **Dark**: `#051326` - 매우 진한 파란색

## 폰트
- **Primary Font**: Pretendard Variable
- **Fallback**: Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, Helvetica Neue, Segoe UI, Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic

## 컴포넌트별 테마

### 클라이언트 테마 (`ClientTheme.js`)
- 헤더: 진한 파란색 배경 (`#051326`)
- 네비게이션: 회색 텍스트, 호버 시 밝은 회색
- 카드: 흰색 배경, 그림자 효과, 호버 시 위로 이동
- 버튼: Primary (진한 파란색), Secondary (투명 배경 + 테두리)

### 관리자 테마 (`AdminTheme.js`)
- 사이드바: 진한 파란색 배경 (`#061F40`)
- 메인 영역: 연한 회색 배경 (`#F8FAFC`)
- 카드/페이퍼: 흰색 배경, 둥근 모서리
- 테이블: 짝수 행 회색 배경, 호버 효과

## 사용법

### 1. 글로벌 스타일 적용
```jsx
import './shared/styles/globals.css';
```

### 2. 테마 프로바이더 사용
```jsx
import { ThemeProvider } from './shared/components/ThemeProvider';

function App() {
  return (
    <ThemeProvider theme="client">
      {/* 클라이언트 컴포넌트들 */}
    </ThemeProvider>
  );
}
```

### 3. 테마 훅 사용
```jsx
import { useTheme } from './shared/components/ThemeProvider';

function MyComponent() {
  const theme = useTheme();
  const primaryColor = theme.colors.primary;
  
  return <div style={{ color: primaryColor }}>Hello</div>;
}
```

### 4. 클라이언트 레이아웃
```jsx
import ClientLayout from './client/components/ClientLayout';
```

### 5. 관리자 레이아웃
```jsx
import AdminLayout from './admin/components/AdminLayout';
```

## 유틸리티 클래스

### 텍스트 줄임 처리
- `.line-clamp-1`: 1줄 줄임
- `.line-clamp-2`: 2줄 줄임  
- `.line-clamp-3`: 3줄 줄임

### 카드 호버 효과
- `.card-hover`: 호버 시 위로 이동 + 그림자 효과

### 그라디언트 배경
- `.gradient-bg`: 메인 그라디언트
- `.dark-gradient-bg`: 진한 그라디언트
- `.light-gradient-bg`: 연한 그라디언트

### 커스텀 스크롤바
- `.custom-scrollbar`: 커스텀 스크롤바 스타일

## 반응형 디자인
- **Mobile**: 768px 이하
- **Desktop**: 769px 이상

## 아이콘
- **Font Awesome**: 메인 아이콘 라이브러리
- **Material Icons**: Google Material Design 아이콘
