# NestJS 后端迁移任务拆分

## 架构目标

把当前单体 Python 后端拆成三层：

```
src/ (前端 React，已有)
  ↓ HTTP / SSE
server/ (NestJS - 业务后端 + 数据库通信)  ← 新建
  ↓ HTTP (调用 Agent 编排)
Agent/ (Python FastAPI - 写作 Agent)  ← 由 backend 改名
  ↓
PostgreSQL + Redis + pgvector
```

## 职责划分

| 层 | 职责 | 技术 |
|----|------|------|
| 前端 src/ | UI、SSE 消费、状态管理 | React + Zustand + TipTap |
| server/ (NestJS) | 业务逻辑、DB 通信、鉴权、对前端 API、调用 Agent | NestJS + Drizzle ORM |
| Agent/ (Python) | Agent 编排、LangGraph、SSE 推送、HITL、RAG | FastAPI + LangGraph |

**关键原则**：
- NestJS 是"业务网关"：所有前端请求先到 NestJS，NestJS 再调 Agent
- Agent 不直接对前端，只对 NestJS（解耦，Agent 可独立演进）
- DB 由 NestJS 管（Drizzle），Agent 不直接读写 DB（通过 NestJS 提供的 API 或共享只读连接）

## 目标目录结构

```
boom_cat-main/
├── src/                    # 前端（不动）
├── server/                 # 新建：NestJS 业务后端
│   ├── src/
│   │   ├── modules/        # 业务模块（threads/runs/works/users）
│   │   ├── common/         # 公共（过滤器/拦截器/守卫）
│   │   ├── config/         # 配置
│   │   ├── db/             # Drizzle schema + 迁移
│   │   ├── agent-client/   # 调用 Agent service 的 client
│   │   └── main.ts
│   ├── drizzle/            # 迁移文件
│   ├── package.json
│   └── tsconfig.json
├── Agent/                  # 原 backend 改名：Python Agent
│   ├── app/                # LangGraph + SSE + HITL + RAG（保留）
│   ├── worker/             # 异步 worker（保留）
│   ├── pyproject.toml
│   └── Dockerfile
├── docker-compose.yml      # 根目录统一编排（新建）
└── docs/
```

---

# 阶段 1：架构调整与目录重命名（0.5 天）

## 任务 1.1：backend → Agent 改名
- **目标**：把 `backend/` 改名为 `Agent/`，更新内部引用
- **步骤**：
  1. `mv backend Agent`
  2. 更新 `Agent/docker-compose.yml` 内的服务名（如 `backend-postgres` → `postgres`）
  3. 更新 `Agent/README.md`、`Agent/pyproject.toml` 里的路径引用
  4. 检查 `Agent/app/` 内部是否有硬编码 `backend` 路径（如 alembic.ini）
- **产出**：`Agent/` 目录，内部引用全部更新
- **验收**：`cd Agent && python -c "from app.main import app"` 不报错
- **依赖**：无

## 任务 1.2：Agent 服务边界确认
- **目标**：明确 Agent 对外暴露什么接口给 NestJS 调
- **步骤**：
  1. 列出 Agent 现有路由：`/agent/{id}/stream`（SSE）、`/api/tasks`（异步任务）
  2. 确认 Agent 不再直接对前端，改为对 NestJS
  3. Agent 的 SSE 端点保持（NestJS 转发或直连，见阶段 5 决策）
- **产出**：Agent 接口清单文档（写到本文件附录）
- **验收**：清单完整，能作为 NestJS 调用的契约
- **依赖**：1.1

## 任务 1.3：根目录 docker-compose.yml 规划
- **目标**：规划统一编排文件（先写骨架，阶段 7 填充）
- **步骤**：
  1. 在根目录建 `docker-compose.yml`
  2. 定义服务：postgres（pgvector）、redis、server（NestJS）、agent（Python）、worker
  3. 先写服务定义和依赖关系，具体构建命令阶段 7 补
- **产出**：`docker-compose.yml` 骨架
- **验收**：服务定义完整，依赖关系清晰
- **依赖**：1.1

---

# 阶段 2：NestJS 脚手架搭建（1 天）

