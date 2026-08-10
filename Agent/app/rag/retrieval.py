"""M3：RAG 检索器（dashscope SDK 版）。

从 knowledge_chunks 中检索与 query 最相似的 top_k 段。

核心：pgvector 的 `<=>` 算子（余弦距离），1 - distance 即为相似度。
"""
import asyncio

from dashscope import TextEmbedding
from sqlalchemy import text

from app.core.db import async_session
from app.core.config import settings

embedding_model = settings.EMBEDDING_MODEL


async def embed_query(query: str) -> list[float]:
    """把 query 转成向量（DashScope SDK）。"""
    loop = asyncio.get_running_loop()

    def _do_embed():
        resp = TextEmbedding.call(
            model=embedding_model,
            input=query,
            api_key=settings.EMBEDDING_API_KEY,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"DashScope embedding 失败: {resp.status_code} {resp.text}")
        return resp.output["embeddings"][0]["embedding"]

    return await loop.run_in_executor(None, _do_embed)


async def search(query: str, kb_id: int, top_k: int = 3) -> list[dict]:
    """检索与 query 最相似的 top_k 个 chunk。

    步骤：
    1. 把 query 转成向量
    2. 用 `<=>` 算子排序，找最近的 chunk
    3. 返回 content + metadata + 相似度
    """
    vec = await embed_query(query)
    # 转成 '['0.1, 0.2, ...]' 格式供 pgvector 使用
    vec_str = "[" + ",".join(str(v) for v in vec) + "]"

    sql = text("""
        SELECT content, metadata_,
               1 - (embedding <=> CAST(:vec AS vector)) AS similarity
        FROM knowledge_chunks
        WHERE kb_id = :kb_id
        ORDER BY embedding <=> CAST(:vec AS vector)
        LIMIT :k
    """)

    async with async_session() as db:
        result = await db.execute(sql, {"vec": vec_str, "kb_id": kb_id, "k": top_k})
        rows = result.fetchall()
        return [
            {
                "content": row.content,
                "metadata": row.metadata_,
                "similarity": round(row.similarity, 4),
            }
            for row in rows
        ]


async def main():
    # 假设 kb_id=1 是我们刚入库的那个
    results = await search("什么是 RAG", kb_id=1, top_k=3)
    for i, r in enumerate(results, 1):
        print(f"--- 第 {i} 段 (相似度 {r['similarity']}) ---")
        print(r["content"])


if __name__ == "__main__":
    asyncio.run(main())
