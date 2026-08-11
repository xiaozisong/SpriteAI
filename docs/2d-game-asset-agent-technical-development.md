# 2D 游戏素材生成 Agent 技术开发文档

> 项目代号：精灵  
> 文档类型：技术开发文档  
> 负责人：高级技术架构师  
> 协作角色：前端、后端、Agent、测试、产品、项目经理  
> 版本：v0.1  
> 状态：评审稿  
> 更新日期：2026-08-10

## 1. 技术目标

实现一套面向 2D 游戏素材生成的 Agent 产品技术体系，覆盖需求解析、生成计划、图像生成、结果评估、导出打包、历史资产管理和自动化测试。

技术方案需要满足：

- 优先使用免费、开源、可本地部署的库和模型。
- LLM API 厂商暂留空，通过 Provider 接口预留。
- 生成任务采用异步队列，避免长耗时请求阻塞。
- 前端工作台具备实时进度、结果预览、动作播放和导出能力。
- 架构上保持业务后端、Agent 编排、图像生成 Worker 的边界清晰。

## 2. 团队研发编排

### 2.1 工作流

```text
产品经理输出 PRD
  ↓
项目经理组织需求评审会
  ↓
架构师输出整体架构与技术选型
  ↓
前端输出 UI 编排与组件方案
  ↓
后端输出 API / DB / 队列 / 存储方案
  ↓
Agent 工程师输出 Agent 图与生成工具方案
  ↓
测试工程师输出测试计划与用例
  ↓
技术评审会冻结 MVP 范围
  ↓
进入开发、联调、测试、验收
```

### 2.2 角色分工

| 角色 | 开发阶段职责 | 评审输入 | 评审输出 |
|---|---|---|---|
| 高级项目经理 | 排期、风险、依赖管理 | PRD、技术方案、测试计划 | 里程碑、阻塞项、上线准入 |
| 高级产品经理 | 需求解释、流程验收 | PRD、原型、验收标准 | 需求冻结与变更记录 |
| 高级技术架构师 | 服务边界、架构、选型 | 架构图、数据模型、接口协议 | 技术方案冻结 |
| 高级前端开发 | 工作台 UI、状态管理、导出体验 | 页面结构、组件状态、交互说明 | 前端任务拆解 |
| 高级后端开发 | 业务 API、任务队列、数据库、文件服务 | API 设计、DB Schema | 后端任务拆解 |
| 高级 Agent 开发工程师 | Agent 编排、Prompt、工具调用、评估 | Agent 状态图、工具接口 | Agent 任务拆解 |
| 高级测试工程师 | 测试策略、自动化、质量门禁 | 测试计划、用例矩阵 | 验收报告模板 |

## 3. 总体架构

```text
┌───────────────────────────────────────┐
│ Frontend: React 19 + Vite              │
│ - Landing / Workspace / Asset Detail   │
│ - SSE / Polling / Download / Preview   │
└───────────────────┬───────────────────┘
                    │ HTTP / SSE
┌───────────────────▼───────────────────┐
│ Business Backend: NestJS               │
│ - Auth 预留 / Project / Asset / Task    │
│ - PostgreSQL / Redis / Object Storage  │
│ - 调用 Agent Service                    │
└───────────────────┬───────────────────┘
                    │ HTTP / Queue Event
┌───────────────────▼───────────────────┐
│ Agent Service: Python FastAPI          │
│ - LangGraph Agent 编排                  │
│ - 需求解析 / Prompt 编排 / 评估 / 导出    │
│ - LLM Provider 接口预留                 │
└───────────────────┬───────────────────┘
                    │ Queue / Local API
┌───────────────────▼───────────────────┐
│ Generation Worker                      │
│ - ComfyUI / Stable Diffusion / 后处理    │
│ - Sprite Sheet / ZIP / JSON Metadata   │
└───────────────────┬───────────────────┘
                    │
┌───────────────────▼───────────────────┐
│ Infra                                  │
│ - PostgreSQL + pgvector                │
│ - Redis                                │
│ - MinIO / S3-compatible Storage        │
│ - OpenTelemetry / Sentry / Langfuse     │
└───────────────────────────────────────┘
```

## 4. 技术选型

### 4.1 前端

