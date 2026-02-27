# app/main.py
import asyncio
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timezone
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from app import settings, engine, Base
from app.config import FRONTEND_DIST
from app.database.connection import SessionLocal
from fastapi.middleware.cors import CORSMiddleware
import os
# 모든 모델 직접 import (metadata 등록용)
from app.models import *
from sqlalchemy.exc import SQLAlchemyError
from app.routers.admin.admin_notice_api_router import router as admin_notice_api_router
from app.routers.client.client_notice_api_router import router as client_notice_api_router
from app.routers.admin.admin_notice_template_router import router as admin_notice_template_router
from app.routers.client.client_notice_template_router import router as client_notice_template_router
from app.routers.admin.admin_faq_api_router import router as admin_faq_api_router
from app.routers.client.client_faq_api_router import router as client_faq_api_router
from app.routers.admin.admin_faq_template_router import router as admin_faq_template_router
from app.routers.client.client_faq_template_router import router as client_faq_template_router
from app.routers.admin.draw_api_router import router as draw_api_router
from app.routers.admin.draw_template_router import router as draw_template_router
from app.routers.admin.participant_api_router import router as participant_api_router
from app.routers.admin.participant_template_router import router as participant_template_router
from app.routers.admin.user_admin_api_router import router as user_admin_api_router
from app.routers.admin.user_admin_template_router import router as user_admin_template_router
from app.routers.client.auth_api_router import router as auth_api_router
from app.routers.client.auth_template_router import router as auth_template_router
from app.routers.client.mypage_api_router import router as mypage_api_router
from app.routers.client.mypage_template_router import router as mypage_template_router
from app.routers.admin.terms_api_router import router as terms_api_router
from app.routers.admin.terms_template_router import router as terms_template_router
from app.routers.admin.notification_api_router import router as notification_api_router
from app.routers.admin.notification_template_router import router as notification_template_router
from app.routers.admin.file_api_router import router as file_api_router
from app.routers.admin.file_template_router import router as file_template_router
from app.routers.admin.dashboard_api_router import router as dashboard_api_router
from app.routers.admin.dashboard_template_router import router as dashboard_template_router
from app.routers.admin.calendar_api_router import router as calendar_api_router
from app.routers.admin.calendar_template_router import router as calendar_template_router
from app.routers.admin.quiz_api_router import router as admin_quiz_api_router
from app.routers.admin.admin_setting_api_router import router as admin_setting_api_router
from app.routers.admin.google_oauth_router import router as google_oauth_router
from app.routers.client.seo_router import router as seo_router
from app.routers.client.quiz_router import router as quiz_router


async def cleanup_expired_temp_users_task(interval_seconds: int = 3600):
    """주기적으로 만료된 임시 회원가입 데이터를 정리한다."""
    # 최초 실행 시 한 번 정리
    await _cleanup_expired_temp_users()
    while True:
        await asyncio.sleep(interval_seconds)
        await _cleanup_expired_temp_users()


async def _cleanup_expired_temp_users():
    """만료된 TempUser 레코드를 삭제한다."""
    session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        deleted = (
            session.query(TempUser)
            .filter(TempUser.expires_at < now)
            .delete(synchronize_session=False)
        )
        if deleted:
            session.commit()
            print(f"[TempUser Cleanup] 만료된 임시 사용자 {deleted}명 삭제")
        else:
            session.commit()
    except Exception as exc:
        session.rollback()
        print(f"[TempUser Cleanup] 정리 중 오류 발생: {exc}")
    finally:
        session.close()
