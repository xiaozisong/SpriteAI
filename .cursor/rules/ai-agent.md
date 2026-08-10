

---

description: AI Agent、RAG、工具调用与工作流开发规则

globs:

  - "agents/**/*"

  - "ai/**/*"

  - "rag/**/*"

  - "llm/**/*"

alwaysApply: false

---

# AI Agent 开发规则

## 1. Agent 架构

不要创建巨型单体 Agent。

应该拆分：

- Model

- Prompt

- Tool

- State

- Retrieval

- Workflow

- Persistence

- Evaluation

业务规则不要全部埋在 Prompt 中。

---

## 2. Prompt

大型 Prompt 不应该直接散落在业务代码里。

可复用 Prompt 应独立管理。

Prompt 应明确：

- Role

- Goal

- Context

- Constraints

- Available Tools

- Expected Output

不要依赖 Prompt 实现真正的安全控制。

重要安全逻辑必须由代码完成。

---

## 3. Tool Calling

每个 Tool 应该：

- 职责单一

- 输入结构明确

- 输出结构明确

- 有参数校验

- 有错误处理

- 名称容易理解

- 描述清晰

例如：

不要创建：

```text

doEverything()