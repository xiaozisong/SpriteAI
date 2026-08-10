# Boom Cat Agent 后端 · 实现计划与代码骨架

> 承接 `agent-backend-architecture.md`。本文件给出**可直接落地**的骨架代码 + 逐步实现计划。优先实现 **M0+M1**（骨架 + 对话 Agent SSE），这是面试最有力的展示点。

---

## 1. 项目骨架（`backend/` 目录）

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                # FastAPI 入口，lifespan(建表/初始化)
│   ├── core/
│   │   ├── config.py          # Pydantic Settings
│   │   ├── db.py              # async SQLAlchemy engine + session
│   │   └── redis.py           # redis client + 队列
│   ├── agents/
│   │   ├── base.py            # 通用 LangGraph 状态图工厂
│   │   ├── chatbot.py         # 最简对话 Agent
│   │   ├── novel_assistant.py # Plan-and-Solve 创作 Agent
│   │   ├── inspiration_assistant.py
│   │   ├── canvas_assistant.py
│   │   ├── rag.py             # pgvector 检索器
│   │   └── registry.py        # AGENTS dict, 按 key 路由
│   ├── api/
│   │   ├── routes_stream.py   # POST /agent/{agent_id}/stream (SSE)
│   │   ├── routes_tasks.py    # 异步任务
│   │   └── routes_works.py    # work/session/message CRUD
│   ├── modules/
│   │   ├── generation/        # 任务 store + 队列发布
│   │   └── studio/            # session/message 存储
│   ├── schema/
│   │   └── models.py          # Pydantic 协议模型
│   └── rag/
│       ├── ingest.py          # 文档入库
│       └── retrieval.py       # pgvector 检索
├── worker/
│   └── run_worker.py          # 任务队列 worker
├── tests/
├── alembic/
├── scripts/ingest.py
├── docker-compose.yml
├── pyproject.toml
└── .env.example
```

---

## 2. 基础设施：Docker Compose

`docker-compose.yml`：

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: boomcat
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

---

## 3. 核心配置与入口

### `app/core/config.py`
```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/boomcat"
    REDIS_URL: str = "redis://localhost:6379/0"
    OPENAI_API_KEY: str = ""
    DEFAULT_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIM: int = 1536
    SENTRY_DSN: str = ""
    LANGSMITH_API_KEY: str = ""
    AUTH_SECRET: str = ""

settings = Settings()
```

### `app/core/db.py`
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncSession:
    async with async_session() as session:
        yield session
```

### `app/core/redis.py`
```python
import redis.asyncio as aioredis

from app.core.config import settings

redis_client = aioredis.from_url(settings.REDIS_URL)
```

### `app/main.py`
```python
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes_stream import router as stream_router
from app.api.routes_tasks import router as tasks_router
from app.core.db import Base, engine
from app.core.redis import redis_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await redis_client.close()

app = FastAPI(lifespan=lifespan)
app.include_router(stream_router, prefix="/agent")
app.include_router(tasks_router, prefix="/api")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

---

## 4. Agent 层

### `app/agents/base.py` —— 状态类型 + 通用构建器
```python
from typing import Annotated, Any

from typing_extensions import TypedDict


class AgentState(TypedDict):
    """LangGraph 状态：消息累加列表。"""
    messages: Annotated[list, lambda x, y: x + y]


def messages_annotator(left: list, right: list) -> list:
    return [*left, *right]
```

### `app/agents/chatbot.py` —— 最简对话 Agent
```python
from langchain_openai import ChatOpenAI
from langgraph.graph import START, END, StateGraph

from app.agents.base import AgentState
from app.core.config import settings

llm = ChatOpenAI(model="gpt-4o-mini", api_key=settings.OPENAI_API_KEY)


def chatbot_node(state: AgentState):
    """把最近消息交给 LLM，返回回复（后续可 bind_tools 做 ReAct）。"""
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


graph = StateGraph(AgentState)
graph.add_node("node", chatbot_node)
graph.add_edge(START, "node")
graph.add_edge("node", END)
chatbot = graph.compile()
```

### `app/agents/registry.py` —— 多 Agent 路由
```python
from app.agents.chatbot import chatbot

AGENTS = {
    "chatbot": chatbot,
    # "novel_assistant": novel_assistant,
    # "inspiration_assistant": inspiration_assistant,
    # "canvas_assistant": canvas_assistant,
}


