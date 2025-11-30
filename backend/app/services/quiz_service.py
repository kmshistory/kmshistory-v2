from __future__ import annotations

from datetime import datetime
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from fastapi import HTTPException
from sqlalchemy import Float, case, cast
from sqlalchemy.orm import Session, selectinload
from sqlalchemy.sql import func

from app.models.quiz import (
    Choice,
    Question,
    QuestionType,
    QuizBundle,
    QuizBundleQuestion,
    QuizCategory as ModelQuizCategory,
    QuizDifficulty as ModelQuizDifficulty,
    Topic,
    UserQuizBundleProgress,
    UserQuizHistory,
)
from app.models.user_model import User
from app.schemas.quiz_schema import (
    AdminChoiceResponse,
    AdminQuestionCreate,
    AdminQuestionListItem,
    AdminQuestionResponse,
    AdminQuestionUpdate,
    QuizBundleCreate,
    QuizBundleDetailResponse,
    QuizBundleListResponse,
    QuizBundleQuestionItem,
    QuizBundleResponse,
    QuizBundleUpdate,
    QuizCategory,
    QuizDifficulty,
    QuizType,
    UserBundleProgressSchema,
    BundleQuestionProgressSchema,
    TopicCreate,
    TopicSchema,
    TopicUpdate,
    TopicListResponse,
    QuestionPerformanceStat,
    BundlePerformanceStat,
    UserPerformanceStat,
    UserBundlePerformanceStat,
    BundleUserPerformanceStat,
    QuizAdminStatsResponse,
)


