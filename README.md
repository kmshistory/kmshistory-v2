# 강민성 한국사 (KMS History)

교육·커뮤니티형 웹 서비스. **한국사 퀴즈**, **공지/FAQ**, **추첨**, **일정(Google Calendar 연동)** 등을 제공하는 풀스택 프로젝트.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 서비스명 | 강민성 한국사 |
| 역할 | 풀스택 웹 개발 (프론트·백엔드·DB·인증·외부 API) |
| 구성 | SPA(React) + REST API(FastAPI), 백엔드가 프론트 정적 파일 서빙 |
| 배포 | 운영 / 스테이징 이중 환경 (`.env` / `.env.staging`, `dist` / `dist-staging`) |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **프론트** | React 18, Vite 7, React Router v6, Axios, Tailwind CSS, React Icons, React Admin(관리자), 다크/라이트 테마 |
| **백엔드** | FastAPI, PostgreSQL, SQLAlchemy 2.0, Alembic, JWT, Bcrypt, Pydantic v2 |
| **인증·외부** | Google OAuth 2.0, 네이버 로그인, Google Calendar API, Google Drive API, FastAPI Mail(이메일 인증·비밀번호 찾기) |
| **인프라** | Uvicorn(ASGI), 환경별 빌드(`dist` / `dist-staging`) |

---

## 빠른 시작

### 요구사항

- Node.js (npm)
- Python 3.x + 가상환경 (`.venv`)
- PostgreSQL
- 루트의 `.env` (DB, OAuth, 메일 등 설정)

### 로컬 실행

**프론트엔드**

```bash
cd frontend
npm install
npm run dev
```

**백엔드**

```bash
cd backend
source ../.venv/bin/activate
pip install -r ../requirements.txt
uvicorn app.main:app --reload
```

- 기본적으로 루트의 `.env`를 사용합니다. 스테이징 설정으로 확인하려면 `ENV_FILE=.env.staging`으로 백엔드를 실행하고, 프론트는 `MODE=staging npm run dev`로 실행할 수 있습니다.

---

## 화면 구성

- **사용자(클라이언트)** `/`: 홈, `/notices`, `/faq`, `/schedule`, `/quiz`, `/login`, `/register`, `/mypage`, `/privacy`, `/terms` 등. 공통 레이아웃 `ClientLayout`, 다크/라이트 테마.
- **관리자** `/admin`: 대시보드, 회원/대상자 관리, 추첨, 퀴즈·통계, 일정, 공지·FAQ, 알림, 설정. React Admin 기반 `AdminLayout`.

전체 경로·설명은 [docs/PORTFOLIO.md](docs/PORTFOLIO.md)의 「화면 구성」 참고.

---

## 프로젝트 구조

```
kmshistory-v2/
├── frontend/
│   ├── src/
│   │   ├── client/          # 사용자: 페이지·ClientLayout·스타일
│   │   ├── admin/           # 관리자: App·페이지·AdminLayout·auth/dataProvider
│   │   └── shared/          # API 클라이언트, 테마, 공통 컴포넌트
│   └── dist / dist-staging  # 환경별 빌드 결과물
├── backend/
│   ├── app/
│   │   ├── routers/         # client / admin API·템플릿
│   │   ├── models/          # SQLAlchemy (user, quiz, notice, faq, participant 등)
│   │   ├── schemas/         # Pydantic 요청/응답
│   │   ├── services/        # auth, quiz, calendar, draw 등 비즈니스 로직
│   │   ├── database/
│   │   └── config.py
│   └── scripts/             # Google OAuth 토큰 갱신 등 유틸
├── .env / .env.staging
├── requirements.txt
└── docs/
```

---

## 배포

### 환경 요약

| 구분 | env 파일 | 프론트 빌드 결과 | 백엔드 포트 | 용도 |
|------|----------|------------------|-------------|------|
| **운영** | `.env` | `frontend/dist` | 8015 | 프로덕션 |
| **스테이징** | `.env.staging` | `frontend/dist-staging` | 8016 | 스테이징 |

모든 프론트 빌드는 **`frontend` 디렉터리**에서 실행.

### 운영

```bash
cd frontend
npm run build
# → frontend/dist/ 를 운영 백엔드가 서빙

cd backend
source ../.venv/bin/activate
uvicorn app.main:app --host 127.0.0.1 --port 8015
```

### 스테이징

```bash
cd frontend
MODE=staging VITE_BUILD_TARGET=staging npm run build
# 또는 npm run build:staging (출력만 dist-staging, .env.staging 반영은 MODE=staging 필요)
# → frontend/dist-staging/ 를 스테이징 백엔드가 서빙

cd backend
source ../.venv/bin/activate
ENV_FILE=.env.staging uvicorn app.main:app --host 127.0.0.1 --port 8016
```

- 스테이징에서 **.env.staging 값을 쓰려면** 프론트 빌드 시 `MODE=staging`을 함께 넣어야 합니다. 상세는 [docs/DEPLOY_ENV_AND_STAGING.md](docs/DEPLOY_ENV_AND_STAGING.md) 참고.

**systemd** 사용 시 스테이징 예: `sudo systemctl restart kmshistory-staging` (서비스에서 `ENV_FILE=.env.staging`, 포트 8016 적용).

**접속 예시**: 운영 `https://kmshistory.kr` (8015, `dist`) / 스테이징 `https://staging.kmshistory.kr` 또는 `http://localhost:8016` (8016, `dist-staging`).

---

## 문서

| 문서 | 설명 |
|------|------|
| [docs/PORTFOLIO.md](docs/PORTFOLIO.md) | 포트폴리오 요약, 화면 구성 전체, 기술 스택, 담당 포인트 |
| [docs/DEPLOY_ENV_AND_STAGING.md](docs/DEPLOY_ENV_AND_STAGING.md) | 운영/스테이징 환경별 빌드·실행·배포 상세 |
| [docs/STAGING_BUILD_AND_RUN.md](docs/STAGING_BUILD_AND_RUN.md) | 스테이징 빌드 및 실행 방법 |
