# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app import settings, engine, Base
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
from app.routers.client.seo_router import router as seo_router
# ----------------------------
# Lifespan Context (신버전)
# ----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작/종료 시 수행되는 초기화 작업"""

    # 🚀 Startup
    try:
        print("🔄 서버 시작 중... DB 연결 및 테이블 생성 중...")
        Base.metadata.create_all(bind=engine)
        print("✅ DB 테이블 생성 완료.")
    except SQLAlchemyError as e:
        print(f"❌ DB 초기화 중 오류 발생: {e}")

    # 서버 실행 (yield 시점 이후부터 요청 처리)
    yield

    # 🛑 Shutdown
    print("🧹 서버 종료 중... 연결 정리 완료.")


# ----------------------------
# FastAPI 인스턴스 생성
# ----------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,  # ← on_event 대신 lifespan 사용
)

# 템플릿 라우터
app.include_router(admin_notice_template_router)
app.include_router(client_notice_template_router)
app.include_router(admin_faq_template_router)
app.include_router(client_faq_template_router)
app.include_router(draw_template_router)
app.include_router(participant_template_router)
app.include_router(user_admin_template_router)
app.include_router(auth_template_router)
app.include_router(mypage_template_router)
app.include_router(terms_template_router)
app.include_router(notification_template_router)
app.include_router(file_template_router)
app.include_router(dashboard_template_router)
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

# ----------------------------
# 라우터 or 기본 엔드포인트
# ----------------------------
@app.get("/")
def root():
    return {"message": f"{settings.PROJECT_NAME} Backend is running!"}


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