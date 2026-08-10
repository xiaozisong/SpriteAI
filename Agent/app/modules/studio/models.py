"""M2：业务数据模型——works / sessions / messages。

每个模型对应一张表，后续 M3/M4 会在此基础上扩展。
"""
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Work(Base):
    """作品/项目：用户创作的小说、剧本等。"""
    __tablename__ = "works"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(nullable=True)  # 未登录用户用 visitor_id
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    work_type: Mapped[str] = mapped_column(String(50), default="novel")  # novel/script/etc
    stage: Mapped[str] = mapped_column(String(50), default="draft")  # draft/outline/finished
    extra: Mapped[dict] = mapped_column(JSON, default=dict)  # 预留扩展字段
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    sessions: Mapped[list["Session"]] = relationship(back_populates="work", cascade="all, delete-orphan")


class Session(Base):
    """对话会话：每个 work 下的多轮对话。"""
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)
    work_id: Mapped[int] = mapped_column(ForeignKey("works.id", ondelete="CASCADE"))
    thread_id: Mapped[str] = mapped_column(String(128), nullable=True)  # LangGraph checkpoint 用
    model: Mapped[str] = mapped_column(String(100), default="gpt-4o-mini")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    work: Mapped["Work"] = relationship(back_populates="sessions")
    messages: Mapped[list["Message"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    """消息：对话中的一条记录。"""
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    session_id: Mapped[int] = mapped_column(ForeignKey("sessions.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20))  # user/assistant/tool
    content: Mapped[str] = mapped_column(Text, nullable=True)
    extra: Mapped[dict] = mapped_column(JSON, default=dict)  # 预留扩展字段
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    session: Mapped["Session"] = relationship(back_populates="messages")