def get_agent(agent_id: str):
    if agent_id not in AGENTS:
        raise KeyError(f"Unknown agent: {agent_id}")
    return AGENTS[agent_id]
```

---

## 5. SSE 流式端点（核心面试点）

### `app/schema/models.py` —— 协议模型
```python
from pydantic import BaseModel


class StreamInput(BaseModel):
    message: str
    thread_id: str = "default"
    agent_id: str = "chatbot"
    model: str | None = None
    stream_mode: list[str] = ["messages", "updates"]


class TaskCreate(BaseModel):
    agent_id: str
    work_id: int | None = None
    params: dict = {}


class TaskStatus(BaseModel):
    task_id: str
    status: str
    result: dict | None = None
    error: str | None = None
```

### `app/api/routes_stream.py`
```python
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.registry import AGENTS, get_agent
from app.schema.models import StreamInput

router = APIRouter()


def _sse_block(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


async def _generate(user_input: StreamInput):
    agent = get_agent(user_input.agent_id)
    config = {"configurable": {"thread_id": user_input.thread_id}}

    async for stream_mode, payload in agent.astream(
        {"messages": [({"role": "user", "content": user_input.message})]},
        config=config,
        stream_mode=["messages", "updates"],
    ):
        if stream_mode == "messages":
            msg, _metadata = payload
            # 忽略非 AI 消息（如 human/tool）
            if getattr(msg, "type", None) not in ("ai", "AIMessageChunk"):
                continue
            content = getattr(msg, "content", "") or ""
            yield _sse_block("messages/partial", {
                "type": "ai",
                "id": getattr(msg, "id", ""),
                "content": content,
            })
        elif stream_mode == "updates":
            yield _sse_block("updates", payload)

    yield _sse_block("messages/complete", {"type": "ai", "status": "completed"})


@router.post("/{agent_id}/stream")
async def stream(agent_id: str, user_input: StreamInput):
    if agent_id not in AGENTS:
        raise HTTPException(status_code=404, detail=f"Unknown agent: {agent_id}")
    user_input.agent_id = agent_id
    return StreamingResponse(
        _generate(user_input),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )
```

---

## 6. 异步任务（Redis Streams + worker）

> 面试可讲：这是"长耗时生成"的主链路，机制与简历里的 BullMQ 完全等价（队列/consumer group/重试/死信）。

### `app/api/routes_tasks.py` —— 入队 + 状态查询
```python
import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.redis import redis_client
from app.schema.models import TaskCreate, TaskStatus

router = APIRouter()
QUEUE = "generation:tasks"
KEY_STATUS = "generation:task:%s"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@router.post("/tasks", response_model=TaskStatus)
async def create_task(req: TaskCreate):
    task_id = f"task_{uuid.uuid4().hex}"
    entry = {
        "task_id": task_id,
        "agent_id": req.agent_id,
        "work_id": req.work_id,
        **req.params,
    }
    # 入 Redis Stream，broker 用（近似 BullMQ add）
    await redis_client.xadd(QUEUE, entry)
    # 状态初始
    await redis_client.hset(KEY_STATUS % task_id, mapping={"status": "queued", "updated_at": _now()})
    return TaskStatus(task_id=task_id, status="queued")


@router.get("/tasks/{task_id}/status", response_model=TaskStatus)
async def task_status(task_id: str):
    data = await redis_client.hgetall(KEY_STATUS % task_id)
    if not data:
        return TaskStatus(task_id=task_id, status="not_found")
    return TaskStatus(
        task_id=task_id,
        status=data.get("status", "unknown"),
        result=json.loads(data["result"]) if data.get("result") else None,
        error=data.get("error"),
    )
```

### `worker/run_worker.py` —— 消费 Redis Stream
```python
import json

import redis.asyncio as aioredis

from app.agents.registry import get_agent

QUEUE = "generation:tasks"
KEY_STATUS = "generation:task:%s"
GROUP = "gen-workers"

async def process(entry: dict):
    task_id = entry["task_id"]
    agent = get_agent(entry["agent_id"])
    # 实际：调用 agent.ainvoke 写回 result
    await redis_client.hset(KEY_STATUS % task_id, mapping={
        "status": "running", "updated_at": ...,
    })
    # ... 跑 LangGraph，成功后写 succeeded, 失败指数退避重试 ...

async def main():
    r = aioredis.from_url(settings.REDIS_URL)
    try:
        await r.xgroup_create(QUEUE, GROUP, id="0", mkstream=True)
    except Exception:
        pass
    while True:
        resp = await r.xreadgroup(GROUP, "worker", {QUEUE: ">"}, count=1, block=5000)
        if resp:
            stream, messages = resp[0]
            for msg_id, fields in messages:
                await process(fields)
                await r.xack(QUEUE, GROUP, msg_id)
```

---

## 7. RAG + pgvector（`app/rag/`）

### `app/rag/retrieval.py` —— 相似度检索
```python
import asyncio

from langchain_openai import OpenAIEmbeddings
from sqlalchemy import text

from app.core.db import async_session
from app.core.config import settings

embeddings = OpenAIEmbeddings(
    model=settings.EMBEDDING_MODEL, api_key=settings.OPENAI_API_KEY
)

async def search(query: str, kb_id: int, top_k: int = 5) -> list[dict]:
    query_vec = await embeddings.aembed_query(query)
    vec_str = "[" + ",".join(map(str, query_vec)) + "]"
    sql = text("""
        SELECT content, metadata,
               1 - (embedding <=> CAST(:vec AS vector)) AS score
        FROM knowledge_chunks
        WHERE kb_id = :kb_id
        ORDER BY embedding <=> CAST(:vec AS vector)
    """)
    LIMIT_CLAUSE = " LIMIT :k"
    sql = text("""
        SELECT content, metadata,
               1 - (embedding <=> CAST(:vec AS vector)) AS score
        FROM knowledge_chunks
        WHERE kb_id = :kb_id
        ORDER BY embedding <=> CAST(:vec AS vector)
    """ + LIMIT_CLAUSE)
    async with async_session() as s:
        rows = (await s.execute(sql, {"vec": vec_str, "kb_id": kb_id, "k": top_k})).rows()
        return [dict(r._mapping) for r in rows]
```

### 面试要点
- `<=>` 是 pgvector 的距离算子，`1 - distance` 得到余弦相似度。
- 用 `metadata -> 'kb_id'` 之类的 `WHERE` 过滤实现知识库隔离。
- 高维用 `hnsw`（无训练、精度好）；低维量级大、冷启动可用 `ivfflat`。
- 维度必须与 embedding 模型输出一致（`text-embedding-3-small` 是 1536）。

---

## 8. 落地路线图

| 阶段 | 内容 | 时长 |
|---|---|---|
| **M0** | 骨架 + docker-compose(postgres+pgvector+redis) + FastAPI 起服务 | 1 天 |
| **M1** | LangGraph chatbot → `/agent/stream` SSE 打通（**核心面试点**） | 2–3 天 |
| **M2** | async SQLAlchemy + works/sessions/messages 建模 + 会话持久化 | 2 天 |
| **M3** | RAG(pgvector)：入库 pipeline + 检索 + Agent 引用 | 2–3 天 |
| **M4** | 异步任务队列：入队 → worker → 轮询/SSE 进度 | 2–3 天 |
| **M5** | Sentry + LangSmith/Langfuse + 测试 | 1–2 天 |
| **M6（可选）** | 前端 baseURL 切换，真实联调 | - |

---

## 9. 面试问答速记

1. **为什么用 LangGraph？** 状态图显式编排、HITL `interrupt()`、Checkpointer 可持久化记忆、多 Agent 复用、`astream` 原生流式。
2. **DeepAgents vs 你的实现？** DeepAgents = 主/子代理 + 中间件；我用 LangGraph StateGraph 复刻主/子代理 + 内容安全中间件。
3. **pgvector HNSW vs IVFFlat？** HNSW 高维精度高、无需训练；IVFFlat 需 train、可调 probes、内存小。起步 m=16/ef_construction=64。
4. **Redis 做了什么？** 缓存 / Redis Streams 任务队列 / 进程间流式扇出。
5. **异步任务削峰重试？** Redis Stream + consumer group + 指数退避 + DLQ + 幂等（任务 id）。
6. **RAG 防幻觉？** 召回注入 + 引用透传 + top_k 过滤 + 评测（标准答案对比）。
7. **SSE 协议为何自定义事件？** 便于前端区分 token/完整消息/状态/中断，扩展性强，且兼容既有 boom_cat 前端解析。
