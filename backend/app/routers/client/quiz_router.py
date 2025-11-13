from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.sql.expression import func
from app.database import get_db
from app.models.quiz import (
    Question,
    Choice,
    UserQuizHistory,
    QuizBundle,
    QuizBundleQuestion,
    QuizCategory as ModelQuizCategory,
    QuizDifficulty as ModelQuizDifficulty,
    Topic,
)
from app.schemas.quiz_schema import (
    ChoiceSchema,
    QuestionSchema,
    SubmitAnswerSchema,
    QuizBundleListResponse,
    QuizBundleDetailResponse,
    QuizResultSchema,
    QuizCategory,
    QuizDifficulty,
    TopicSchema,
    TopicListResponse,
    BundleProgressUpdateSchema,
    UserBundleProgressSchema,
)
from app.services.quiz_service import (
    list_quiz_bundles,
    get_quiz_bundle,
    list_topics,
    upsert_user_bundle_progress,
    reset_user_bundle_progress,
)
from app.utils.auth import get_current_user_from_cookie, get_current_user_optional

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

# 🔹 랜덤 문제 가져오기
@router.get("/random", response_model=QuestionSchema)
def get_random_question(
    db: Session = Depends(get_db),
    category: Optional[QuizCategory] = Query(None),
    difficulty: Optional[QuizDifficulty] = Query(None),
    bundle_id: Optional[int] = Query(None, alias="bundleId"),
    topic_id: Optional[int] = Query(None, alias="topicId"),
):
    query = db.query(Question).options(
        selectinload(Question.choices),
        selectinload(Question.topics),
    )

    if bundle_id:
        query = (
            query.join(QuizBundleQuestion, QuizBundleQuestion.question_id == Question.id)
            .join(QuizBundle, QuizBundle.id == QuizBundleQuestion.bundle_id)
            .filter(QuizBundle.id == bundle_id, QuizBundle.is_active.is_(True))
        )

    if category:
        query = query.filter(Question.category == ModelQuizCategory(category.value))

    if difficulty:
        query = query.filter(Question.difficulty == ModelQuizDifficulty(difficulty.value))

    if topic_id:
        query = query.join(Question.topics).filter(Topic.id == topic_id).distinct()

    question = query.order_by(func.random()).first()
    if not question:
        raise HTTPException(status_code=404, detail="문제가 없습니다.")
    return QuestionSchema(
        id=question.id,
        question_text=question.question_text,
        type=question.type.value if hasattr(question.type, "value") else question.type,
        choices=[
            ChoiceSchema(id=choice.id, content=choice.content)
            for choice in getattr(question, "choices", []) or []
        ],
        explanation=question.explanation,
        category=QuizCategory(question.category.value),
        difficulty=QuizDifficulty(question.difficulty.value),
        topics=[
            TopicSchema(id=topic.id, name=topic.name, description=topic.description, created_at=topic.created_at)
            for topic in getattr(question, "topics", []) or []
        ],
        image_url=question.image_url,
    )


# 🔹 정답 제출 (단답형 / 객관식 모두)
@router.post("/submit", response_model=QuizResultSchema)
def submit_answer(
    data: SubmitAnswerSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional)
):
    question = db.query(Question).filter(Question.id == data.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    user_answer = data.user_answer.strip()

    # 🔸 객관식(MULTIPLE): 정답 보기의 content와 비교
    if question.type.value == "MULTIPLE":
        correct_choice = db.query(Choice).filter(
            Choice.question_id == question.id, Choice.is_correct == True
        ).first()
        if not correct_choice:
            raise HTTPException(status_code=500, detail="객관식 문제의 정답 정보가 없습니다.")

        is_correct = user_answer == str(correct_choice.id) or user_answer == correct_choice.content

    # 🔸 단답형(SHORT): 텍스트 비교 (대소문자 무시)
    else:
        is_correct = question.correct_answer.strip().lower() == user_answer.lower()

    # 기록 저장
    if current_user:
        history = UserQuizHistory(
            user_id=current_user.id,
            question_id=question.id,
            bundle_id=data.bundle_id,
            user_answer=user_answer,
            is_correct=is_correct,
        )
        db.add(history)
        db.commit()

    return QuizResultSchema(
        is_correct=is_correct,
        correct_answer=question.correct_answer,
        explanation=question.explanation
    )


@router.get("/bundles", response_model=QuizBundleListResponse)
def get_bundle_list(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    category: Optional[QuizCategory] = Query(None),
    difficulty: Optional[QuizDifficulty] = Query(None),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_from_cookie),
):
    return list_quiz_bundles(
        db,
        page=page,
        limit=limit,
        search=search,
        category=category,
        difficulty=difficulty,
        only_active=True,
        user_id=current_user.id,
    )


@router.get("/bundles/{bundle_id}", response_model=QuizBundleDetailResponse)
def get_bundle_detail(
    bundle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_from_cookie),
):
    bundle = get_quiz_bundle(db, bundle_id, user_id=current_user.id)
    if not bundle.is_active:
        raise HTTPException(status_code=404, detail="비활성화된 테마형입니다.")
    return bundle


@router.post("/bundles/{bundle_id}/progress", response_model=UserBundleProgressSchema)
def update_bundle_progress(
    bundle_id: int,
    payload: BundleProgressUpdateSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_from_cookie),
):
    bundle = (
        db.query(QuizBundle)
        .filter(QuizBundle.id == bundle_id, QuizBundle.is_active.is_(True))
        .first()
    )
    if not bundle:
        raise HTTPException(status_code=404, detail="테마형을 찾을 수 없습니다.")

    progress = upsert_user_bundle_progress(
        db,
        user_id=current_user.id,
        bundle_id=bundle_id,
        total_questions=payload.total_questions,
        correct_answers=payload.correct_answers,
        completed=payload.completed,
        last_question_id=payload.last_question_id,
        last_question_order=payload.last_question_order,
        in_progress=payload.in_progress if payload.in_progress is not None else not payload.completed,
    )

    return UserBundleProgressSchema(
        bundle_id=progress.bundle_id,
        total_questions=progress.total_questions,
        correct_answers=progress.correct_answers,
        completed=progress.completed,
        in_progress=progress.in_progress,
        last_question_id=progress.last_question_id,
        last_question_order=progress.last_question_order,
        last_played_at=progress.last_played_at,
        completed_at=progress.completed_at,
    )


@router.delete("/bundles/{bundle_id}/progress")
def delete_bundle_progress(
    bundle_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_from_cookie),
):
    bundle = (
        db.query(QuizBundle)
        .filter(QuizBundle.id == bundle_id, QuizBundle.is_active.is_(True))
        .first()
    )
    if not bundle:
        raise HTTPException(status_code=404, detail="테마형을 찾을 수 없습니다.")

    reset_user_bundle_progress(db, user_id=current_user.id, bundle_id=bundle_id)
    return {"message": "테마형 진행 기록이 초기화되었습니다."}


@router.get("/topics", response_model=TopicListResponse)
def get_topic_list(db: Session = Depends(get_db)):
    return list_topics(db)
