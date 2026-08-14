# 从前端到「全栈 + Agent」工程师：AgentOps 平台 15 天进化路线图

> **角色定位**：由高级 AI 应用全栈工程师（导师）主导，带你带项目。
> **目标学员**：4 年前端经验 + 基础 Agent 概念（MCP / Tool Calling / RAG）。
> **项目载体**：本仓库的 `boom_cat` AgentOps 平台（React 前端 + Java 控制面 + Python Agent Runtime）。
> **周期**：15 天（工作日每天 ~4-6 小时，含实战作业与总结）。

---

## 0. 为什么是这个项目、这 15 天要达成什么

### 0.1 一条"跑得通"的真实链路早已打通

本项目已经是一条**跨三端、全链路**的活系统（不是 toy demo）：

```
React(AgentOps Dashboard)
   │  POST /api/agentops/playground/run
   ▼
Java(Control Plane: Run 状态机 + Trace 落库 + Auth + AgentGateway)
   │  转发到 Python Runtime
   ▼
Python(FastAPI + LangGraph: novel_assistant / chatbot 等 Agent)
   │  执行时产出 Span / Event（trace_id 向下传播）
   ▼
HttpSink ──批量 POST /ingest──▶  Java(Trace/Span 落库)
   ▼
前端 TracesPage 三栏展示 Span 树
```

**看懂这条链路，就是全栈 + Agent 的入门**。15 天要做的事，就是**逐步拆开这条链路的每一环、亲手改每一环、并在每环上叠加工程能力**。

### 0.2 15 天结束时的能力画像

- 能独立从零搭一个 FastAPI + LangGraph Agent，并接入 Tool、流式输出、持久化。
- 能读懂并修改 Java 控制面（Run/Trace 的 CRUD 与状态机）。
- 理解并把控三种「数据库」：PostgreSQL（关系型）、Redis Streams（队列）、pgvector（向量检索）。
- 能在前端自行完成「后端接口 → 状态 → UI」的闭环，不再等别人给接口。
- 简历可写：**主导过 AgentOps 可观测平台的三端全链路开发与调优**。

### 0.3 约定与纪律

1. **先跑通 → 再拆解 → 再改造**。任何模块先能运行，再看内部，最后动手改。
2. **每个 Milestone 都要有一个"验收动作"**（curl / 页面 / 单测），做完才进下一个。
3. **用本仓库已有的 Phase/M 编号（M1~M5）与前端 AgentOps 模块对齐**，避免二次造概念。
4. 每天结束前写 3-5 行复盘（贴在 `docs/` 或随笔记），我在审阅时基于它给反馈。

---

## 1. 时间线总览（5 个阶段 × 3 天）

| 阶段 | 天 | 主题 | 产出 / 可验收成果 |
|---|---|---|---|
| **Phase A** | D1–D3 | 全栈链路贯通 + Python 后端入门 | 本地跑通整条链路；用 FastAPI 写第一个接口 |
| **Phase B** | D4–D6 | Java 控制面 + PostgreSQL 落库 | 熟悉 Run/Trace 数据流；亲手改一个 CRUD |
| **Phase C** | D7–D9 | Agent 核心：LangGraph + Tool Calling + SSE | 新写/改造一个 Agent，接 Tool 与流式 |
| **Phase D** | D10–D12 | RAG + Redis 异步队列 + 多重数据库 | 知识库检索；异步任务重试/幂等 |
| **Phase E** | D13–D15 | 可观测体系 + 评估 + 前端闭环收尾 | Trace 完善、Eval 跑通、前端接新能力 |

> **设计原则**：每天 60% 时间动手写，40% 理解原理。每个阶段最后一天有"验收作业"。

---

## Phase A：全栈链路贯通 + Python 后端入门（D1–D3）

### D1 · 先把整条链路跑起来（先跑通）

**任务**：
1. 按 `Agent/README.md` 快速启动，把 Python Runtime 跑起来（`uvicorn app.main:app`），验证 `GET /health`。
2. 用 curl 打一次流式对话：`POST /agent/chatbot/stream`，观察 SSE 帧（`messages/partial`、`messages/complete`、`updates`）。
3. 在浏览器打开前端，进入 `Traces` 页，点「新建 Trace」，**亲眼看到一次 Run 的 Span 树生成**。

**要理解的概念**：
- 什么是 SSE（Server-Sent Events），和 WebSocket 的区别。
- 一条消息从前端到 Python 再回来的完整 HTTP 路径。
- `src/api/index.ts` 里的 `postLangGraphStream` 为什么特殊（专门解析 LangGraph 的 `event:/data:` 格式）。

### D2 · Python 后端入门：FastAPI 心智模型