def _resolve_question_type(value: QuizType | str) -> QuestionType:
    raw_value = value.value if isinstance(value, QuizType) else str(value)
    try:
        return QuestionType(raw_value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 문제 유형입니다.") from exc


def _resolve_category(value: QuizCategory | str | None) -> Optional[ModelQuizCategory]:
    if value is None:
        return None
    raw_value = value.value if isinstance(value, QuizCategory) else str(value)
    try:
        return ModelQuizCategory(raw_value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 카테고리입니다.") from exc


def _resolve_difficulty(value: QuizDifficulty | str | None) -> Optional[ModelQuizDifficulty]:
    if value is None:
        return None
    raw_value = value.value if isinstance(value, QuizDifficulty) else str(value)
    try:
        return ModelQuizDifficulty(raw_value)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="유효하지 않은 난이도입니다.") from exc


def _serialize_choice(choice: Choice) -> AdminChoiceResponse:
    return AdminChoiceResponse(id=choice.id, content=choice.content, is_correct=choice.is_correct)


def _serialize_topic(topic: Topic) -> TopicSchema:
    return TopicSchema(id=topic.id, name=topic.name, description=topic.description, created_at=topic.created_at)


def _apply_question_topics(db: Session, question: Question, topic_ids: Optional[List[int]]) -> None:
    if topic_ids is None:
        return
    unique_ids: List[int] = []
    for topic_id in topic_ids:
        if topic_id not in unique_ids:
            unique_ids.append(topic_id)

    if not unique_ids:
        question.topics = []
        return

    topics = db.query(Topic).filter(Topic.id.in_(unique_ids)).all()
    if len(topics) != len(unique_ids):
        raise HTTPException(status_code=400, detail="존재하지 않는 주제가 포함되어 있습니다.")

    topic_map = {topic.id: topic for topic in topics}
    question.topics = [topic_map[topic_id] for topic_id in unique_ids]


def _serialize_question(question: Question) -> AdminQuestionResponse:
    return AdminQuestionResponse(
        id=question.id,
        question_text=question.question_text,
        type=QuizType(question.type.value),
        correct_answer=question.correct_answer,
        explanation=question.explanation,
        choices=[_serialize_choice(choice) for choice in question.choices],
        created_at=question.created_at,
        category=QuizCategory(question.category.value),
        difficulty=QuizDifficulty(question.difficulty.value),
        topics=[_serialize_topic(topic) for topic in question.topics],
        image_url=question.image_url,
    )


def list_questions(
    db: Session,
    *,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    quiz_type: Optional[QuizType] = None,
    category: Optional[QuizCategory] = None,
    difficulty: Optional[QuizDifficulty] = None,
    topic_id: Optional[int] = None,
) -> Tuple[List[AdminQuestionListItem], int]:
    query = db.query(Question).options(
        selectinload(Question.choices),
        selectinload(Question.topics),
    )

    if search:
        query = query.filter(Question.question_text.ilike(f"%{search.strip()}%"))

    if quiz_type:
        query = query.filter(Question.type == _resolve_question_type(quiz_type))

    if category:
        query = query.filter(Question.category == _resolve_category(category))

    if difficulty:
        query = query.filter(Question.difficulty == _resolve_difficulty(difficulty))

    if topic_id:
        query = query.join(Question.topics).filter(Topic.id == topic_id).distinct()

    total = query.count()

    offset = max(page - 1, 0) * limit
    questions: Iterable[Question] = (
        query.order_by(Question.created_at.desc()).offset(offset).limit(limit).all()
    )

    items = [
        AdminQuestionListItem(
            id=question.id,
            question_text=question.question_text,
            type=QuizType(question.type.value),
            created_at=question.created_at,
            choice_count=len(question.choices),
            has_explanation=bool(question.explanation),
            category=QuizCategory(question.category.value),
            difficulty=QuizDifficulty(question.difficulty.value),
            topics=[_serialize_topic(topic) for topic in question.topics],
            image_url=question.image_url,
        )
        for question in questions
    ]

    return items, total


def get_question(db: Session, *, question_id: int) -> AdminQuestionResponse:
    question = (
        db.query(Question)
        .options(selectinload(Question.choices), selectinload(Question.topics))
        .filter(Question.id == question_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    # Ensure choices loaded
    _ = question.choices  # noqa: F841
    _ = question.topics

    return _serialize_question(question)


def create_question(db: Session, *, data: AdminQuestionCreate) -> AdminQuestionResponse:
    question_type = _resolve_question_type(data.type)

    question = Question(
        question_text=data.question_text.strip(),
        type=question_type,
        correct_answer=data.correct_answer.strip(),
        explanation=data.explanation.strip() if data.explanation else None,
        category=_resolve_category(data.category) or ModelQuizCategory.ALL,
        difficulty=_resolve_difficulty(data.difficulty) or ModelQuizDifficulty.STANDARD,
        image_url=data.image_url.strip() if data.image_url else None,
    )
    db.add(question)
    db.flush()

    if question_type == QuestionType.MULTIPLE:
        for choice_data in data.choices or []:
            choice = Choice(
                question_id=question.id,
                content=choice_data.content.strip(),
                is_correct=choice_data.is_correct,
            )
            db.add(choice)

    _apply_question_topics(db, question, data.topic_ids)

    db.commit()
    db.refresh(question)
    _ = question.choices  # noqa: F841
    _ = question.topics
    return _serialize_question(question)


def update_question(
    db: Session,
    *,
    question_id: int,
    data: AdminQuestionUpdate,
) -> AdminQuestionResponse:
    question: Optional[Question] = (
        db.query(Question)
        .options(selectinload(Question.choices), selectinload(Question.topics))
        .filter(Question.id == question_id)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    question_type = _resolve_question_type(data.type)
    question.question_text = data.question_text.strip()
    question.type = question_type
    question.correct_answer = data.correct_answer.strip()
    question.explanation = data.explanation.strip() if data.explanation else None
    question.category = _resolve_category(data.category) or ModelQuizCategory.ALL
    question.difficulty = _resolve_difficulty(data.difficulty) or ModelQuizDifficulty.STANDARD
    question.image_url = data.image_url.strip() if data.image_url else None

    # Replace choices
    for existing_choice in list(question.choices):
        db.delete(existing_choice)
    db.flush()

    if question_type == QuestionType.MULTIPLE:
        for choice_data in data.choices or []:
            choice = Choice(
                question_id=question.id,
                content=choice_data.content.strip(),
                is_correct=choice_data.is_correct,
            )
            db.add(choice)

    _apply_question_topics(db, question, data.topic_ids)

    db.commit()
    db.refresh(question)
    _ = question.choices  # noqa: F841
    _ = question.topics
    return _serialize_question(question)


def delete_question(db: Session, *, question_id: int) -> None:
    question: Optional[Question] = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="문제를 찾을 수 없습니다.")

    db.delete(question)
    db.commit()


# ------------------------------------------------------------
# Quiz Bundle Services
# ------------------------------------------------------------


def _serialize_bundle(
    bundle: QuizBundle,
    progress: Optional[UserQuizBundleProgress] = None,
) -> QuizBundleResponse:
    serialized_progress = (
        UserBundleProgressSchema(
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
        if progress
        else None
    )

    return QuizBundleResponse(
        id=bundle.id,
        title=bundle.title,
        description=bundle.description,
        category=QuizCategory(bundle.category.value) if bundle.category else None,
        difficulty=QuizDifficulty(bundle.difficulty.value) if bundle.difficulty else None,
        question_count=bundle.question_count,
        is_active=bundle.is_active,
        created_at=bundle.created_at,
        user_progress=serialized_progress,
    )


def list_quiz_bundles(
    db: Session,
    *,
    page: int = 1,
    limit: int = 10,
    search: Optional[str] = None,
    category: Optional[QuizCategory] = None,
    difficulty: Optional[QuizDifficulty] = None,
    only_active: bool = False,
    user_id: Optional[int] = None,
) -> QuizBundleListResponse:
    query = db.query(QuizBundle)

    if search:
        query = query.filter(QuizBundle.title.ilike(f"%{search.strip()}%"))

    if category:
        query = query.filter(QuizBundle.category == _resolve_category(category))

    if difficulty:
        query = query.filter(QuizBundle.difficulty == _resolve_difficulty(difficulty))

    if only_active:
        query = query.filter(QuizBundle.is_active.is_(True))

    total = query.count()
    offset = max(page - 1, 0) * limit
    bundles = (
        query.order_by(QuizBundle.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    progress_map: dict[int, UserQuizBundleProgress] = {}
    if user_id and bundles:
        bundle_ids = [bundle.id for bundle in bundles]
        progresses = (
            db.query(UserQuizBundleProgress)
            .filter(
                UserQuizBundleProgress.user_id == user_id,
                UserQuizBundleProgress.bundle_id.in_(bundle_ids),
            )
            .all()
        )
        progress_map = {progress.bundle_id: progress for progress in progresses}

    items = [_serialize_bundle(bundle, progress_map.get(bundle.id)) for bundle in bundles]
    pagination = {
        "page": page,
        "limit": limit,
        "total": total,
        "total_pages": (total + limit - 1) // limit if total else 1,
    }
    return QuizBundleListResponse(items=items, pagination=pagination)


def get_quiz_bundle(
    db: Session,
    bundle_id: int,
    *,
    user_id: Optional[int] = None,
) -> QuizBundleDetailResponse:
    bundle = (
        db.query(QuizBundle)
        .options(
            selectinload(QuizBundle.questions)
            .selectinload(QuizBundleQuestion.question)
            .selectinload(Question.choices),
            selectinload(QuizBundle.questions)
            .selectinload(QuizBundleQuestion.question)
            .selectinload(Question.topics),
        )
        .filter(QuizBundle.id == bundle_id)
        .first()
    )
    if not bundle:
        raise HTTPException(status_code=404, detail="테마형을 찾을 수 없습니다.")

    items: List[QuizBundleQuestionItem] = []
    for item in sorted(bundle.questions, key=lambda q: q.order):
        question = item.question
        items.append(
            QuizBundleQuestionItem(
                id=item.id,
                question_id=question.id,
                order=item.order,
                question_text=question.question_text,
                type=QuizType(question.type.value),
                category=QuizCategory(question.category.value),
                difficulty=QuizDifficulty(question.difficulty.value),
                explanation=question.explanation,
                choices=[
                    AdminChoiceResponse(
                        id=choice.id,
                        content=choice.content,
                        is_correct=choice.is_correct,
                    )
                    for choice in question.choices
                ],
                topics=[_serialize_topic(topic) for topic in question.topics],
                image_url=question.image_url,
            )
        )

    progress_record = None
    question_progress: List[BundleQuestionProgressSchema] = []

    if user_id:
        progress_record = get_user_bundle_progress(db, user_id=user_id, bundle_id=bundle.id)
        histories = (
            db.query(UserQuizHistory)
            .filter(
                UserQuizHistory.user_id == user_id,
                UserQuizHistory.bundle_id == bundle.id,
            )
            .all()
        )
        question_model_map = {entry.question.id: entry.question for entry in bundle.questions}
        order_map = {entry.question.id: entry.order for entry in bundle.questions}

        for history in histories:
            question_model = question_model_map.get(history.question_id)
            if not question_model:
                continue
            question_progress.append(
                BundleQuestionProgressSchema(
                    question_id=history.question_id,
                    is_correct=history.is_correct,
                    user_answer=history.user_answer,
                    correct_answer=question_model.correct_answer,
                    explanation=question_model.explanation,
                    solved_at=history.solved_at,
                    order=order_map.get(history.question_id, 0),
                )
            )

        question_progress.sort(key=lambda item: item.order)

    bundle_response = _serialize_bundle(bundle, progress_record)
    return QuizBundleDetailResponse(
        **bundle_response.dict(),
        questions=items,
        question_progress=question_progress,
    )


def get_user_bundle_progress(
    db: Session,
    *,
    user_id: int,
    bundle_id: int,
) -> Optional[UserQuizBundleProgress]:
    return (
        db.query(UserQuizBundleProgress)
        .filter(
            UserQuizBundleProgress.user_id == user_id,
            UserQuizBundleProgress.bundle_id == bundle_id,
        )
        .first()
    )


def upsert_user_bundle_progress(
    db: Session,
    *,
    user_id: int,
    bundle_id: int,
    total_questions: int,
    correct_answers: int,
    completed: bool,
    last_question_id: Optional[int],
    last_question_order: Optional[int],
    in_progress: bool,
) -> UserQuizBundleProgress:
    record = get_user_bundle_progress(db, user_id=user_id, bundle_id=bundle_id)

    if not record:
        record = UserQuizBundleProgress(
            user_id=user_id,
            bundle_id=bundle_id,
        )

    record.total_questions = total_questions
    record.correct_answers = correct_answers
    record.completed = completed
    record.in_progress = in_progress
    if last_question_id is not None:
        record.last_question_id = last_question_id
    if last_question_order is not None:
        record.last_question_order = last_question_order
    record.last_played_at = datetime.utcnow()
    record.completed_at = datetime.utcnow() if completed else None

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def reset_user_bundle_progress(
    db: Session,
    *,
    user_id: int,
    bundle_id: int,
) -> None:
    db.query(UserQuizHistory).filter(
        UserQuizHistory.user_id == user_id,
        UserQuizHistory.bundle_id == bundle_id,
    ).delete(synchronize_session=False)

    db.query(UserQuizBundleProgress).filter(
        UserQuizBundleProgress.user_id == user_id,
        UserQuizBundleProgress.bundle_id == bundle_id,
    ).delete(synchronize_session=False)

    db.commit()


def _assign_questions_to_bundle(
    db: Session,
    bundle: QuizBundle,
    question_ids: Sequence[int],
) -> None:
    # Remove existing
    db.query(QuizBundleQuestion).filter(QuizBundleQuestion.bundle_id == bundle.id).delete()
    db.flush()

    if not question_ids:
        bundle.question_count = 0
        return

    questions = (
        db.query(Question)
        .filter(Question.id.in_(question_ids))
        .order_by(func.array_position(question_ids, Question.id))
        .all()
    )
    order_map = {question_id: idx for idx, question_id in enumerate(question_ids)}

    for question in questions:
        db.add(
            QuizBundleQuestion(
                bundle_id=bundle.id,
                question_id=question.id,
                order=order_map.get(question.id, 0),
            )
        )

    bundle.question_count = len(questions)


def create_quiz_bundle(db: Session, data: QuizBundleCreate) -> QuizBundleDetailResponse:
    bundle = QuizBundle(
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        category=_resolve_category(data.category),
        difficulty=_resolve_difficulty(data.difficulty),
        is_active=data.is_active,
    )
    db.add(bundle)
    db.flush()

    _assign_questions_to_bundle(db, bundle, data.question_ids or [])

    db.commit()
    db.refresh(bundle)
    return get_quiz_bundle(db, bundle.id)


def update_quiz_bundle(
    db: Session,
    bundle_id: int,
    data: QuizBundleUpdate,
) -> QuizBundleDetailResponse:
    bundle = db.query(QuizBundle).filter(QuizBundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="테마형을 찾을 수 없습니다.")

    bundle.title = data.title.strip()
    bundle.description = data.description.strip() if data.description else None
    bundle.category = _resolve_category(data.category)
    bundle.difficulty = _resolve_difficulty(data.difficulty)
    bundle.is_active = data.is_active

    if data.question_ids is not None:
        _assign_questions_to_bundle(db, bundle, data.question_ids)

    db.commit()
    db.refresh(bundle)
    return get_quiz_bundle(db, bundle.id)


def delete_quiz_bundle(db: Session, bundle_id: int) -> None:
    bundle = db.query(QuizBundle).filter(QuizBundle.id == bundle_id).first()
    if not bundle:
        raise HTTPException(status_code=404, detail="테마형을 찾을 수 없습니다.")

    db.delete(bundle)
    db.commit()


# ------------------------------------------------------------
# Topic Services
# ------------------------------------------------------------


def list_topics(db: Session) -> TopicListResponse:
    topics = db.query(Topic).order_by(Topic.name.asc()).all()
    items = [_serialize_topic(topic) for topic in topics]
    return TopicListResponse(items=items)


def create_topic(db: Session, data: TopicCreate) -> TopicSchema:
    normalized_name = data.name.strip()
    exists = (
        db.query(Topic)
        .filter(func.lower(Topic.name) == func.lower(normalized_name))
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="이미 존재하는 주제입니다.")

    topic = Topic(name=normalized_name, description=data.description.strip() if data.description else None)
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return _serialize_topic(topic)


def update_topic(db: Session, topic_id: int, data: TopicUpdate) -> TopicSchema:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="주제를 찾을 수 없습니다.")

    normalized_name = data.name.strip()
    exists = (
        db.query(Topic)
        .filter(func.lower(Topic.name) == func.lower(normalized_name), Topic.id != topic_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=409, detail="이미 존재하는 주제입니다.")

    topic.name = normalized_name
    topic.description = data.description.strip() if data.description else None
    db.commit()
    db.refresh(topic)
    return _serialize_topic(topic)


def delete_topic(db: Session, topic_id: int) -> None:
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="주제를 찾을 수 없습니다.")

    db.delete(topic)
    db.commit()


def _calculate_accuracy(correct: int, total: int) -> float:
    if not total:
        return 0.0
    return correct / total


def get_admin_quiz_statistics(
    db: Session,
    *,
    question_limit: int = 10,
    bundle_limit: int = 10,
    user_limit: int = 10,
    bundle_user_limit: int = 5,
    question_category: Optional[QuizCategory] = None,
    question_difficulty: Optional[QuizDifficulty] = None,
    question_topic_id: Optional[int] = None,
    bundle_category: Optional[QuizCategory] = None,
    bundle_difficulty: Optional[QuizDifficulty] = None,
    question_page: int = 1,
    bundle_page: int = 1,
    bundle_user_page: int = 1,
) -> QuizAdminStatsResponse:
    # 문제별 오답률 높은 순 정렬
    question_query = (
        db.query(
            Question,
            func.count(UserQuizHistory.id).label("total_attempts"),
            func.sum(
                case(
                    (UserQuizHistory.is_correct.is_(True), 1),
                    else_=0,
                )
            ).label("correct_count"),
        )
        .join(UserQuizHistory, UserQuizHistory.question_id == Question.id)
        .options(selectinload(Question.topics))
    )

    if question_category:
        question_query = question_query.filter(Question.category == _resolve_category(question_category))

    if question_difficulty:
        question_query = question_query.filter(Question.difficulty == _resolve_difficulty(question_difficulty))

    if question_topic_id:
        question_query = question_query.join(Question.topics).filter(Topic.id == question_topic_id)

    question_rows = (
        question_query.group_by(Question.id)
        .having(func.count(UserQuizHistory.id) > 0)
        .all()
    )

    question_stats: List[QuestionPerformanceStat] = []
    for question, total_attempts, correct_count in question_rows:
        total_attempts = int(total_attempts or 0)
        correct_count = int(correct_count or 0)
        incorrect_count = max(total_attempts - correct_count, 0)
        accuracy = _calculate_accuracy(correct_count, total_attempts)
        question_stats.append(
            QuestionPerformanceStat(
                question_id=question.id,
                question_text=question.question_text,
                category=QuizCategory(question.category.value) if question.category else None,
                difficulty=QuizDifficulty(question.difficulty.value) if question.difficulty else None,
                total_attempts=total_attempts,
                correct_count=correct_count,
                incorrect_count=incorrect_count,
                accuracy=accuracy,
                topics=[_serialize_topic(topic) for topic in question.topics],
            )
        )

    question_stats.sort(key=lambda item: (item.accuracy, -item.total_attempts))
    question_total = len(question_stats)
    question_page = max(question_page, 1)
    question_start = max(question_page - 1, 0) * max(question_limit, 1)
    top_incorrect_questions = question_stats[question_start : question_start + question_limit]

    # 테마형(번들) 성과 통계
    accuracy_expr = case(
        (
            UserQuizBundleProgress.total_questions > 0,
            cast(UserQuizBundleProgress.correct_answers, Float)
            / cast(UserQuizBundleProgress.total_questions, Float),
        ),
        else_=None,
    )

    bundle_query = (
        db.query(
            QuizBundle,
            func.count(UserQuizBundleProgress.id).label("total_users"),
            func.sum(
                case(
                    (UserQuizBundleProgress.completed.is_(True), 1),
                    else_=0,
                )
            ).label("completed_users"),
            func.sum(
                case(
                    (UserQuizBundleProgress.in_progress.is_(True), 1),
                    else_=0,
                )
            ).label("in_progress_users"),
            func.avg(accuracy_expr).label("avg_accuracy"),
        )
        .join(UserQuizBundleProgress, UserQuizBundleProgress.bundle_id == QuizBundle.id)
    )

    if bundle_category:
        bundle_query = bundle_query.filter(QuizBundle.category == _resolve_category(bundle_category))

    if bundle_difficulty:
        bundle_query = bundle_query.filter(QuizBundle.difficulty == _resolve_difficulty(bundle_difficulty))

    bundle_rows = (
        bundle_query.group_by(QuizBundle.id)
        .having(func.count(UserQuizBundleProgress.id) > 0)
        .all()
    )

    bundle_stats: List[BundlePerformanceStat] = []
    for bundle, total_users, completed_users, in_progress_users, avg_accuracy in bundle_rows:
        bundle_stats.append(
            BundlePerformanceStat(
                bundle_id=bundle.id,
                title=bundle.title,
                total_users=int(total_users or 0),
                completed_users=int(completed_users or 0),
                in_progress_users=int(in_progress_users or 0),
                average_accuracy=float(avg_accuracy or 0.0),
            )
        )

    bundle_stats.sort(key=lambda item: (item.average_accuracy, -item.total_users))
    bundle_total = len(bundle_stats)
    bundle_page = max(bundle_page, 1)
    bundle_start = max(bundle_page - 1, 0) * max(bundle_limit, 1)
    bundle_performance = bundle_stats[bundle_start : bundle_start + bundle_limit]

    # 사용자 성과 통계
    history_rows = (
        db.query(
            UserQuizHistory.user_id.label("user_id"),
            func.count(UserQuizHistory.id).label("attempts"),
            func.sum(
                case(
                    (UserQuizHistory.is_correct.is_(True), 1),
                    else_=0,
                )
            ).label("correct"),
        )
        .group_by(UserQuizHistory.user_id)
        .all()
    )

    history_map: Dict[int, Tuple[int, int]] = {
        row.user_id: (int(row.attempts or 0), int(row.correct or 0)) for row in history_rows
    }

    progress_rows = (
        db.query(
            UserQuizBundleProgress.user_id.label("user_id"),
            func.sum(
                case(
                    (UserQuizBundleProgress.completed.is_(True), 1),
                    else_=0,
                )
            ).label("completed_bundles"),
            func.avg(accuracy_expr).label("avg_accuracy"),
        )
        .group_by(UserQuizBundleProgress.user_id)
        .all()
    )

    progress_map: Dict[int, Tuple[int, Optional[float]]] = {
        row.user_id: (int(row.completed_bundles or 0), float(row.avg_accuracy) if row.avg_accuracy is not None else None)
        for row in progress_rows
    }

    bundle_user_rows = (
        db.query(
            UserQuizHistory.bundle_id.label("bundle_id"),
            UserQuizHistory.user_id.label("user_id"),
            func.count(UserQuizHistory.id).label("attempts"),
            func.sum(
                case(
                    (UserQuizHistory.is_correct.is_(True), 1),
                    else_=0,
                )
            ).label("correct"),
        )
        .filter(UserQuizHistory.bundle_id.isnot(None))
        .group_by(UserQuizHistory.bundle_id, UserQuizHistory.user_id)
        .all()
    )

    bundle_ids = {row.bundle_id for row in bundle_user_rows if row.bundle_id is not None}
    bundle_user_user_ids = {row.user_id for row in bundle_user_rows if row.user_id is not None}

    user_ids = set(history_map.keys()) | set(progress_map.keys()) | bundle_user_user_ids

    bundles: List[QuizBundle] = []
    if bundle_ids:
        bundles = db.query(QuizBundle).filter(QuizBundle.id.in_(bundle_ids)).all()
    bundle_index = {bundle.id: bundle for bundle in bundles}

    progress_by_bundle_user: Dict[Tuple[int, int], UserQuizBundleProgress] = {}
    if bundle_ids:
        bundle_progress_rows = (
            db.query(UserQuizBundleProgress)
            .filter(UserQuizBundleProgress.bundle_id.in_(bundle_ids))
            .all()
        )
        progress_by_bundle_user = {
            (progress.user_id, progress.bundle_id): progress for progress in bundle_progress_rows
        }

    user_stats: List[UserPerformanceStat] = []
    bundle_user_stats_map: Dict[int, List[UserBundlePerformanceStat]] = {}

    if user_ids:
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_index = {user.id: user for user in users}

        for user_id in user_ids:
            user = user_index.get(user_id)
            if not user:
                continue

            attempts, correct = history_map.get(user_id, (0, 0))
            completed_bundles, avg_bundle_accuracy = progress_map.get(user_id, (0, None))

            if attempts == 0 and completed_bundles == 0:
                continue

            accuracy = _calculate_accuracy(correct, attempts)
            user_stats.append(
                UserPerformanceStat(
                    user_id=user.id,
                    nickname=user.nickname,
                    total_attempts=attempts,
                    correct_answers=correct,
                    accuracy=accuracy,
                    completed_bundles=completed_bundles,
                    average_bundle_accuracy=avg_bundle_accuracy,
                )
            )

        for row in bundle_user_rows:
            bundle_id = row.bundle_id
            user_id = row.user_id
            if bundle_id is None or user_id is None:
                continue

            bundle = bundle_index.get(bundle_id)
            user = user_index.get(user_id)
            if not bundle or not user:
                continue

            attempts = int(row.attempts or 0)
            correct = int(row.correct or 0)
            if attempts == 0:
                continue

            accuracy = _calculate_accuracy(correct, attempts)
            progress = progress_by_bundle_user.get((user_id, bundle_id))
            completed = bool(progress.completed) if progress else False

            bundle_user_stats_map.setdefault(bundle_id, []).append(
                UserBundlePerformanceStat(
                    user_id=user.id,
                    nickname=user.nickname,
                    attempts=attempts,
                    correct_answers=correct,
                    accuracy=accuracy,
                    completed=completed,
                )
            )

    user_stats.sort(key=lambda item: (-item.accuracy, -item.total_attempts))
    user_performance = user_stats[:user_limit]

    bundle_user_performance: List[BundleUserPerformanceStat] = []
    for bundle_id, user_list in bundle_user_stats_map.items():
        bundle = bundle_index.get(bundle_id)
        if not bundle:
            continue

        user_list.sort(key=lambda item: (-item.accuracy, -item.attempts))
        bundle_user_performance.append(
            BundleUserPerformanceStat(
                bundle_id=bundle.id,
                bundle_title=bundle.title,
                users=user_list[:bundle_user_limit],
            )
        )

    bundle_user_performance.sort(key=lambda item: item.bundle_title or "")
    bundle_user_total = len(bundle_user_performance)
    bundle_user_page = max(bundle_user_page, 1)
    bundle_user_start = max(bundle_user_page - 1, 0) * max(bundle_limit, 1)
    bundle_user_performance = bundle_user_performance[
        bundle_user_start : bundle_user_start + bundle_limit
    ]

    return QuizAdminStatsResponse(
        generated_at=datetime.utcnow(),
        top_incorrect_questions=top_incorrect_questions,
        bundle_performance=bundle_performance,
        user_performance=user_performance,
        bundle_user_performance=bundle_user_performance,
        question_total=question_total,
        bundle_total=bundle_total,
        bundle_user_total=bundle_user_total,
    )

