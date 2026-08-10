# Boom Cat Agent 后端 · 架构设计与落地计划

> **定位**：为 `boom_cat`（爆文猫 · AI 创作平台）前端补一个**真实的、符合简历描述的 Agent 后端**，用最小的前端改动（甚至不改前端，只做 URL/网关切换）跑通。本项目以**学习 + 面试可回答**为第一目标，因此技术选型和架构刻意贴合简历关键词。

## 0. 一句话目标

> 为 boom_cat 增建一个 **Python(FastAPI+LangGraph) 驱动的 Agent 后端**，支持 AI 创作（小说/灵感/画布）、**RAG(pgvector)** 知识库问答、**Redis 会话/缓存 + 异步队列（多 Agent 任务流水线）**、**Sentry 可观测**，让简历里每个关键词都有可演示、可解释的真实落点。

---

## 1. 技术选型 → 简历关键词映射

| 简历关键词 | 本项目落点 | 理由 |
|---|---|---|
| LangChain | `langchain-openai` / `langchain-core` 消息与工具抽象 | 生态标准 |
| **LangGraph** | `langgraph` 状态图驱动 Agent 编排 | 简历明确写了，呼应 DeepAgents 工作流 |
| **RAG** | LangChain 检索链 + pgvector 向量检索 | 简历写 pgvector |
| **向量数据库** | **PostgreSQL + pgvector** 扩展 | 贴合简历，且 Postgres 同时承载业务/会话/checkpoint |
| **Redis** | 缓存 · 会话上下文 · 流式扇出 · 短生命周期状态 | 简历写 Redis |
| **异步队列/轮询** | **Redis Streams / BullMQ(JS) 或 Python `RQ`/`arq`** 做生成任务队列，前端轮询 | 简历写 BullMQ、异步任务可观测 |
| **后端** | FastAPI + Pydantic v2 + SQLAlchemy(async) | 简历写后端全栈、模块分层 |
| DeepAgents | 借鉴其"主/子代理编排 + 中间件 + 工具接入"思想，用 LangGraph 复刻 | 简历你"理解 DeepAgents" |
| Sentry / 可观测 | `sentry-sdk` + LangSmith/Langfuse 追踪 | 简历写 Sentry、前端可观测性 |

**为什么不直接"搬" agent-service-toolkit？**
- 它是通用模板，与你产品的 AI 场景（小说创作）无关。
- 学习价值在于**吃透其架构后自建适配业务的版本**，面试能讲"我如何改造/设计"比"我 clone 了模板"加分得多。
- 保留 agent-service-toolkit 作为**架构参考**即可，不引入其依赖与代码基线。

---

## 2. 整体架构图（分层）

```
┌───────────────────────────── Frontend (boom_cat, 不改动或极小改动) ─────────────────────────────┐
│  src/api/apiClient → 当前指向火山网关  │  通过 baseURL 切换到新后端 /api 与 /agent/stream        │
└───────────────────────────────────────────────────────────────────────────────────────────┘
                                          │
┌─────────────────────────────────────────┴────────────────────────────────────────────┐
│                        🐍 Agent 后端 (FastAPI, 本项目)                                │
│                                                                                      │
│  ┌───────────────┐   ┌────────────────────┐   ┌──────────────────────────────────┐  │
│  │  Gateway / 路由 │   │  Session/Works 业务  │   │  Agent 编排 (LangGraph)          │  │
│  │  (模块/控制层)   │   │  (SQLAlchemy+pgvector)│   │  ┌────────────────────────────┐│  │
│  └───────┬───────┘   └─────────┬──────────┘   │  │  research_assistant(reAct)   ││  │
│          │                    │               │  │  novel_assistant(plan&solve)││  │
│          │                    │               │  │  canvas_assistant(react)    ││  │
│          │                    │               │  └────────────────────────────┘│  │
│          ├────────────────────┴───────────────┼─ RAG 检索器(pgvector, 知识库)    │  │
│          │                                    └──────────────────────────────────┘  │
│  ┌───────┴───────────────────────────────────────────────┐                          │
│  │  Infrastructure 层                                     │                          │
│  │   • PostgreSQL + pgvector (业务+向量+checkpoint)         │                          │
│  │   • Redis (会话缓存 / 流式扇出 / 队列)                    │                          │
│  │   • 任务队列 (arq/BullMQ) → 长耗时生成异步 + 前端轮询      │                          │
│  │   • Sentry + LangSmith/Langfuse 追踪                    │                          │
│  └─────────────────────────────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 请求的两条链路（重要，面试可讲）

1. **短耗时 · 对话/生成（同步 + SSE 流式）**
   `POST /agent/{agent_id}/stream` → LangGraph 编排 → 直接 SSE 回传给前端
2. **长耗时 · 深度生成（异步任务 + 轮询）**
   `POST /api/tasks` 入队(Redis) → Worker 消费 → LangGraph 跑完回写 → 前端 `GET /api/tasks/{id}/status` 轮询 / SSE 收进度

> 这两条链路分别对齐你简历里的"流式响应"和"异步 Run 轮询 / BullMQ 削峰重试"。

---

## 3. Agent 编排设计（LangGraph，对齐 DeepAgents）

借鉴你对 DeepAgents 的理解（主/子代理编排 + 中间件 + 工具接入），用 LangGraph 表达：

### 3.1 通用状态图
```text
[user_input] → (pre-check/content-safety 中间件)
             → [AGENT 节点] ←→ { tools: 联网搜索/file/绘图/RAG检索 }
             → (post-check / 记录 LangSmith)
             → [Stream 输出 / 写回任务结果]
