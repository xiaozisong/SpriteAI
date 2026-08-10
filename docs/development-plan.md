# 开发计划与学习路径

> 本文档是 boom_cat 项目改造的**主推进文档**，结合"改造任务 + 学习目标"。
> 每个阶段包含：做什么 → 做完掌握什么 → 关键知识点 → 验收标准 → 对应面试题。
> 推进方式：按阶段顺序执行，每完成一阶段打勾，回看学习点确认理解。
>
> **当前最高优先级**：先执行阶段 P0「精灵」品牌与 AI Native Workspace 视觉改造。详细规范见 [`ui-redesign-plan.md`](./ui-redesign-plan.md)。P0 只改 UI 和体验，不改变业务逻辑；完成后再继续后端阶段 4。

---

## 文档定位

- **不只是任务清单**：每个任务配套"学什么、为什么、对应面试哪题"
- **不只是学习笔记**：每个知识点配套"在哪个任务实践、怎么验收"
- **主推进文档**：以后所有开发按此文档阶段推进，完成后更新进度

## 整体架构目标

把当前单体 Python 后端拆成三层：

```
src/ (前端 React，已有)
  ↓ HTTP / SSE
server/ (NestJS - 业务后端 + 数据库通信)  ← 新建
  ↓ HTTP (调用 Agent 编排)
Agent/ (Python FastAPI - 写作 Agent)  ← 已由 backend 改名
  ↓
PostgreSQL + Redis + pgvector
```

