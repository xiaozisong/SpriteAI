# 生产级 Agent 后端 · 5 天学习路径

> 目标：从 demo 级（能跑）到生产级（能上线、能讲细节）
> 方式：我执行 + 我讲原理 + 你理解，不让用户敲零散命令

## Day 1：错误处理 + 可观测性 ⬅ 当前

### 核心能力
- [x] 结构化日志（loguru）：`logger.bind(task_id=...)` 带上下文
- [x] 全局异常处理：统一错误格式 + 自动记日志
- [x] Sentry 接入骨架（DSN 配了就生效）
- [ ] LangSmith 追踪 Agent 链路
- [ ] 错误分类（临时 vs 永久）+ 不同处理策略

### 面试可讲
> "三层可观测：loguru 结构化日志做开发调试，Sentry 聚合异常并告警，
> LangSmith 追踪 Agent 链路（token/延迟/工具调用）。三者互补。"

---

## Day 2：并发 + 性能

### 核心能力
- [ ] 数据库连接池配置（pool_size, max_overflow）
- [ ] Redis 连接池
- [ ] worker 多 consumer 并发（count 参数）
- [ ] 限流（slowapi：每用户每秒 N 请求）
- [ ] SSE 连接数控制

### 面试可讲
> "连接池避免每次请求新建连接（TCP 握手贵）；worker 用多 consumer 并行消费；
> 限流防止单用户刷爆 LLM token 配额。"

---

## Day 3：安全 + 一致性

### 核心能力
- [ ] JWT 鉴权中间件
- [ ] Pydantic 输入校验（防 SQL 注入、prompt 注入）
- [ ] Redis + Postgres 双写一致性
- [ ] 任务幂等（Redis SETNX 去重）
- [ ] 敏感信息脱敏（日志不打印 API key）

### 面试可讲
> "JWT 鉴权 + Pydantic 校验输入；任务用 Redis SETNX 保证幂等；
> Redis 状态 + Postgres 落库双写，Redis 是快路径，Postgres 是持久化。"

---

## Day 4：Agent 生产化

### 核心能力
- [ ] token 成本控制（预算 + 统计 + 超限降级）
- [ ] 模型 fallback（主模型挂了降级到备用）
- [ ] 上下文窗口管理（长对话摘要 + 截断）
- [ ] RAG 集成进 Agent（retrieval 作为工具）
- [ ] HITL（interrupt 实现人机协同）

### 面试可讲
> "Agent 不是调一次 LLM 就完——要控成本（token 预算）、
> 做容灾（模型 fallback）、管上下文（摘要截断）、
> 集成 RAG（retrieval 作为工具让 Agent 自主调用）。"

---

## Day 5：部署 + 测试

### 核心能力
- [ ] gunicorn + uvicorn workers（多进程）
- [ ] 健康检查 + 优雅关闭（SIGTERM 处理）
- [ ] Dockerfile 生产化（多阶段构建，镜像小）
- [ ] 关键路径测试（pytest + httpx）
- [ ] CI 配置（GitHub Actions）

### 面试可讲
> "gunicorn 多 worker 提升并发；优雅关闭处理在途请求；
> 多阶段构建镜像从 1GB 压到 200MB；pytest 测关键路径。"

---

## 进度跟踪

| Day | 主题 | 状态 |
|---|---|---|
| 1 | 错误处理 + 可观测性 | 🔧 进行中 |
| 2 | 并发 + 性能 | 待开始 |
| 3 | 安全 + 一致性 | 待开始 |
| 4 | Agent 生产化 | 待开始 |
| 5 | 部署 + 测试 | 待开始 |