## 任务 2.1：初始化 NestJS 项目
- **目标**：在 `server/` 创建 NestJS 项目
- **步骤**：
  1. `npx @nestjs/cli new server --package-manager pnpm`（或 npm）
  2. 进入 `server/`，安装核心依赖：
     - `pnpm add @nestjs/config @nestjs/swagger`
     - `pnpm add drizzle-orm pg dotenv`
     - `pnpm add -D drizzle-kit @types/pg`
  3. 配置 `tsconfig.json`（路径别名 `@/*`）
  4. 配置 `nest-cli.json`
- **产出**：可启动的空 NestJS 项目
- **验收**：`cd server && pnpm start:dev` 启动成功，访问 `localhost:3000` 返回 Hello
- **依赖**：阶段 1

## 任务 2.2：配置模块
- **目标**：环境变量管理
- **步骤**：
  1. 建 `server/.env`、`server/.env.example`
  2. 配置项：
     ```
     PORT=3000
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/boomcat
     REDIS_URL=redis://localhost:6379
     AGENT_SERVICE_URL=http://localhost:8000
     JWT_SECRET=xxx
     ```
  3. 建 `src/config/` 用 `@nestjs/config` 加载
- **产出**：配置模块，环境变量可注入
- **验收**：`ConfigService.get('DATABASE_URL')` 能拿到值
- **依赖**：2.1

## 任务 2.3：全局异常过滤器 + 日志
- **目标**：统一错误处理
- **步骤**：
  1. 建 `src/common/filters/all-exceptions.filter.ts`
  2. 建 `src/common/middleware/logger.middleware.ts`
  3. 在 main.ts 全局注册
- **产出**：全局异常过滤器 + 请求日志
- **验收**：抛错返回统一 JSON 格式，日志打印请求
- **依赖**：2.1

## 任务 2.4：健康检查端点
- **目标**：`/health` 端点供 docker-compose 健康检查
- **步骤**：
  1. 建 `AppController` 提供 `@Get('health')` 返回 `{ status: 'ok' }`
- **产出**：健康检查端点
- **验收**：`curl localhost:3000/health` 返回 ok
- **依赖**：2.1

---

# 阶段 3：NestJS 数据库层（Drizzle）（2 天）⭐ 核心

## 任务 3.1：Drizzle schema 设计
- **目标**：用 Drizzle 定义核心表（对齐 Python 侧已有模型）
- **步骤**：
  1. 参考 `Agent/app/modules/studio/models.py`（Work/Session/Message）和 `generation/models.py`（GenerationTask）
  2. 在 `server/src/db/schema/` 定义：
     - `users.ts`（用户）
     - `works.ts`（作品，对应 Python 的 Work）
     - `sessions.ts`（会话，对应 Session）
     - `messages.ts`（消息，对应 Message）
     - `generation-runs.ts`（生成任务，对应 GenerationTask）
     - `knowledge-bases.ts` + `knowledge-chunks.ts`（RAG，对应 Python rag/models）
  3. 用 Drizzle 的 `pgTable` 定义，字段类型对齐 Python 侧（含 pgvector）
- **产出**：完整 schema 文件
- **验收**：schema 能被 drizzle-kit 识别生成迁移
- **依赖**：2.1
- **注意**：维度和 Python 侧一致（embedding 1024），timestamp 用 `timestamp({ withTimezone: true })`

## 任务 3.2：pgvector 类型支持
- **目标**：Drizzle 支持 vector 类型
- **步骤**：
  1. Drizzle 没原生 vector，用 `customType` 自定义：
     ```typescript
     export const vector = (dim: number) => customType<{ data: number[]; driverData: string }>({
       dataType() { return `vector(${dim})` },
       toDriver(value) { return `[${value.join(',')}]` },
       fromDriver(value) { return JSON.parse(value) }
     })
     ```
  2. 在 schema 用 `vector(1024)`
- **产出**：vector 自定义类型
- **验收**：schema 含 vector 列能生成迁移
- **依赖**：3.1

## 任务 3.3：数据库连接池
- **目标**：配置 Drizzle + pg 连接池
- **步骤**：
  1. 建 `server/src/db/index.ts`
  2. 用 `drizzle-orm/node-postgres` + `Pool`
  3. 导出 `db` 实例供模块注入
  4. 建 `DbModule` 封装，全局可用
- **产出**：db 连接 + DbModule
- **验收**：能在 service 里注入 db 并查询
- **依赖**：2.2、3.1

