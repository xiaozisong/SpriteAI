# 「精灵」AI Native Workspace 页面改造计划

> 优先级：**P0（最高）**。本计划在 NestJS 业务 API 开发前执行。
>
> 目标：将产品品牌从“爆文猫”升级为“精灵”，并将现有页面视觉升级为克制、深色、Artifact-first 的 AI Native Workspace。
>
> 约束：**只改 UI、布局、视觉层级、动效与交互反馈；不改任何路由、页面关系、接口、字段、按钮业务行为或数据结构。**

## 实施进度

- [x] 建立深色 Workspace Token（默认主题切换为深色）
- [x] 更新浏览器标题为“精灵”
- [x] 首轮改造 Workspace Shell：60px Sidebar、透明 Header、深色 Popover
- [x] 将 Workspace 侧栏与“关于我们”可见品牌替换为“精灵”
- [x] 重构根路由 Landing：Agent Workspace 产品叙事、Prompt 演示、Artifact、工作流与 CTA
- [x] 移除旧 Landing 的全屏翻页、浅色品牌组件与“爆文猫”展示文案
- [x] 按 `video/dribbb-mp4.mp4` 校准 Landing 动效语言：浮动导航、中心核心、连接线路、弧形环境光与分层滚动入场
- [ ] 全站展示层品牌盘点（法律协议与域名/接口等技术标识暂不替换）
- [ ] Welcome / Quick Action / Prompt Composer
- [ ] Conversation Canvas / Artifact / Agent Activity
- [ ] 页面族迁移与视觉回归

## 0. 当前事实与范围

- 已确认桌面端工作区入口：`src/layout/WorkspaceLayout/`
- 已确认核心布局：`WorkspaceLayout`、`WorkspaceSidebar`、`WorkspaceHeader`
- 已确认桌面路由均位于 `/workspace/*`，必须全部保留
- 已分析 `video/dribbb-mp4.mp4`：吸收其控制台式浮动导航、中心核心、弱连接线和大弧形环境光；保留“精灵”既定的深蓝紫主题，不复制原视频的品牌、绿色或具体内容

## 1. 设计目标与非目标

### 设计目标
- 品牌名统一展示为：**精灵**
- 深冷灰黑背景、低饱和蓝紫仅作为极少量强调色
- 56px 左右图标侧栏，替换当前宽侧栏
- 内容集中在 600–820px 工作区，不铺满页面
- Prompt、Agent 状态、Artifact 成为视觉主体
- 对话从聊天气泡改为垂直 Conversation Canvas
- Loading 呈现为 Agent Activity，不使用孤立 spinner

### 非目标
- 不接入 NestJS、Agent、SSE 或任何新后端能力
- 不改动菜单路由、编辑器、登录、额度、反馈等既有功能含义
- 不修改 API 调用、Store 数据结构、数据库字段
- 不做高饱和渐变、玻璃拟态、赛博朋克、传统 Dashboard 或微信式气泡

## 2. 视觉 Token（先建立基础，再改页面）

| Token | 建议值 | 使用原则 |
|---|---|---|
| `--bg-primary` | `#090C15` | 全局背景，不用纯黑 |
| `--bg-surface` | `#0D111B` | Composer、Popover、Modal |
| `--bg-surface-raised` | `#10141E` | Hover/局部抬升 |
| `--text-primary` | `rgba(255,255,255,.92)` | 主标题与核心内容 |
| `--text-secondary` | `rgba(255,255,255,.62)` | 正文、次级操作 |
| `--text-muted` | `rgba(255,255,255,.38)` | 辅助说明 |
| `--border-subtle` | `rgba(255,255,255,.06)` | 默认边框 |
| `--border-hover` | `rgba(255,255,255,.11)` | Hover 边框 |
| `--accent` | 低饱和蓝紫 | 仅 Agent、运行态、选中态、生成动作 |

圆角只使用 6 / 10 / 14 / 18px；普通内容不用明显阴影；Modal、Popover、Dropdown 才可使用轻阴影。

## 3. 开发阶段

### P0.1 品牌盘点与替换（0.5 天）

**改造**
- 搜索并替换用户可见的“爆文猫”“Boom Cat”等品牌文字为“精灵”
- 更新页面 title、Logo 的 `alt`、关于我们文案、登录/账户相关可见文案
- 保留内部目录、数据库名、环境变量和 API 名称，避免误伤运行逻辑

