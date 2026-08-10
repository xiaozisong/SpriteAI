"""M3：文档入库 pipeline（dashscope SDK 版）。

流程：切分文档 → 每段 embedding → 写入 knowledge_chunks 表。

使用阿里云 DashScope SDK（官方），不是 OpenAI 兼容格式。
"""
import asyncio

from dashscope import TextEmbedding

from app.core.db import async_session
from app.core.config import settings
from app.rag.models import KnowledgeBase, KnowledgeChunk
from app.rag.vector_type import Vector

# 全局 embedding 客户端（DashScope SDK）
embedding_model = settings.EMBEDDING_MODEL


def split_document(text: str) -> list[str]:
    """把长文档切分成 chunk。

    面试要点：为什么必须切分？
    - 检索精度：用户问"主角性格"，整篇文档一个向量检索不到精确定位
    - 上下文限制：LLM 有 token 上限，塞不下整篇，只塞相关 chunk
    - 引用来源：每个 chunk 能单独返回，让 LLM 引用"来自哪段"

    chunk_size 的选择是工程权衡：
    - 太大（如 1000）：短文档切不出多段，检索失去意义
    - 太小（如 100）：语义被切碎，检索到的 chunk 不完整
    - 经验值：500 字符（中文约 250 字），兼顾精度和完整度
    """
    from langchain_text_splitters import RecursiveCharacterTextSplitter

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=200,       # 调小到 200，让短文档也能切出多段
        chunk_overlap=30,     # 相邻段重叠 30，避免切断语义
        separators=["\n\n", "\n", "。", "！", "？"],  # 优先按段落/句子切
    )
    return splitter.split_text(text)


async def embed_texts(texts: list[str]) -> list[list[float]]:
    """批量计算 embedding（DashScope SDK）。

    DashScope 的 TextEmbedding.call 是同步的，但内部是异步 HTTP。
    我们用 asyncio.to_thread 把它放进线程池，不阻塞事件循环。
    """
    loop = asyncio.get_running_loop()

    def _do_embed():
        resp = TextEmbedding.call(
            model=embedding_model,
            input=texts,
            api_key=settings.EMBEDDING_API_KEY,
        )
        if resp.status_code != 200:
            raise RuntimeError(f"DashScope embedding 失败: {resp.status_code} {resp.text}")
        return [item["embedding"] for item in resp.output["embeddings"]]

    return await loop.run_in_executor(None, _do_embed)


async def ingest_text(kb_name: str, text: str) -> int:
    """把一个 KB 下的文档入库，返回 chunk 数量。

    四步：
    ① 建知识库（若不存在）
    ② 切分文档
    ③ 批量 embedding（最耗时，网络 I/O）
    ④ 写入向量表
    """
    async with async_session() as db:
        # ① 建知识库
        kb = KnowledgeBase(name=kb_name)
        db.add(kb)
        await db.flush()
        await db.refresh(kb)
        kb_id = kb.id

        # ② 切分文档
        chunks = split_document(text)
        print(f"共切分 {len(chunks)} 段")

        # ③ 批量 embedding（最耗时，因为每个 chunk 要网络请求）
        vectors = await embed_texts(chunks)
        assert len(vectors) == len(chunks), "embedding 数量与 chunk 不匹配"

        # ④ 写入向量表
        for chunk_text, vec in zip(chunks, vectors):
            db.add(KnowledgeChunk(
                kb_id=kb_id,
                content=chunk_text,
                metadata_={"chunk_index": chunks.index(chunk_text)},
                embedding=vec,
            ))
        await db.commit()
        return len(chunks)


async def main():
    text = """RAG（检索增强生成）是一种结合检索与生成的技术。
它先根据用户问题从知识库检索相关文档片段，
再把这些片段拼进提示词，让 LLM 基于这些真实文档生成回答，
从而减少幻觉并支持答案引用来源。
向量数据库（如 pgvector）用于存储和检索文本的语义向量表示。"""
    n = await ingest_text("rag_教程", text)
    print(f"✅ 入库完成，共 {n} 段")


if __name__ == "__main__":
    asyncio.run(main())