## 任务 3.4：drizzle-kit 迁移配置
- **目标**：能用 drizzle-kit 生成和执行迁移
- **步骤**：
  1. 建 `server/drizzle.config.ts`
  2. 配置 schema 路径、输出路径、连接
  3. package.json 加脚本：
     - `db:generate`: `drizzle-kit generate`
     - `db:migrate`: `drizzle-kit migrate`
     - `db:studio`: `drizzle-kit studio`
- **产出**：迁移工具链
- **验收**：`pnpm db:generate` 生成迁移文件，`pnpm db:migrate` 执行成功
- **依赖**：3.1、3.3

## 任务 3.5：首次迁移 + 数据库初始化
- **目标**：在本地 Postgres 建表
- **步骤**：
  1. 启动 Postgres（用 Agent 的 docker-compose 或根目录的）
  2. 执行 `CREATE EXTENSION IF NOT EXISTS vector;`
  3. `pnpm db:migrate`
  4. 用 drizzle-studio 验证表结构
- **产出**：本地数据库表结构就绪
- **验收**：drizzle-studio 能看到所有表
- **依赖**：3.4、阶段 1 的 postgres 容器

---

# 阶段 4：NestJS 业务 API（2 天）⭐ 核心

## 任务 4.1：Users 模块（基础）
- **目标**：用户 CRUD（先简单，鉴权阶段 6 补）
- **步骤**：
  1. `nest g module users`、`nest g service users`、`nest g controller users`
  2. Service 用 db 注入，实现 findAll/findOne/create/update/delete
  3. Controller 暴露 REST：`GET /users`、`POST /users`、`GET /users/:id`
  4. DTO 用 class-validator 校验
- **产出**：Users 模块可 CRUD
- **验收**：curl 能创建/查询用户
- **依赖**：3.5

## 任务 4.2：Works 模块（作品）
- **目标**：作品 CRUD（对应 Python 的 Work）
- **步骤**：
  1. 建 Works 模块（Module/Service/Controller）
  2. 字段：id/userId/title/content/status/createdAt/updatedAt
  3. 关联：works → users（N:1）
  4. API：`GET /works?userId=`、`POST /works`、`GET /works/:id`、`PATCH /works/:id`、`DELETE /works/:id`
  5. 分页：`?page=&pageSize=`
- **产出**：Works 模块
- **验收**：能创建作品、按用户查列表、分页正常
- **依赖**：4.1

## 任务 4.3：Sessions 模块（会话）
- **目标**：会话 CRUD（对应 Thread 概念）
- **步骤**：
  1. 建 Sessions 模块
  2. 字段：id/workId/title/activeRunId/createdAt
  3. 关联：sessions → works（N:1）
  4. API：按 work 查 sessions、创建 session
- **产出**：Sessions 模块
- **验收**：能在某 work 下创建 session
- **依赖**：4.2

## 任务 4.4：Messages 模块（消息）
- **目标**：消息 CRUD（会话内的消息历史）
- **步骤**：
  1. 建 Messages 模块
  2. 字段：id/sessionId/role/content/toolCalls/createdAt
  3. 关联：messages → sessions（N:1）
  4. API：按 session 查消息（分页，支持游标）
- **产出**：Messages 模块
- **验收**：能在 session 下查消息历史
- **依赖**：4.3

## 任务 4.5：GenerationRuns 模块（生成任务）
- **目标**：生成任务 CRUD + 状态机（核心）
- **步骤**：
  1. 建 GenerationRuns 模块
  2. 字段：id/sessionId/status/prompt/result/attempts/lastError/startedAt/completedAt
  3. 状态机：queued → in_progress → completed/failed/cancelled
  4. API：
     - `POST /runs`：创建任务（含幂等键校验）
     - `GET /runs/:id`：查状态
     - `GET /runs?sessionId=&status=`：按会话查
  5. 幂等：`idempotency-key` header + Redis SETNX
- **产出**：GenerationRuns 模块 + 幂等
- **验收**：创建任务、查状态、重复请求不重复创建
- **依赖**：4.3、Redis（阶段 1）

## 任务 4.6：统一分页 + 响应格式
- **目标**：所有列表 API 统一分页和响应结构
- **步骤**：
  1. 建 `src/common/dto/pagination.dto.ts`
  2. 建 `src/common/interceptors/transform.interceptor.ts` 统一响应 `{ code, data, message }`
  3. 所有列表 API 返回 `{ items, total, page, pageSize }`
- **产出**：统一分页 + 响应
- **验收**：所有 API 响应格式一致
- **依赖**：4.1