| 能力 | 选型 | 类型 | 原因 |
|---|---|---|---|
| 应用框架 | React 19 + Vite | 开源 | 与现有项目一致，开发效率高 |
| 路由 | react-router-dom | 开源 | 现有项目已使用 |
| 状态管理 | Zustand | 开源 | 轻量，适合工作台状态 |
| UI 基础 | Radix UI / 自研组件 | 开源 | 可访问性好，可控性强 |
| 样式 | Tailwind CSS / CSS Variables | 开源 | 适合设计 Token 落地 |
| 动效 | framer-motion | 开源 | 现有依赖已有，适合 Agent 状态动效 |
| 图标 | lucide-react 直接导入 | 开源 | 轻量，注意避免 barrel 导入 |
| 文件下载 | file-saver / JSZip | 开源 | 现有项目已有，适合 ZIP 下载 |
| 动画预览 | Canvas / CSS Steps | Web 标准 | 播放 Sprite 帧动画无需额外库 |

### 4.2 后端

| 能力 | 选型 | 类型 | 原因 |
|---|---|---|---|
| 业务服务 | NestJS | 开源 | 与既有规划一致，模块化强 |
| ORM | Drizzle ORM | 开源 | 类型安全，迁移清晰 |
| 数据库 | PostgreSQL | 开源 | 业务数据、任务、资产元数据统一存储 |
| 向量检索 | pgvector | 开源 | 可存储风格模板、素材知识库 |
| 缓存 / 队列 | Redis + BullMQ | 开源 | 任务队列、进度缓存、重试 |
| 对象存储 | MinIO，本地开发；S3-compatible 生产 | 开源 / 三方 API | 存储生成图片、ZIP、预览图 |
| API 文档 | OpenAPI / Swagger | 开源 | 便于前后端联调 |

### 4.3 Agent 与生成服务

| 能力 | 选型 | 类型 | 原因 |
|---|---|---|---|
| Agent 服务 | Python FastAPI | 开源 | 适合 AI 工程生态 |
| Agent 编排 | LangGraph | 开源 | 状态图清晰，适合多节点编排 |
| Prompt 模板 | Jinja2 / LangChain Core Prompt | 开源 | 易维护、可版本化 |
| LLM API |  | 待定 | 按要求留空 |
| 图像工作流 | ComfyUI | 开源 | 可视化图像生成工作流，易本地部署 |
| 基础模型 | Stable Diffusion XL / FLUX.1-schnell / 其他开源模型 | 开源权重视许可证而定 | MVP 可本地验证 |
| 后处理 | Pillow / OpenCV | 开源 | 透明背景、裁切、拼图、尺寸检查 |
| Sprite Sheet | Pillow 自研脚本 | 开源库 | 可控、实现成本低 |
| 观测 | Langfuse / OpenTelemetry | 开源 | 追踪 Agent 步骤与耗时 |

> 注意：开源模型需要逐一确认许可证、商用限制、模型来源和部署成本。MVP 以技术验证为主，生产使用前必须补充合规评估。

## 5. 服务边界

### 5.1 Frontend

- 展示页面、工作台和资产详情。
- 管理用户输入、规格确认、任务状态、结果预览。
- 通过 HTTP 创建任务，通过 SSE 或轮询获取进度。
- 负责下载 ZIP、PNG、Sprite Sheet。

### 5.2 Business Backend

- 管理项目、任务、资产、文件记录。
- 创建生成任务并写入队列。
- 提供任务状态查询、资产查询、下载签名 URL。
- 对 Agent Service 做内部调用和错误兜底。

### 5.3 Agent Service

- 将用户需求解析为 `AssetSpec`。
- 生成图像提示词和工作流参数。
- 调用图像生成 Worker。
- 对结果进行一致性评估。
- 触发导出打包。

### 5.4 Generation Worker

- 执行 ComfyUI 工作流或图像生成脚本。
- 对生成结果做裁切、透明背景处理、尺寸规范化。
- 合并 Sprite Sheet。
- 写入对象存储并回传结果。

## 6. Agent 编排设计

### 6.1 状态结构

```ts
type AssetKind = 'character' | 'animation' | 'item_icon' | 'scene_prop'

interface AssetSpec {
  kind: AssetKind
  style: string
  size: {
    width: number
    height: number
  }
  background: 'transparent' | 'solid' | 'scene'
  prompt: string
  negativePrompt?: string
  framePlan?: {
    action: string
    frames: number
    fps: number
  }[]
  exportFormats: ('png' | 'sprite_sheet' | 'json' | 'zip')[]
}
```