**任务**：
1. 精读 `Agent/app/main.py` + `app/core/config.py`（看懂 Settings / lifespan / 路由挂载）。
2. 自己在 `app/api/` 下**新建一个最小接口**（例如 `GET /healthz` 或一个 echo 接口），用 Pydantic 定义请求/响应模型。
3. 理解 FastAPI 三件套：**路径路由 → Pydantic 校验 → 依赖注入**。

**要理解的概念**：
- FastAPI 与 Express/Nest 的对应关系（路由、中间件、校验、依赖注入）。
- Pydantic 的 `BaseModel` 校验 = 前端的 runtime 校验（zod），但它在**服务端入口做强制契约**。
- 同步/异步 `def` / `async def` 的区别，以及为什么 IO 密集要 async。

### D3 · 拆解一次 Run：runtime 与 execute（本阶段验收）

**任务**：
1. 精读 `Agent/app/runtime/adapter.py`（AgentAdapter 抽象 + GameAssetAgentAdapter）与 `runtime/execute.py`。
2. 画一张时序图：`create_run → execute_run → adapter.run() → span 生成 → 返回 RunResult`。
3. **验收作业**：把 execute 里生成的 `run_id` / `trace_id` 逻辑讲清楚，并回答：为什么 `HttpSink` 要"run 终止时一次性批量上报"而不是每事件一条？

**要理解的概念**：
- Adapter 模式（把具体 Agent 与统一 Run 执行逻辑解耦）。
- trace_id / span_id / parent_span_id 的关系（分布式追踪的基础）。

---

## Phase B：Java 控制面 + PostgreSQL 落库（D4–D6）

### D4 · Java 控制面地图与数据库认知

**任务**：
1. 浏览 `backend/src/main/java/com/jingling/agentops/`（Controller / Service / Repository / Entity / Dto 的分层）。
2. 对照 `archive/server-nestjs/src/db/schema/`（12 张 Drizzle 表）理解实体边界。
3. **重点**：说清三张核心表 —— `AgentopsRunEntity`、`AgentopsTraceEntity`、`AgentopsSpanEntity` 各自存什么、有何关联。

**要理解的概念**：
- 关系型数据库基础：主键/外键/唯一约束/索引。用前端语言类比：一张表 = 一个集合，一行 = 一个对象，外键 = 引用。
- 为什么 Run 的**状态机**（running/success/failed）放在 Java 控制面，而不是 Python。

### D5 · 亲手改一个 CRUD（动手核心）

**任务**：
1. 沿 `AgentopsRunController → AgentopsRunService → AgentopsRunRepository` 读完整条链。
2. 选一个**容易的验收项**改造：例如给 Run 列表接口加一个"按状态过滤"参数，或用日志打印 `durationMs` 的分布。
3. 用 curl + 前端页面双重验证改动生效。

**要理解的概念**：
- JPA Repository 的声明式查询（`findByStatus` 等），和前端 `Array.filter` 的心智差异：**过滤发生在数据库，而不是内存**。
- 分页（`content` / `totalElements`）——前端 `TracesPage` 里 `res.content` 对应的正是这东西。

### D6 · 状态机、事务与验收（本阶段验收）

**任务**：
1. 搞懂 Run 状态机的迁移逻辑（开始→运行→成功/失败），回答：并发下两个请求同时改状态会怎样？（引出事务 / 行锁）。
2. **验收作业**：画出「前端发起 Playground Run → Java 建 Run 记录 → 转发 Python → Python 上报 span → Java 落库 → 前端拉 trace」的完整**数据库写入时序**，标注每一步写哪张表。

**要理解的概念**：
- ACID 事务、乐观锁/悲观锁、索引为什么能加速查询（B+树直觉）。

---

## Phase C：Agent 核心 —— LangGraph + Tool Calling + SSE（D7–D9）

> 这是"从前端工程师到 Agent 工程师"最关键的一周。

### D7 · 看懂一个真实 Agent：novel_assistant

**任务**：
1. 精读 `Agent/app/agents/novel_assistant.py`（Plan-and-Execute 范式）：`planner → executor → (tools) → executor → ...` 工作流。
2. 对照 `app/agents/base.py`（AgentState 基类）理解**状态如何在整个图里流转/追加合并**。
3. 画一幅节点图：每个 node 的输入、输出、做什么决策、如何终止（看 `should_continue` 的条件边）。
4. 对照 `app/runtime/adapter.py` 看 `LangGraphAdapter` 基类如何把这个 graph 包成可观测的 Run。