---

# 阶段 5：NestJS ↔ Agent Service 通信（1.5 天）⭐ 核心

## 任务 5.1：Agent Client 封装
- **目标**：NestJS 封装调用 Agent service 的 client
- **步骤**：
  1. 建 `server/src/agent-client/agent-client.module.ts` + `agent-client.service.ts`
  2. 用 `@nestjs/axios` 或原生 fetch 调用 `AGENT_SERVICE_URL`
  3. 方法：
     - `startAgent(sessionId, prompt, runId)`：触发 Agent 开始
     - `getAgentStream(sessionId, runId)`：拿 SSE 流（转发用）
     - `approveAction(runId, actionId)`：HITL 审批
  4. 加 timeout、retry、错误处理
- **产出**：AgentClient 服务
- **验收**：能调通 Agent 的 `/agent/{id}/stream` 端点
- **依赖**：阶段 4、Agent 服务在跑

## 任务 5.2：SSE 转发决策与实现
- **目标**：前端 SSE 请求经 NestJS 转发到 Agent，还是直连 Agent
- **决策**：
  - **方案 A（NestJS 转发）**：前端 → NestJS /runs/:id/stream → NestJS 转发 Agent SSE。优点：统一入口、可加鉴权/限流。缺点：NestJS 要处理流转发，多一跳。
  - **方案 B（前端直连 Agent）**：NestJS 返回 Agent URL，前端直连。优点：简单、低延迟。缺点：Agent 暴露给前端、绕过鉴权。
  - **推荐 A**：生产级要统一鉴权，NestJS 转发更可控
- **步骤（方案 A）**：
  1. 在 RunsController 加 `@Sse(':id/stream')` 端点
  2. 用 NestJS 的 `@Sse()` 装饰器返回 Observable
  3. 内部订阅 AgentClient 的 SSE 流，原样转发给前端
  4. 处理前端断开（取消对 Agent 的订阅）
- **产出**：SSE 转发端点
- **验收**：前端连 NestJS SSE 能收到 Agent 的 token 流
- **依赖**：5.1

## 任务 5.3：创建 Run 触发 Agent
- **目标**：`POST /runs` 不仅写 DB，还要触发 Agent 执行
- **步骤**：
  1. `POST /runs` 流程：
     - 幂等校验（Redis SETNX）
     - 写 DB（status=queued）
     - 调 `agentClient.startAgent()` 触发 Agent
     - 返回 runId
  2. Agent 侧：收到触发后开始 LangGraph 执行，更新 run 状态（回调或 Agent 写 DB）
  3. 状态同步决策：
     - **方案 A**：Agent 通过 NestJS API 回写状态（Agent 不直连 DB）
     - **方案 B**：Agent 直连 DB 写状态（共享 DB）
     - **推荐 B**（初期简单）：Agent 和 NestJS 共享 DB，Agent 直接更新 runs 表。后期要解耦再改 A。
- **产出**：创建 Run → 触发 Agent → 状态同步
- **验收**：创建 run 后 Agent 开始执行，状态从 queued → in_progress → completed
- **依赖**：5.1、4.5

## 任务 5.4：HITL 审批端点
- **目标**：NestJS 暴露 HITL 审批 API
- **步骤**：
  1. `POST /runs/:id/approve`：审批 action_request
  2. 调 `agentClient.approveAction()`
  3. Agent 侧：收到审批后从 interrupt 恢复，继续执行
  4. 幂等：同一 action 重复审批返回"已处理"
- **产出**：HITL 审批端点
- **验收**：审批后 Agent 从中断点继续
- **依赖**：5.1

---

# 阶段 6：前端联调（1.5 天）

## 任务 6.1：前端环境变量切换
- **目标**：前端指向本地 NestJS
- **步骤**：
  1. 改 `.env.dev`：`VITE_API_BASE_URL=http://localhost:3000`
  2. 确认 vite.config.ts 的 proxy（如需）
  3. 启动前端 `pnpm dev`
- **产出**：前端连本地 NestJS
- **验收**：前端启动，请求打到 localhost:3000
- **依赖**：阶段 4

## 任务 6.2：前端 API 模块对齐
- **目标**：检查 `src/api/` 现有模块，对齐 NestJS 接口
- **步骤**：
  1. 列出 `src/api/` 各模块调用的接口路径
  2. 对比 NestJS 已实现的接口
  3. 优先对齐核心：works/sessions/runs/messages
  4. 不一致的改前端 API 调用 或 NestJS 路由