**学习**
- 品牌重构必须区分“展示层标识”和“技术标识”
- 展示层可以替换；域名、API、表名、埋点 key 等技术标识需要单独迁移方案，不能批量替换

**验收**
- 全站可见品牌统一为“精灵”
- 路由、接口、环境变量、后端服务名不发生变化

### P0.2 全局设计 Token 与基础组件（1 天）

**改造**
- 在 `src/styles/theme.css`、`src/styles/globals.css` 建立深色 Token、字体层级、边框、圆角、动效变量
- 统一 Button、Popover、Tooltip、Modal、Toast 的深色样式
- 为页面增加极弱 radial glow / noise 背景，不影响可读性

**学习**
- Design Token：用语义变量而不是散落的十六进制色值，主题与组件才能一致演进
- 信息层级优先使用字体、透明度、间距、背景明度，不依赖卡片和阴影
- 可访问性：深色主题仍需满足文字对比度，不能用低透明度替代可读性

**验收**
- 不修改任何业务组件逻辑，仅替换变量即可让全局变为深色 Workspace 基调
- Hover/Focus/Disabled 状态清晰，键盘焦点可见

### P0.3 Workspace Shell 改造（1 天）

**改造**
- 改造 `WorkspaceLayout`：去除 `minWidth: calc(184px + 800px)` 等传统后台布局约束
- 改造 `WorkspaceSidebar`：宽度 52–60px、仅图标、Tooltip 显示文案、顶部 Logo、底部设置/个人操作
- 改造 `WorkspaceHeader`：高度 56–64px，透明；左侧当前页面标题，右侧额度/账户操作
- 保留所有已有菜单、子菜单和点击路由行为

**学习**
- App Shell：导航负责定位，内容负责表达；导航应退居视觉背景
- Icon-only Sidebar：必须用 Tooltip、`aria-label`、active 状态保证可发现性与可访问性
- 响应式：桌面用窄侧栏，移动端使用现有移动端布局或 Bottom Navigation，不强塞桌面侧栏

**验收**
- 所有 `/workspace/*` 路由仍可正常跳转
- 侧栏不再持续显示文字；Hover 可看到功能名称
- 工作区内容不因宽侧栏挤压

### P0.4 首页与 Prompt Composer（1–1.5 天）

**改造**
- 优先改造 `my-place` 或当前工作区主入口
- Welcome 状态：极简标识、“精灵”欢迎语、30–36px 核心标题、3 个保留既有功能入口的 Quick Actions
- 将现有输入区域重构为核心 Composer：Agent/Mode 入口、附件/上下文入口、发送按钮保持原行为
- 初始态 Composer 居中偏下；对话态通过 CSS 布局成为底部 Sticky Composer

**学习**
- Empty State：不是装饰，而是帮助用户理解下一步可做什么
- Prompt Composer 是 AI 产品的主控件，应比导航和卡片优先级更高
- 不改变按钮行为：只换容器、排版、图标表现和反馈

**验收**
- 原有发送、附件、模式选择、快捷入口的事件处理保持不变
- Composer 最大宽度 600–680px，页面在大屏保留留白

### P0.5 Conversation Canvas、Artifact 与 Agent Activity（1.5 天）

**改造**
- 现有用户输入：去除聊天气泡，显示为 Canvas 顶部的轻量 Prompt 区
- 现有 AI 输出：正文直接排版；图片、代码、文档、表格等以 Artifact 视觉承载
- 为已有重试、编辑、继续、复制、下载等操作提供轻量 Icon Toolbar，保留原事件
- 将 Loading/异步任务展示改为 Thinking / Searching / Generating 等 Agent Activity；使用微 shimmer/透明度，而非单 spinner
- 将 Tool Calling/任务反馈展示为右下角 Task Toast / Agent Activity

**学习**
- Conversation Canvas：Turn = Prompt → Agent Status → Artifact → Explanation，不是左右气泡
- Artifact-first：生成内容是主体，UI 容器是背景
- 流式更新性能：Token 高频到达时使用 buffer + `requestAnimationFrame` 合并渲染，避免每个 token 都触发 React render

**验收**
- 现有消息、生成结果、加载和错误流程全部保留
- 新结果出现使用轻量 fade/translate/blur 动画（400–550ms）
- 没有新增或修改任何 SSE/API 协议

### P0.6 页面族迁移（2–3 天）

