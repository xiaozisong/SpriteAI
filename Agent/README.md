# Boom Cat Agent 后端

FastAPI + LangGraph 驱动的 AI 创作 Agent 后端。对应
`docs/architecture/agent-backend-architecture.md` 与 `docs/architecture/backend-implementation-plan.md`。

## 两条请求链路（面试可讲）

1. **短耗时 · 对话/生成（同步 + SSE 流式）**
   `POST /agent/{agent_id}/stream` → LangGraph 编排 → SSE 下发 token / 状态
   （前端用 `postLangGraphStream` 解析 `messages/partial`、`messages/complete`、`updates`）。

2. **长耗时 · 深度生成（异步任务 + 轮询）**
   `POST /api/tasks` 入 Redis Stream（consumer group）→ `worker/run_worker.py`
   消费并调 LangGraph → 前端 `GET /api/tasks/{id}/status` 轮询。
   「队列 / 删量 / 重试（指数退避）/ DLQ / 幂等」机制与简历里的 BullMQ 等价。

## 快速启动（M0 基线）

```bash
cd Agent
cp .env.example .env          # 填入 OPENAI_API_KEY
docker compose up -d postgres redis   # 只起依赖

# 建虚拟环境装依赖
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# 启动 API
uvicorn app.main:app --reload --port 8000

# 起 worker（任务队列）
python -m worker.run_worker
```

验证：

```bash
curl localhost:8000/health                      # {"status":"ok"}
# M1 打通后：
curl -N -X POST localhost:8000/agent/chatbot/stream \
  -H 'Content-Type: application/json' \
  -d '{"message":"你好","thread_id":"t1"}'
```

## 目录结构

```
app/
├── main.py              入口 / lifespan
├── observability.py     Sentry + LangSmith（M5）
├── core/                config / db / redis
├── agents/              base(状态) / chatbot / registry(多 Agent)
│                        ← M1: 实现 novel_assistant 等
├── api/                 routes_stream(SSE) / routes_tasks(异步任务)
├── schema/              Pydantic 协议模型 + SSE 帧
├── modules/             generation / studio（M2 业务落库）
└── rag/                 pgvector 知识库（M3）
worker/run_worker.py     Redis Streams 任务消费
```

## 演进路线

| 阶段 | 内容 | 状态 |
|---|---|---|
| M0 | 骨架 + docker-compose + FastAPI | ✅ 已就绪 |
| M1 | LangGraph Agent + SSE（chatbot 基线已通，待扩展多 Agent） | 🔧 你来做核心 |
| M2 | works/sessions/messages 持久化 | 待做 |
| M3 | RAG + pgvector 入库 / 检索 | 待做 |
| M4 | 异步任务完善（重试/DLQ/幂等/落库） | 🔧 你来做核心 |
| M5 | Sentry + LangSmith + 测试 | 待做 |