- **产出**：前端核心 API 能调通 NestJS
- **验收**：前端能拉作品列表、创建作品
- **依赖**：6.1、阶段 4

## 任务 6.3：SSE 消费联调
- **目标**：前端能消费 NestJS 转发的 SSE 流
- **步骤**：
  1. 找前端现有的 SSE 消费代码（搜 EventSource 或 fetch stream）
  2. 指向 NestJS 的 `/runs/:id/stream`
  3. 验证 token 流、updates 事件、HITL interrupt 都能收到
- **产出**：前端 SSE 消费正常
- **验收**：创建 run 后前端实时显示生成 token
- **依赖**：6.2、5.2

## 任务 6.4：HITL 审批 UI 联调
- **目标**：前端能展示 action_request 并审批
- **步骤**：
  1. 收到 updates 里的 __interrupt__ → 渲染审批卡片
  2. 用户点 Approve → 调 `POST /runs/:id/approve`
  3. Agent 继续执行，前端继续收 SSE
- **产出**：HITL 完整链路
- **验收**：能演示 interrupt → 审批 → 续走
- **依赖**：6.3、5.4

---

# 阶段 7：Docker Compose 整合（1 天）

## 任务 7.1：根目录 docker-compose.yml
- **目标**：一键启动所有服务
- **步骤**：
  1. 根目录 `docker-compose.yml` 定义：
     - `postgres`：pgvector 镜像
     - `redis`：redis 镜像
     - `server`：NestJS（build server/Dockerfile）
     - `agent`：Python（build Agent/Dockerfile）
     - `worker`：Python worker（同 agent 镜像，不同 command）
  2. depends_on：server/agent 依赖 postgres+redis
  3. healthcheck：各服务加健康检查
  4. volumes：postgres 数据持久化
- **产出**：完整 docker-compose
- **验收**：`docker-compose up` 一键启动所有服务
- **依赖**：阶段 1.3、各服务 Dockerfile

## 任务 7.2：NestJS Dockerfile
- **目标**：server 能容器化
- **步骤**：
  1. 建 `server/Dockerfile`：node:20-alpine + pnpm + build + start
  2. 多阶段构建（builder + runner）减小镜像
  3. 暴露 3000 端口
- **产出**：server Dockerfile
- **验收**：`docker build server/` 成功
- **依赖**：阶段 2

## 任务 7.3：Agent Dockerfile 调整
- **目标**：Agent（原 backend）Dockerfile 适配新结构
- **步骤**：
  1. 检查 `Agent/Dockerfile` 路径（改名后可能要调）
  2. 确认能 build
- **产出**：Agent Dockerfile 可用
- **验收**：`docker build Agent/` 成功
- **依赖**：1.1

## 任务 7.4：环境变量统一
- **目标**：各服务环境变量通过 compose 注入
- **步骤**：
  1. compose 里用 `environment` 或 `env_file` 注入
  2. 服务间用服务名通信（`http://server:3000`、`http://agent:8000`）
  3. 数据库 URL 用 `postgres://postgres:postgres@postgres:5432/boomcat`
- **产出**：环境变量配置完整
- **验收**：容器间能互相访问
- **依赖**：7.1

---

# 阶段 8：端到端验证（0.5 天）

## 任务 8.1：完整链路冒烟测试
- **目标**：跑通"前端创建作品 → 创建 run → Agent 生成 → SSE 推送 → 完成"
- **步骤**：
  1. `docker-compose up`
  2. 前端创建作品
  3. 触发生成（创建 run）
  4. 观察 SSE 实时推送
  5. 验证 DB 状态更新
  6. 验证消息历史保存
- **产出**：端到端跑通
- **验收**：完整链路无报错，数据一致
- **依赖**：阶段 6、7

## 任务 8.2：HITL 端到端验证
- **目标**：跑通 HITL 完整流程
- **步骤**：
  1. 触发会 interrupt 的 Agent
  2. 前端收到 __interrupt__
  3. 审批
  4. Agent 续走
  5. 完成
- **产出**：HITL 端到端
- **验收**：interrupt → 审批 → 续走完整
- **依赖**：8.1、6.4

