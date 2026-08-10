"""M3 一键验证脚本：drop 旧表 → 重建 1024 维表 → 入库 → 检索。

跑法：
    cd Agent
    source .venv/bin/activate
    PYTHONPATH=. python3 scripts/m3_full_pipeline.py

每一步都会打印进度，最后输出检索结果。
"""
import asyncio

from sqlalchemy import text

from app.core.db import engine, async_session, Base
from app.rag import models  # noqa: F401 — 注册模型
from app.rag.ingest import ingest_text
from app.rag.retrieval import search


# 一段稍长的测试文档（确保能切出多段，验证检索有意义）
TEST_DOC = """RAG（检索增强生成）是一种结合检索与生成的技术。

它的工作流程是：先根据用户问题从知识库检索相关文档片段，
再把这些片段拼进提示词，让 LLM 基于这些真实文档生成回答。

RAG 的核心价值是减少幻觉。LLM 的训练数据有截止日期，
对私有知识或最新事件一无所知，容易"编造"答案。
RAG 让 LLM 只基于检索到的真实文档回答，并能引用来源。

向量数据库是 RAG 的基础设施。pgvector 是 PostgreSQL 的向量扩展，
它给 Postgres 加了 vector 类型和相似度算子 <=>。
文档入库时被切分成 chunk，每个 chunk 算一个 embedding 向量存进去。
检索时把 query 也转成向量，用余弦相似度找最接近的 chunk。

HNSW 索引是 pgvector 推荐的高维向量索引，精度高、无需训练。
相比之下 IVFFlat 需要训练、可调 probes，适合冷启动大数据量场景。
"""


async def rebuild_table() -> None:
    """drop 旧表 → 用 create_all 重建（维度已改成 1024）。"""
    async with engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS knowledge_chunks CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS knowledge_bases CASCADE"))
        print("✅ 旧表已删除")
    # 重建（按最新模型定义，embedding 是 vector(1024)）
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        print("✅ 表已重建（embedding 维度 = 1024）")


async def main() -> None:
    print("\n=== 第 1 步：重建表 ===")
    await rebuild_table()

    print("\n=== 第 2 步：入库（切分 + embedding + 写库）===")
    n = await ingest_text("rag_教程", TEST_DOC)
    print(f"✅ 入库完成，共 {n} 段 chunk")

    print("\n=== 第 3 步：检索 ===")
    # 查出刚建的 kb_id
    async with async_session() as db:
        result = await db.execute(
            text("SELECT id, name FROM knowledge_bases ORDER BY id DESC LIMIT 1")
        )
        row = result.fetchone()
        kb_id = row.id
        print(f"知识库: id={kb_id}, name={row.name}")

    # 跑几个不同的 query，看检索效果
    queries = ["什么是 RAG", "RAG 怎么减少幻觉", "HNSW 和 IVFFlat 区别"]
    for q in queries:
        print(f"\n🔍 查询: {q}")
        results = await search(q, kb_id=kb_id, top_k=2)
        for i, r in enumerate(results, 1):
            print(f"  [{i}] 相似度 {r['similarity']}: {r['content'][:60]}...")


if __name__ == "__main__":
    asyncio.run(main())