### 6.2 LangGraph 节点

```text
Start
  ↓
InputGuardNode
  ↓
RequirementParserNode
  ↓
SpecValidatorNode
  ↓
PromptComposerNode
  ↓
GenerationPlannerNode
  ↓
ImageGenerationNode
  ↓
QualityEvaluatorNode
  ↓
PostProcessNode
  ↓
ExportPackagerNode
  ↓
ResultSummaryNode
  ↓
End
```

### 6.3 节点职责

| 节点 | 职责 | 失败策略 |
|---|---|---|
| InputGuardNode | 检查输入长度、空输入、明显冲突 | 返回可读错误 |
| RequirementParserNode | 解析素材类型、风格、尺寸、动作 | 缺字段时请求补充 |
| SpecValidatorNode | 检查尺寸、帧数、导出格式合法性 | 自动修正或提示用户 |
| PromptComposerNode | 生成图像提示词、负向提示词 | 使用模板兜底 |
| GenerationPlannerNode | 拆分批量生成任务 | 限制任务规模 |
| ImageGenerationNode | 调用图像生成 Worker | 重试、降级参数 |
| QualityEvaluatorNode | 检查尺寸、透明背景、一致性 | 标记低质量结果 |
| PostProcessNode | 裁切、去背景、统一命名 | 单项失败不影响其他结果 |
| ExportPackagerNode | 生成 PNG、Sprite Sheet、JSON、ZIP | 失败可单独重试 |
| ResultSummaryNode | 总结结果与下一步建议 | 不阻塞主结果 |

## 7. 数据模型

### 7.1 核心表

```text
projects
  id, name, description, created_at, updated_at

generation_tasks
  id, project_id, kind, status, prompt, spec_json, progress, error_message,
  created_at, updated_at, completed_at

assets
  id, task_id, project_id, kind, name, version, status, preview_url,
  metadata_json, created_at, updated_at

asset_files
  id, asset_id, file_type, storage_key, file_name, mime_type, size_bytes,
  width, height, created_at

agent_events
  id, task_id, node_name, event_type, message, payload_json, created_at

style_presets
  id, name, description, prompt_template, negative_prompt_template,
  preview_url, created_at, updated_at
```

### 7.2 任务状态

```text
created
queued
parsing
planning
generating
evaluating
post_processing
packaging
completed
failed
cancelled
```

## 8. API 设计

### 8.1 创建生成任务

```http
POST /api/generation-tasks
Content-Type: application/json
```

```json
{
  "projectId": "project_001",
  "kind": "character",
  "prompt": "生成一个像素风猫咪勇者，蓝色斗篷，32x32，透明背景",
  "options": {
    "width": 32,
    "height": 32,
    "style": "pixel-art",
    "exportFormats": ["png", "zip"]
  }
}
```

### 8.2 查询任务状态

```http
GET /api/generation-tasks/{taskId}
```

### 8.3 任务事件流

```http
GET /api/generation-tasks/{taskId}/events
Accept: text/event-stream
```

### 8.4 资产列表

```http
GET /api/projects/{projectId}/assets
```

### 8.5 下载资源包

```http
GET /api/assets/{assetId}/download?format=zip
```

## 9. UI 编排方案

### 9.1 信息架构

```text
Landing
  └─ Workspace
      ├─ Project Sidebar
      ├─ Prompt & Spec Panel
      ├─ Generation Canvas
      ├─ Agent Activity Panel
      └─ Export Drawer
```

### 9.2 工作台布局

- 左侧窄栏：项目、历史任务、收藏资产。
- 中间主区域：Prompt 输入、规格确认、结果网格、动作播放预览。
- 右侧面板：Agent 当前步骤、参数、导出格式、质量提示。
- 顶部：项目名、任务状态、全局操作。

### 9.3 关键组件

| 组件 | 职责 |
|---|---|
| PromptComposer | 输入需求、选择素材类型、提交生成 |
| AssetSpecForm | 展示和修改 Agent 解析出的规格 |
| GenerationProgress | 展示任务状态、进度和可重试错误 |
| AgentActivityTimeline | 展示 Agent 分步执行日志 |
| AssetResultGrid | 展示候选图和版本 |
| SpritePreview | 播放动作序列 |
| ExportDrawer | 选择 PNG、Sprite Sheet、JSON、ZIP 下载 |