## 任务 8.3：文档更新
- **目标**：更新 README 说明新架构和启动方式
- **步骤**：
  1. 根目录 README 写新架构图 + 启动步骤
  2. server/README 写 NestJS 部分
  3. Agent/README 更新
- **产出**：文档齐全
- **验收**：新人能照文档跑起来
- **依赖**：8.1

---

# 执行顺序与依赖图

## 推荐执行顺序（按依赖 + 价值）

```
阶段 1（0.5天）目录改名 + 边界确认
   ↓
阶段 2（1天）NestJS 脚手架 ← 能启动空项目
   ↓
阶段 3（2天）Drizzle 数据库层 ← DB 通⭐
   ↓
阶段 4（2天）业务 API ← CRUD 能用⭐
   ↓
阶段 5（1.5天）Agent 通信 ← 联动⭐
   ↓
阶段 6（1.5天）前端联调 ← 端到端可见⭐
   ↓
阶段 7（1天）Docker 整合 ← 一键启动
   ↓
阶段 8（0.5天）验证 + 文档
```

**总工时**：约 10 天（含学习时间，纯熟后可压缩到 6-7 天）

## 关键里程碑

| 里程碑 | 完成阶段 | 标志 |
|--------|---------|------|
| M1：NestJS 能启动 | 阶段 2 | localhost:3000 返回 ok |
| M2：DB 通 | 阶段 3 | drizzle-studio 看到表 |
| M3：API 能用 | 阶段 4 | curl 能 CRUD |
| M4：Agent 联动 | 阶段 5 | 创建 run 触发 Agent |
| M5：前端跑通 | 阶段 6 | 浏览器看到生成 |
| M6：一键启动 | 阶段 7 | docker-compose up |

---

# 风险与注意事项

## 技术风险

### 1. Agent 和 NestJS 共享 DB 的耦合
- **风险**：初期 Agent 直连 DB 写状态，后期要解耦难
- **缓解**：明确这是临时方案，记录技术债；后期改 Agent 调 NestJS API
- **决策**：初期为快速跑通允许共享，但 Agent 只写 runs 状态，不读业务表

### 2. SSE 转发的复杂性
- **风险**：NestJS 转发 Agent SSE 要处理流式、断开、错误，比同步请求复杂
- **缓解**：先实现简单转发（原样透传），边界情况（断开/错误）逐步完善
- **备选**：若太复杂，初期前端直连 Agent（方案 B），后期再改转发

### 3. pgvector 在 Drizzle 的支持
- **风险**：Drizzle 对 pgvector 支持不如 SQLAlchemy 成熟，可能要自定义类型
- **缓解**：阶段 3.2 专门处理 vector 类型，参考社区实现
- **备选**：若 Drizzle vector 有问题，RAG 部分暂时留在 Agent（Python）侧

### 4. 前端 API 大量已存在
- **风险**：`src/api/` 有 20+ 模块，对齐工作量大
- **缓解**：只对齐核心（works/sessions/runs/messages），非核心暂留连远程或 mock
- **策略**：先跑通核心链路，边缘功能逐步迁移

## 学习要点（边做边学）

### NestJS 必学
1. **Module/Controller/Service 三层**：依赖注入基础
2. **@nestjs/config**：环境变量管理
3. **DTO + class-validator**：请求校验
4. **异常过滤器**：全局错误处理
5. **@Sse() 装饰器**：SSE 端点实现
6. **拦截器**：统一响应格式

### Drizzle 必学
1. **pgTable 定义**：schema 设计
2. **查询 API**：select/insert/update/delete
3. **关联查询**：with/leftJoin
4. **drizzle-kit**：迁移生成和执行
5. **customType**：自定义类型（vector）
6. **drizzle-studio**：可视化表结构

### 架构思维
1. **服务边界**：NestJS 和 Agent 各管什么
2. **API 契约**：NestJS 和 Agent 的接口约定
3. **状态同步**：DB 共享 vs API 回调的权衡
4. **错误传播**：Agent 失败怎么传到前端

---

# 附录：Agent 现有接口清单（待阶段 1.2 填充）

## Agent 对外接口（供 NestJS 调用）

| 接口 | 方法 | 用途 | NestJS 对应 |
|------|------|------|------------|
| `/agent/{id}/stream` | GET(SSE) | 流式生成 | NestJS `/runs/:id/stream` 转发 |
| `/api/tasks` | POST | 创建异步任务 | NestJS `POST /runs` 触发 |
| `/api/tasks/{id}` | GET | 查任务状态 | NestJS `GET /runs/:id` 查 DB |
| （HITL 审批） | POST | 审批 action | NestJS `POST /runs/:id/approve` |