# ----------------------------
# Lifespan Context (신버전)
# ----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작/종료 시 수행되는 초기화 작업"""

    app.state.temp_user_cleanup_task = None

    # 🚀 Startup
    try:
        # 디버깅: 실제 설정값 확인
        print("=" * 60)
        print("🔍 디버깅 정보:")
        print(f"  settings.DB_AUTO_MIGRATE (raw): {repr(settings.DB_AUTO_MIGRATE)}")
        print(f"  settings.DB_AUTO_MIGRATE (type): {type(settings.DB_AUTO_MIGRATE)}")
        
        db_mode = settings.DB_AUTO_MIGRATE.lower() if settings.DB_AUTO_MIGRATE else "none"
        print(f"  db_mode (processed): {repr(db_mode)}")
        print("=" * 60)
        
        print(f"🔄 서버 시작 중...")
        print(f"📋 DB_AUTO_MIGRATE 설정값: '{settings.DB_AUTO_MIGRATE}'")
        print(f"📋 적용될 모드: '{db_mode}'")
        print("=" * 60)
        
        if db_mode == "create-drop":
            # JPA의 create-drop과 동일: 모든 테이블 삭제 후 재생성
            print("⚠️  경고: create-drop 모드 - 모든 테이블을 삭제하고 재생성합니다!")
            print("⚠️  이 작업은 모든 데이터를 삭제합니다!")
            print("🔄 테이블 삭제 중...")
            try:
                Base.metadata.drop_all(bind=engine)
                print("✓ 기존 테이블 삭제 완료")
            except Exception as drop_error:
                print(f"⚠️  테이블 삭제 실패 (권한 문제일 수 있음): {drop_error}")
                print("ℹ️  기존 테이블은 그대로 두고 컬럼만 추가/업데이트합니다.")
            print("🔄 테이블 재생성/업데이트 중...")
            Base.metadata.create_all(bind=engine)
            print("✅ DB 테이블 재생성/업데이트 완료.")
            print("=" * 60)
            
        elif db_mode == "create":
            # 테이블 없으면 생성
            Base.metadata.create_all(bind=engine)
            print("✅ DB 테이블 생성 완료.")
            
        elif db_mode == "update":
            # 테이블 없으면 생성, 있으면 누락된 컬럼만 추가 (권장)
            Base.metadata.create_all(bind=engine)
            print("✅ DB 테이블 생성/업데이트 완료.")
            print("ℹ️  모델 변경사항이 자동으로 반영됩니다.")
            
        elif db_mode == "validate":
            # 테이블 존재만 확인
            from sqlalchemy import inspect
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            print(f"✅ DB 연결 확인 완료. 테이블 수: {len(tables)}")
            
        else:  # none
            print(f"ℹ️  DB 자동 마이그레이션 비활성화됨 (모드: {db_mode})")
        cleanup_interval = max(int(getattr(settings, "TEMP_USER_CLEANUP_INTERVAL_SECONDS", 3600)), 0)
        if cleanup_interval > 0:
            app.state.temp_user_cleanup_task = asyncio.create_task(
                cleanup_expired_temp_users_task(cleanup_interval)
            )
            print(f"[TempUser Cleanup] 만료 임시 사용자 정리 작업 시작 (주기: {cleanup_interval}초)")
        else:
            print("[TempUser Cleanup] 주기가 0 이하로 설정되어 있어 실행하지 않습니다.")

    except SQLAlchemyError as e:
        print(f"❌ DB 초기화 중 오류 발생: {e}")
        import traceback
        traceback.print_exc()
    except Exception as e:
        print(f"❌ 예상치 못한 오류 발생: {e}")
        import traceback
        traceback.print_exc()

    # 서버 실행 (yield 시점 이후부터 요청 처리)
    yield

    # 🛑 Shutdown
    cleanup_task = getattr(app.state, "temp_user_cleanup_task", None)
    if cleanup_task:
        cleanup_task.cancel()
        with suppress(asyncio.CancelledError):
            await cleanup_task
        print("[TempUser Cleanup] 정리 작업이 중단되었습니다.")

    print("🧹 서버 종료 중... 연결 정리 완료.")


# ----------------------------
# FastAPI 인스턴스 생성
# ----------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,  # ← on_event 대신 lifespan 사용
)