### 9.4 前端状态

| Store | 内容 |
|---|---|
| useWorkspaceStore | 当前项目、选中任务、选中资产 |
| useGenerationTaskStore | 任务状态、进度、事件流 |
| useAssetPreviewStore | 预览图、动作帧、播放状态 |
| useExportStore | 导出格式、下载状态 |

## 10. 测试方案

### 10.1 测试分层

| 层级 | 工具 | 覆盖内容 |
|---|---|---|
| 单元测试 | Vitest / Jest / Pytest | 规格解析、状态转换、导出脚本 |
| 组件测试 | React Testing Library | Prompt、规格表单、结果网格 |
| API 测试 | Supertest / Pytest HTTPX | 创建任务、状态查询、下载接口 |
| Agent 测试 | Pytest | LangGraph 节点、失败重试、Prompt 模板 |
| E2E 测试 | Playwright | 从输入到导出的完整流程 |
| 视觉回归 | Playwright Screenshot | Landing、Workspace、预览状态 |

### 10.2 P0 测试用例

| 编号 | 用例 | 预期 |
|---|---|---|
| T-001 | 输入角色素材需求并提交 | 创建任务成功，进入 queued |
| T-002 | Agent 返回结构化规格 | 前端展示可编辑规格表单 |
| T-003 | 生成任务正常完成 | 状态为 completed，展示结果图 |
| T-004 | 任务失败后重试 | 新任务或子任务重新进入 queued |
| T-005 | 动作序列播放 | SpritePreview 按 fps 播放帧 |
| T-006 | 导出 PNG | 下载透明 PNG 文件 |
| T-007 | 导出 Sprite Sheet + JSON | 文件存在，JSON 帧坐标正确 |
| T-008 | 刷新页面后查看历史任务 | 历史任务和资产仍可查询 |
| T-009 | SSE 断开后降级轮询 | 任务状态继续更新 |
| T-010 | 非法尺寸输入 | 系统提示并阻止提交 |

### 10.3 质量门禁

- `npm run lint` 通过。
- `npm run build:dev` 通过。
- 前端 P0 组件测试通过。
- 后端 API 测试通过。
- Agent 节点测试通过。
- Playwright P0 主流程通过。
- 导出文件可被本地脚本校验。

## 11. 开发里程碑

| 阶段 | 周期 | 主要产出 | Owner |
|---|---|---|---|
| M0 需求与技术评审 | 2 天 | PRD、技术方案、接口草案、测试计划 | 项目经理 |
| M1 基础架构 | 4 天 | DB、队列、对象存储、任务 API | 后端 / 架构师 |
| M2 Agent MVP | 5 天 | 需求解析、Prompt 编排、生成任务、评估节点 | Agent 工程师 |
| M3 工作台 UI | 5 天 | Prompt、规格、进度、预览、导出 | 前端 |
| M4 联调与导出 | 4 天 | 端到端链路、Sprite Sheet、ZIP | 前端 / 后端 / Agent |
| M5 测试与验收 | 3 天 | 自动化测试、缺陷修复、验收报告 | 测试 |

## 12. 风险控制

| 风险 | 技术影响 | 处理方案 |
|---|---|---|
| 图像模型本地部署不稳定 | 阻塞生成链路 | Worker 接口抽象，支持 Mock 和三方替换 |
| LLM API 未定 | Agent 节点无法真实推理 | 先实现 Provider 接口和规则兜底解析 |
| 大文件下载失败 | 影响导出体验 | 对象存储 + 签名 URL + ZIP 异步生成 |
| SSE 不稳定 | 影响进度体验 | SSE 优先，轮询兜底 |
| Sprite Sheet 坐标错误 | 游戏侧不可用 | 导出后执行 JSON 与图片尺寸校验 |
| 模型许可证风险 | 生产不可用 | 技术评审前补许可证清单和合规确认 |

## 13. 待决策事项

- LLM API：留空，待成本、效果、合规评审后确定。
- 图像生成方案：本地 ComfyUI 优先，是否引入三方 API 待评审。
- 是否使用账号体系：MVP 可先本地项目化，后续接入登录。
- 是否开放用户自定义模型 / LoRA：建议 P1 评估。
- 是否增加内容安全审核：生产上线前必须补充。