**职责划分**：
- **NestJS（server/）**：业务逻辑、DB 通信、鉴权、对前端 API、调 Agent
- **Agent（Python）**：LangGraph 编排、SSE 推送、HITL、RAG
- **前端 src/**：UI、SSE 消费、状态管理

## 当前进度（截至 2026-08-10）

| 阶段 | 状态 | 产出 |
|------|------|------|
| P0 精灵品牌与 AI Native Workspace 改造 | 🚧 进行中（最高优先级） | 见 `docs/ui-redesign-plan.md` |
| 1.1 backend→Agent 改名 | ✅ | `Agent/` 目录，import 验证通过 |
| 1.2 Agent 接口清单 | ✅ | 3 接口确认（stream/tasks/health） |
| 2 NestJS 脚手架 | ✅ | `server/` 能启动，`/health` 正常 |
| 3 Drizzle 数据库层 | ✅ | 7 表 schema，迁移文件已生成 |
| 4 业务 API | ⏳ 待做 | - |
| 5 Agent 通信 | ⏳ 待做 | - |
| 6 前端联调 | ⏳ 待做 | - |
| 7 Docker 整合 | ⏳ 待做 | - |
| 8 端到端验证 | ⏳ 待做 | - |

---

# 阶段 P0：「精灵」品牌与 AI Native Workspace 页面改造 🚧 进行中（最高优先级）

## 改造目标
将网站用户可见品牌统一为“精灵”，并将现有界面升级为深色、克制、Artifact-first 的 AI Native Workspace；**不改路由、接口、字段、数据结构、事件处理或业务流程**。

详细任务、视觉 Token、文件地图、验收与风险控制见：[`ui-redesign-plan.md`](./ui-redesign-plan.md)。

## 学习目标（做完掌握）
1. **AI Native Workspace 信息架构**：Prompt、Agent Status、Artifact 是主视觉，不是传统 Dashboard 卡片或聊天气泡。
2. **Design Token 与设计系统落地**：通过语义颜色、间距、字体、圆角和动效变量实现全局一致性。
3. **视觉重构的回归控制**：只替换展示层，保护既有功能、路由、接口与数据行为。
4. **流式 AI 体验**：Agent Activity、Artifact 出现动效、buffer + requestAnimationFrame 的高频渲染优化。

## 任务顺序
1. P0.1 品牌盘点与替换
2. P0.2 全局 Token 与基础组件
3. P0.3 Workspace Shell（窄侧栏 + Header）
4. P0.4 Welcome 状态与 Prompt Composer
5. P0.5 Conversation Canvas / Artifact / Agent Activity
6. P0.6 页面族迁移
7. P0.7 响应式、可访问性与视觉回归

## 验收标准
- [ ] 可见品牌均为“精灵”
- [ ] 深色极简 Workspace、Icon-only Sidebar、集中内容宽度生效
- [ ] 原有页面、路由、按钮功能、接口调用、数据结构均保持不变
- [ ] Loading/生成状态表现为 Agent Activity
- [ ] `npm run lint` 与 `npm run build:dev` 通过

## 对应面试题
- 阿里 Q46-Q48：流式 Token 的前端渲染优化
- 阿里 Q90：自动跟随滚动与用户滚动的冲突处理
- 阿里 Q95-Q98：状态管理与重构决策
- 阿里 Q129-Q133：Owner 如何推进跨团队技术与体验决策

---

# 阶段 1：架构调整与目录重命名 ✅ 已完成

## 改造目标
`backend/` → `Agent/`，明确 Agent 服务边界。

## 学习目标（做完掌握）
1. **服务边界设计**：为什么要把 Agent 和业务后端分开
2. **目录命名即架构**：目录名反映职责（Agent 专注编排，不掺业务）

## 关键知识点
- **单体 vs 微服务**：初期共享 DB 快速跑通，后期解耦。不是越拆越好，按需拆。
- **服务边界判断**：技术栈差异（Node vs Python）、职责差异（业务 vs AI）、扩展需求差异。
- **改名风险**：硬编码路径、配置引用、文档引用要全更新。

## 对应面试题
- 阿里 Q117：Agent Service/Backend/Worker 是否拆微服务？判断标准？
- 阿里 Q118：微服务一定比单体高级吗？
- 阿里 Q119：5 人团队选模块化单体还是微服务？

## 实际产出
- `Agent/` 目录，pyproject name 改为 `boomcat-agent`
- README/scripts 内 `cd backend` → `cd Agent`
- Agent 接口清单写入 `docs/architecture/nestjs-migration-tasks.md` 附录

---

# 阶段 2：NestJS 脚手架搭建 ✅ 已完成

## 改造目标
在 `server/` 创建可启动的 NestJS 项目，含配置/异常/健康检查。

## 学习目标（做完掌握）
1. **NestJS 核心架构**：Module/Controller/Service 三层 + DI（依赖注入）
2. **全局组件**：异常过滤器、拦截器、管道（ValidationPipe）
3. **配置管理**：@nestjs/config 加载环境变量

## 关键知识点

### 1. NestJS 的 DI（依赖注入）
- **为什么需要 DI**：解耦 + 可测试（mock 容易）+ 单例管理
- **怎么用**：Module 的 providers 声明，Controller/Service 构造函数注入
- **对比 React**：React 用 hooks/props，NestJS 用 DI，因为后端对象生命周期不同（单例 vs 每渲染）

### 2. 全局异常过滤器
- **作用**：所有未捕获异常 → 统一 JSON 响应，用户永远看不到 500+堆栈
- **对应 Agent 侧**：Python 的 `global_exception_handler`，机制对等
- **生产级关键**：错误格式统一，便于前端处理 + Sentry 上报

### 3. 响应拦截器（TransformInterceptor）
- **作用**：所有成功响应包成 `{code, data, message}`
- **为什么**：前后端契约一致，前端不用判断"是数组还是对象"
- **对比**：异常过滤器管"出错"，拦截器管"成功"，两者互补

### 4. ValidationPipe
- **作用**：全局 DTO 校验（class-validator）
- **关键参数**：`whitelist: true`（去未声明字段）、`transform: true`（自动转类型）
- **为什么全局**：每个 Controller 不用重复加，统一行为

## 对应面试题
- 阿里 Q103：FastAPI vs NestJS 在 AI 后端的优势
- 字节 Q（NestJS 在高并发下什么坑）：默认单进程，需 cluster；DB 连接池要配

## 实际产出
- `server/` 项目，依赖装好（NestJS + Drizzle + pg + config + swagger）
- `src/config/config.module.ts`：全局 ConfigModule
- `src/common/filters/all-exceptions.filter.ts`：全局异常过滤器
- `src/common/interceptors/transform.interceptor.ts`：响应拦截器
- `src/health.controller.ts`：健康检查
- `src/main.ts`：ValidationPipe + CORS + 全局组件注册
- `.env` / `.env.example`：环境变量模板
- `tsconfig.json`：`@/*` 路径别名

## 验收结果
- `npm run start:dev` 启动成功
- `curl localhost:3000/health` 返回 `{"code":0,"data":{"status":"ok",...},"message":"ok"}`
- 响应格式证明拦截器生效

---

# 阶段 3：Drizzle 数据库层 ✅ 已完成

## 改造目标
用 Drizzle 定义 7 张表 schema，对齐 Python 侧，生成迁移文件。

## 学习目标（做完掌握）
1. **Drizzle ORM**：schema 定义、迁移、连接池
2. **pgvector 集成**：Drizzle 没原生 vector，用 customType 自定义
3. **Schema 设计**：主键/外键/索引/时区/JSONB

## 关键知识点

### 1. Drizzle vs SQLAlchemy vs Prisma
- **Drizzle**：SQL-like，无运行时，类型安全靠 TS 推导，轻量
- **SQLAlchemy**：Python 生态，ActiveRecord/DataMapper，装饰器重
- **Prisma**：独立 schema DSL，自动生成 client，DX 最好但抽象厚
- **选 Drizzle**：想要 SQL 控制力 + TS 类型安全，不要额外抽象

### 2. customType 自定义类型（pgvector）
- **为什么需要**：Drizzle 不内置 vector 类型
- **三个回调**：
  - `dataType`：生成 DDL（`vector(1024)`）
  - `toDriver`：JS `number[]` → Postgres 字符串 `[0.1,0.2]`
  - `fromDriver`：Postgres 字符串 → JS `number[]`
- **对应 Python**：`Agent/app/rag/vector_type.py` 的 `UserDefinedType`，机制对等

### 3. timestamp with time zone（关键坑）
- **为什么必须加**：Python 的 aware datetime（带 tz）存 naive 列报错
- **Drizzle 写法**：`timestamp('created_at', { withTimezone: true })`
- **对应 Python**：`DateTime(timezone=True)`
- **底层**：Postgres `TIMESTAMP WITH TIME ZONE` 存 UTC，查询按客户端时区返回

### 4. 外键级联策略
- `onDelete: 'cascade'`：删父级联删子（删 work 级联删 sessions）
- `onDelete: 'set null'`：删父，子外键置空
- **选择依据**：强依赖（work→session）用 cascade；弱依赖用 set null

### 5. 索引设计
- **唯一索引**：`task_id` 唯一（幂等防重）
- **复合索引**：`(session_id, status)` 按会话查状态
- **最左匹配**：复合索引 `(a,b,c)` 能用 a / a,b / a,b,c，不能跳过 a
- **对应面试**：阿里 Q28 最左匹配原则

### 6. JSONB vs JSON
- **JSONB**：二进制存储，可索引、可查询，性能好
- **JSON**：文本存储，每次解析，慢
- **选 JSONB**：存 `extra`/`params`/`result` 等结构化扩展字段

## 对应面试题
- 阿里 Q23：ORM 价值，什么时候放弃 ORM 直接写 SQL
- 阿里 Q25：主键/外键/索引设计
- 阿里 Q27：什么情况有索引却不走索引
- 阿里 Q28：最左匹配原则
- 字节 Q27：PostgreSQL vs MySQL，AI/RAG 为什么倾向 PG

## 实际产出
- `src/db/schema/`：7 张表（users/works/sessions/messages/generation-runs/knowledge-bases/knowledge-chunks）
- `src/db/vector.ts`：pgvector customType
- `src/db/db.module.ts`：全局 Drizzle 连接池
- `src/db/types.ts`：Db 类型导出
- `drizzle.config.ts`：drizzle-kit 配置
- `drizzle/0000_young_sage.sql`：迁移文件（7 表 + 索引 + 外键）
- package.json 加 `db:generate`/`db:migrate`/`db:push`/`db:studio` 脚本

## 验收结果
- `npx tsc --noEmit` 编译通过
- `npx drizzle-kit generate` 生成迁移文件，识别 7 表
- 迁移 SQL 含 `timestamp with time zone`、`jsonb`、外键、唯一索引

---

# 阶段 4：业务 API ⏳ 待做（核心，2 天）

## 改造目标
实现 users/works/sessions/messages/generation-runs 的 CRUD + 幂等，能用 curl 跑通"创建作品→会话→生成任务"。

## 学习目标（做完掌握）
1. **NestJS 模块化开发**：每业务域一个 Module（Controller/Service/DTO）
2. **Drizzle 查询 API**：select/insert/update/delete + 关联查询 + 分页
3. **幂等设计**：idempotency-key + Redis SETNX 防重复创建
4. **状态机**：Run 的 queued→in_progress→completed 流转
5. **DTO 校验**：class-validator 装饰器，请求体校验

## 关键知识点

### 1. NestJS Module 组织
- **每业务域一个 Module**：UsersModule / WorksModule / SessionsModule...
- **三层结构**：Controller（HTTP）→ Service（业务）→ Db（数据）
- **Module 导出**：Service 在 providers 声明，跨 Module 用 exports 导出
- **对比前端**：类似 React 的组件分层，但 NestJS 用 DI 注入而非 props

### 2. Drizzle 查询 API
```typescript
// 查询
await db.select().from(works).where(eq(works.userId, 1));
// 关联
await db.query.works.findMany({ with: { sessions: true } });
// 分页
await db.select().from(works).limit(20).offset(0);
// 插入
await db.insert(works).values({ title: 'x', userId: 1 }).returning();
// 更新
await db.update(works).set({ stage: 'finished' }).where(eq(works.id, 1));
```
- **returning()**：Postgres 特有，返回插入/更新的行（类似 RETURNING）
- **with（关联）**：Drizzle 的关系查询，类似 SQLAlchemy 的 relationship

### 3. 幂等设计（核心，对应简历 MemeSkill）
- **场景**：用户连点 3 次"生成"，只创建 1 个 Run
- **方案**：前端生成 `idempotency_key`（UUID），后端 Redis SETNX 去重
```typescript
const set = await redis.set(`idem:${userId}:${key}`, runId, 'NX', 'EX', 600);
if (!set) {
  // key 已存在，返回已有 runId（不重复创建）
  return await redis.get(`idem:${userId}:${key}`);
}
// 创建新 Run
```
- **三层防护**：前端 disable + idempotency_key + DB 唯一约束（task_id）

### 4. 幂等 vs 防重复提交（阿里 Q14）
- **防重复提交**：识别"同一请求"，直接返回已有结果（不执行）= 门卫不让进
- **幂等**：允许重复执行，但结果和执行一次一样 = 进了也不出事
- **关系**：防重复在前（省资源），幂等在后（兜底）

### 5. 状态机设计（Run）
```
queued → in_progress → completed
                    ↘ failed（重试 → delayed → queued）
                    ↘ cancelled
```
- **DB 实现**：`status` 字段 + 业务层控制转移
- **约束**：completed 不能回 in_progress（业务层校验）
- **对应简历**：MemeSkill 的 Run 状态机

### 6. DTO 校验
```typescript
class CreateWorkDto {
  @IsString() @MaxLength(255)
  title: string;

  @IsInt() @IsOptional()
  userId?: number;

  @IsString() @IsIn(['novel', 'script'])
  workType?: string;
}
```
- **全局开启**：main.ts 的 ValidationPipe（阶段 2 已配）
- **whitelist**：自动去除未声明字段
- **transform**：字符串自动转 number/boolean

## 任务拆分

### 4.1 Users 模块（基础）
- 建 UsersModule/Controller/Service
- CRUD：findAll/findOne/create/update/delete
- DTO：CreateUserDto/UpdateUserDto
- **学习点**：NestJS 三层结构 + DI 注入

### 4.2 Works 模块（作品）
- 字段：id/userId/title/workType/stage/extra/createdAt/updatedAt
- API：`GET /works?userId=&page=`、`POST /works`、`GET/PATCH/DELETE /works/:id`
- 分页：`?page=&pageSize=`
- **学习点**：Drizzle 分页查询 + 关联 users

### 4.3 Sessions 模块（会话）
- 字段：id/workId/threadId/model/createdAt
- API：按 work 查 sessions、创建 session
- **学习点**：外键关联 + 级联

### 4.4 Messages 模块（消息）
- 字段：id/sessionId/role/content/extra/createdAt
- API：按 session 查消息（游标分页）
- **学习点**：游标分页 vs offset 分页

### 4.5 GenerationRuns 模块（生成任务，核心）
- 字段：id/sessionId/taskId/agentId/status/prompt/result/error/retries/...
- API：
  - `POST /runs`：创建任务（含幂等键校验）
  - `GET /runs/:id`：查状态
  - `GET /runs?sessionId=&status=`：按会话查
- 幂等：`idempotency-key` header + Redis SETNX
- **学习点**：幂等设计 + 状态机

### 4.6 统一分页 + 响应格式
- PaginationDto：page/pageSize
- 所有列表 API 返回 `{ items, total, page, pageSize }`
- **学习点**：统一契约设计

## 验收标准
- [ ] `curl POST /works` 能创建作品
- [ ] `curl GET /works?userId=1` 能查列表 + 分页
- [ ] `curl POST /runs` 能创建任务，重复请求不重复创建（幂等）
- [ ] `curl GET /runs/:id` 能查状态
- [ ] 所有 API 响应格式统一 `{code, data, message}`

## 对应面试题
- 阿里 Q5：完整链路（创建作品→会话→Run）
- 阿里 Q8：Run 状态机设计
- 阿里 Q12：连点 3 次防重复
- 阿里 Q13：前端超时但后端成功
- 阿里 Q14：幂等 vs 防重复提交
- 阿里 Q24：核心表设计
- 阿里 Q26：1 亿 runs 查最近 20 条

## 对应简历技术栈
- MemeSkill：NestJS + Drizzle + 业务 API 设计
- 爆文猫：Thread/Run 模型 + 状态机

---

# 阶段 5：NestJS ↔ Agent Service 通信 ⏳ 待做（1.5 天）

## 改造目标
NestJS 封装 AgentClient，调 Agent service；实现 SSE 转发；创建 Run 触发 Agent；HITL 审批。

## 学习目标（做完掌握）
1. **服务间通信**：NestJS 调 Python Agent（HTTP + SSE）
2. **SSE 转发**：NestJS 把 Agent 的 SSE 流转发给前端
3. **状态同步**：Agent 和 NestJS 共享 DB vs API 回调的权衡
4. **HITL 续走**：审批后从 interrupt 恢复

## 关键知识点

### 1. AgentClient 封装
- **职责**：封装对 Agent service 的 HTTP 调用，业务层不关心 Agent 细节
- **方法**：startAgent / getAgentStream / approveAction
- **容错**：timeout + retry + 错误处理
- **对应简历**：MemeSkill 的"前端不直接调 Agent，经业务后端"

### 2. SSE 转发决策（关键架构选择）
- **方案 A（NestJS 转发）**：前端 → NestJS /runs/:id/stream → 转发 Agent SSE
  - 优点：统一入口、可加鉴权/限流
  - 缺点：NestJS 要处理流转发，多一跳
- **方案 B（前端直连 Agent）**：NestJS 返回 Agent URL，前端直连
  - 优点：简单、低延迟
  - 缺点：Agent 暴露给前端、绕过鉴权
- **选 A**：生产级要统一鉴权，NestJS 转发更可控

### 3. SSE 转发实现（NestJS @Sse 装饰器）
```typescript
@Sse(':id/stream')
streamRun(@Param('id') id: string): Observable<MessageEvent> {
  return new Observable((subscriber) => {
    // 订阅 Agent 的 SSE 流，原样转发
    const abort = new AbortController();
    fetch(`${AGENT_URL}/agent/${agentId}/stream`, { signal: abort.signal })
      .then(async (res) => {
        for await (const chunk of parseSSE(res.body)) {
          subscriber.next({ type: chunk.event, data: chunk.data });
        }
        subscriber.complete();
      });
    return () => abort.abort(); // 前端断开时取消对 Agent 的订阅
  });
}
```
- **关键**：前端断开 → 取消对 Agent 的订阅（不烧 token）

### 4. 状态同步方案
- **方案 A（API 回调）**：Agent 通过 NestJS API 回写状态
  - 优点：解耦，Agent 不碰 DB
  - 缺点：多一跳，Agent 要调 NestJS
- **方案 B（共享 DB）**：Agent 直连 DB 写状态
  - 优点：简单、快
  - 缺点：耦合，Agent 知道 DB schema
- **初期选 B**：快速跑通，Agent 只写 runs 状态不读业务表
- **后期改 A**：解耦，记技术债

### 5. HITL 续走（对应简历爆文猫）
- **流程**：Agent interrupt → 前端展示 action_request → 用户审批 → NestJS 调 Agent resume
- **Command 机制**：LangGraph 的 `Command(resume=...)`，从中断点继续
- **幂等**：同一 action 重复审批，DB 状态机校验（pending→approved，已 approved 返回"已处理"）

## 任务拆分

### 5.1 AgentClient 封装
- `src/agent-client/agent-client.module.ts` + `agent-client.service.ts`
- 用 fetch 调 `AGENT_SERVICE_URL`
- 方法：startAgent / getAgentStream / approveAction
- **学习点**：服务间通信 + 容错

### 5.2 SSE 转发端点
- RunsController 加 `@Sse(':id/stream')`
- 订阅 Agent SSE，原样转发
- 处理前端断开（取消订阅）
- **学习点**：NestJS @Sse + 流转发

### 5.3 创建 Run 触发 Agent
- `POST /runs` 流程：幂等校验 → 写 DB → 调 agentClient.startAgent
- Agent 侧：收到触发后开始 LangGraph，更新 runs 状态
- **学习点**：状态同步方案选择

### 5.4 HITL 审批端点
- `POST /runs/:id/approve`：调 agentClient.approveAction
- Agent 侧补 `/agent/{id}/resume` 端点
- 幂等：重复审批返回"已处理"
- **学习点**：HITL 续走 + 幂等

## 验收标准
- [ ] 创建 Run 后 Agent 开始执行，状态 queued→in_progress→completed
- [ ] 前端连 NestJS SSE 能收到 Agent 的 token 流
- [ ] 前端断开 SSE，Agent 停止推流（不烧 token）
- [ ] HITL interrupt → 审批 → Agent 续走完整链路

## 对应面试题
- 阿里 Q9：前端怎么获取进度（轮询 vs SSE）
- 阿里 Q43-Q51：SSE 协议、断线、cancellation
- 阿里 Q52-Q57：HITL、interrupt、审批
- 字节 Q50：前后端共同 cancellation

## 对应简历技术栈
- 爆文猫：SSE 转发 + HITL + commandOnly 续走
- MemeSkill：服务间通信 + 状态同步

---

# 阶段 6：前端联调 ⏳ 待做（1.5 天）

## 改造目标
前端指向本地 NestJS，对齐核心 API，跑通 SSE 消费 + HITL UI。

## 学习目标（做完掌握）
1. **前后端联调**：环境变量切换、API 对齐、跨域
2. **SSE 前端消费**：EventSource / fetch stream + buffer + rAF
3. **HITL 前端 UI**：interrupt 卡片渲染 + 审批交互
4. **状态管理**：Zustand store 划分（chat/canvas/task/SSE）

## 关键知识点

### 1. 前端连本地后端
- `.env.dev`：`VITE_API_BASE_URL=http://localhost:3000`
- CORS：NestJS 已开 `enableCors`（阶段 2）
- vite.config.ts proxy（如需）

### 2. SSE 前端消费（对应简历爆文猫）
- **EventSource**：简单但只支持 GET，不能带 body
- **fetch + ReadableStream**：支持 POST + body，手动解析 SSE
- **buffer + rAF**：高频 token 优化，每帧只 setState 一次（阿里 Q46-Q48）

### 3. HITL 前端 UI
- 收到 `updates` 里的 `__interrupt__` → 渲染审批卡片
- 用户点 Approve → `POST /runs/:id/approve`
- Agent 续走，前端继续收 SSE

### 4. Zustand Store 划分（阿里 Q96）
- `useChatStore`：messages、当前生成
- `useCanvasStore`：节点、连线
- `useTaskStore`：HITL 待审批
- `useSSEStore`：流式连接、buffer
- 原则：跨组件共享→全局；单组件用→组件内；高频更新→独立 store

## 任务拆分

### 6.1 前端环境变量切换
- 改 `.env.dev` 指向 localhost:3000
- 启动 `pnpm dev` 验证请求打到 NestJS
- **学习点**：环境变量 + 跨域

### 6.2 前端 API 模块对齐
- 列 `src/api/` 现有模块
- 对齐核心：works/sessions/runs/messages
- 不一致的改前端调用 或 NestJS 路由
- **学习点**：API 契约对齐

### 6.3 SSE 消费联调
- 找前端现有 SSE 代码（搜 EventSource/fetch stream）
- 指向 NestJS `/runs/:id/stream`
- 验证 token 流、updates、HITL interrupt
- **学习点**：SSE 消费 + buffer 优化

### 6.4 HITL 审批 UI
- 收到 interrupt → 渲染卡片
- 审批 → 调 API → Agent 续走
- **学习点**：HITL 完整链路

## 验收标准
- [ ] 前端启动，请求打到 localhost:3000
- [ ] 能拉作品列表、创建作品
- [ ] 创建 run 后前端实时显示生成 token
- [ ] HITL interrupt → 审批 → 续走完整

## 对应面试题
- 阿里 Q46-Q48：高频 token React 优化
- 阿里 Q90：自动滚动 vs 用户滚动
- 阿里 Q95-Q96：Zustand + Store 划分
- 字节 Q43-Q44：SSE 前端消费 + buffer

## 对应简历技术栈
- 爆文猫：SSE 消费 + HITL UI + Zustand
- ECMAS：虚拟列表（前端性能，后续优化）

---

# 阶段 7：Docker 整合 ⏳ 待做（1 天）

## 改造目标
根目录 docker-compose.yml 一键启动所有服务（postgres/redis/server/agent/worker）。

## 学习目标（做完掌握）
1. **多服务编排**：docker-compose 依赖、健康检查、volume
2. **多阶段 Dockerfile**：减小镜像体积
3. **服务间通信**：容器内用服务名，不用 localhost

## 关键知识点

### 1. docker-compose 编排
- `depends_on`：启动顺序（server/agent 依赖 postgres+redis）
- `healthcheck`：健康检查（curl /health）
- `volumes`：postgres 数据持久化
- `env_file`：环境变量注入

### 2. 多阶段 Dockerfile（NestJS）
- builder 阶段：装依赖 + 编译
- runner 阶段：只复制 dist + node_modules，体积小
- 好处：最终镜像不含源码和 dev 依赖

### 3. 容器间通信
- 容器内用服务名：`http://server:3000`、`http://agent:8000`
- DB URL：`postgres://postgres:postgres@postgres:5432/boomcat`
- 不是 localhost（localhost 是容器自己）

## 任务拆分
- 7.1 根目录 docker-compose.yml（postgres/redis/server/agent/worker）
- 7.2 server/Dockerfile（多阶段构建）
- 7.3 Agent/Dockerfile 适配改名后路径
- 7.4 环境变量统一注入

## 验收标准
- [ ] `docker-compose up` 一键启动所有服务
- [ ] 各服务健康检查通过
- [ ] 容器间能用服务名通信

## 对应面试题
- 阿里 Q115：从 0 设计企业级 AI Agent 平台
- 阿里 Q116：哪些用 NestJS，哪些用 Python
- 字节 Q（Docker Compose 编排多服务）

---

# 阶段 8：端到端验证 ⏳ 待做（0.5 天）

## 改造目标
跑通完整链路：前端创建作品 → 创建 run → Agent 生成 → SSE 推送 → 完成；HITL 完整流程。

## 学习目标（做完掌握）
1. **端到端排查**：分层定位问题（前端/NestJS/Agent/DB）
2. **可观测验证**：Sentry + LangSmith trace 串联
3. **文档沉淀**：README + 架构图

## 任务拆分
- 8.1 完整链路冒烟测试
- 8.2 HITL 端到端验证
- 8.3 文档更新（README + 架构图）

## 验收标准
- [ ] 前端创建作品 → run → SSE 生成 → 完成，全程无报错
- [ ] HITL interrupt → 审批 → 续走完整
- [ ] README 能让新人跑起来

## 对应面试题
- 阿里 Q29：接口慢分层排查
- 阿里 Q113：统一 Trace 链路
- 阿里 Q114：P95 突增排查顺序

---

# 学习方法（贯穿所有阶段）

## 三层追问法（每写一行代码前问）
```
L1 用了什么（事实）
L2 为什么这么做，不这么做会怎样（选型/权衡）
L3 底层原理是什么（机制/源码）
```
- 答不出 L2 = "用过"，答出 L2 = "理解"，答出 L3 = "精通"

## 边做边学的 5 个习惯
1. **先理解再编码**：每阶段先读理论/文档搞清"为什么"，再动手
2. **小步实现**：每任务最小可演示版本，不求完美
3. **关联面试题**：每完成一阶段，回去答 interview-map 对应题
4. **写笔记沉淀**：每阶段写技术笔记，变成可讲的内容
5. **能演示**：能向别人讲清"做了什么 + 为什么 + 踩了什么坑"

## 每阶段完成后的自检
- [ ] 能讲清这阶段"做了什么"
- [ ] 能讲清"为什么这么做，对比过什么"
- [ ] 能讲清"底层原理是什么"
- [ ] 能讲清"踩了什么坑，怎么解决"
- [ ] 能回答 interview-map 对应面试题

---

# 进度跟踪表（每完成一阶段更新）

| 阶段 | 状态 | 完成日期 | 关键产出 | 学习点掌握 |
|------|------|---------|---------|-----------|
| P0 精灵 AI Workspace | 🚧 进行中 | 2026-08-10 | 已完成 Workspace Shell 首轮改造 | Design Token / AI Workspace / 视觉回归 |
| 1.1 改名 | ✅ | 2026-08-10 | Agent/ 目录 | 服务边界设计 |
| 1.2 接口清单 | ✅ | 2026-08-10 | 接口契约文档 | API 契约设计 |
| 2 脚手架 | ✅ | 2026-08-10 | server/ 能启动 | NestJS DI + 全局组件 |
| 3 数据库层 | ✅ | 2026-08-10 | 7 表 + 迁移 | Drizzle + pgvector + 索引 |
| 4 业务 API | ⏳ | - | - | - |
| 5 Agent 通信 | ⏳ | - | - | - |
| 6 前端联调 | ⏳ | - | - | - |
| 7 Docker | ⏳ | - | - | - |
| 8 端到端 | ⏳ | - | - | - |

---

# 总结

## 文档使用方式
1. **推进开发**：按阶段顺序执行，每完成一阶段更新进度表
2. **学习对照**：每阶段配套学习点，做完回看确认理解
3. **面试准备**：每阶段对应面试题，做完能答 interview-map 相关题
4. **复盘沉淀**：踩坑记入笔记，丰富面试故事

## 核心目标
完成 P0 与后续 8 个阶段后，你应该能：
1. **讲清架构**：为什么拆 NestJS + Agent，职责怎么分
2. **讲清实现**：Drizzle schema、幂等、SSE 转发、HITL 续走的细节
3. **讲清选型**：Drizzle vs SQLAlchemy、SSE 转发 vs 直连、共享 DB vs API 回调
4. **讲清踩坑**：pgvector 维度、timestamp 时区、SSE 断开、幂等边界
5. **答对应面试题**：interview-map 里阿里/字节的对应题

## 面试话术（做完后能讲）
> "我把单体 Python 后端拆成 NestJS 业务层 + Python Agent 层。NestJS 用 Drizzle 管 DB 和鉴权，提供 works/sessions/runs CRUD + 幂等创建；Agent 专注 LangGraph 编排和 SSE 推送；NestJS 转发 Agent 的 SSE 给前端，处理前端断开取消订阅；HITL 通过 interrupt + Command resume 实现，审批幂等靠 DB 状态机；docker-compose 一键启动 postgres/redis/server/agent/worker。"
