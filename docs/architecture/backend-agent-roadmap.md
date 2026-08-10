# 后端 + Agent 继续改造路线图

> 聚焦后端和 Agent 方向，对照简历技术栈补齐缺口。
> 每阶段：改造目标 → 学习内容 → 对应面试题 → 验收标准。
> 建议节奏：每阶段 3-5 天，边做边能讲清"为什么"。

---

## 当前已完成（M1-M4 基线）

| 能力 | 状态 | 简历对应 |
|------|------|----------|
| LangGraph 多 Agent（ReAct + Plan-Execute） | ✅ | 爆文猫 |
| SSE 自定义协议 | ✅ | 爆文猫 |
| SQLAlchemy + PostgreSQL | ✅ | 爆文猫 |
| pgvector RAG（向量检索） | ✅ | 爆文猫 |
| Redis Streams 异步队列 + Worker | ✅ | MemeSkill/BullMQ 对等 |
| loguru + Sentry + LangSmith | ✅ | 三个项目 |
| HITL interrupt（后端） | ✅ 部分 | 爆文猫 |

---

## M5：Reflection 范式 + Agent 自检（3 天）

### 改造目标
在 novel_assistant 加 Reflection 节点：生成章节后自检（文风、连贯、字数），不合格回退重写。

### 学习内容
1. Reflection 范式原理：生成 → 自评 → 修正循环
2. Self-Critique Prompt 设计：让 LLM 评价自己的输出
3. Reflexion 论文：带记忆的反思（记下"上次哪里错"）
4. 质量指标：用什么标准评（文风相似度、连贯性、字数）
5. 停止条件：反思几次停（避免无限循环 + 烧 token）

### 实现要点
```
planner → executor → reflector → (合格) → END
                      ↓ (不合格)
                   executor（带反思意见重写）
```
- reflector 节点：用另一个 LLM 调用评价（或同模型不同 prompt）
- 反思意见注入 messages，让 executor 知道"上次哪里不好"
- 最多反思 2 次（成本控制）

### 对应面试题
- Q31（ReAct/Plan-Solve/Reflection 区别 + 缺点）
- Q36（子 Agent 错误结果如何提高可靠性）
- Q71（Agent Eval 指标）
- Q73（成功率 vs Token 成本权衡）

### 验收标准
- 能讲清 Reflection 和 ReAct/Plan-Execute 的本质区别
- 能讲清"反思几次停"的成本权衡
- novel_assistant 生成后带自检，能演示"不合格回退重写"

---

## M6：DeepAgents 主子代理 + Router（4 天）

### 改造目标
用 LangGraph 复刻 DeepAgents 的主子代理架构：主代理编排，子代理专精（搜索/写作/校对），Router 路由。

### 学习内容
1. DeepAgents 原版机制：主代理（Orchestrator）+ 子代理（Specialist）+ 中间件
2. 主子代理通信：主代理下发任务，子代理返回结果，状态如何传递
3. Router 设计：规则路由 + LLM 路由 + 混合路由
4. 中间件机制：在主子之间插逻辑（安全过滤、日志、限流）
5. Subgraph：LangGraph 的子图机制，把子代理封装成独立 graph
6. Send API：LangGraph 的 map-reduce 模式（并行调多个子代理）

### 实现要点
```
router_node → 主代理（orchestrator）
                ├→ search_subagent（ReAct + 搜索工具）
                ├→ write_subagent（Plan-Execute + 写作）
                └→ proofread_subagent（Reflection）
主代理汇总子代理结果 → 输出
```
- 每个子代理是独立 StateGraph（subgraph）
- 主代理用 Send API 并行调多个子代理
- 中间件：在子代理调用前后插日志、安全过滤

### 对应面试题
- Q28（爆文猫 Graph 设计）
- Q29（为什么多 Agent 不用超级 Prompt）
- Q30（Router 模型判断 vs 规则，路由错了怎么办）
- Q35（主子代理优势 + 新问题）

### 验收标准
- 能讲清 DeepAgents 原版和 LangGraph 复刻的对应关系
- 能讲清 Router 的三种方式 + 路由错误的恢复策略
- 能演示主代理并行调 3 个子代理，汇总输出

---

## M7：Model Adapter + 限流熔断（4 天）

### 改造目标
抽象统一 Model Adapter，支持 OpenAI/Claude/DashScope 多模型 fallback；加限流和熔断。

### 学习内容
1. Adapter 模式：统一接口，各厂商转换
2. 消息格式标准化：各厂商 messages 格式差异
3. Tool Calling 标准化：各厂商 function calling 格式差异
4. 流式标准化：各厂商 SSE chunk 格式差异
5. Fallback 策略：主模型挂 → 备模型，同模型降级
6. 熔断器：连续失败熔断，半开恢复
7. 限流：令牌桶 / 漏桶，用户级 + 全局级
8. Token 预算：实时累计，超预算降级或停

