from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, field_validator, model_validator


class QuizType(str, Enum):
    MULTIPLE = "MULTIPLE"
    SHORT = "SHORT"


class QuizCategory(str, Enum):
    ALL = "ALL"
    PRE_MODERN_HISTORY = "PRE_MODERN_HISTORY"
    MODERN_HISTORY = "MODERN_HISTORY"


class QuizDifficulty(str, Enum):
    BASIC = "기초"
    STANDARD = "보통"
    ADVANCED = "심화"


class TopicBase(BaseModel):
    name: str
    description: Optional[str] = None

    @field_validator("name")
    def validate_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("주제 이름은 비어 있을 수 없습니다.")
        return value


class TopicCreate(TopicBase):
    pass


class TopicUpdate(TopicBase):
    pass


class TopicSchema(TopicBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChoiceSchema(BaseModel):
    id: int
    content: str

    class Config:
        from_attributes = True


class QuestionSchema(BaseModel):
    id: int
    question_text: str
    type: QuizType
    choices: Optional[List[ChoiceSchema]] = None
    explanation: Optional[str] = None
    category: QuizCategory
    difficulty: QuizDifficulty
    topics: List[TopicSchema] = []
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class SubmitAnswerSchema(BaseModel):
    question_id: int
    user_answer: str
    bundle_id: Optional[int] = None


class QuizResultSchema(BaseModel):
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None


class AdminChoiceSchema(BaseModel):
    id: Optional[int] = None
    content: str
    is_correct: bool = False

    class Config:
        from_attributes = True


class AdminQuestionBase(BaseModel):
    question_text: str
    type: QuizType
    correct_answer: str
    explanation: Optional[str] = None
    choices: Optional[List[AdminChoiceSchema]] = None
    category: QuizCategory = QuizCategory.ALL
    difficulty: QuizDifficulty = QuizDifficulty.STANDARD
    topic_ids: List[int] = []
    image_url: Optional[str] = None

    @field_validator("question_text", "correct_answer")
    def not_empty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("해당 필드는 비어 있을 수 없습니다.")
        return value

    @model_validator(mode="after")
    def validate_choices(cls, values: "AdminQuestionBase"):
        quiz_type = values.type
        choices = values.choices or []

        if quiz_type == QuizType.MULTIPLE:
            if len(choices) < 2:
                raise ValueError("객관식 문제는 최소 2개의 보기가 필요합니다.")
            correct_count = sum(1 for choice in choices if choice.is_correct)
            if correct_count == 0:
                raise ValueError("객관식 문제는 적어도 하나의 정답 보기가 필요합니다.")
        else:
            values.choices = []

        return values


class AdminQuestionCreate(AdminQuestionBase):
    pass


class AdminQuestionUpdate(AdminQuestionBase):
    pass


class AdminChoiceResponse(AdminChoiceSchema):
    id: int


class AdminQuestionResponse(BaseModel):
    id: int
    question_text: str
    type: QuizType
    correct_answer: str
    explanation: Optional[str]
    choices: List[AdminChoiceResponse] = []
    created_at: Optional[datetime] = None
    category: QuizCategory
    difficulty: QuizDifficulty
    topics: List[TopicSchema] = []
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


class AdminQuestionListItem(BaseModel):
    id: int
    question_text: str
    type: QuizType
    created_at: Optional[datetime]
    choice_count: int
    has_explanation: bool
    category: QuizCategory
    difficulty: QuizDifficulty
    topics: List[TopicSchema] = []
    image_url: Optional[str] = None


class AdminQuestionListResponse(BaseModel):
    items: List[AdminQuestionListItem]
    pagination: dict


class QuizBundleQuestionItem(BaseModel):
    id: int
    question_id: int
    order: int
    question_text: str
    type: QuizType
    category: QuizCategory
    difficulty: QuizDifficulty
    explanation: Optional[str] = None
    choices: Optional[List[ChoiceSchema]] = None
    topics: List[TopicSchema] = []
    image_url: Optional[str] = None


class BundleQuestionProgressSchema(BaseModel):
    question_id: int
    is_correct: bool
    user_answer: str
    correct_answer: str
    explanation: Optional[str] = None
    solved_at: datetime
    order: int

    class Config:
        from_attributes = True


class UserBundleProgressSchema(BaseModel):
    bundle_id: int
    total_questions: int
    correct_answers: int
    completed: bool
    in_progress: bool = True
    last_question_id: Optional[int] = None
    last_question_order: Optional[int] = 0
    last_played_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BundleProgressUpdateSchema(BaseModel):
    total_questions: int
    correct_answers: int
    completed: bool = False
    last_question_id: Optional[int] = None
    last_question_order: Optional[int] = None
    in_progress: Optional[bool] = True

    @model_validator(mode="after")
    def validate_counts(cls, values: "BundleProgressUpdateSchema"):
        total_questions = values.total_questions
        correct_answers = values.correct_answers
        if total_questions < 0:
            raise ValueError("총 문제 수는 0 이상이어야 합니다.")
        if correct_answers < 0:
            raise ValueError("맞힌 문제 수는 0 이상이어야 합니다.")
        if correct_answers > total_questions:
            raise ValueError("맞힌 문제 수가 총 문제 수를 초과할 수 없습니다.")
        if values.last_question_order is not None and values.last_question_order < 0:
            raise ValueError("마지막 문제 순서는 0 이상이어야 합니다.")
        return values


class QuizBundleBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[QuizCategory] = None
    difficulty: Optional[QuizDifficulty] = None
    is_active: bool = True

    @field_validator("title")
    def validate_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("제목은 필수입니다.")
        return value


class QuizBundleCreate(QuizBundleBase):
    question_ids: List[int] = []


class QuizBundleUpdate(QuizBundleBase):
    question_ids: Optional[List[int]] = None


class QuizBundleResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[QuizCategory]
    difficulty: Optional[QuizDifficulty]
    question_count: int
    is_active: bool
    created_at: datetime
    user_progress: Optional[UserBundleProgressSchema] = None

    class Config:
        from_attributes = True


class QuizBundleDetailResponse(QuizBundleResponse):
    questions: List[QuizBundleQuestionItem] = []
    question_progress: List[BundleQuestionProgressSchema] = []


class QuizBundleListResponse(BaseModel):
    items: List[QuizBundleResponse]
    pagination: dict


class TopicListResponse(BaseModel):
    items: List[TopicSchema]
    pagination: Optional[dict] = None


class QuestionPerformanceStat(BaseModel):
    question_id: int
    question_text: str
    category: Optional[QuizCategory] = None
    difficulty: Optional[QuizDifficulty] = None
    total_attempts: int
    correct_count: int
    incorrect_count: int
    accuracy: float
    topics: List[TopicSchema] = []


class BundlePerformanceStat(BaseModel):
    bundle_id: int
    title: str
    total_users: int
    completed_users: int
    in_progress_users: int
    average_accuracy: float


class UserPerformanceStat(BaseModel):
    user_id: int
    nickname: str
    total_attempts: int
    correct_answers: int
    accuracy: float
    completed_bundles: int
    average_bundle_accuracy: Optional[float] = None


class UserBundlePerformanceStat(BaseModel):
    user_id: int
    nickname: str
    attempts: int
    correct_answers: int
    accuracy: float
    completed: bool


class BundleUserPerformanceStat(BaseModel):
    bundle_id: int
    bundle_title: str
    users: List[UserBundlePerformanceStat] = []


class QuizAdminStatsResponse(BaseModel):
    generated_at: datetime
    top_incorrect_questions: List[QuestionPerformanceStat] = []
    bundle_performance: List[BundlePerformanceStat] = []
    user_performance: List[UserPerformanceStat] = []
    bundle_user_performance: List[BundleUserPerformanceStat] = []
    question_total: int = 0
    bundle_total: int = 0
    bundle_user_total: int = 0
