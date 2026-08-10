"""M3：RAG 知识库模型——knowledge_bases + knowledge_chunks（含 pgvector 向量列）。

每个 chunk 存一段文档切分 + 它的嵌入向量（embedding），用于相似度检索。
"""
from datetime import datetime, timezone
from sqlalchemy import String, Text, BigInteger, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.rag.vector_type import Vector


class KnowledgeBase(Base):
    """知识库：用户上传的文档集合。"""
    __tablename__ = "knowledge_bases"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class KnowledgeChunk(Base):
    """向量块：文档切分后的一段 + 它的嵌入向量。"""
    __tablename__ = "knowledge_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    kb_id: Mapped[int] = mapped_column(ForeignKey("knowledge_bases.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_: Mapped[dict] = mapped_column(JSON, default=dict)
    embedding: Mapped[list[float]] = mapped_column(Vector(1024), nullable=False)  # 必须与 embedding 模型输出一致（qwen3.7 = 1024）
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
