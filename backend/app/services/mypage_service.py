# app/services/mypage_service.py
from fastapi import HTTPException, Response
from sqlalchemy import func, case
from sqlalchemy.orm import Session, selectinload
from app.utils.auth import verify_password, get_password_hash, clear_auth_cookie
from datetime import datetime
import re
from typing import Optional

from app.models.quiz import (
    UserQuizBundleProgress,
    QuizBundle,
    UserQuizHistory,
    Question,
    QuestionTopicLink,
)
from app.schemas.quiz_schema import TopicSchema
from app.schemas.mypage_schema import (
    BundleHistoryItem,
    BundleHistoryResponse,
    WrongAnswerItem,
    WrongAnswerListResponse,
    UserQuizStatsResponse,
    CategoryStat,
    DifficultyStat,
    HardQuestionStat,
)

# 닉네임 수정
async def update_user_info_service(request, db: Session, current_user):
    data = await request.json()
    nickname = data.get("nickname")

    if not nickname:
        raise HTTPException(400, "닉네임이 필요합니다.")
    if len(nickname) < 2 or len(nickname) > 15:
        raise HTTPException(400, "닉네임은 2~15자 사이여야 합니다.")
    if not re.match(r"^[가-힣a-zA-Z0-9]+$", nickname):
        raise HTTPException(400, "닉네임은 한글, 영문, 숫자만 가능합니다.")

    existing = db.query(current_user.__class__).filter(
        current_user.__class__.nickname == nickname,
        current_user.__class__.id != current_user.id
    ).first()
    if existing:
        raise HTTPException(409, "이미 사용 중인 닉네임입니다.")

    current_user.nickname = nickname
    current_user.updated_at = datetime.now()
    db.commit()
    db.refresh(current_user)
    return {"message": "닉네임이 수정되었습니다."}

# 현재 비밀번호 확인
async def verify_current_password_service(request, db: Session, current_user):
    data = await request.json()
    current_password = data.get("current_password")
    if not current_password:
        raise HTTPException(400, "현재 비밀번호를 입력해주세요.")

    if verify_password(current_password, current_user.password_hash):
        return {"valid": True}
    else:
        raise HTTPException(400, "현재 비밀번호가 일치하지 않습니다.")

# 비밀번호 변경 (자동 로그아웃 포함)
async def change_user_password_service(request, db: Session, current_user):
    data = await request.json()
    current_pw = data.get("current_password")
    new_pw = data.get("new_password")

    if not current_pw or not new_pw:
        raise HTTPException(400, "현재/새 비밀번호를 입력해주세요.")

    if len(new_pw) < 6 or len(new_pw) > 32:
        raise HTTPException(400, "비밀번호는 6~32자 사이여야 합니다.")

    patterns = [r"[A-Z]", r"[a-z]", r"[0-9]", r'[!@#$%^&*(),.?":{}|<>]']
    match_count = sum(1 for p in patterns if re.search(p, new_pw))
    if match_count < 2:
        raise HTTPException(400, "비밀번호는 영문 대·소문자, 숫자, 특수문자 중 2가지 이상 포함해야 합니다.")

    if not verify_password(current_pw, current_user.password_hash):
        raise HTTPException(400, "현재 비밀번호가 일치하지 않습니다.")
    if current_pw == new_pw:
        raise HTTPException(400, "현재 비밀번호와 새 비밀번호가 같습니다.")

    # 비밀번호 업데이트
    current_user.password_hash = get_password_hash(new_pw)
    current_user.updated_at = datetime.now()
    db.commit()
    db.refresh(current_user)

    # 자동 로그아웃 처리
    response = Response()
    clear_auth_cookie(response)

    return {
        "message": "비밀번호가 성공적으로 변경되었습니다. 다시 로그인해주세요.",
        "logout": True,
        "headers": dict(response.headers)
    }

# 회원탈퇴 (자동 로그아웃 추가)
async def withdraw_user_service(request, db: Session, current_user):
    if current_user.deleted_at is not None:
        raise HTTPException(400, "이미 탈퇴 처리된 계정입니다.")

    # 계정 상태 변경
    current_user.deleted_at = datetime.now()
    current_user.is_active = False
    current_user.nickname_deactivated_at = datetime.now()
    db.commit()
    db.refresh(current_user)

    # 로그아웃 처리
    response = Response()
    clear_auth_cookie(response)

    return {
        "message": "회원탈퇴가 완료되었습니다. 7일 후 계정이 완전히 삭제됩니다.",
        "logout": True,
        "headers": dict(response.headers),
    }

def get_bundle_history(db: Session, user_id: int) -> BundleHistoryResponse:
    records = (
        db.query(UserQuizBundleProgress, QuizBundle)
        .join(QuizBundle, QuizBundle.id == UserQuizBundleProgress.bundle_id)
        .filter(UserQuizBundleProgress.user_id == user_id)
        .order_by(UserQuizBundleProgress.last_played_at.desc())
        .all()
    )

    items = []
    for progress, bundle in records:
        total_questions = progress.total_questions or bundle.question_count or 0
        accuracy = 0.0
        if total_questions:
            accuracy = progress.correct_answers / total_questions

        items.append(
            BundleHistoryItem(
                bundle_id=bundle.id,
                title=bundle.title,
                description=bundle.description,
                category=bundle.category.value if bundle.category else None,
                difficulty=bundle.difficulty.value if bundle.difficulty else None,
                total_questions=total_questions,
                correct_answers=progress.correct_answers,
                completed=progress.completed,
                in_progress=progress.in_progress,
                accuracy=accuracy,
                last_played_at=progress.last_played_at,
                completed_at=progress.completed_at,
            )
        )

    return BundleHistoryResponse(items=items)