### 实现要点
```python
class ModelAdapter(ABC):
    async def chat(messages, tools) -> Response
    async def stream(messages, tools) -> AsyncIterator[Chunk]

class OpenAIAdapter(ModelAdapter): ...
class ClaudeAdapter(ModelAdapter): ...
class DashScopeAdapter(ModelAdapter): ...

class ModelRouter:
    async def call(messages, tools):
        for adapter in [primary, fallback, cheap]:
            if circuit_breaker.is_open(adapter): continue
            try: return await adapter.chat(...)
            except: continue
        raise AllFailed
```
- 熔断器：连续 5 次失败 → 熔断 60s → 半开试一次
- 限流：Redis + lua 原子操作，令牌桶

### 对应面试题
- Q34（Tool 安全风险）
- Q66（降 50% Token 成本）
- Q105（日活涨 1000→10 万，瓶颈在哪）
- Q106（LLM 故障的 Timeout/Retry/Fallback/Circuit Breaker）
- Q107（多模型统一 Adapter）

### 验收标准
- 能讲清 Adapter 模式 + 消息/工具/流式标准化
- 能讲清熔断器的三种状态（closed/open/half-open）
- 能演示主模型超时自动切备模型

---

## M8：HITL 完整链路 + 审批流（3 天）

### 改造目标
把后端 interrupt 扩展成完整审批流：action_request 状态机、超时归档、commandOnly 续走、幂等。

### 学习内容
1. action_request 状态机：pending → in_progress → approved/rejected
2. 超时机制：定时任务扫超时 action，自动归档
3. commandOnly 续走：LangGraph 的 Command + resume 机制
4. 幂等：同一 action 重复审批不重复执行
5. 审批通知：WebSocket 推 + 邮件兜底
6. 审计：记录谁审批、何时、决策内容

### 实现要点
```python
# action_request 表
id, thread_id, type, payload, status, created_at, decided_at, decided_by

# 状态机
pending → approved → 续走 graph
pending → rejected → 终止
pending → timeout（24h）→ 归档

# 幂等
UPDATE action_requests SET status='approved' WHERE id=? AND status='pending'
# affected_rows=0 表示已处理，返回"已审批"
```
- 超时：APScheduler 定时扫，超 24h 自动归档
- 续走：POST /threads/{id}/resume 带 Command(resume=...)

### 对应面试题
- Q45（interrupt 本质解决什么）
- Q46（状态存哪，两天后能恢复吗）
- Q47（重复 Approve 幂等）
- Q48（什么情况必须 HITL）
- Q49（commandOnly 续走）

### 验收标准
- 能讲清 interrupt 的状态持久化 + 恢复机制
- 能讲清幂等的三层防护（前端 disable + DB 状态机 + Command 去重）
- 能演示 interrupt → 审批 → 续走完整流程

---

## M9：RAG 深化 - 混合检索 + Rerank（4 天）

### 改造目标
RAG 从纯向量检索升级到 Hybrid Search（向量 + BM25）+ Reranker 精排。

### 学习内容
1. BM25 算法：关键词检索的评分原理（TF-IDF 变体）
2. PostgreSQL 全文检索：tsvector + tsquery + GIN 索引
3. Hybrid Search 融合：RRF（Reciprocal Rank Fusion）算法
4. Reranker 原理：cross-encoder vs bi-encoder（向量检索是 bi）
5. Reranker 集成：bge-reranker / cohere-rerank
6. 检索质量评估：Recall@K、MRR、NDCG
7. Query 改写：HyDE、多 query 生成

### 实现要点
```python
# Hybrid Search
vector_results = pgvector_search(query_embedding, top_k=50)  # 向量召回
bm25_results = postgres_fts(query, top_k=50)                  # 关键词召回
fused = rrf_merge(vector_results, bm25_results)               # RRF 融合
reranked = reranker.rerank(query, fused, top_k=5)              # 精排
```
- BM25：Postgres 的 tsvector + ts_rank
- RRF：score = 1/(k + rank)，k=60 经验值
- Reranker：调 bge-reranker API 或本地模型

### 对应面试题
- Q50（完整 RAG Pipeline）
- Q57（TopK 大小权衡）
- Q58（召回相关但答案错的排查）
- Q59（Hybrid Search）
- Q60（Reranker）

