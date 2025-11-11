from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.quiz_schema import QuizCategory, QuizDifficulty, TopicSchema


class BundleHistoryItem(BaseModel):
    bundle_id: int
    title: str
    description: Optional[str] = None
    category: Optional[QuizCategory] = None
    difficulty: Optional[QuizDifficulty] = None
    total_questions: int
    correct_answers: int
    completed: bool
    in_progress: bool
    accuracy: float
    last_played_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None


class BundleHistoryResponse(BaseModel):
    items: List[BundleHistoryItem]


class WrongAnswerItem(BaseModel):
    history_id: int
    question_id: int
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    solved_at: datetime
    bundle_id: Optional[int] = None
    bundle_title: Optional[str] = None
    category: Optional[QuizCategory] = None
    difficulty: Optional[QuizDifficulty] = None
    topics: List[TopicSchema] = []
    explanation: Optional[str] = None


class WrongAnswerListResponse(BaseModel):
    items: List[WrongAnswerItem]


class CategoryStat(BaseModel):
    category: Optional[QuizCategory]
    attempts: int
    correct: int
    accuracy: float


class DifficultyStat(BaseModel):
    difficulty: Optional[QuizDifficulty]
    attempts: int
    correct: int
    accuracy: float


class HardQuestionStat(BaseModel):
    question_id: int
    question_text: str
    attempts: int
    correct: int
    accuracy: float


class UserQuizStatsResponse(BaseModel):
    total_attempts: int
    total_correct: int
    accuracy: float
    streak: Optional[int] = None
    category_stats: List[CategoryStat] = []
    difficulty_stats: List[DifficultyStat] = []
    hard_questions: List[HardQuestionStat] = []