> 阶段 1.2 执行时，详细列出 Agent 所有路由 + 请求/响应格式，作为 NestJS 调用契约。

---

# 快速启动检查清单

完成所有阶段后，应该能：

```bash
# 1. 一键启动
docker-compose up -d

# 2. 健康检查
curl localhost:3000/health        # NestJS
curl localhost:8000/health        # Agent

# 3. 前端
pnpm dev                           # localhost:5555

# 4. 端到端
# 浏览器 → 创建作品 → 创建 run → 看到 SSE 生成 → 完成
```

---

# 总结

## 核心目标
把单体 Python 后端拆成 **NestJS（业务+DB）+ Agent（Python 编排）**，让项目跑起来。

## 优先级
- **P0 必做**：阶段 1-6（能端到端跑通）
- **P1 重要**：阶段 7（Docker 一键启动）
- **P2 可选**：阶段 8（文档完善）

## 学习收益
做完这套迁移，你能掌握：
1. NestJS 全栈开发（Module/DI/DTO/异常/SSE）
2. Drizzle ORM（schema/迁移/查询/自定义类型）
3. 微服务拆分（NestJS ↔ Python 通信、SSE 转发）
4. Docker 多服务编排
5. 前后端联调（API 对齐、SSE 消费）

## 面试对应
这套迁移直接对应简历的：
- MemeSkill 的 NestJS + Drizzle + BullMQ
- 爆文猫的 LangGraph + SSE + HITL
- 系统设计的"业务后端 + Agent 服务拆分"

**做完后面试能讲**："我把单体 Python 后端拆成 NestJS 业务层 + Python Agent 层，NestJS 用 Drizzle 管 DB 和鉴权，Agent 专注 LangGraph 编排，两者通过 HTTP + SSE 通信，docker-compose 一键启动。"

---

# 附录：Agent 现有接口清单（阶段 1.2 已确认）

## Agent 对外接口（供 NestJS 调用）

### 1. SSE 流式生成（短耗时，对话/生成）
- **端点**：`POST /agent/{agent_id}/stream`
- **agent_id**：路径参数，对应 `AGENTS` 注册的 key（chatbot / novel_assistant）
- **请求体**（StreamInput）：
  ```json
  {
    "message": "用户输入",
    "thread_id": "会话ID",
    "agent_id": "chatbot",
    "model": null,
    "stream_mode": ["messages", "updates"]
  }
  ```
- **响应**：SSE 流，事件类型：
  - `messages/partial`：token 增量 `{type, id, content}`
  - `messages/complete`：完整消息
  - `updates`：状态变化（含 tool_calls、__interrupt__）
  - `error`：错误
- **NestJS 对应**：`POST /runs` 创建 → `GET /runs/:id/stream` 转发此 SSE

### 2. 异步任务（长耗时，深度生成）
- **入队**：`POST /api/tasks`
  - 请求体（TaskCreate）：`{agent_id, work_id?, params}`
  - 响应（TaskStatus）：`{task_id, status: "queued", ...}`
- **查状态**：`GET /api/tasks/{task_id}/status`
  - 响应（TaskStatus）：`{task_id, status, result?, error?, updated_at}`
  - status：queued / running / succeeded / failed / not_found
- **NestJS 对应**：`POST /runs` 触发 → `GET /runs/:id` 查状态（读 DB）

### 3. 健康检查
- `GET /health` → `{status: "ok", env}`

## 待补接口（HITL 审批）
当前 Agent 有 interrupt 机制但无审批端点，阶段 5.4 在 Agent 侧补：
- `POST /agent/{agent_id}/resume`：带 Command(resume=...) 续走

## NestJS ↔ Agent 通信契约

| NestJS 端点 | 调用 Agent | 用途 |
|------------|-----------|------|
| `POST /runs` | `POST /api/tasks` 或 `POST /agent/{id}/stream` | 创建生成任务 |
| `GET /runs/:id/stream` | 转发 `POST /agent/{id}/stream` 的 SSE | 实时推送 |
| `GET /runs/:id` | 读 DB（Agent 回写状态） | 查状态 |
| `POST /runs/:id/approve` | `POST /agent/{id}/resume` | HITL 审批 |
