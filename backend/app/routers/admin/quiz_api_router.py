from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, UploadFile, File
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.quiz_schema import (
    AdminQuestionCreate,
    AdminQuestionUpdate,
    QuizBundleCreate,
    QuizBundleUpdate,
    QuizCategory,
    QuizDifficulty,
    QuizType,
    TopicCreate,
    TopicUpdate,
)
from app.services.quiz_service import (
    create_question,
    create_quiz_bundle,
    create_topic,
    delete_question,
    delete_quiz_bundle,
    delete_topic,
    get_admin_quiz_statistics,
    get_question,
    get_quiz_bundle,
    list_questions,
    list_quiz_bundles,
    list_topics,
    update_question,
    update_quiz_bundle,
    update_topic,
)
from app.services.quiz_media_service import save_question_image
from app.utils.auth import get_current_user_from_cookie


router = APIRouter(prefix="/api/admin/quiz", tags=["Admin:Quiz"])


def ensure_admin(request: Request, db: Session):
    user = get_current_user_from_cookie(request, db)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="관리자 권한이 필요합니다.")
    return user


def _parse_quiz_type(value: str | None) -> QuizType | None:
    if not value:
        return None
    try:
        return QuizType(value.upper())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 문제 유형입니다.") from exc


def _parse_category(value: str | None) -> QuizCategory | None:
    if not value:
        return None
    try:
        return QuizCategory(value.upper())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 카테고리입니다.") from exc


def _parse_difficulty(value: str | None) -> QuizDifficulty | None:
    if not value:
        return None
    try:
        return QuizDifficulty(value.upper())
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 난이도입니다.") from exc


@router.get("/questions")
def admin_list_questions(
    request: Request,
    page: int = Query(1, ge=1, description="페이지 번호"),
    limit: int = Query(10, ge=1, le=100, description="페이지당 항목 수"),
    search: str | None = Query(None, description="문제 내용 검색"),
    quiz_type: str | None = Query(None, description="문제 유형"),
    category: str | None = Query(None, description="카테고리"),
    difficulty: str | None = Query(None, description="난이도"),
    topic_id: int | None = Query(None, description="주제 ID"),
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)

    items, total = list_questions(
        db,
        page=page,
        limit=limit,
        search=search,
        quiz_type=_parse_quiz_type(quiz_type),
        category=_parse_category(category),
        difficulty=_parse_difficulty(difficulty),
        topic_id=topic_id,
    )

    total_pages = (total + limit - 1) // limit if total else 1

    payload = {
        "message": "퀴즈 목록 조회 성공",
        "items": [item.dict() for item in items],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
        },
    }
    return JSONResponse(content=jsonable_encoder(payload))