# ----------------------------
# CSP 헤더 오버라이드 미들웨어 (nginx에서 설정한 CSP 제거)
# ----------------------------
@app.middleware("http")
async def remove_csp_header(request: Request, call_next):
    """nginx에서 설정한 CSP 헤더 제거 (HTML meta 태그의 CSP 사용)"""
    response = await call_next(request)
    # Content-Security-Policy 헤더 제거 (HTML meta 태그 사용)
    # MutableHeaders는 pop 메서드가 없으므로 del 사용
    if "Content-Security-Policy" in response.headers:
        del response.headers["Content-Security-Policy"]
    if "content-security-policy" in response.headers:
        del response.headers["content-security-policy"]
    return response

# ----------------------------
# CORS 설정 (React 연동용)
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8017",  # 프론트엔드 개발 서버
        "http://localhost:8015",  # 프로덕션 백엔드 (직접 접속용)
        "http://127.0.0.1:8015",  # 프로덕션 IPv4 직접 접속용
        "http://localhost:8016",  # 스테이징 백엔드 (직접 접속용)
        "http://127.0.0.1:8016",  # 스테이징 IPv4 직접 접속용
        "https://staging.kmshistory.kr",  # 스테이징 서버
        "https://kmshistory.kr",  # 운영 서버
    ],
    allow_credentials=True,                   # ✅ 쿠키 전송 허용 (필수)
    allow_methods=["*"],                       # 모든 HTTP 메서드 허용
    allow_headers=["*"],                       # 모든 헤더 허용
)


# 템플릿 라우터 (API 라우터보다 먼저 등록)
# app.include_router(admin_notice_template_router)  # React로 대체됨
# app.include_router(client_notice_template_router)  # React로 대체됨
# app.include_router(admin_faq_template_router)  # React로 대체됨
# app.include_router(client_faq_template_router)  # React로 대체됨
# app.include_router(draw_template_router)  # React로 대체됨 (일부는 여전히 사용 중일 수 있음)
# app.include_router(participant_template_router)  # React로 대체됨
# app.include_router(user_admin_template_router)  # React로 대체됨
app.include_router(auth_template_router)
# app.include_router(mypage_template_router)  # React로 대체됨 (메인 페이지)
app.include_router(terms_template_router)
app.include_router(notification_template_router)
app.include_router(file_template_router)
# app.include_router(dashboard_template_router)  # React로 대체됨
app.include_router(calendar_template_router)
app.include_router(seo_router)

# API 라우터
app.include_router(admin_notice_api_router)
app.include_router(client_notice_api_router)
app.include_router(admin_faq_api_router)
app.include_router(client_faq_api_router)
app.include_router(draw_api_router)
app.include_router(participant_api_router)
app.include_router(user_admin_api_router)
app.include_router(auth_api_router)
app.include_router(mypage_api_router)
app.include_router(terms_api_router)
app.include_router(notification_api_router)
app.include_router(file_api_router)
app.include_router(dashboard_api_router)
app.include_router(calendar_api_router)
app.include_router(admin_quiz_api_router)
app.include_router(admin_setting_api_router)
app.include_router(google_oauth_router)
app.include_router(quiz_router)

# ----------------------------
# 정적 파일 및 SPA 라우팅 (React 앱 서빙)
# ----------------------------
# FRONTEND_DIST는 app.config에서 ENV_FILE에 따라 dist 또는 dist-staging으로 설정됨

# 정적 파일 서빙 (전체 dist 디렉토리)
if os.path.exists(FRONTEND_DIST):
    # 전체 dist 디렉토리를 정적 파일로 마운트 (assets, images, vite.svg 등)
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
    # 루트 레벨 정적 파일들 (vite.svg 등)을 위한 별도 마운트는 필요 없음
    # SPA 라우팅에서 처리
    print(f"✅ 프론트엔드 정적 파일 서빙 활성화: {FRONTEND_DIST}")

