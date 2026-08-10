description: React 与 Next.js 前端开发规则 

globs: - "**/*.tsx" - "**/*.ts" - "app/**/*" - "components/**/*" 

alwaysApply: false

# 前端开发规则

## 1. React

统一使用函数式组件。

优先使用：

- 组件组合
- 小型、职责单一的组件
- 派生状态
- 自定义 Hooks
- 现有状态管理方案

避免：

- 不必要的 `useEffect`
- 重复 state
- 不必要的 Context
- 多层 Prop Drilling
- 将可以计算得到的数据存入 state

---

## 2. useEffect 使用规则

使用 `useEffect` 之前，先判断能否通过以下方式解决：

- Event Handler
- 派生值
- Server Component
- Server Rendering
- React Query / SWR
- Memoization
- 路由状态

不要把 `useEffect` 当成默认的数据流解决方案。

---

## 3. Next.js

如果项目使用 App Router：

优先使用 Server Component。

只有以下情况使用 Client Component：

- 需要浏览器 API
- 需要事件绑定
- 需要 React State
- 需要 Effect
- 使用仅支持浏览器的第三方库

不要为了方便，随意添加：

```ts

"use client";

```