### 验收标准
- 能讲清 BM25 和向量检索的互补性
- 能讲清 RRF 融合算法
- 能讲清 Reranker 为什么比向量检索精
- 能演示向量 + BM25 + Rerank 三级检索

---

## M10：Context Engineering + Memory（3 天）

### 改造目标
实现上下文管理：长对话摘要压缩、Short-term/Long-term Memory、上下文裁剪。

### 学习内容
1. Context Engineering vs Prompt Engineering：系统设计上下文 vs 优化措辞
2. 摘要压缩：老消息摘要 + 近期原文，何时触发
3. Short-term Memory：当前会话状态，存 Redis
4. Long-term Memory：用户偏好、历史作品，存 Postgres + 向量
5. 上下文裁剪策略：按相关性、按时间、按角色
6. Memory 检索：长期记忆用 RAG 检索
7. 窗口管理：接近满时触发压缩

### 实现要点
```python
def manage_context(state):
    if token_count(state.messages) > WINDOW * 0.8:
        # 触发压缩：老消息摘要，近期保留
        old = state.messages[:-10]
        summary = llm.summarize(old)
        state.messages = [SystemMessage(summary)] + state.messages[-10:]
    # 长期记忆检索
    if state.user_id:
        memory = rag.retrieve(user_preferences(state.user_id))
        state.messages = [SystemMessage(memory)] + state.messages
```
- 摘要触发：token 超 80% 窗口
- 长期记忆：用户偏好存 Postgres，用 RAG 检索注入

### 对应面试题
- Q67（Context Engineering vs Prompt Engineering）
- Q68（窗口快满怎么选）
- Q69（Short-term vs Long-term Memory）
- Q70（Redis vs Postgres 存 Memory）

### 验收标准
- 能讲清 Context Engineering 的系统设计视角
- 能讲清摘要压缩的触发时机和代价
- 能演示长对话自动摘要 + 长期记忆注入

---

## M11：Eval 系统 + Agent 评估（3 天）

### 改造目标
建一套 Agent Eval 系统：标注 eval set、跑 A/B、统计显著性、质量 + 成本综合评估。

### 学习内容
1. Eval 指标体系：成功率、准确率、忠实度、相关性、完整性
2. Eval set 构建：标注 100+ case，覆盖各场景
3. LLM-as-Judge：用 LLM 评判 LLM 输出（G-Eval、Constitutional AI）
4. A/B 测试：同 prompt 跑 N 次，看分布不是单次
5. 统计显著性：t 检验、卡方检验，p-value
6. RAG 评估：RAGAS（faithfulness、answer relevancy、context recall）
7. 成本评估：质量提升 vs Token 成本的 ROI

### 实现要点
```python
class EvalSuite:
    def run(agent, eval_set):
        results = []
        for case in eval_set:
            output = agent.invoke(case.input)
            score = judge(output, case.expected)  # LLM-as-Judge
            results.append({output, score, tokens})
        return aggregate(results)  # 成功率、P95、token

def ab_test(agent_a, agent_b, eval_set, n=100):
    scores_a = [run_n_times(agent_a, case, n) for case in eval_set]
    scores_b = [run_n_times(agent_b, case, n) for case in eval_set]
    return statistical_test(scores_a, scores_b)  # p-value
```
- LLM-as-Judge：用 gpt-4 评判输出质量（1-5 分）
- RAGAS：faithfulness（是否基于 context）、answer relevancy

### 对应面试题
- Q71（Agent Eval 指标）
- Q72（A/B 85% vs 89% 是否更好）
- Q73（95% 成功率但 Token +300% 值得吗）

### 验收标准
- 能讲清 Eval 指标体系 + LLM-as-Judge
- 能讲清统计显著性的判断
- 能演示跑 eval set + A/B 对比 + 出报告

---

## M12：NestJS + Drizzle 对等实现（5 天，可选）

### 改造目标
用 NestJS + Drizzle 把 boom_cat 后端核心模块对等实现一遍，对应简历 MemeSkill 技术栈。

### 学习内容
1. NestJS 模块化：Module/Controller/Service/Repository
2. NestJS DI：依赖注入，providers + 构造函数注入
3. Drizzle ORM：schema 定义、迁移（drizzle-kit）、查询
4. Drizzle vs SQLAlchemy：SQL-like vs ORM 抽象
5. NestJS + BullMQ：用 BullMQ 替代 Redis Streams
6. NestJS + SSE：@Sse() 装饰器实现流式
7. NestJS 异常过滤器：全局异常处理 + Sentry 集成

### 实现要点
- 把 /agent/{id}/stream 用 NestJS @Sse() 重写
- 把 generation_tasks 用 BullMQ 重写
- 把 RAG 检索用 Drizzle 查询重写
- 对比两套实现的差异