# 업로드 파일 정적 제공
os.makedirs(settings.MEDIA_ROOT, exist_ok=True)
app.mount(
    settings.MEDIA_URL,
    StaticFiles(directory=settings.MEDIA_ROOT),
    name="uploads",
)

# ----------------------------
# 라우터 or 기본 엔드포인트
# ----------------------------
@app.get("/")
def root():
    """루트 경로 - React 앱 서빙 또는 API 메시지"""
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_html):
        # 프론트엔드 빌드가 있으면 index.html 서빙
        return FileResponse(index_html)
    # 빌드가 없으면 API 메시지
    return {"message": f"{settings.PROJECT_NAME} Backend is running!"}


# SPA 라우팅 (React 앱을 위한 catch-all)
# 마지막에 배치하여 다른 모든 라우터가 먼저 매칭되도록 함
@app.api_route("/{full_path:path}", methods=["GET"])
async def serve_spa(request: Request, full_path: str):
    """
    React SPA를 위한 catch-all 라우터
    API 경로와 정적 파일 경로를 제외한 모든 요청을 index.html로 리다이렉트
    """
    # API 경로만 제외 (404 반환)
    if full_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")
    
    # assets 경로는 이미 마운트되어 있으므로 여기서는 처리하지 않음
    if full_path.startswith("assets/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not Found")
    
    # 정적 파일 경로 체크 (vite.svg, robots.txt 등)
    # 실제 파일이 존재하면 FileResponse로 반환
    static_file_path = os.path.join(FRONTEND_DIST, full_path)
    if os.path.isfile(static_file_path):
        return FileResponse(static_file_path)
    
    # 파일이 없으면 React SPA 라우팅으로 간주하고 index.html 반환
    index_html = os.path.join(FRONTEND_DIST, "index.html")
    if os.path.exists(index_html):
        return FileResponse(index_html)
    
    # 빌드 디렉토리가 없으면 404
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail="Not Found")


# # ========================================
# # 🌍 환경설정 / 초기화
# # ========================================

# # 환경변수 로드 (.env)
# load_dotenv()

# # 로거 설정
# logger = logging.getLogger(__name__)

# # FastAPI 앱 생성
# app = FastAPI(title="강민성 한국사 관리 시스템")

# # 템플릿 설정
# templates = Jinja2Templates(directory="templates")

# # ========================================
# # ⚙️ 에러 핸들러
# # ========================================

# @app.exception_handler(HTTPException)
# async def http_exception_handler(request: Request, exc: HTTPException):
#     """HTTP 예외 핸들러"""
#     accept = request.headers.get("accept", "")

#     # API 요청인 경우 (JSON 응답)
#     if "application/json" in accept or request.url.path.startswith("/api/"):
#         return JSONResponse(
#             status_code=exc.status_code,
#             content={"detail": exc.detail}
#         )

#     # HTML 요청인 경우 (템플릿 기반)
#     if exc.status_code == 404:
#         if request.url.path.startswith('/admin'):
#             return templates.TemplateResponse("backoffice/errors/404.html", {"request": request}, status_code=404)
#         return templates.TemplateResponse("client/errors/404.html", {"request": request}, status_code=404)

#     elif exc.status_code == 500:
#         if request.url.path.startswith('/admin'):
#             return templates.TemplateResponse("backoffice/errors/500.html", {"request": request}, status_code=500)
#         return templates.TemplateResponse("client/errors/500.html", {"request": request}, status_code=500)

#     # 그 외 에러는 JSON
#     return JSONResponse(
#         status_code=exc.status_code,
#         content={"detail": exc.detail}
#     )


# # ========================================
# # 🖼️ 정적 파일 설정
# # ========================================
# app.mount("/static", StaticFiles(directory="static"), name="static")
# app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# # ========================================
# # 🗄️ DB 초기화
# # ========================================
# Base.metadata.create_all(bind=engine)
# init_db()  # 만약 별도의 초기화 로직이 있다면

# # ========================================
# # ✅ 실행 진입점 (로컬 실행 시)
# # ========================================
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8003)