from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    Boolean,
    DateTime,
    Enum,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class QuestionType(enum.Enum):
    MULTIPLE = "MULTIPLE"  # 객관식
    SHORT = "SHORT"        # 단답형/서술형

class QuizCategory(enum.Enum):
    KOREAN_HISTORY = "KOREAN_HISTORY"
    MODERN_HISTORY = "MODERN_HISTORY"
    WORLD_HISTORY = "WORLD_HISTORY"
    GENERAL_HISTORY = "GENERAL_HISTORY"


class QuizDifficulty(enum.Enum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_text = Column(Text, nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    category = Column(Enum(QuizCategory), nullable=False, default=QuizCategory.GENERAL_HISTORY)
    difficulty = Column(Enum(QuizDifficulty), nullable=False, default=QuizDifficulty.MEDIUM)
    image_url = Column(String(512))

    # 객관식 보기들 (MULTIPLE일 때만 존재)
    choices = relationship("Choice", back_populates="question", cascade="all, delete-orphan")
    bundles = relationship("QuizBundleQuestion", back_populates="question", cascade="all, delete-orphan")
    topics = relationship("Topic", secondary="question_topic_links", back_populates="questions")

class Choice(Base):
    __tablename__ = "choices"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    content = Column(String(255), nullable=False)
    is_correct = Column(Boolean, default=False)

    question = relationship("Question", back_populates="choices")

class UserQuizHistory(Base):
    __tablename__ = "user_quiz_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    bundle_id = Column(Integer, ForeignKey("quiz_bundles.id", ondelete="SET NULL"), nullable=True)
    user_answer = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False)
    solved_at = Column(DateTime, default=datetime.utcnow)

    question = relationship("Question")
    bundle = relationship("QuizBundle")


class QuizBundle(Base):
    __tablename__ = "quiz_bundles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(Enum(QuizCategory), nullable=True)
    difficulty = Column(Enum(QuizDifficulty), nullable=True)
    question_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("QuizBundleQuestion", back_populates="bundle", cascade="all, delete-orphan")


class QuizBundleQuestion(Base):
    __tablename__ = "quiz_bundle_questions"

    id = Column(Integer, primary_key=True, index=True)
    bundle_id = Column(Integer, ForeignKey("quiz_bundles.id", ondelete="CASCADE"))
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"))
    order = Column(Integer, default=0)

    bundle = relationship("QuizBundle", back_populates="questions")
    question = relationship("Question", back_populates="bundles")


class UserQuizBundleProgress(Base):
    __tablename__ = "user_quiz_bundle_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bundle_id = Column(Integer, ForeignKey("quiz_bundles.id", ondelete="CASCADE"), nullable=False)
    total_questions = Column(Integer, nullable=False, default=0)
    correct_answers = Column(Integer, nullable=False, default=0)
    completed = Column(Boolean, default=False)
    in_progress = Column(Boolean, default=True)
    last_question_id = Column(Integer, ForeignKey("questions.id", ondelete="SET NULL"))
    last_question_order = Column(Integer, default=0)
    last_played_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)

    bundle = relationship("QuizBundle")

    __table_args__ = (UniqueConstraint("user_id", "bundle_id", name="uq_user_bundle_progress"),)


class Topic(Base):
    __tablename__ = "quiz_topics"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("Question", secondary="question_topic_links", back_populates="topics")


class QuestionTopicLink(Base):
    __tablename__ = "question_topic_links"

    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("quiz_topics.id", ondelete="CASCADE"), nullable=False)

    __table_args__ = (UniqueConstraint("question_id", "topic_id", name="uq_question_topic"),)
