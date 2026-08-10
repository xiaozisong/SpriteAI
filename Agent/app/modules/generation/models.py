"""M4 异步任务模型。当前为占位，M4 阶段完善。

generation_tasks：长耗时生成任务的状态持久化，与 worker 联动。
"""
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class GenerationTask(Base):
    """异步生成任务：状态机 queued → running → succeeded/failed。"""
    __tablename__ = "generation_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    task_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)  # Redis 任务 id
    agent_id: Mapped[str] = mapped_column(String(50), default="chatbot")
    work_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="queued")
    params: Mapped[dict] = mapped_column(JSON, default=dict)
    result: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error: Mapped[str | None] = mapped_column(Text, nullable=True)
    retries: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(default=lambda: datetime.now(timezone.utc))
