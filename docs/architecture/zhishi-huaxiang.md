# 知识画像 · Agent 与后端（V2）

> 基于 2026-08-06 多轮问答对话自动生成。
> 画像会随每次问答**持续更新**，用于定制个人的学习方式与面试准备。

## 一、画像结论（一句话）

> **概念有大轮廓，但缺精确切分 + 缺运行时机制的地基。** 属于"动手型学习者"，缺的是把模糊印象转化为结构化精确记忆。

---

## 二、能力区块评估

### ✅ 已掌握 / 可转化为面试素材

| 能力 | 依据 |
|---|---|
| 动手能力强，愿意写代码 | 独立完成 base.py / chatbot.py |
| 有"限制循环次数"的需求意识 | 想到防止无限循环（方向正确） |
| 概念层判断力开始建立 | 答对"先大纲再正文 → Plan-and-Execute" |
| 环境搭建可独立推进 | 装依赖、设 .env、跑通图编译 |
| **端到端跑通能力强** | 独立排错 ImportError / SSL 证书 / 端口，SSE 真实 token 跑通 |
| **排错方法论建立** | 用诊断脚本定位是 recursion_limit=3 太小 + updates 序列化问题 |

### ⚠️ 概念混淆（最易面试露馅，需优先加固）

| 混淆点 | 现象 | 纠正 |
|---|---|---|
| **Reflection / ReAct / HITL 边界** | 把"自我批评"当 ReAct、把"人工审批"当 Reflection | 按"解决什么问题"切分：改自己输出=Reflection、外部工具/资料=ReAct、人等审批=HITL |
| **命令式思维残留** | 想用"计数数组"控制循环 | 图框架下用 `recursion_limit`（运行时 config） |
| **编译期 vs 运行时划分** | 以为 `recursion_limit` 应在 `compile()` 传 | `compile()` 定拓扑；执行参数走每次 invoke 的 `config` |

### ❓ 知识盲区（需补地基）

| 盲区 | 说明 | 对应里程碑 |
|---|---|---|
| **`ainvoke` vs `astream` 流式机制** | 完全不知道异步、逐 token、事件循环阻塞 | M1 已补 |
| **SQL / 数据库操作** | 对 SQL、ORM（SQLAlchemy）不熟 | M2 |
| **Redis 机制** | 缓存/队列/pub-sub 原理不熟 | M4 |
| **K8s / 部署** | 对容器编排、k8s 不熟 | 基础设施 |
| **异步依赖链** | asyncpg + greenlet + SQLAlchemy async 的依赖关系不清楚 | M2 |
| **迁移工具** | alembic 同步/异步配置、env.py 结构不熟 | M2 |

---

## 三、五大 Agent 模式对照卡（防混淆，面试速记）

```
场景                  → 模式            → 一句话本质
查资料/用外部工具       → ReAct           → 推理⊕行动⊕观察，循环
先规划再执行            → Plan-and-Exec   → 先拆步骤再逐条跑
改自己生成的输出         → Reflection      → 生成→批评→重写
停等人工/审批            → HITL           → interrupt 挂在节点间
多个专用模型分工        → Multi-Agent     → 主代理调度子代理
```

**判断口诀**：外部工具=ReAct · 拆任务=Plan-and-Execute · 改自己=Reflection · 等人=HITL · 多模型=Multi-Agent

---

## 四、LangGraph 核心心智模型（需内化）

```
状态(State) → 节点读状态、写新状态 → 边决定下一步
   • 节点 = 函数 / 预置节点(ToolNode)
   • 普通边 = 无条件走
   • 条件边 = 按返回值跳不同节点(ReAct 判断靠它)
   • 循环 = 边构成环 (tools → agent)，recursion_limit 兜底防死循环
```

### 关键划分能力

| 层面 | 做什么 | 谁来定 |
|---|---|---|
| **图定义** | 节点/边的拓扑 | `compile()`，一次 |
| **运行时参数** | 循环上限 / 线程 id / 流式 | 每次 `astream()/ainvoke()` 的 `config` |

---

## 五、学习方式定制

- 你的稳定画像 = **判别式 / 连线题**（给近义项让你选、给场景让你判断），比"开放式记忆"高效。
- 讲解方式 = **逆向阅读 + 对照表 + 最小复现**，不做逐行敲代码。
- 推进节奏 = **跑通闭环优先**（体感 > 概念），再补机制深度。

### 已记录的进展里程碑

- [x] base.py / chatbot.py 可编译
- [x] .env 配置真实 key，图构造成功
- [x] 启动 FastAPI 服务
- [x] curl 发流式请求，看到真实 token ⭐ **M1 最小闭环打通**
- [x] 理解 ReAct 循环结构（agent→tools→agent）⭐ **概念 + 代码已对齐**
- [x] 真实调用 calculator 工具验证，ReAct 完整循环跑通 ⭐ **M1 完整闭环**
- [x] 修复 `_serialize_updates` + `sse_block` 保险丝（防御性编程）
- [x] 修复 `recursion_limit`（3 → 30），解决 GraphRecursionError
- [x] `_serialize_updates` 升级为递归版，兜住所有嵌套 AIMessage
- [x] novel_assistant 注册到 AGENTS ✅ M1 扩展完成（Plan-and-Execute）
- [x] M2 数据持久化 ✅（建表 + 插入 + 查询闭环跑通，works/sessions/messages）
- [x] M3 RAG + pgvector（完整闭环跑通：切分多段 + 不同 query 检索到不同 chunk + 相似度解读）⭐⭐
- [x] M4 异步任务队列（链路跑通：入队 → worker 消费 → 状态流转 → 轮询）⭐
- [ ] 加入 inspiration_assistant / canvas_assistant
- [ ] 异步任务队列 M4