def get_wrong_answers(
    db: Session,
    user_id: int,
    bundle_id: Optional[int] = None,
    topic_id: Optional[int] = None,
) -> WrongAnswerListResponse:
    query = (
        db.query(UserQuizHistory)
        .options(
            selectinload(UserQuizHistory.question).selectinload(Question.topics),
            selectinload(UserQuizHistory.bundle),
        )
        .filter(
            UserQuizHistory.user_id == user_id,
            UserQuizHistory.is_correct.is_(False),
        )
        .order_by(UserQuizHistory.solved_at.desc())
    )

    if bundle_id:
        query = query.filter(UserQuizHistory.bundle_id == bundle_id)

    if topic_id:
        query = (
            query.join(Question, Question.id == UserQuizHistory.question_id)
            .join(QuestionTopicLink, QuestionTopicLink.question_id == Question.id)
            .filter(QuestionTopicLink.topic_id == topic_id)
        )

    records = query.all()

    items = []
    for history in records:
        question = history.question
        bundle = history.bundle
        topics = []
        if question and getattr(question, "topics", None):
            topics = [
                TopicSchema(
                    id=topic.id,
                    name=topic.name,
                    description=topic.description,
                    created_at=topic.created_at,
                )
                for topic in question.topics
            ]

        items.append(
            WrongAnswerItem(
                history_id=history.id,
                question_id=history.question_id,
                question_text=question.question_text if question else "",
                user_answer=history.user_answer,
                correct_answer=question.correct_answer if question else "",
                is_correct=history.is_correct,
                solved_at=history.solved_at,
                bundle_id=bundle.id if bundle else None,
                bundle_title=bundle.title if bundle else None,
                category=question.category.value if question and question.category else None,
                difficulty=question.difficulty.value if question and question.difficulty else None,
                topics=topics,
                explanation=question.explanation if question else None,
            )
        )

    return WrongAnswerListResponse(items=items)


def get_user_quiz_stats(db: Session, user_id: int) -> UserQuizStatsResponse:
    total_attempts, total_correct = (
        db.query(
            func.count(UserQuizHistory.id),
            func.sum(case((UserQuizHistory.is_correct.is_(True), 1), else_=0)),
        )
        .filter(UserQuizHistory.user_id == user_id)
        .one()
    )

    total_attempts = total_attempts or 0
    total_correct = total_correct or 0
    accuracy = total_correct / total_attempts if total_attempts else 0.0

    category_rows = (
        db.query(
            Question.category,
            func.count(UserQuizHistory.id),
            func.sum(case((UserQuizHistory.is_correct.is_(True), 1), else_=0)),
        )
        .join(Question, Question.id == UserQuizHistory.question_id)
        .filter(UserQuizHistory.user_id == user_id)
        .group_by(Question.category)
        .all()
    )

    category_stats = []
    for category, attempts, correct in category_rows:
        attempts = attempts or 0
        correct = correct or 0
        category_stats.append(
            CategoryStat(
                category=category.value if category else None,
                attempts=attempts,
                correct=correct,
                accuracy=correct / attempts if attempts else 0.0,
            )
        )

    difficulty_rows = (
        db.query(
            Question.difficulty,
            func.count(UserQuizHistory.id),
            func.sum(case((UserQuizHistory.is_correct.is_(True), 1), else_=0)),
        )
        .join(Question, Question.id == UserQuizHistory.question_id)
        .filter(UserQuizHistory.user_id == user_id)
        .group_by(Question.difficulty)
        .all()
    )

    difficulty_stats = []
    for difficulty, attempts, correct in difficulty_rows:
        attempts = attempts or 0
        correct = correct or 0
        difficulty_stats.append(
            DifficultyStat(
                difficulty=difficulty.value if difficulty else None,
                attempts=attempts,
                correct=correct,
                accuracy=correct / attempts if attempts else 0.0,
            )
        )

    question_rows = (
        db.query(
            UserQuizHistory.question_id,
            Question.question_text,
            func.count(UserQuizHistory.id),
            func.sum(case((UserQuizHistory.is_correct.is_(True), 1), else_=0)),
        )
        .join(Question, Question.id == UserQuizHistory.question_id)
        .filter(UserQuizHistory.user_id == user_id)
        .group_by(UserQuizHistory.question_id, Question.question_text)
        .all()
    )

    hard_questions = []
    for question_id, question_text, attempts, correct in question_rows:
        attempts = attempts or 0
        correct = correct or 0
        wrong = attempts - correct
        if wrong <= 0:
            continue
        hard_questions.append(
            HardQuestionStat(
                question_id=question_id,
                question_text=question_text,
                attempts=attempts,
                correct=correct,
                accuracy=correct / attempts if attempts else 0.0,
            )
        )

    hard_questions.sort(key=lambda item: (item.attempts - item.correct, item.attempts), reverse=True)
    hard_questions = hard_questions[:5]

    return UserQuizStatsResponse(
        total_attempts=total_attempts,
        total_correct=total_correct,
        accuracy=accuracy,
        streak=None,
        category_stats=category_stats,
        difficulty_stats=difficulty_stats,
        hard_questions=hard_questions,
    )