**要理解的概念**：
- LangGraph 的 `StateGraph`：节点（node）+ 边/条件边（conditional edge）+ 状态（state）。
- ReAct vs Plan-and-Execute 两种范式：`chatbot.py` 是 ReAct（边思考边调工具），`novel_assistant.py` 是 Plan-and-Execute（先规划再执行）。
- LangGraphAdapter 的"通用 trace 集成"：基类收敛了 graph 与 tracing 的对接，子类只需提供 `build_graph` 函数。

### D8 · 亲手加一个 Tool（动手核心）

**任务**：
1. 参考 `chatbot.py` 里的 `get_current_time` / `calculator` 工具，给 `novel_assistant.py` **新增一个真实工具函数**。建议方向：
   - `polish_tool`：对一段文字做风格润色（调一次 LLM 即可）
   - `consistency_checker_tool`：检查章节是否与大纲一致
   - `summarize_outline_tool`：把已写章节归纳回大纲
2. 用 `@tool` 装饰器注册，挂到 `executor` 的 `bind_tools([...])`，并确保它在一次 Run 的 `tool` span 里能被看到。
3. 在 `TracesPage` 的 Span 树上**肉眼可见**这个新 Tool 的调用。

**要理解的概念**：
- Tool Calling 的本质：LLM 决定"调不调、传什么参" → 框架执行工具 → 结果回填给 LLM。
- 工具的描述（description）如何影响 LLM 选择工具 —— 这是 Agent 调优的第一课。
- `should_continue` 条件边的判定逻辑：检查最后一条 ai message 是否有 `tool_calls`。

### D9 · 流式输出与验收（本阶段验收）

**任务**：
1. 精读 `Agent/app/api/routes_stream.py`，理解 SSE 如何把 LangGraph 的 async stream 转成逐帧下发。
2. 对照前端 `postLangGraphStream`，把「后端发什么帧 → 前端怎么解析」对齐。
3. **验收作业**：从"新增工具 → 一次 Run → Trace 里看到 tool span → 前端 Playground 流式看到输出"完整演示一遍，并写一段 200 字说明。

**要理解的概念**：
- 流式（streaming）与批式（一次性返回）在后端与网络的差别；背压 / 心跳。

---

## Phase D：多重数据库 —— RAG + Redis 异步队列（D10–D12）

> 一周方法论：**三种数据库各自解决什么"读/写/吞吐"问题**。

### D10 · PostgreSQL + pgvector：什么是向量检索

**任务**：
1. 精读 `Agent/app/rag/`（models / ingest / retrieval）与 `archive/.../knowledge-chunks.ts`（`embedding: vector(1024)`）。
2. 跑通一遍**入库（ingest）→ 检索（retrieval）**，用真实文本验证相似度 TOP-K。
3. 画出「文本 → embedding 向量 → pgvector 存储 → 余弦相似度检索」的流程。

**要理解的概念**：
- RAG 与向量检索的底层直觉："语义相似 = 多维空间上相近"。
- 为什么选 1024 维、`embedding` 列用什么距离函数，这块的取舍。

### D11 · Redis Streams：异步任务队列 + 重试（动手核心）

**任务**：
1. 精读 `Agent/app/api/routes_tasks.py` + `worker/run_worker.py`，对照 `m4_test_queue.py`。
2. 跑通：提交异步任务 → Redis Stream 入库 → worker 消费 → 前端**轮询** `GET /api/tasks/{id}/status`。
3. **改造**：给任务加"指数退避重试"与"失败次数上限"，观察行为。理解它与 BullMQ 的等价性（README 里明确写了）。

**要理解的概念**：
- 消息队列 vs 直接调用（削峰、解耦、异步）。
- 幂等性（为什么 worker 可能重复消费还安全）、DLQ。

### D12 · 三种数据库横评与验收（本阶段验收）

**任务**：
1. 绘制一张对比表：PostgreSQL（关系）/ Redis（队列+缓存）/ pgvector（向量）各自的**存储形态、适用场景、一致性代价**。
2. **验收作业**：为"小说创作 Agent"设计一个需要同时用到"关系库（用户/作品/章节）+ 队列（异步长文生成）+ 向量库（语料风格检索）"的场景，并说明数据如何流动。

---

## Phase E：可观测 + 评估 + 前端闭环收尾（D13–D15）

### D13 · 可观测体系：Trace/Span/Event 的进阶

**任务**：
1. 精读 `Agent/app/tracing/`（models / core / span_context / langgraph_hooks / sink）。
2. 重点理解 `tracing/span_context.py` 用 `contextvars` 在异步调用链中传播 id —— 这是分布式追踪的精华。
3. 给某次 LLM 调用**主动补充一个自定义 span 或事件**（比如记录 token 数 / 加入一个业务标记）。

