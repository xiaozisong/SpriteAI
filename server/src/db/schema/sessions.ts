/**
 * sessions 表：对话会话（每个 work 下的多轮对话）。
 *
 * 对齐 Python 侧 Agent/app/modules/studio/models.py 的 Session。
 * - thread_id：LangGraph checkpoint 关联用
 * - model：会话使用的模型
 */
import { pgTable, serial, integer, varchar, timestamp, foreignKey } from 'drizzle-orm/pg-core';
import { works } from './works';

export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    workId: integer('work_id')
      .notNull()
      .references(() => works.id, { onDelete: 'cascade' }),
    threadId: varchar('thread_id', { length: 128 }), // LangGraph checkpoint 用
    model: varchar('model', { length: 100 }).default('gpt-4o-mini').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  // 复合索引：按 work 查 sessions
);
