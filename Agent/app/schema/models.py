"""Pydantic 协议模型：SSE 流式 + 异步任务。"""
from pydantic import BaseModel, Field


# ---------- SSE 流式（同步 / agent stream） ----------
class StreamInput(BaseModel):
    message: str
    thread_id: str = "default"
    agent_id: str = "chatbot"
    model: str | None = None
    # LangGraph astream 的 stream_mode，按需覆盖
    stream_mode: list[str] = Field(default=["messages", "updates"])


# ---------- 异步任务（长耗时生成，前端轮询 / SSE 进度） ----------
class TaskCreate(BaseModel):
    agent_id: str
    work_id: int | None = None
    params: dict = Field(default_factory=dict)


class TaskStatus(BaseModel):
    task_id: str
    status: str  # queued / running / succeeded / failed / not_found
    result: dict | None = None
    error: str | None = None
    updated_at: str | None = None