**要理解的概念**：
- trace = 一次完整请求，span = 一个逻辑步骤，父子 span 组成树。
- `contextvars` 为什么能跨 async 函数/协程传播而不用全局变量（这也是前端 `AsyncLocalStorage` / 上下文的概念迁移）。

### D14 · 评估体系：Evaluations / Datasets / Experiments

**任务**：
1. 在 Java 控制面读 `AgentopsDatasetController` / `AgentopsEvaluatorController` / `AgentopsExperimentController`，理解三者关系（数据集 → 评估器 → 对照实验）。
2. 在**前端** `Evaluations / Datasets / Experiments` 页面走通一次"喂数据集 → 跑评估 → 看结果"。
3. 思考：如何给小说 Agent 写一条"章节是否包含必含情节要素"或"文风是否符合参考作品"的评估器，并跑出分数。

**要理解的概念**：
- LLM 评测的价值：不能靠"感觉"，要靠**可复现的数据集 + 评估器 + 分数**。
- 评估结果如何反过来指导 Agent 提示词 / 工具描述的调优（Agent 调优闭环）。

### D15 · 全链路收尾 + 综合验收（毕业作业）

**任务**：
1. 从「前端 → Java → Python → 数据库 → 前端」独立**完整搭一个 mini 新功能**（命题可选，见下）。
2. 用 Traces/Analytics 数据说明新功能的链路与耗时/成功率。
3. 输出一份 **1000 字内向报告**：这次学会了什么、每阶段踩的坑、后续想深入的方向。

**毕业命题（三选一）**：
- **A**：给 AgentOps 新增一个"按耗时排序的 Top Run 接口"，贯穿 Java + 前端表格。
- **B**：给小说 Agent 新增一个"风格一致性自动评估器"（生成分对照参考语料），落进 Datasets/Experiments，跑出分数并给出结论。
- **C**：把某次 Run 的 LLM 输入/输出以**自定义 Event** 记录，并在 TracesPage 详情里渲染出来。

---

## 附：导师审阅要点与每日节奏

### 验收完成的定义（每天必须满足，才可推进）
- 有可运行的代码（不是注释或伪代码）。
- 有可执行/可观察的验证动作（curl、页面、单测、日志）。
- 能用 100-200 字把"改了什么、为什么、结果如何"讲清楚（我据此给反馈）。

### 跟你的技术基础点对点衔接
| 你已会的（前端） | 将迁移到的（全栈） | 触达阶段 |
|---|---|---|
| axios / fetch + 拦截器 | FastAPI 路由 / Java Client | D1–D5 |
| state 管理（zustand） | 数据库持久化 + 状态机 | D4–D6 |
| 渲染 / 组件组合 | LangGraph 节点组合 / Adapter | D7–D9 |
| 异步与并发（Promise.all） | asyncio / Redis 队列 / contextvars | D7–D12 |
| 对象/数组引用（前端直觉） | 关系/向量/缓存数据库的权衡 | D10–D12 |
| 你已了解的 RAG / toolcalling | 在真实 Agent 里落地与调优 | D7–D12 |

### 关键文件速查
- 后端入口与配置：`Agent/app/main.py`、`Agent/app/core/config.py`
- Agent 核心：`Agent/app/agents/novel_assistant.py`、`Agent/app/agents/chatbot.py`、`Agent/app/agents/base.py`
- Agent Adapter 抽象：`Agent/app/runtime/adapter.py`（`LangGraphAdapter` 基类 + `NovelAgentAdapter` 实现）
- Runtime 抽象：`Agent/app/runtime/{adapter,execute,registry,store}.py`
- 可观测精华：`Agent/app/tracing/{models,span_context,core,sink}.py`
- 任务队列：`Agent/worker/run_worker.py`、`Agent/app/api/routes_tasks.py`
- RAG：`Agent/app/rag/`
- Agent 版本配置：`Agent/app/config/agent_versions.yaml`（novel_assistant v1.0 / v1.1）
- 历史归档（不再注册，仅教学参考）：`Agent/app/agents/asset_assistant.legacy.py`
- Java 控制面：`backend/.../agentops/*Controller.java`
- 前端链路：`src/agentops/api/agentopsApi.ts`、`src/agentops/pages/TracesPage.tsx`
- HTTP 基建：`src/api/index.ts`

---

> **写在最后**：这 15 天不是"读 15 天文档"，而是"每 3 天交付一个能被验证的东西"。你在前端已经很有手感，缺的只是「数据是怎么从后端流出来、又被谁收住存起来」这两块拼图。把上面这条链路亲手摸一遍，你就完成了从"前端工程师"到"全栈 + Agent 工程师"的关键跃迁。