```
- 用 `StateGraph(state_schema=MessagesState)` 建图。
- 用 `ToolNode` + `tool_calling` 实现 ReAct 循环。
- 用 `interrupt()` 实现 HITL（人机协同，前端审批），对齐简历的"生成-反馈-再生成"。

### 3.2 多 Agent 注册（按 URL / 参数路由）
| agent_key | 范式 | 定位 | 工具 |
|---|---|---|---|
| `novel_assistant` | Plan-and-Solve | 长文/大纲/章节生成 | 文件读写、风格模板、RAG |
| `inspiration_assistant` | ReAct | 灵感/脑暴/发散 | 联网搜索、RAG |
| `canvas_assistant` | ReAct | 画布/剧本节点生成 | 结构化输出、RAG |
| `chatbot` | 简单对话 | 闲聊/问答 | 基础 |

> 每个 Agent 是一个 `CompiledStateGraph`，统一放进 `AGENTS: dict[str, CompiledGraph]`，路由层按 key 分发。**这正是 agent-service-toolkit 的做法，也是你简历"多代理编排"的可讲点。**

### 3.3 记忆与会话
- **短时记忆（Thread 级）**：LangGraph Checkpointer 存到 **Postgres**（`langgraph-checkpoint-postgres`），用 `thread_id` 关联前端 `sessionId`。
- **长期记忆（跨会话）**：LangGraph `Store`（InMemory / Postgres），供 Agent 沉淀写作风格偏好。
- **Redis 缓存**：热点 Prompt 模板、最近会话摘要。

---

## 4. RAG + pgvector 设计

### 4.1 场景
为创作 Agent 建"写作知识库/风格库/模板库"，支持"引用知识片段"增强生成。

### 4.2 检索链路
```text
文档入库：  上传 → 切分(LangChain TextSplitter, 按段落) → embedding(OpenAI/本地) → 写入 pgvector
查询时：   用户 query → embedding → pgvector 相似度检索(pgvector>=0.7 COSINE) → 拼入 prompt 上下文
刷新召回：  pgvector 的 HNSW 索引 + IVFFlat 对比（面试可讲）
```

### 4.3 关键 DDL（pgvector）
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE knowledge_chunks (
  id          BIGSERIAL PRIMARY KEY,
  kb_id       BIGINT NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  metadata    JSONB,
  embedding   vector(1536) NOT NULL,          -- OpenAI text-embedding-3 维度
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX kn_chunk_embed_hnsw ON knowledge_chunks
  USING hnsw (embedding vector_cosine_ops)  -- HNSW 余弦，适合高维
  WITH (m = 16, ef_construction = 64);
```
> 面试要点：为何选 HNSW（高维精度高、无训练重建）vs IVFFlat（需训练、可调 probes）；如何用 `metadata →>` 过滤 `kb_id` 做租户/知识库隔离。

---

## 5. 异步队列 + Redis（对齐 BullMQ/异步轮询）

> 简历写的是 BullMQ(Node)，本方案在 Python 侧用**对等实现**，道理完全一样（队列、worker、重试、削峰、可见性）。面试重点是讲清机制而非语言。

### 5.1 队列选型
| 方案 | 说明 |
|---|---|
| **Redis Streams**（推荐，自包含） | 原生 Redis 即可，无额外依赖；用 `XADD`/`XREADGROUP` 做工作队列，自带 consumer group |
| arq（异步优先） | 基于 Redis 的 Python 异步任务队列，支持重试/scheduled，易上手 |
| BullMQ | Node 生态，若后续想与前端同语言可演化 |

### 5.2 任务流水线（深度生成）
```text
POST /api/tasks {agent_id, params}
   → 写入 task 表(状态 queued) + Redis Stream 入队
Worker 消费:
   → 状态 running → 调 LangGraph 图 → 流式/最终结果写回
   → 失败退避重试(指数退避, max_retries) → 状态 failed
前端: GET /api/tasks/{id}/status 轮询  或  SSE /api/tasks/{id}/stream 收进度
```
- 用 Redis 做"去重/幂等"（任务 id 唯一）。
- 失败进入死信(DLQ)，可重试（面试可讲"削峰 + 重试 + 可见性"）。

### 5.3 Redis 的多重职责
1. 会话上下文缓存（短 ttl）
2. 异步队列 / consumer group
3. 流式事件扇出（如果 worker 与 API 分进程，通过 Redis Pub/Sub 转 SSE）
4. 热点 Prompt / 生成结果缓存

---

## 6. 数据模型（PostgreSQL 为核心）