### 对应面试题
- Q12（Redis 和 BullMQ 各解决什么）
- Q13（BullMQ Job 生命周期）
- Q23（ORM 价值，什么时候放弃 ORM）
- Q103（FastAPI vs NestJS 在 AI 后端的优势）

### 验收标准
- 能讲清 NestJS DI 和 FastAPI 依赖注入的差异
- 能讲清 Drizzle 和 SQLAlchemy 的设计哲学差异
- 能演示 NestJS 版的 SSE + BullMQ + Drizzle

---

## M13：分布式 Worker + 审计（4 天，进阶）

### 改造目标
Worker 从单机扩展到多机，加 Tool 版本化 + 审计日志，对应企业级生产。

### 学习内容
1. 多 Worker 消费：consumer group、任务分片、顺序保证
2. 分布式锁：Redis Redlock，同用户任务串行
3. Tool 版本化：版本号 + 多版本共存 + 历史重放
4. 审计日志：记录每步决策（输入、输出、模型、token）
5. 任务可重放：从快照恢复 vs 重新执行
6. 幂等键全局化：跨 Worker 重复消费防护
7. 监控告警：Worker 健康、队列堆积、任务失败率

### 实现要点
```python
# 多 Worker 消费同一 stream
await redis.xgroup_create("tasks", "workers", id="$", mkstream=True)
# 多个 worker 进程都 join "workers" group，自动负载均衡

# 同用户串行（分布式锁）
lock = redis.lock(f"user:{user_id}", timeout=300)
if not lock.acquire(blocking=True, timeout=60):
    raise Busy
try: process_task()
finally: lock.release()

# Tool 版本化
tool_registry.register("search_web", v1, SearchWebV1)
tool_registry.register("search_web", v2, SearchWebV2)
# Run 记录 tool 版本，重放时按版本调用
```

### 对应面试题
- Q14（Worker 崩溃恢复）
- Q17（Job 执行两次幂等）
- Q108（Tool 版本升级，历史 Run 重放）
- Q109（审计要保存哪些数据）

### 验收标准
- 能讲清多 Worker 消费 + 同用户串行的实现
- 能讲清 Tool 版本化 + 历史重放的策略
- 能演示 2 个 Worker 进程消费同一队列 + 审计日志查询

---

# 学习路径总结

## 优先级排序（按面试价值）

**P0（必做，面试高频）**：
- M5 Reflection（补齐第三范式）
- M6 DeepAgents 主子代理（简历核心）
- M8 HITL 完整链路（简历核心）
- M9 RAG 深化（RAG 是重点）

**P1（重要，提升深度）**：
- M7 Model Adapter + 熔断（高可用）
- M10 Context Engineering（前沿）
- M11 Eval 系统（量化能力）

**P2（可选，扩展广度）**：
- M12 NestJS + Drizzle（对应 MemeSkill）
- M13 分布式 Worker（进阶生产）

## 时间规划（8 周）

| 周 | 阶段 | 重点 |
|----|------|------|
| 1-2 | M5 + M6 | Reflection + DeepAgents |
| 3 | M8 | HITL 完整链路 |
| 4-5 | M9 | RAG 混合检索 + Rerank |
| 6 | M7 + M10 | Model Adapter + Context |
| 7 | M11 | Eval 系统 |
| 8 | M12 或 M13 | NestJS 或 分布式 |

## 学习方法

1. **先理解再编码**：每阶段先读理论/论文，搞清"为什么"，再动手
2. **小步实现**：每阶段最小可演示版本，不求完美
3. **关联面试题**：每做完一阶段，回去答对应面试题，验证理解
4. **写笔记**：每阶段写一篇技术笔记，沉淀成可讲的内容
5. **演示**：能向别人讲清"做了什么 + 为什么 + 踩了什么坑"

## 关键资源

- **论文**：Reflexion（反思）、Self-Discover（规划）、Tree of Thoughts
- **文档**：LangGraph 官方（subgraph、Send、interrupt）、DeepAgents 源码
- **工具**：LangSmith（trace + eval）、RAGAS（RAG 评估）、bge-reranker
- **书**：DDIA（分布式）、LLM 应用开发实践

## 验收总标准

做完所有 P0 + P1 后，你应该能：
1. 脱口而出三大 Agent 范式 + 各自适用场景
2. 画出爆文猫完整 Graph（含 Reflection + 主子代理 + HITL）
3. 讲清 RAG 三级检索（向量 + BM25 + Rerank）
4. 讲清 Model Adapter + 熔断 + 限流
5. 讲清 Context Engineering 的系统设计
6. 用 Eval 数据证明"我的优化有效"