**改造顺序**
1. 工作区主页面 / 创作页
2. 编辑器与 AI 文档相关页面
3. Dashboard、榜单、列表与表格
4. 个人中心、额度、账户、设置
5. Modal、Popover、Dropdown、Toast 等覆盖层

**统一规则**
- Dashboard 使用 Hero Metric + Metric Strip，避免卡片墙
- 列表使用 Row-based List，淡 divider，不使用表格网格
- Profile 用 420–520px 单列布局，Section + Divider，不 Card 套 Card
- Modal 380–440px；Overlay 使用 `rgba(5,7,12,.45)` + 6–10px blur

**学习**
- 设计系统落地不是“改一个页面”，而是按页面族迁移，先复用基础组件再改业务页面
- 视觉回归：每改完一个页面族都要检查空态、加载、错误、Hover、移动端

**验收**
- 路由数量、页面关系、字段、业务按钮和跳转保持不变
- 桌面内容最大宽度遵循 460 / 680 / 820px 的层级约束

### P0.7 动效、响应式、可访问性与视觉回归（1 天）

**改造**
- 统一 150–220ms Hover、180–250ms 页面淡入、400–550ms Artifact 出现
- 支持 `prefers-reduced-motion`
- 检查手机端：保留 Workspace 概念，Prompt Sticky Bottom，Artifact 100% 宽
- 逐页视觉回归，验证业务路径

**学习**
- 动效用于解释状态变化，不用于装饰
- `prefers-reduced-motion` 是产品质量要求，不是可选项
- UI 改造最重要的回归是“行为不变”：每个事件、跳转、接口调用必须保持

**验收**
- 无重动画、无布局抖动、无横向溢出
- 键盘可操作、焦点可见、Tooltip/Popover 有正确语义
- `npm run lint` 与 `npm run build:dev` 通过

## 4. 文件级实施地图

| 范围 | 优先文件 | 主要改动 |
|---|---|---|
| 全局 Token | `src/styles/theme.css`、`src/styles/globals.css` | 颜色、字体、边框、动效 |
| 根入口 | `src/main.tsx`、`index.html` | 页面标题、全局背景、字体 |
| Workspace Shell | `src/layout/WorkspaceLayout/index.tsx` | 60px 侧栏、内容宽度、透明 Header |
| 侧栏 | `src/layout/WorkspaceLayout/WorkspaceSidebar.tsx` | Icon-only、Tooltip、Logo、Active |
| 顶栏 | `src/layout/WorkspaceLayout/WorkspaceHeader.tsx` | 页面标题、账户、额度、深色 Popover |
| 主入口 | `src/pages/my-place/**` | Welcome、Quick Action、Composer |
| 对话/生成 | `src/components/**`、`src/services/**` | Conversation Canvas、Artifact、Agent Activity；不动数据和接口 |
| 覆盖层 | `src/components/ui/**` | Button、Modal、Popover、Tooltip、Toast |
| 移动端 | `src/layout/MLayout/**`、`src/m-pages/**` | Bottom Navigation、Sticky Composer |

## 5. 风险控制

| 风险 | 约束/处理 |
|---|---|
| 全局 CSS 误伤业务页面 | 先建立 Token；每次只迁移一个页面族；视觉回归 |
| 品牌名批量替换影响 API/埋点 | 仅替换用户可见文案、title、alt；不替换技术标识 |
| 侧栏缩窄导致子菜单不可达 | Tooltip + Click Popover 保留全部子菜单 |
| UI 改造中误改事件逻辑 | 样式与结构改动优先；Handler、Store、API 调用不改 |
| 视频参考缺失 | 当前以文字规范执行；视频补入后只做视觉参数校准，不改变已定功能范围 |

## 6. 与主开发计划的关系

- 本计划对应 `docs/development-plan.md` 的 **阶段 P0**
- P0 完成后再继续后端的阶段 4（业务 API）
- 若 P0.5 需要真实 Agent 运行态才能完整验证，可以先完成视觉静态态与 mock，再在后端阶段 5 联调时补真实态

## 7. P0 完成定义

- [ ] 网站用户可见品牌统一为“精灵”
- [ ] Workspace Shell、Sidebar、Header 已切换为深色极简工作区
- [ ] 主入口有 Welcome / Quick Action / Composer 三层结构
- [ ] 对话与结果遵循 Conversation Canvas / Artifact-first
- [ ] Loading 和任务反馈使用 Agent Activity
- [ ] 页面、路由、接口、字段、功能事件均未改变
- [ ] `npm run lint`、`npm run build:dev` 通过
