/**
 * generation_runs 表：生成任务（异步长任务的状态持久化）。
 *
 * 对齐 Python 侧 Agent/app/modules/generation/models.py 的 GenerationTask。
 * - task_id: Redis 任务 id（唯一，幂等用）
 * - status 状态机: queued → in_progress → completed/failed/cancelled
 * - retries: 重试次数
 *
 * 注意：Python 用 generation_tasks 表名，这里用 generation_runs 体现 Thread/Run 模型。
 * 实际部署时可对齐表名，这里先按 NestJS 语义命名。
 */
import { pgTable, serial, integer, varchar, text, jsonb, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sessions } from './sessions';

export const RUN_STATUS = {
  QUEUED: 'queued',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const generationRuns = pgTable(
  'generation_runs',
  {
    id: serial('id').primaryKey(),
    sessionId: integer('session_id').references(() => sessions.id, { onDelete: 'cascade' }),
    taskId: varchar('task_id', { length: 128 }).notNull(), // Redis 任务 id（幂等键）
    agentId: varchar('agent_id', { length: 50 }).default('chatbot').notNull(),
    status: varchar('status', { length: 20 }).default(RUN_STATUS.QUEUED).notNull(),
    prompt: text('prompt'), // 用户输入
    params: jsonb('params').default({}).notNull(),
    result: jsonb('result'), // 生成结果
    error: text('error'), // 失败原因
    retries: integer('retries').default(0).notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    // task_id 唯一索引：幂等防重
    taskIdx: uniqueIndex('gen_runs_task_id_idx').on(table.taskId),
    // 按 session 查 + 状态过滤
    sessionStatusIdx: index('gen_runs_session_status_idx').on(table.sessionId, table.status),
  }),
);