@router.get("/questions/{question_id}")
def admin_get_question_detail(
    request: Request,
    question_id: int,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    question = get_question(db, question_id=question_id)
    return JSONResponse(content=jsonable_encoder({"data": question}))


@router.post("/questions", status_code=status.HTTP_201_CREATED)
def admin_create_question_endpoint(
    request: Request,
    payload: AdminQuestionCreate,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    question = create_question(db, data=payload)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=jsonable_encoder(
            {
                "message": "퀴즈 문제가 생성되었습니다.",
                "data": question,
            }
        ),
    )


@router.post("/questions/upload-image", status_code=status.HTTP_201_CREATED)
async def admin_upload_quiz_image(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    image_url = await save_question_image(file)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={"message": "문제 이미지가 업로드되었습니다.", "url": image_url},
    )


@router.put("/questions/{question_id}")
def admin_update_question_endpoint(
    request: Request,
    question_id: int,
    payload: AdminQuestionUpdate,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    question = update_question(db, question_id=question_id, data=payload)
    return JSONResponse(
        content=jsonable_encoder(
            {
                "message": "퀴즈 문제가 수정되었습니다.",
                "data": question,
            }
        )
    )


@router.delete("/questions/{question_id}")
def admin_delete_question_endpoint(
    request: Request,
    question_id: int,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    delete_question(db, question_id=question_id)
    return JSONResponse(content={"message": "퀴즈 문제가 삭제되었습니다."})


@router.get("/bundles")
def admin_list_bundles(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: str | None = Query(None),
    category: str | None = Query(None),
    difficulty: str | None = Query(None),
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    response = list_quiz_bundles(
        db,
        page=page,
        limit=limit,
        search=search,
        category=_parse_category(category),
        difficulty=_parse_difficulty(difficulty),
        only_active=False,
    )
    return JSONResponse(content=jsonable_encoder(response))


@router.get("/bundles/{bundle_id}")
def admin_get_bundle_detail(
    request: Request,
    bundle_id: int,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    detail = get_quiz_bundle(db, bundle_id)
    return JSONResponse(content=jsonable_encoder(detail))


@router.get("/stats")
def admin_get_quiz_stats(
    request: Request,
    question_limit: int = Query(10, ge=1, le=100, description="표시할 문제 통계 개수"),
    question_page: int = Query(1, ge=1, description="문제 통계 페이지"),
    bundle_limit: int = Query(10, ge=1, le=100, description="표시할 테마형 통계 개수"),
    bundle_page: int = Query(1, ge=1, description="테마형 통계 페이지"),
    user_limit: int = Query(10, ge=1, le=100, description="표시할 사용자 통계 개수"),
    bundle_user_limit: int = Query(5, ge=1, le=100, description="테마형별 사용자 통계당 사용자 수"),
    bundle_user_page: int = Query(1, ge=1, description="테마형별 사용자 통계 페이지"),
    question_category: str | None = Query(None, description="문제 통계 필터 - 카테고리"),
    question_difficulty: str | None = Query(None, description="문제 통계 필터 - 난이도"),
    question_topic_id: int | None = Query(None, description="문제 통계 필터 - 주제 ID"),
    bundle_category: str | None = Query(None, description="테마형 통계 필터 - 카테고리"),
    bundle_difficulty: str | None = Query(None, description="테마형 통계 필터 - 난이도"),
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    stats = get_admin_quiz_statistics(
        db,
        question_limit=question_limit,
        bundle_limit=bundle_limit,
        user_limit=user_limit,
        bundle_user_limit=bundle_user_limit,
        question_category=_parse_category(question_category),
        question_difficulty=_parse_difficulty(question_difficulty),
        question_topic_id=question_topic_id,
        bundle_category=_parse_category(bundle_category),
        bundle_difficulty=_parse_difficulty(bundle_difficulty),
        question_page=question_page,
        bundle_page=bundle_page,
        bundle_user_page=bundle_user_page,
    )
    payload = {
        "message": "퀴즈 통계가 조회되었습니다.",
        "data": stats,
    }
    return JSONResponse(content=jsonable_encoder(payload))


@router.post("/bundles", status_code=status.HTTP_201_CREATED)
def admin_create_bundle(
    request: Request,
    payload: QuizBundleCreate,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    bundle = create_quiz_bundle(db, payload)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=jsonable_encoder({"message": "테마형이 생성되었습니다.", "data": bundle}),
    )


@router.put("/bundles/{bundle_id}")
def admin_update_bundle(
    request: Request,
    bundle_id: int,
    payload: QuizBundleUpdate,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    bundle = update_quiz_bundle(db, bundle_id, payload)
    return JSONResponse(
        content=jsonable_encoder({"message": "테마형이 수정되었습니다.", "data": bundle})
    )


@router.delete("/bundles/{bundle_id}")
def admin_delete_bundle(
    request: Request,
    bundle_id: int,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    delete_quiz_bundle(db, bundle_id)
    return JSONResponse(content={"message": "테마형이 삭제되었습니다."})


@router.get("/topics")
def admin_list_topics(
    request: Request,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    topics = list_topics(db)
    return JSONResponse(content=jsonable_encoder(topics))


@router.post("/topics", status_code=status.HTTP_201_CREATED)
def admin_create_topic(
    request: Request,
    payload: TopicCreate,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    topic = create_topic(db, payload)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content=jsonable_encoder({"message": "주제가 생성되었습니다.", "data": topic}),
    )


@router.put("/topics/{topic_id}")
def admin_update_topic(
    request: Request,
    topic_id: int,
    payload: TopicUpdate,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    topic = update_topic(db, topic_id, payload)
    return JSONResponse(content=jsonable_encoder({"message": "주제가 수정되었습니다.", "data": topic}))


@router.delete("/topics/{topic_id}")
def admin_delete_topic(
    request: Request,
    topic_id: int,
    db: Session = Depends(get_db),
):
    ensure_admin(request, db)
    delete_topic(db, topic_id)
    return JSONResponse(content={"message": "주제가 삭제되었습니다."})