```
users            (复用/或并存，或用现有登录体系)
works            (项目/作品: id, user_id, title, type, stage)
sessions         (对话会话: id, work_id, thread_id, model)
messages         (消息: id, session_id, role, content, meta, created_at)
knowledge_bases  (知识库: id, user_id, name)
knowledge_chunks (向量块: id, kb_id, content, metadata, embedding)
generation_tasks (异步任务: id, agent_id, work_id, status, result, retries, error)
agent_checkpoints / store (LangGraph Checkpointer/Store 表, 由插件自建)
```

---

## 7. 目录结构（可运行骨架）

```
backend/
├── app/
│   ├── main.py                # FastAPI 入口，路由挂载，lifespan(初始化DB/Redis/Agent)
│   ├── core/
│   │   ├── config.py          # Pydantic Settings（db/redis/model/secret）
│   │   ├── db.py              # async SQLAlchemy engine + session
│   │   └── redis.py           # redis client + 队列封装
│   ├── agents/
│   │   ├── base.py            # StateGraph 工厂、通用图
│   │   ├── novel_assistant.py # Plan-and-Solve 创作 Agent
│   │   ├── inspiration_assistant.py
│   │   ├── canvas_assistant.py
│   │   ├── rag.py             # pgvector 检索器
│   │   └── registry.py        # AGENTS dict，按 key 路由
│   ├── api/
│   │   ├── routes_works.py    # 业务 CRUD
│   │   ├── routes_stream.py   # /agent/{id}/stream (SSE)
│   │   └── routes_tasks.py    # 异步任务 (POST/GET status/stream)
│   ├── modules/
│   │   ├── generation/        # 任务 store、队列发布、状态机
│   │   └── studio/            # session/message 存储
│   ├── schema/                # Pydantic 协议模型
│   └── rag/
│       ├── ingest.py          # 文档入库 pipeline
│       └── retrieval.py       # embedding + pgvector 检索
├── worker/                    # 任务队列 worker（arq/redis-stream）
│   └── run_worker.py
├── tests/
├── scripts/ingest.py          # CLI 知识库入库
├── alembic/                   # 数据库迁移
├── docker-compose.yml         # postgres(pgvector) + redis + api + worker
├── pyproject.toml
└── .env.example
```

---

## 8. 落地路线图（阶段化, 每阶段可面试可不面试）

> **M0（1 天）** 项目骨架 + docker-compose(postgres+pgvector+redis) + FastAPI 起服务
> **M1（2–3 天）** LangGraph 对话 Agent（chatbot）打通 `/agent/stream` SSE；**核心面试点**
> **M2（2 天）** async SQLAlchemy + `works/sessions/messages` 建模 + 会话持久化（放 Postgres checkpoint）
> **M3（2–3 天）** RAG(pgvector)：入库 pipeline + 检索 + 创作 Agent 引用
> **M4（2–3 天）** 异步任务队列：`/api/tasks` 入队 → worker → 前端轮询/SSE 进度
> **M5（1–2 天）** Sentry + LangSmith/Langfuse 追踪 + 测试
> **M6（可选）** 前端 baseURL 切换，真实联调

---

## 9. 面试问答准备清单（每条都要能讲 30 秒-1 分钟）

1. **为什么用 LangGraph 而不是直接调 LLM？** —— 状态图显式编排、支持 HITL interrupt、可插拔 checkpointer、流式与多 Agent 复用。
2. **DeepAgents 和你的 LangGraph 实现差异？** —— DeepAgents 主/子代理 + 中间件；我用 LangGraph StateGraph 复刻其主/子代理 + 内容安全中间件。
3. **pgvector 检索为什么选 HNSW / 为什么 1536 维？** —— 见 §4.3。
4. **Redis 在你这里到底做了什么？** —— 缓存 / 队列 / 流式扇出（§5.3），并解释与 BullMQ 的对应关系。
5. **异步任务的削峰、重试、死信、幂等怎么做的？** —— §5.2。
6. **长对话内存优化** —— backend 用 Redis 摘要 + LangGraph 长程记忆 + 前端虚拟列表（呼应你简历 400MB→200MB 优化）。
7. **RAG 如何防止"幻觉"/如何评测？** —— 引用来源透传、召回 chunk + LLaMA-Index 式 eval 思路。
8. **SSE 协议为什么自己定义 event/type？** —— 便于前端区分 token / 完整消息 / 状态 / 中断，扩展性强（呼应用户已有前端解析逻辑）。

---

## 10. 配置/环境变量示例

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/boomcat
# Redis
REDIS_URL=redis://localhost:6379/0
# LLM
OPENAI_API_KEY=sk-xxx
DEFAULT_MODEL=gpt-4o-mini
# Embedding
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIM=1536
# Observability
SENTRY_DSN=
LANGSMITH_API_KEY=
# Security
AUTH_SECRET=change-me
```

---

## 11. 快用最快能跑通的断点

优先实现 **M0 + M1**：一个能本地起服务、`curl` 打字测的 `chatbot` Agent，SSE 返回 token。这是"**真实 LangGraph 全栈可演示**"的最小闭环，也是面试最有力的起点。
